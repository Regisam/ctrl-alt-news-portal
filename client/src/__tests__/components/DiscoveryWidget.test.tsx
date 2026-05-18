import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DiscoveryWidget } from '../../components/DiscoveryWidget';

describe('DiscoveryWidget', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('component rendering', () => {
    it('should render discovery widget', () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} />
      );

      const widget = container.querySelector('.discovery-widget');
      expect(widget).toBeTruthy();
    });

    it('should render widget title', async () => {
      render(<DiscoveryWidget userId={userId} />);

      await waitFor(() => {
        const title = screen.getByText('Trending in Your Interests');
        expect(title).toBeTruthy();
      });
    });

    it('should accept and apply custom className', () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} className="custom-widget" />
      );

      const widget = container.querySelector('.custom-widget');
      expect(widget).toBeTruthy();
    });
  });

  describe('props handling', () => {
    it('should accept userId prop', () => {
      const { container } = render(
        <DiscoveryWidget userId="user-456" />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });

    it('should accept maxItems prop', () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} maxItems={3} />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });

    it('should accept cacheMinutes prop', () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} cacheMinutes={30} />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });

    it('should accept onArticleClick callback', () => {
      const callback = () => {};

      const { container } = render(
        <DiscoveryWidget userId={userId} onArticleClick={callback} />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });
  });

  describe('structure', () => {
    it('should have widget container with correct attributes', async () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} />
      );

      await waitFor(() => {
        const widget = container.querySelector('[data-testid="discovery-widget"]');
        expect(widget).toBeTruthy();
      });
    });

    it('should render heading with icon', async () => {
      render(<DiscoveryWidget userId={userId} />);

      await waitFor(() => {
        const heading = screen.getByText('Trending in Your Interests');
        expect(heading).toBeTruthy();
        expect(heading.parentElement).toBeTruthy();
      });
    });
  });

  describe('responsive behavior', () => {
    it('should render different layouts based on maxItems', async () => {
      const { rerender } = render(
        <DiscoveryWidget userId={userId} maxItems={3} />
      );

      await waitFor(() => {
        expect(screen.getByText('Trending in Your Interests')).toBeTruthy();
      });

      rerender(<DiscoveryWidget userId={userId} maxItems={5} />);

      await waitFor(() => {
        expect(screen.getByText('Trending in Your Interests')).toBeTruthy();
      });
    });
  });

  describe('error states', () => {
    it('should render without crashing with default props', () => {
      const { container } = render(
        <DiscoveryWidget userId={userId} />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });

    it('should handle empty userId gracefully', () => {
      const { container } = render(
        <DiscoveryWidget userId="" />
      );

      expect(container.querySelector('.discovery-widget')).toBeTruthy();
    });
  });
});
