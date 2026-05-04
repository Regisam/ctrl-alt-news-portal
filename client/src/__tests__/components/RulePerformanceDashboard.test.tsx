import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RulePerformanceDashboard } from '@/components/RulePerformanceDashboard';
import type { Rule } from '@/lib/rules-engine';

describe('RulePerformanceDashboard', () => {
  const mockRules: Rule[] = [
    {
      id: 'rule_ai',
      name: 'AI Topic Rule',
      priority: 100,
      enabled: true,
      conditions: [{ type: 'topic_interest', field: 'favoriteCategories', value: 'AI' }],
      actions: [{ type: 'boost_articles', field: 'category', value: 'AI', weight: 2.0 }],
      metadata: {
        impressions: 100,
        clicks: 35,
        firing_count: 50,
        ctr_target: 0.30,
      },
    },
    {
      id: 'rule_science',
      name: 'Science Topic Rule',
      priority: 101,
      enabled: true,
      conditions: [{ type: 'topic_interest', field: 'favoriteCategories', value: 'SCIENCE' }],
      actions: [{ type: 'boost_articles', field: 'category', value: 'SCIENCE', weight: 2.0 }],
      metadata: {
        impressions: 80,
        clicks: 20,
        firing_count: 40,
        ctr_target: 0.30,
      },
    },
    {
      id: 'rule_fallback',
      name: 'Fallback Rule',
      priority: 999,
      enabled: true,
      conditions: [{ type: 'always_match' }],
      actions: [{ type: 'sort_articles', field: 'date', order: 'descending' }],
      metadata: {
        impressions: 500,
        clicks: 50,
        firing_count: 100,
        ctr_target: 0.15,
      },
    },
  ];

  describe('Full Dashboard', () => {
    it('should render dashboard with rules', () => {
      render(<RulePerformanceDashboard rules={mockRules} />);

      expect(screen.getByText('Rule Performance Analysis')).toBeInTheDocument();
      expect(screen.getByText('AI Topic Rule')).toBeInTheDocument();
      expect(screen.getByText('Science Topic Rule')).toBeInTheDocument();
      expect(screen.getByText('Fallback Rule')).toBeInTheDocument();
    });

    it('should display rule metadata correctly', () => {
      render(<RulePerformanceDashboard rules={mockRules} />);

      // AI rule should be present with its metadata
      expect(screen.getByText('AI Topic Rule')).toBeInTheDocument();

      // Check for impression count (AI rule: 100)
      const impressionElements = screen.getAllByText('100');
      expect(impressionElements.length).toBeGreaterThan(0);

      // Check for CTR (AI rule: 35%)
      const ctrElements = screen.getAllByText('35.0%');
      expect(ctrElements.length).toBeGreaterThan(0);
    });

    it('should calculate CTR correctly', () => {
      render(<RulePerformanceDashboard rules={mockRules} />);

      // AI rule: 35/100 = 35%
      expect(screen.getByText('35.0%')).toBeInTheDocument();
      // Science rule: 20/80 = 25%
      expect(screen.getByText('25.0%')).toBeInTheDocument();
      // Fallback rule: 50/500 = 10%
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('should sort by firing count by default', () => {
      const { container } = render(<RulePerformanceDashboard rules={mockRules} />);

      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr') || [];

      // Fallback rule has 100 fires (highest), so should be first
      expect(rows[0]).toHaveTextContent('Fallback Rule');
    });

    it('should sort by impressions when button clicked', () => {
      const { container } = render(<RulePerformanceDashboard rules={mockRules} />);

      const impressionsButton = screen.getByRole('button', { name: /Impressions/ });
      fireEvent.click(impressionsButton);

      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr') || [];

      // Fallback rule has 500 impressions (highest)
      expect(rows[0]).toHaveTextContent('Fallback Rule');
    });

    it('should sort by CTR when button clicked', () => {
      const { container } = render(<RulePerformanceDashboard rules={mockRules} />);

      const ctrButton = screen.getByRole('button', { name: /CTR/ });
      fireEvent.click(ctrButton);

      const tbody = container.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr') || [];

      // AI rule has highest CTR (35%)
      expect(rows[0]).toHaveTextContent('AI Topic Rule');
    });

    it('should show disabled status for disabled rules', () => {
      const disabledRules: Rule[] = [
        {
          ...mockRules[0],
          enabled: false,
        },
      ];

      render(<RulePerformanceDashboard rules={disabledRules} />);

      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('should display empty state when no rules', () => {
      render(<RulePerformanceDashboard rules={[]} />);

      expect(screen.getByText('No rules configured')).toBeInTheDocument();
    });

    it('should show target CTR values', () => {
      render(<RulePerformanceDashboard rules={mockRules} />);

      // AI rule target: 0.30 * 100 = 30% (appears in table)
      const targetCtrElements = screen.getAllByText('30.0%');
      expect(targetCtrElements.length).toBeGreaterThan(0);

      // Fallback rule target: 0.15 * 100 = 15%
      const fallbackCtrElements = screen.getAllByText('15.0%');
      expect(fallbackCtrElements.length).toBeGreaterThan(0);
    });

    it('should handle rules with no impressions', () => {
      const noImpressionRules: Rule[] = [
        {
          ...mockRules[0],
          metadata: {
            ...mockRules[0].metadata,
            impressions: 0,
            clicks: 0,
          },
        },
      ];

      render(<RulePerformanceDashboard rules={noImpressionRules} />);

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version', () => {
      render(<RulePerformanceDashboard rules={mockRules} compact={true} />);

      expect(screen.getByText('Rules Performance')).toBeInTheDocument();
      expect(screen.queryByText('Rule Performance Analysis')).not.toBeInTheDocument();
    });

    it('should show only top 5 rules in compact mode', () => {
      const manyRules = [...mockRules, ...mockRules, ...mockRules];
      render(<RulePerformanceDashboard rules={manyRules} compact={true} />);

      const rules = screen.getAllByText(/Rule/);
      expect(rules.length).toBeLessThanOrEqual(6); // 5 rules + header
    });

    it('should display rule names and stats in compact view', () => {
      render(<RulePerformanceDashboard rules={mockRules} compact={true} />);

      expect(screen.getByText('AI Topic Rule')).toBeInTheDocument();
      expect(screen.getByText('50x')).toBeInTheDocument(); // firing_count
      expect(screen.getByText('35.0%')).toBeInTheDocument(); // CTR
    });
  });
});
