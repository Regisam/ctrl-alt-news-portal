import { describe, it, expect, beforeEach, vi } from "vitest";
import { createShareEvent, trackShareEvent } from "@/lib/share-utils";
import type { Article } from "@/lib/data";

const mockArticle: Article = {
  id: 1,
  title: { en: "Test Article", pt: "Artigo Teste" },
  excerpt: { en: "Test excerpt", pt: "Trecho teste" },
  category: "AI" as const,
  author: "Test Author",
  date: "2026-04-25",
  readTime: "5 min",
  views: "1.2K",
  image: "https://example.com/image.jpg",
  publishedAt: "2026-04-25T10:00:00Z",
};

describe("Google Analytics Event Tracking", () => {
  beforeEach(() => {
    // Mock window.gtag for testing
    (window as unknown as Record<string, unknown>).gtag = vi.fn();
  });

  describe("createShareEvent", () => {
    it("creates a valid share event object", () => {
      const event = createShareEvent(mockArticle, "facebook");

      expect(event).toHaveProperty("event_name", "article_shared");
      expect(event).toHaveProperty("article_id", 1);
      expect(event).toHaveProperty("article_title", "Test Article");
      expect(event).toHaveProperty("platform", "facebook");
      expect(event).toHaveProperty("timestamp");
    });

    it("includes user_id when provided", () => {
      const event = createShareEvent(mockArticle, "twitter", "user-123");

      expect(event.user_id).toBe("user-123");
    });

    it("generates ISO 8601 timestamp", () => {
      const event = createShareEvent(mockArticle, "linkedin");
      const timestamp = new Date(event.timestamp);

      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("tracks all share platforms", () => {
      const platforms = ["facebook", "twitter", "linkedin", "whatsapp", "email", "copy"] as const;

      platforms.forEach((platform) => {
        const event = createShareEvent(mockArticle, platform);
        expect(event.platform).toBe(platform);
      });
    });
  });

  describe("trackShareEvent", () => {
    it("calls gtag with correct event data", () => {
      const gtagMock = vi.fn();
      (window as unknown as Record<string, unknown>).gtag = gtagMock;

      const event = createShareEvent(mockArticle, "facebook", "user-456");
      trackShareEvent(event);

      expect(gtagMock).toHaveBeenCalledWith("event", "article_shared", {
        article_id: 1,
        article_title: "Test Article",
        platform: "facebook",
        timestamp: event.timestamp,
        user_id: "user-456",
      });
    });

    it("gracefully handles missing gtag", () => {
      delete (window as unknown as Record<string, unknown>).gtag;

      const event = createShareEvent(mockArticle, "twitter");

      expect(() => {
        trackShareEvent(event);
      }).not.toThrow();
    });

    it("tracks all share platforms correctly", () => {
      const gtagMock = vi.fn();
      (window as unknown as Record<string, unknown>).gtag = gtagMock;

      const platforms = ["facebook", "twitter", "linkedin", "whatsapp", "email", "copy"] as const;

      platforms.forEach((platform) => {
        const event = createShareEvent(mockArticle, platform);
        trackShareEvent(event);
      });

      expect(gtagMock).toHaveBeenCalledTimes(platforms.length);
    });

    it("includes all required event properties", () => {
      const gtagMock = vi.fn();
      (window as unknown as Record<string, unknown>).gtag = gtagMock;

      const event = createShareEvent(mockArticle, "linkedin");
      trackShareEvent(event);

      const callArgs = gtagMock.mock.calls[0];
      const eventData = callArgs[2];

      expect(eventData).toHaveProperty("article_id");
      expect(eventData).toHaveProperty("article_title");
      expect(eventData).toHaveProperty("platform");
      expect(eventData).toHaveProperty("timestamp");
    });
  });

  describe("GA integration in ArticleDetail", () => {
    it("creates and tracks event with correct article data", () => {
      const gtagMock = vi.fn();
      (window as unknown as Record<string, unknown>).gtag = gtagMock;

      // Simulate ArticleDetail behavior
      const platform = "whatsapp";
      const event = createShareEvent(mockArticle, platform);
      trackShareEvent(event);

      expect(gtagMock).toHaveBeenCalledWith(
        "event",
        "article_shared",
        expect.objectContaining({
          article_id: mockArticle.id,
          article_title: mockArticle.title.en,
          platform,
        })
      );
    });
  });

  describe("Event data validation", () => {
    it("creates valid event with various article types", () => {
      const articles: Array<Partial<Article> & { id: number; title: any; author: string }> = [
        { id: 1, title: { en: "Article 1", pt: "Artigo 1" }, author: "Author 1", category: "AI" },
        { id: 2, title: { en: "Article 2", pt: "Artigo 2" }, author: "Author 2", category: "SCIENCE" },
        { id: 3, title: { en: "Article 3", pt: "Artigo 3" }, author: "Author 3", category: "ROBOTICS" },
      ];

      articles.forEach((article) => {
        const event = createShareEvent(article as Article, "email");

        expect(event.article_id).toBe(article.id);
        expect(event.article_title).toBe(article.title.en);
        expect(event.platform).toBe("email");
      });
    });

    it("preserves article metadata in events", () => {
      const event = createShareEvent(mockArticle, "copy");

      expect(event.article_id).toBe(mockArticle.id);
      expect(event.article_title).toBe(mockArticle.title.en);
      expect(event.event_name).toBe("article_shared");
    });
  });
});
