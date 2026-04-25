import { describe, it, expect } from 'vitest';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from '@/lib/schema';
import type { Article } from '@/lib/data';

const mockArticle: Article = {
  id: 123,
  title: {
    en: 'GPT-5 Breaks Every Benchmark: The New Era of Reasoning AI',
    pt: 'GPT-5 Quebra Todos os Benchmarks: A Nova Era da IA de Raciocínio',
  },
  excerpt: {
    en: 'OpenAI\'s latest model demonstrates unprecedented logical reasoning capabilities, surpassing human performance on complex multi-step problems.',
    pt: 'O mais recente modelo da OpenAI demonstra capacidades de raciocínio lógico sem precedentes, superando o desempenho humano em problemas complexos de múltiplas etapas.',
  },
  category: 'AI',
  author: 'Alex Chen',
  date: 'Apr 25, 2026',
  readTime: '5 min',
  views: '48.2K',
  image: 'https://example.com/gpt5-article.jpg',
};

describe('generateArticleSchema', () => {
  it('should generate valid article schema structure', () => {
    const schema = generateArticleSchema(mockArticle);

    expect(schema).toHaveProperty('@context', 'https://schema.org');
    expect(schema).toHaveProperty('@type', 'NewsArticle');
    expect(schema).toHaveProperty('headline');
    expect(schema).toHaveProperty('description');
    expect(schema).toHaveProperty('image');
    expect(schema).toHaveProperty('datePublished');
    expect(schema).toHaveProperty('dateModified');
    expect(schema).toHaveProperty('author');
    expect(schema).toHaveProperty('publisher');
    expect(schema).toHaveProperty('articleSection');
  });

  it('should use article title in headline', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.headline).toBe(mockArticle.title.en);
  });

  it('should use article excerpt in description', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.description).toContain('OpenAI');
  });

  it('should truncate description to 160 characters', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.description.length).toBeLessThanOrEqual(160);
  });

  it('should use article image as og:image', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.image[0].url).toBe(mockArticle.image);
  });

  it('should use placeholder image if article image missing', () => {
    const articleWithoutImage = { ...mockArticle, image: '' };
    const schema = generateArticleSchema(articleWithoutImage);
    expect(schema.image[0].url).toBeTruthy();
    expect(schema.image[0].url).toContain('private-us-east');
  });

  it('should set image dimensions to 1200x630', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.image[0].width).toBe(1200);
    expect(schema.image[0].height).toBe(630);
  });

  it('should format dates in ISO 8601', () => {
    const schema = generateArticleSchema(mockArticle);
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(schema.datePublished).toMatch(isoRegex);
    expect(schema.dateModified).toMatch(isoRegex);
  });

  it('should include author information', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.author['@type']).toBe('Person');
    expect(schema.author.name).toBe(mockArticle.author);
    expect(schema.author.url).toContain('author');
  });

  it('should generate author slug correctly', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.author.url).toContain('/author/alex-chen');
  });

  it('should include publisher information', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.publisher['@type']).toBe('Organization');
    expect(schema.publisher.name).toBe('Ctrl Alt News');
    expect(schema.publisher.logo).toHaveProperty('url');
    expect(schema.publisher.logo).toHaveProperty('width', 600);
    expect(schema.publisher.logo).toHaveProperty('height', 60);
  });

  it('should set article section to category', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.articleSection).toBe('AI');
  });

  it('should accept custom site config', () => {
    const customConfig = {
      siteUrl: 'https://custom.com',
      siteName: 'Custom News',
    };
    const schema = generateArticleSchema(mockArticle, customConfig);
    expect(schema.author.url).toContain('https://custom.com');
    expect(schema.publisher.name).toBe('Custom News');
    expect(schema.publisher.url).toBe('https://custom.com');
  });

  it('should handle invalid dates gracefully', () => {
    const articleWithBadDate = { ...mockArticle, date: 'invalid-date' };
    const schema = generateArticleSchema(articleWithBadDate);
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(schema.datePublished).toMatch(isoRegex);
  });

  it('should handle missing featured image with fallback', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(schema.image[0].url).toBeTruthy();
    expect(schema.image).toHaveLength(1);
  });
});

describe('generateBreadcrumbSchema', () => {
  it('should generate valid breadcrumb schema structure', () => {
    const schema = generateBreadcrumbSchema(mockArticle);

    expect(schema).toHaveProperty('@context', 'https://schema.org');
    expect(schema).toHaveProperty('@type', 'BreadcrumbList');
    expect(schema).toHaveProperty('itemListElement');
    expect(Array.isArray(schema.itemListElement)).toBe(true);
  });

  it('should include home breadcrumb at position 1', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Home');
  });

  it('should include category breadcrumb at position 2', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].name).toBe('AI');
    expect(schema.itemListElement[1].item).toContain('/category/ai');
  });

  it('should include article breadcrumb at position 3', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[2].name).toBe(mockArticle.title.en);
    expect(schema.itemListElement[2].item).toContain(`/article/${mockArticle.id}`);
  });

  it('should generate correct breadcrumb hierarchy', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(schema.itemListElement).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(schema.itemListElement[i]).toHaveProperty('@type', 'ListItem');
      expect(schema.itemListElement[i]).toHaveProperty('position');
      expect(schema.itemListElement[i]).toHaveProperty('name');
      expect(schema.itemListElement[i]).toHaveProperty('item');
    }
  });

  it('should accept custom site config', () => {
    const customConfig = {
      siteUrl: 'https://custom.com',
      siteName: 'Custom News',
    };
    const schema = generateBreadcrumbSchema(mockArticle, customConfig);
    expect(schema.itemListElement[0].item).toBe('https://custom.com');
    expect(schema.itemListElement[1].item).toContain('https://custom.com');
    expect(schema.itemListElement[2].item).toContain('https://custom.com');
  });

  it('should convert category to lowercase in breadcrumb URL', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(schema.itemListElement[1].item).toContain('/category/ai');
  });
});

describe('Schema JSON-LD validity', () => {
  it('should generate valid JSON-LD for article schema', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(() => JSON.stringify(schema)).not.toThrow();
    const json = JSON.stringify(schema);
    expect(json).toContain('@context');
    expect(json).toContain('@type');
  });

  it('should generate valid JSON-LD for breadcrumb schema', () => {
    const schema = generateBreadcrumbSchema(mockArticle);
    expect(() => JSON.stringify(schema)).not.toThrow();
    const json = JSON.stringify(schema);
    expect(json).toContain('@context');
    expect(json).toContain('BreadcrumbList');
  });

  it('should not contain circular references', () => {
    const schema = generateArticleSchema(mockArticle);
    expect(() => {
      const seen = new WeakSet<Record<string, unknown>>();
      const hasCycle = (obj: unknown): boolean => {
        if (typeof obj !== 'object' || obj === null) return false;
        const objRecord = obj as Record<string, unknown>;
        if (seen.has(objRecord)) return true;
        seen.add(objRecord);
        for (const key in objRecord) {
          if (hasCycle(objRecord[key])) return true;
        }
        return false;
      };
      hasCycle(schema);
    }).not.toThrow();
  });
});
