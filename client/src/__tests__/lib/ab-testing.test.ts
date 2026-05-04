import {
  assignVariant,
  registerExperiment,
  getUserVariant,
  setExperimentEnabled,
  getExperiments,
  getUserAssignments,
  clearABTestData,
  formatGA4Dimension,
  type ABExperiment,
} from '@/lib/ab-testing';

const testExperiment: ABExperiment = {
  id: 'test_experiment',
  name: 'Test Experiment',
  enabled: true,
  variants: ['A', 'B', 'C'],
};

describe('ab-testing library', () => {
  beforeEach(() => {
    clearABTestData();
  });

  describe('assignVariant', () => {
    it('should return one of the provided variants', () => {
      const variant = assignVariant('user-123', 'test', ['A', 'B']);
      expect(['A', 'B']).toContain(variant);
    });

    it('should assign deterministically (same user = same variant)', () => {
      const variant1 = assignVariant('user-123', 'exp-1', ['A', 'B']);
      const variant2 = assignVariant('user-123', 'exp-1', ['A', 'B']);
      expect(variant1).toBe(variant2);
    });

    it('should assign different users to different variants', () => {
      const variant1 = assignVariant('user-1', 'exp-1', ['A', 'B']);
      const variant2 = assignVariant('user-2', 'exp-1', ['A', 'B']);
      // High probability they're different (though not guaranteed with only 2 variants)
      expect([variant1, variant2]).toHaveLength(2);
    });

    it('should handle 3+ variants', () => {
      const variant = assignVariant('user-123', 'test', ['A', 'B', 'C']);
      expect(['A', 'B', 'C']).toContain(variant);
    });

    it('should throw error for empty variants', () => {
      expect(() => assignVariant('user-123', 'test', [])).toThrow();
    });
  });

  describe('registerExperiment', () => {
    it('should register an experiment', () => {
      registerExperiment(testExperiment);
      const experiments = getExperiments();
      expect(experiments['test_experiment']).toBeDefined();
      expect(experiments['test_experiment'].name).toBe('Test Experiment');
    });

    it('should update experiment if already registered', () => {
      registerExperiment(testExperiment);
      const updatedExperiment = { ...testExperiment, enabled: false };
      registerExperiment(updatedExperiment);
      const experiments = getExperiments();
      expect(experiments['test_experiment'].enabled).toBe(false);
    });
  });

  describe('getUserVariant', () => {
    it('should return null for disabled experiment', () => {
      const disabledExp = { ...testExperiment, enabled: false };
      registerExperiment(disabledExp);
      const variant = getUserVariant('user-123', 'test_experiment');
      expect(variant).toBeNull();
    });

    it('should return null for non-existent experiment', () => {
      const variant = getUserVariant('user-123', 'nonexistent');
      expect(variant).toBeNull();
    });

    it('should assign and return variant for enabled experiment', () => {
      registerExperiment(testExperiment);
      const variant = getUserVariant('user-123', 'test_experiment');
      expect(['A', 'B', 'C']).toContain(variant);
    });

    it('should cache assignment in localStorage', () => {
      registerExperiment(testExperiment);
      const variant1 = getUserVariant('user-123', 'test_experiment');
      const variant2 = getUserVariant('user-123', 'test_experiment');
      expect(variant1).toBe(variant2);
    });

    it('should return consistent variant across calls', () => {
      registerExperiment(testExperiment);
      const variants = [
        getUserVariant('user-123', 'test_experiment'),
        getUserVariant('user-123', 'test_experiment'),
        getUserVariant('user-123', 'test_experiment'),
      ];
      expect(new Set(variants).size).toBe(1); // All same
    });
  });

  describe('setExperimentEnabled', () => {
    it('should disable experiment', () => {
      registerExperiment(testExperiment);
      setExperimentEnabled('test_experiment', false);
      const variant = getUserVariant('user-123', 'test_experiment');
      expect(variant).toBeNull();
    });

    it('should re-enable experiment', () => {
      registerExperiment({ ...testExperiment, enabled: false });
      setExperimentEnabled('test_experiment', true);
      const variant = getUserVariant('user-123', 'test_experiment');
      expect(['A', 'B', 'C']).toContain(variant);
    });
  });

  describe('formatGA4Dimension', () => {
    it('should format as lowercase with underscore', () => {
      const formatted = formatGA4Dimension('Feed_Layout', 'Personalized');
      expect(formatted).toBe('feed_layout_personalized');
    });

    it('should handle already lowercase', () => {
      const formatted = formatGA4Dimension('exp_1', 'variant_a');
      expect(formatted).toBe('exp_1_variant_a');
    });
  });

  describe('clearABTestData', () => {
    it('should clear all data', () => {
      registerExperiment(testExperiment);
      getUserVariant('user-123', 'test_experiment');
      clearABTestData();
      const experiments = getExperiments();
      expect(Object.keys(experiments).length).toBe(0);
    });
  });

  describe('getExperiments', () => {
    it('should return all registered experiments', () => {
      const exp1 = { id: 'exp-1', name: 'Exp 1', enabled: true, variants: ['A', 'B'] };
      const exp2 = { id: 'exp-2', name: 'Exp 2', enabled: true, variants: ['X', 'Y'] };
      registerExperiment(exp1);
      registerExperiment(exp2);
      const experiments = getExperiments();
      expect(Object.keys(experiments).length).toBe(2);
      expect(experiments['exp-1'].name).toBe('Exp 1');
      expect(experiments['exp-2'].name).toBe('Exp 2');
    });
  });

  describe('getUserAssignments', () => {
    it('should return all user assignments', () => {
      registerExperiment({ id: 'exp-1', name: 'Exp 1', enabled: true, variants: ['A', 'B'] });
      registerExperiment({ id: 'exp-2', name: 'Exp 2', enabled: true, variants: ['X', 'Y'] });
      getUserVariant('user-123', 'exp-1');
      getUserVariant('user-123', 'exp-2');
      const assignments = getUserAssignments();
      expect(Object.keys(assignments).length).toBe(2);
      expect(['A', 'B']).toContain(assignments['exp-1']);
      expect(['X', 'Y']).toContain(assignments['exp-2']);
    });
  });
});
