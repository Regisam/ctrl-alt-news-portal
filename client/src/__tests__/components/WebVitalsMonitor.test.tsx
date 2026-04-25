import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WebVitalsMonitor } from '@/components/WebVitalsMonitor';

// Mock useWebVitals hook
vi.mock('@/hooks/useWebVitals', () => ({
  useWebVitals: vi.fn(() => ({
    metrics: {
      LCP: 2000,
      FID: 50,
      CLS: 0.05,
      FCP: 1500,
      TTFB: 200,
    },
    status: {
      LCP: 'good',
      FID: 'good',
      CLS: 'good',
    },
    isGreen: true,
    loading: false,
  })),
}));

describe('WebVitalsMonitor', () => {
  it('should render status indicator when metrics loaded', () => {
    render(<WebVitalsMonitor />);
    expect(screen.getByText(/All GREEN/i)).toBeInTheDocument();
  });

  it('should show status indicator color based on isGreen', () => {
    const { container } = render(<WebVitalsMonitor />);
    const indicator = container.querySelector('.web-vitals-monitor');
    expect(indicator).toBeInTheDocument();
  });

  it('should not display details by default', () => {
    render(<WebVitalsMonitor />);
    expect(screen.queryByText(/Largest Contentful Paint/i)).not.toBeInTheDocument();
  });

  it('should display detailed metrics when showDetails is true', () => {
    render(<WebVitalsMonitor showDetails={true} />);
    expect(screen.getByText(/Largest Contentful Paint/i)).toBeInTheDocument();
    expect(screen.getByText(/First Input Delay/i)).toBeInTheDocument();
    expect(screen.getByText(/Cumulative Layout Shift/i)).toBeInTheDocument();
  });

  it('should display metric values in details view', () => {
    render(<WebVitalsMonitor showDetails={true} />);
    expect(screen.getByText(/2000ms/i)).toBeInTheDocument(); // LCP
    expect(screen.getByText(/50ms/i)).toBeInTheDocument(); // FID
    expect(screen.getByText(/0\.05/i)).toBeInTheDocument(); // CLS
  });

  it('should apply custom className', () => {
    const { container } = render(<WebVitalsMonitor className="custom-class" />);
    const monitor = container.querySelector('.web-vitals-monitor');
    expect(monitor).toHaveClass('custom-class');
  });

  it('should display status badges for each metric in details view', () => {
    render(<WebVitalsMonitor showDetails={true} />);
    const badges = screen.getAllByText(/good/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should return null when loading', () => {
    vi.mocked(useWebVitals).mockReturnValue({
      metrics: null,
      status: null,
      isGreen: false,
      loading: true,
    });

    const { container } = render(<WebVitalsMonitor />);
    expect(container.firstChild).toBeNull();
  });
});

// Import useWebVitals for mocking
import { useWebVitals } from '@/hooks/useWebVitals';
