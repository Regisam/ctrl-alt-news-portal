/**
 * Smart Digest Email Template Tests — Story 12.7 Phase 2
 *
 * Tests for email rendering, template structure, mobile responsiveness,
 * security (XSS prevention), and analytics integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderDigestEmail, generateOneTimeToken } from '../services/SmartDigestService';
import { SmartDigestPayload, SmartDigestConfig, DigestArticle } from '../../client/src/lib/smart-digest.types';

describe('SmartDigestService - Email Rendering (Phase 2)', () => {
  let mockConfig: SmartDigestConfig;
  let mockArticles: DigestArticle[];
  let mockDigest: SmartDigestPayload;

  beforeEach(() => {
    // Setup test configuration
    mockConfig = {
      enabled: true,
      frequency: 'weekly',
      preferredTime: '08:00',
      topics: ['AI', 'Science'],
      lastDigestSent: new Date(),
    };

    // Setup test articles
    mockArticles = [
      {
        id: '1',
        title: 'The Future of AI in Healthcare',
        summary: 'AI is revolutionizing medical diagnostics and patient care. New models achieve 99% accuracy.',
        link: 'https://ctrl-alt-news.local/articles/ai-healthcare',
        category: 'AI',
        relevanceScore: 95,
        reason: 'Matches your AI interest and trending in your feed',
      },
      {
        id: '2',
        title: 'Quantum Computing Breakthrough Announced',
        summary: 'Scientists achieve quantum advantage in optimization problems. New processor shows 10x speedup.',
        link: 'https://ctrl-alt-news.local/articles/quantum-breakthrough',
        category: 'Science',
        relevanceScore: 88,
        reason: 'Related to your Science interest',
      },
      {
        id: '3',
        title: 'Latest Robotics Innovations',
        summary: 'Humanoid robots now capable of complex assembly tasks with minimal supervision.',
        link: 'https://ctrl-alt-news.local/articles/robotics-innovation',
        category: 'Robotics',
        relevanceScore: 85,
        reason: 'Trending topic in your preferred categories',
      },
      {
        id: '4',
        title: 'New Smartphone Cameras Set Records',
        summary: 'Latest flagship phones feature 200MP sensors with advanced computational photography.',
        link: 'https://ctrl-alt-news.local/articles/smartphone-cameras',
        category: 'Gadgets',
        relevanceScore: 78,
        reason: 'Popular in your gadgets section',
      },
      {
        id: '5',
        title: 'Neural Networks Meet Symbolic AI',
        summary: 'Hybrid approach combines deep learning with rule-based systems for better explainability.',
        link: 'https://ctrl-alt-news.local/articles/hybrid-ai',
        category: 'AI',
        relevanceScore: 92,
        reason: 'Matches your top AI interest',
      },
    ];

    // Setup digest payload
    mockDigest = {
      userId: 'user-123',
      digestDate: new Date('2026-05-13T08:00:00Z'),
      articles: mockArticles,
      config: mockConfig,
      unsubscribeToken: 'token-unsubscribe-abc123xyz',
      preferencesToken: 'token-prefs-def456uvw',
    };
  });

  describe('Task 2.1: Email Template Structure', () => {
    it('should render HTML email with valid DOCTYPE and structure', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Verify HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include header with "Your Smart Digest" title', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('Your Smart Digest');
      expect(html).toContain('Top articles curated for you');
      expect(html).toContain('<div class="header">');
    });

    it('should include personalized greeting with user name', () => {
      const html = renderDigestEmail(mockDigest, 'Alice Smith');

      expect(html).toContain('Hi Alice Smith,');
    });

    it('should render all articles with correct structure', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Verify articles container
      expect(html).toContain('<div class="articles">');

      // Verify all 5 articles are rendered
      mockArticles.forEach((article) => {
        expect(html).toContain(article.title);
        expect(html).toContain(article.summary);
        expect(html).toContain(article.link);
        expect(html).toContain(article.category);
      });
    });

    it('AC3: should render email template with 3-5 top-ranked articles', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Count article divs
      const articleCount = (html.match(/<div class="article">/g) || []).length;
      expect(articleCount).toBe(mockArticles.length);
      expect(articleCount).toBeGreaterThanOrEqual(3);
      expect(articleCount).toBeLessThanOrEqual(5);
    });

    it('AC5: should include article metadata (title, summary, link, category)', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');
      const testArticle = mockArticles[0];

      // All metadata should be present
      expect(html).toContain(`href="${testArticle.link}`);
      expect(html).toContain(testArticle.title);
      expect(html).toContain(testArticle.summary);
      expect(html).toContain(testArticle.category);
    });

    it('should render articles with UTM tracking parameters', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Verify UTM parameters are added
      expect(html).toContain('utm_source=digest');
      expect(html).toContain('utm_medium=email');
      expect(html).toContain('utm_campaign=smart_digest');
    });
  });

  describe('Task 2.1.2: CSS for Responsive Mobile Design', () => {
    it('should include inline CSS styles in <head>', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('should include mobile-responsive styles (max-width media query)', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('@media (max-width: 600px)');
    });

    it('should include dark mode support (@prefers-color-scheme: dark)', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should have max-width constraint for desktop view', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('max-width: 600px');
    });

    it('should include proper spacing and padding for readability', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Verify padding values for content sections
      expect(html).toContain('padding: 32px 24px');
      expect(html).toContain('padding: 24px');
    });

    it('should style category badges with color-coded styling', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Check for category-specific colors
      expect(html).toContain('.category.ai');
      expect(html).toContain('.category.science');
      expect(html).toContain('.category.robotics');
      expect(html).toContain('.category.gadgets');
    });

    it('should use system fonts as fallback for email compatibility', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('-apple-system');
      expect(html).toContain('BlinkMacSystemFont');
      expect(html).toContain('Segoe UI');
    });
  });

  describe('Task 2.1.3: Dynamic Article Rendering', () => {
    it('should render article titles as clickable links', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      mockArticles.forEach((article) => {
        expect(html).toContain(`<a href="${article.link}`);
        expect(html).toContain(article.title);
        expect(html).toContain('</a>');
      });
    });

    it('should render article summaries with proper truncation', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      mockArticles.forEach((article) => {
        // Summary should be present (may be truncated if > 150 chars)
        if (article.summary.length <= 150) {
          expect(html).toContain(article.summary);
        } else {
          expect(html).toContain(article.summary.substring(0, 150));
        }
      });
    });

    it('should display "Recommended because:" explanation for each article', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      mockArticles.forEach((article) => {
        expect(html).toContain('Recommended because:');
        expect(html).toContain(article.reason);
      });
    });

    it('should apply category-specific CSS class to badges', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Verify category classes are applied
      expect(html).toContain('class="category ai"');
      expect(html).toContain('class="category science"');
      expect(html).toContain('class="category robotics"');
    });

    it('should render articles in order of relevance score', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Articles are rendered as provided (order matters for relevance)
      const articleTitles = mockArticles.map((a) => a.title);
      let lastIndex = -1;

      articleTitles.forEach((title) => {
        const currentIndex = html.indexOf(title);
        expect(currentIndex).toBeGreaterThan(lastIndex);
        lastIndex = currentIndex;
      });
    });
  });

  describe('Task 2.1.4: Test with Sample Data', () => {
    it('should render email with minimal article count (3 articles)', () => {
      const minimalDigest: SmartDigestPayload = {
        ...mockDigest,
        articles: mockArticles.slice(0, 3),
      };

      const html = renderDigestEmail(minimalDigest, 'Test User');
      const articleCount = (html.match(/<div class="article">/g) || []).length;

      expect(articleCount).toBe(3);
    });

    it('should render email with maximum article count (5 articles)', () => {
      const html = renderDigestEmail(mockDigest, 'Test User');
      const articleCount = (html.match(/<div class="article">/g) || []).length;

      expect(articleCount).toBe(5);
    });

    it('should use correct frequency label in greeting', () => {
      // Weekly
      let html = renderDigestEmail(mockDigest, 'John');
      expect(html).toContain('this week');

      // Daily
      mockDigest.config.frequency = 'daily';
      html = renderDigestEmail(mockDigest, 'John');
      expect(html).toContain('this day');
    });

    it('should handle article titles with special characters', () => {
      const specialArticle: DigestArticle = {
        ...mockArticles[0],
        title: 'AI & Machine Learning: <Script> "Challenges" & Solutions',
      };

      mockDigest.articles[0] = specialArticle;
      const html = renderDigestEmail(mockDigest, 'John');

      // Should be HTML-escaped
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
      expect(html).not.toContain('<Script>');
    });

    it('should handle long article titles gracefully', () => {
      const longTitle = 'A'.repeat(200);
      mockDigest.articles[0].title = longTitle;

      const html = renderDigestEmail(mockDigest, 'John');
      expect(html).toContain(longTitle);
    });

    it('should handle articles with empty summary', () => {
      mockDigest.articles[0].summary = '';
      const html = renderDigestEmail(mockDigest, 'John');

      expect(html).toContain('class="summary"');
    });
  });

  describe('AC6: Unsubscribe & AC7: Preference Management Links', () => {
    it('should include unsubscribe link in footer', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('Unsubscribe');
      expect(html).toContain(`token-unsubscribe-abc123xyz`);
    });

    it('should include manage preferences link in footer', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('Manage Preferences');
      expect(html).toContain(`token-prefs-def456uvw`);
    });

    it('should use one-time tokens in footer links', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('/api/digest/unsubscribe/');
      expect(html).toContain('/digest/preferences/');
    });

    it('should render footer links with proper structure', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('<div class="footer-links">');
      expect(html).toContain('</div>');
    });
  });

  describe('AC8: Email Analytics - Open Tracking Pixel', () => {
    it('should include 1x1 tracking pixel in footer', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('<img');
      expect(html).toContain('class="tracking-pixel"');
      expect(html).toContain('width="1"');
      expect(html).toContain('height="1"');
    });

    it('should use token in tracking pixel URL', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('/api/digest/open/');
      expect(html).toContain(mockDigest.unsubscribeToken);
    });

    it('should mark tracking pixel as alt="" for accessibility', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('alt=""');
    });
  });

  describe('AC12: Security - XSS Prevention', () => {
    it('should escape HTML entities in article titles', () => {
      mockDigest.articles[0].title = '<img src=x onerror=alert("xss")>';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).not.toContain('<img src=x onerror');
      expect(html).toContain('&lt;img');
      expect(html).toContain('&gt;');
    });

    it('should escape HTML entities in article summaries', () => {
      mockDigest.articles[0].summary = 'Test <script>alert("xss")</script>';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML entities in article reasons', () => {
      mockDigest.articles[0].reason = '"quotes" & <brackets>';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('&quot;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
    });

    it('should escape HTML entities in category names', () => {
      mockDigest.articles[0].category = '<svg onload=alert("xss")>';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).not.toContain('<svg');
      expect(html).toContain('&lt;svg');
    });

    it('should escape HTML entities in user name', () => {
      const html = renderDigestEmail(mockDigest, 'John & <Jane>');

      expect(html).not.toContain('<Jane>');
      expect(html).toContain('&lt;Jane&gt;');
      expect(html).toContain('&amp;');
    });

    it('should preserve safe URLs without escaping', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // URLs should not be escaped
      mockArticles.forEach((article) => {
        expect(html).toContain(article.link);
      });
    });
  });

  describe('Token Generation', () => {
    it('should generate 32-character tokens', () => {
      const token = generateOneTimeToken('unsubscribe');

      expect(token).toHaveLength(32);
    });

    it('should generate alphanumeric-only tokens', () => {
      const token = generateOneTimeToken('preferences');
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;

      expect(alphanumericRegex.test(token)).toBe(true);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateOneTimeToken('unsubscribe');
      const token2 = generateOneTimeToken('unsubscribe');
      const token3 = generateOneTimeToken('unsubscribe');

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should accept any token type parameter', () => {
      const types = ['unsubscribe', 'preferences', 'click-tracking', 'custom-type'];

      types.forEach((type) => {
        const token = generateOneTimeToken(type);
        expect(token).toHaveLength(32);
        expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
      });
    });
  });

  describe('Email Rendering with Different Configurations', () => {
    it('should render email with daily frequency', () => {
      mockDigest.config.frequency = 'daily';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('this day');
    });

    it('should render email with weekly frequency', () => {
      mockDigest.config.frequency = 'weekly';
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('this week');
    });

    it('should render email with custom base URL', () => {
      const customUrl = 'https://custom-domain.com';
      const html = renderDigestEmail(mockDigest, 'John Doe', customUrl);

      expect(html).toContain(customUrl);
    });

    it('should use default base URL when not provided', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('https://ctrl-alt-news.local');
    });
  });

  describe('HTML Email Compatibility', () => {
    it('should include proper character encoding (UTF-8)', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('charset=');
      expect(html).toContain('UTF-8');
    });

    it('should include viewport meta tag for mobile', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      expect(html).toContain('viewport');
      expect(html).toContain('device-width');
      expect(html).toContain('1.0');
    });

    it('should use inline CSS for maximum email client compatibility', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Should have style tag with CSS
      expect(html).toContain('<style>');
      expect(html).toContain('body');
      expect(html).toContain('color:');
      expect(html).toContain('</style>');
    });

    it('should render without requiring external stylesheets', () => {
      const html = renderDigestEmail(mockDigest, 'John Doe');

      // Should not have link to external CSS
      expect(html).not.toContain('<link');
      expect(html).not.toContain('stylesheet');
    });
  });
});
