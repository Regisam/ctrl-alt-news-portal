import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateShareUrl,
  copyToClipboard,
  createShareEvent,
  trackShareEvent,
  type ShareEvent,
} from '@/lib/share-utils';
import type { Article } from '@/lib/data';

const mockArticle: Article = {
  id: 1,
  title: { en: "Test Article Title", pt: "Título do Artigo de Teste" },
  excerpt: { en: "Test excerpt", pt: "Trecho de teste" },
  category: 'AI',
  author: "John Doe",
  date: "Feb 24, 2026",
  readTime: "5 min",
  views: "1.2K",
  image: "https://example.com/image.jpg",
};

const articleUrl = "https://ctrl-alt-news.com/article/1";

describe("generateShareUrl", () => {
  it("should generate correct Facebook share URL", () => {
    const url = generateShareUrl('facebook', mockArticle, articleUrl);
    expect(url).toContain('facebook.com/sharer/sharer.php');
    expect(url).toContain(encodeURIComponent(articleUrl));
  });

  it("should generate correct Twitter share URL", () => {
    const url = generateShareUrl('twitter', mockArticle, articleUrl);
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent(articleUrl));
    expect(url).toContain(encodeURIComponent('Test Article Title by John Doe at Ctrl Alt News'));
    expect(url).toContain('via=ctrlaltnews');
  });

  it("should generate correct LinkedIn share URL", () => {
    const url = generateShareUrl('linkedin', mockArticle, articleUrl);
    expect(url).toContain('linkedin.com/sharing/share-offsite');
    expect(url).toContain(encodeURIComponent(articleUrl));
  });

  it("should generate correct WhatsApp share URL", () => {
    const url = generateShareUrl('whatsapp', mockArticle, articleUrl);
    expect(url).toContain('wa.me');
    expect(url).toContain(encodeURIComponent('Test Article Title'));
    expect(url).toContain(encodeURIComponent(articleUrl));
  });

  it("should generate correct email share URL", () => {
    const url = generateShareUrl('email', mockArticle, articleUrl);
    expect(url).toContain('mailto:');
    expect(url).toContain('subject=' + encodeURIComponent('Test Article Title'));
    expect(url).toContain(encodeURIComponent(articleUrl));
  });

  it("should return article URL for copy platform", () => {
    const url = generateShareUrl('copy', mockArticle, articleUrl);
    expect(url).toBe(articleUrl);
  });

  it("should use custom text when provided", () => {
    const customText = "Custom share message";
    const url = generateShareUrl('twitter', mockArticle, articleUrl, customText);
    expect(url).toContain(encodeURIComponent(customText));
  });
});

describe("copyToClipboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use navigator.clipboard if available", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    await copyToClipboard("test text");
    expect(writeTextMock).toHaveBeenCalledWith("test text");
  });

  it("should handle clipboard errors gracefully", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Clipboard error"));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    await expect(copyToClipboard("test text")).rejects.toThrow("Failed to copy link");
  });
});

describe("createShareEvent", () => {
  it("should create a share event with correct properties", () => {
    const event = createShareEvent(mockArticle, 'twitter');

    expect(event.event_name).toBe('article_shared');
    expect(event.article_id).toBe(mockArticle.id);
    expect(event.article_title).toBe(mockArticle.title.en);
    expect(event.platform).toBe('twitter');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601 format
  });

  it("should include user_id when provided", () => {
    const userId = "user-123";
    const event = createShareEvent(mockArticle, 'facebook', userId);

    expect(event.user_id).toBe(userId);
  });

  it("should create valid ISO 8601 timestamp", () => {
    const event = createShareEvent(mockArticle, 'linkedin');
    const timestamp = new Date(event.timestamp);

    expect(timestamp.toString()).not.toBe('Invalid Date');
  });
});

describe("trackShareEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call gtag if available", () => {
    const gtagMock = vi.fn();
    (globalThis as unknown as Record<string, unknown>).gtag = gtagMock;

    const event: ShareEvent = {
      event_name: 'article_shared',
      article_id: 1,
      article_title: 'Test',
      platform: 'twitter',
      timestamp: new Date().toISOString(),
    };

    trackShareEvent(event);

    expect(gtagMock).toHaveBeenCalledWith('event', 'article_shared', {
      article_id: event.article_id,
      article_title: event.article_title,
      platform: event.platform,
      timestamp: event.timestamp,
      user_id: undefined,
    });
  });

  it("should work without gtag", () => {
    delete (globalThis as unknown as Record<string, unknown>).gtag;

    const event: ShareEvent = {
      event_name: 'article_shared',
      article_id: 1,
      article_title: 'Test',
      platform: 'linkedin',
      timestamp: new Date().toISOString(),
    };

    expect(() => trackShareEvent(event)).not.toThrow();
  });
});
