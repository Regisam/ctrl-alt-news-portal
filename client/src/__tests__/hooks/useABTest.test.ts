import { renderHook, waitFor } from '@testing-library/react';
import { useABTest, useABTests } from '@/hooks/useABTest';
import { clearABTestData } from '@/lib/ab-testing';
import type { ABExperiment } from '@/lib/ab-testing';

const testExperiment: ABExperiment = {
  id: 'test_exp',
  name: 'Test Experiment',
  enabled: true,
  variants: ['A', 'B'],
};

const disabledExperiment: ABExperiment = {
  id: 'disabled_exp',
  name: 'Disabled Experiment',
  enabled: false,
  variants: ['X', 'Y'],
};

describe('useABTest hook', () => {
  beforeEach(() => {
    clearABTestData();
  });

  it('should return null initially for disabled experiment', async () => {
    const { result } = renderHook(() => useABTest(disabledExperiment, 'user-123'));

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('should return a variant for enabled experiment', async () => {
    const { result } = renderHook(() => useABTest(testExperiment, 'user-123'));

    await waitFor(() => {
      expect(['A', 'B']).toContain(result.current);
    });
  });

  it('should assign consistently (same user = same variant)', async () => {
    const { result: result1 } = renderHook(() => useABTest(testExperiment, 'user-123'));

    await waitFor(() => {
      expect(result1.current).not.toBeNull();
    });

    const variant1 = result1.current;

    const { result: result2 } = renderHook(() => useABTest(testExperiment, 'user-123'));

    await waitFor(() => {
      expect(result2.current).toBe(variant1);
    });
  });

  it('should generate user ID from localStorage if not provided', async () => {
    const { result: result1 } = renderHook(() => useABTest(testExperiment));

    await waitFor(() => {
      expect(result1.current).not.toBeNull();
    });

    const variant1 = result1.current;

    const { result: result2 } = renderHook(() => useABTest(testExperiment));

    await waitFor(() => {
      expect(result2.current).toBe(variant1);
    });
  });

  it('should handle experiment enable/disable changes', async () => {
    const mutableExp = { ...testExperiment, enabled: true };

    const { result, rerender } = renderHook(() => useABTest(mutableExp, 'user-456'));

    await waitFor(() => {
      expect(['A', 'B']).toContain(result.current);
    });

    // Disable experiment
    mutableExp.enabled = false;
    rerender();

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('should track variant in GA4 when assigned', async () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    const { result } = renderHook(() => useABTest(testExperiment, 'user-789'));

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    // Verify GA4 was called with variant assignment
    expect(gtag).toHaveBeenCalledWith('event', 'ab_test_variant', {
      experiment_id: 'test_exp',
      variant: result.current,
    });
  });
});

describe('useABTests hook', () => {
  beforeEach(() => {
    clearABTestData();
  });

  it('should return assignments for multiple experiments', async () => {
    const exp1: ABExperiment = { id: 'exp-1', name: 'Exp 1', enabled: true, variants: ['A', 'B'] };
    const exp2: ABExperiment = { id: 'exp-2', name: 'Exp 2', enabled: true, variants: ['X', 'Y'] };

    const { result } = renderHook(() => useABTests([exp1, exp2], 'user-abc'));

    await waitFor(() => {
      expect(result.current['exp-1']).not.toBeNull();
      expect(result.current['exp-2']).not.toBeNull();
    });
  });

  it('should return null for disabled experiments in batch', async () => {
    const exp1: ABExperiment = { id: 'exp-1', name: 'Exp 1', enabled: true, variants: ['A', 'B'] };
    const exp2: ABExperiment = { id: 'exp-2', name: 'Exp 2', enabled: false, variants: ['X', 'Y'] };

    const { result } = renderHook(() => useABTests([exp1, exp2], 'user-xyz'));

    await waitFor(() => {
      expect(['A', 'B']).toContain(result.current['exp-1']);
      expect(result.current['exp-2']).toBeNull();
    });
  });

  it('should track all variants in GA4', async () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    const exp1: ABExperiment = { id: 'exp-1', name: 'Exp 1', enabled: true, variants: ['A', 'B'] };
    const exp2: ABExperiment = { id: 'exp-2', name: 'Exp 2', enabled: true, variants: ['X', 'Y'] };

    const { result } = renderHook(() => useABTests([exp1, exp2], 'user-123'));

    await waitFor(() => {
      expect(result.current['exp-1']).not.toBeNull();
      expect(result.current['exp-2']).not.toBeNull();
    });

    // Verify GA4 was called for both experiments
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'ab_test_variant',
      expect.objectContaining({
        experiment_id: 'exp-1',
      })
    );
    expect(gtag).toHaveBeenCalledWith(
      'event',
      'ab_test_variant',
      expect.objectContaining({
        experiment_id: 'exp-2',
      })
    );
  });
});
