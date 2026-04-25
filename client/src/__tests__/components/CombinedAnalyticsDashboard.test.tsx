import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CombinedAnalyticsDashboard from '../../components/CombinedAnalyticsDashboard';

describe('CombinedAnalyticsDashboard', () => {
  it('should render dashboard title', async () => {
    render(<CombinedAnalyticsDashboard />);
    const title = await screen.findByText('Analytics Dashboard');
    expect(title).toBeInTheDocument();
  });

  it('should render time period buttons', async () => {
    render(<CombinedAnalyticsDashboard />);
    await screen.findByText('Analytics Dashboard');
    expect(screen.getByText('30d')).toBeInTheDocument();
    expect(screen.getByText('60d')).toBeInTheDocument();
    expect(screen.getByText('90d')).toBeInTheDocument();
  });

  it('should render export button', async () => {
    render(<CombinedAnalyticsDashboard />);
    await screen.findByText('Analytics Dashboard');
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should render SEO metrics section', async () => {
    render(<CombinedAnalyticsDashboard />);
    const seoSection = await screen.findByText('SEO Metrics');
    expect(seoSection).toBeInTheDocument();
  });

  it('should render social metrics section', async () => {
    render(<CombinedAnalyticsDashboard />);
    const socialSection = await screen.findByText('Social Metrics');
    expect(socialSection).toBeInTheDocument();
  });

  it('should render performance metrics section', async () => {
    render(<CombinedAnalyticsDashboard />);
    const perfSection = await screen.findByText('Performance');
    expect(perfSection).toBeInTheDocument();
  });

  it('should render trends chart', async () => {
    render(<CombinedAnalyticsDashboard />);
    const trends = await screen.findByText('Trends');
    expect(trends).toBeInTheDocument();
  });

  it('should render growth comparison section', async () => {
    render(<CombinedAnalyticsDashboard />);
    const growth = await screen.findByText(/Growth Impact/);
    expect(growth).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<CombinedAnalyticsDashboard />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should accept days prop', async () => {
    render(<CombinedAnalyticsDashboard days={60} />);
    await screen.findByText('Analytics Dashboard');
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
