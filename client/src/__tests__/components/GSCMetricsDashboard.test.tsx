import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GSCMetricsDashboard from '../../components/GSCMetricsDashboard';

describe('GSCMetricsDashboard', () => {
  it('should render dashboard title', async () => {
    render(<GSCMetricsDashboard />);
    const title = await screen.findByText('Google Search Console Analytics');
    expect(title).toBeInTheDocument();
  });

  it('should render summary metrics section', async () => {
    render(<GSCMetricsDashboard />);
    const clicks = await screen.findByText(/Total Clicks/);
    expect(clicks).toBeInTheDocument();
  });

  it('should render trend section', async () => {
    render(<GSCMetricsDashboard />);
    const trend = await screen.findByText('30-Day Trend');
    expect(trend).toBeInTheDocument();
  });

  it('should render top keywords section', async () => {
    render(<GSCMetricsDashboard />);
    const keywords = await screen.findByText('Top Keywords');
    expect(keywords).toBeInTheDocument();
  });

  it('should render top articles section', async () => {
    render(<GSCMetricsDashboard />);
    const articles = await screen.findByText('Top Articles by Traffic');
    expect(articles).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<GSCMetricsDashboard />);
    expect(screen.getByText('Loading GSC metrics...')).toBeInTheDocument();
  });

  it('should accept siteUrl prop', async () => {
    render(<GSCMetricsDashboard siteUrl="https://example.com" />);
    await screen.findByText('Google Search Console Analytics');
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('should accept refreshInterval prop', async () => {
    render(<GSCMetricsDashboard refreshInterval={300000} />);
    await screen.findByText('Google Search Console Analytics');
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
