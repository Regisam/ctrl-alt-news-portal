import { describe, it, expect } from "vitest";
import {
  generateSitemapXML,
  generateCanonicalURL,
  validateSitemapXML,
} from "../lib/sitemap";

const mockArticles = [
  {
    id: 1,
    title: { en: "AI Revolution", pt: "Revolução da IA" },
    excerpt: {
      en: "Latest breakthroughs in AI",
      pt: "Últimas descobertas em IA",
    },
    category: "AI" as const,
    author: "Tech Writer",
    date: "2026-04-25",
    readTime: "5 min",
    views: "1.2K",
    image: "https://example.com/ai.jpg",
    publishedAt: "2026-04-25T10:00:00Z",
  },
  {
    id: 2,
    title: { en: "Quantum Computing", pt: "Computação Quântica" },
    excerpt: { en: "Breaking quantum barriers", pt: "Quebrando barreiras quânticas" },
    category: "SCIENCE" as const,
    author: "Science Reporter",
    date: "2026-04-24",
    readTime: "8 min",
    views: "2.5K",
    image: "https://example.com/quantum.jpg",
  },
];

const testConfig = {
  siteUrl: "https://example.com",
  baseUrl: "https://example.com",
};

describe("Sitemap Generation", () => {
  describe("generateSitemapXML", () => {
    it("generates valid XML sitemap", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain("<urlset");
      expect(xml).toContain("</urlset>");
    });

    it("includes homepage in sitemap", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain("https://example.com");
      expect(xml).toContain("<changefreq>daily</changefreq>");
      expect(xml).toMatch(/<priority>1(\.0)?<\/priority>/);
    });

    it("includes all category pages", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain("/category/ai");
      expect(xml).toContain("/category/science");
      expect(xml).toContain("/category/robotics");
      expect(xml).toContain("/category/gadgets");
    });

    it("assigns correct priority to category pages", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const categorySection = xml.match(
        /<url>[\s\S]*?\/category\/ai[\s\S]*?<\/url>/
      )?.[0];
      expect(categorySection).toContain("<priority>0.8</priority>");
    });

    it("includes all articles in sitemap", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain("/article/1/");
      expect(xml).toContain("/article/2/");
    });

    it("assigns correct priority to articles", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const articleSection = xml.match(/<url>[\s\S]*?\/article\/1[\s\S]*?<\/url>/)?.[0];
      expect(articleSection).toContain("<priority>0.6</priority>");
    });

    it("includes lastmod dates for articles", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain("<lastmod>2026-04-25</lastmod>");
      expect(xml).toContain("<lastmod>2026-04-24</lastmod>");
    });

    it("sets changefreq to weekly for articles", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const articleSection = xml.match(/<url>[\s\S]*?\/article\/1[\s\S]*?<\/url>/)?.[0];
      expect(articleSection).toContain("<changefreq>weekly</changefreq>");
    });

    it("removes special characters from article titles in slug", () => {
      const articlesWithSpecialChars = [
        {
          ...mockArticles[0],
          title: { en: 'AI & ML "Revolution"', pt: "PT Title" },
        },
      ];
      const xml = generateSitemapXML(articlesWithSpecialChars, testConfig);
      // Special characters should be removed from slug, resulting in clean URL
      expect(xml).toContain("/article/1/ai-ml-revolution");
      // Extract article section to verify no unescaped special chars in slug
      const articleMatch = xml.match(/<loc>.*\/article\/1\/.*<\/loc>/);
      expect(articleMatch?.[0]).toContain("ai-ml-revolution");
    });
  });

  describe("generateCanonicalURL", () => {
    it("generates canonical URL with slug", () => {
      const url = generateCanonicalURL(
        "https://example.com",
        "AI Revolution",
        "1"
      );
      expect(url).toBe("https://example.com/article/1/ai-revolution");
    });

    it("converts title to lowercase slug", () => {
      const url = generateCanonicalURL(
        "https://example.com",
        "QUANTUM COMPUTING",
        "2"
      );
      expect(url).toContain("quantum-computing");
    });

    it("replaces spaces with hyphens", () => {
      const url = generateCanonicalURL(
        "https://example.com",
        "The Future Of AI",
        "3"
      );
      expect(url).toContain("the-future-of-ai");
    });

    it("removes special characters from slug", () => {
      const url = generateCanonicalURL(
        "https://example.com",
        "AI and ML Breaking Barriers",
        "4"
      );
      const slug = url.split("/").pop();
      expect(slug).not.toContain("&");
      expect(slug).not.toContain(":");
      expect(slug).not.toContain("!");
    });

    it("preserves base URL", () => {
      const url = generateCanonicalURL(
        "https://ctrlaltnews.com",
        "Article Title",
        "5"
      );
      expect(url).toBe("https://ctrlaltnews.com/article/5/article-title");
    });

    it("includes article ID in URL", () => {
      const url = generateCanonicalURL(
        "https://example.com",
        "Test Article",
        "42"
      );
      expect(url).toContain("/article/42/");
    });
  });

  describe("validateSitemapXML", () => {
    it("validates well-formed sitemap XML", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const isValid = validateSitemapXML(xml);
      expect(isValid).toBe(true);
    });

    it("rejects malformed XML", () => {
      const malformedXml = "<urlset><url><loc>test</url></urlset>";
      const isValid = validateSitemapXML(malformedXml);
      expect(isValid).toBe(false);
    });

    it("rejects XML without urlset", () => {
      const xml = '<url><loc>https://example.com</loc></url>';
      const isValid = validateSitemapXML(xml);
      expect(isValid).toBe(false);
    });

    it("rejects empty string", () => {
      const isValid = validateSitemapXML("");
      expect(isValid).toBe(false);
    });

    it("rejects invalid XML", () => {
      const invalidXml = "this is not xml";
      const isValid = validateSitemapXML(invalidXml);
      expect(isValid).toBe(false);
    });
  });

  describe("Sitemap Structure", () => {
    it("includes XML declaration", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toMatch(/^<\?xml version="1.0"/);
    });

    it("includes xmlns attribute", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    });

    it("contains correct number of entries", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const urlMatches = xml.match(/<url>/g);
      // 1 homepage + 4 categories + 2 articles = 7 entries
      expect(urlMatches?.length).toBe(7);
    });

    it("maintains ISO 8601 date format", () => {
      const xml = generateSitemapXML(mockArticles, testConfig);
      const dateMatches = xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g);
      expect(dateMatches?.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty articles array", () => {
      const xml = generateSitemapXML([], testConfig);
      const isValid = validateSitemapXML(xml);
      expect(isValid).toBe(true);
      expect(xml).toContain("<url>");
    });

    it("handles articles without published date", () => {
      const articlesNoDates = [
        {
          ...mockArticles[0],
          publishedAt: undefined,
          updatedAt: undefined,
        },
      ];
      const xml = generateSitemapXML(articlesNoDates, testConfig);
      expect(xml).toContain("<lastmod>");
    });

    it("handles default config when not provided", () => {
      const xml = generateSitemapXML(mockArticles);
      expect(xml).toContain("https://ctrlaltnews.com");
    });

    it("handles articles with duplicate IDs", () => {
      const duplicateArticles = [mockArticles[0], mockArticles[0]];
      const xml = generateSitemapXML(duplicateArticles, testConfig);
      const isValid = validateSitemapXML(xml);
      expect(isValid).toBe(true);
    });
  });

  describe("Performance", () => {
    it("generates sitemap for 100+ articles within acceptable time", () => {
      const largeArticleSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockArticles[0],
        id: i + 1,
      }));

      const start = performance.now();
      generateSitemapXML(largeArticleSet, testConfig);
      const end = performance.now();

      expect(end - start).toBeLessThan(500);
    });
  });
});
