import { describe, it, expect } from 'vitest';
import { generateMetaTags, createMetaTagElements } from '@/lib/meta-tags';
import type { Article } from '@/lib/data';

const mockArticle: Article = {
  id: 1,
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
  date: 'Feb 24, 2026',
  readTime: '5 min',
  views: '48.2K',
  image: 'https://example.com/image.jpg',
};

describe('generateMetaTags', () => {
  it('should generate meta tags with correct structure', () => {
    const tags = generateMetaTags(mockArticle);

    expect(tags).toHaveProperty('title');
    expect(tags).toHaveProperty('description');
    expect(tags).toHaveProperty('keywords');
    expect(tags).toHaveProperty('ogTitle');
    expect(tags).toHaveProperty('ogDescription');
    expect(tags).toHaveProperty('ogImage');
    expect(tags).toHaveProperty('ogUrl');
    expect(tags).toHaveProperty('twitterCard');
    expect(tags).toHaveProperty('canonical');
  });

  it('should truncate title to 60 characters', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.title.length).toBeLessThanOrEqual(60);
  });

  it('should truncate description to 160 characters', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.description.length).toBeLessThanOrEqual(160);
  });

  it('should generate correct OG title', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.ogTitle).toContain('GPT-5');
  });

  it('should set og:type to article', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.ogType).toBe('article');
  });

  it('should set twitter:card to summary_large_image', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.twitterCard).toBe('summary_large_image');
  });

  it('should include article category in keywords', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.keywords).toContain('ai');
  });

  it('should generate correct canonical URL', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.canonical).toContain(`/article/${mockArticle.id}`);
  });

  it('should respect language parameter', () => {
    const tagsEn = generateMetaTags(mockArticle, {}, 'en');
    const tagsPt = generateMetaTags(mockArticle, {}, 'pt');

    expect(tagsEn.title).toContain('GPT-5');
    expect(tagsPt.title).toContain('GPT-5');
  });

  it('should use custom config values', () => {
    const customConfig = {
      siteUrl: 'https://custom.com',
      siteName: 'Custom News',
      twitterHandle: '@customnews',
    };
    const tags = generateMetaTags(mockArticle, customConfig);

    expect(tags.canonical).toContain('custom.com');
    expect(tags.ogSiteName).toBe('Custom News');
    expect(tags.twitterCreator).toBe('@customnews');
  });

  it('should use article image as og:image', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.ogImage).toBe(mockArticle.image);
  });

  it('should use category fallback image if article image missing', () => {
    const articleWithoutImage = { ...mockArticle, image: '' };
    const tags = generateMetaTags(articleWithoutImage);
    expect(tags.ogImage).toBeTruthy();
    expect(tags.ogImage).not.toBe('');
  });

  it('should set correct author info', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.author).toBe(mockArticle.author);
    expect(tags.articleAuthor).toBe(mockArticle.author);
  });

  it('should set article published time in ISO format', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.articlePublishedTime).toBeDefined();
    expect(typeof tags.articlePublishedTime).toBe('string');
    expect(tags.articlePublishedTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should set article modified time in ISO format', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.articleModifiedTime).toBeDefined();
    expect(typeof tags.articleModifiedTime).toBe('string');
    expect(tags.articleModifiedTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should set article modified time same as published time', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.articleModifiedTime).toBeDefined();
    expect(tags.articleModifiedTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should set article section to category', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.articleSection).toBe(mockArticle.category);
  });

  it('should set platform-specific images from article image', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.linkedInImage).toBe(mockArticle.image);
    expect(tags.pinterestImage).toBe(mockArticle.image);
    expect(tags.whatsAppImage).toBe(mockArticle.image);
  });

  it('should use category fallback for all platform images', () => {
    const articleWithoutImage = { ...mockArticle, image: '' };
    const tags = generateMetaTags(articleWithoutImage);
    expect(tags.linkedInImage).toBeTruthy();
    expect(tags.pinterestImage).toBeTruthy();
    expect(tags.whatsAppImage).toBeTruthy();
  });

  it('should have all platform-specific properties', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags).toHaveProperty('linkedInImage');
    expect(tags).toHaveProperty('pinterestImage');
    expect(tags).toHaveProperty('whatsAppImage');
    expect(tags).toHaveProperty('articleModifiedTime');
    expect(tags).toHaveProperty('articleSection');
  });

  it('should use date for published time', () => {
    const tags = generateMetaTags(mockArticle);
    expect(tags.articlePublishedTime).toBeDefined();
    expect(tags.articlePublishedTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(tags.articlePublishedTime).toContain('2026-02');
  });
});

describe('createMetaTagElements', () => {
  it('should create meta tag elements object', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('meta-title');
    expect(elements).toHaveProperty('meta-description');
    expect(elements).toHaveProperty('og-title');
    expect(elements).toHaveProperty('twitter-card');
    expect(elements).toHaveProperty('canonical');
  });

  it('should map all tag values correctly', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements['meta-title']).toBe(tags.title);
    expect(elements['meta-description']).toBe(tags.description);
    expect(elements['og-title']).toBe(tags.ogTitle);
    expect(elements['twitter-card']).toBe(tags.twitterCard);
    expect(elements['canonical']).toBe(tags.canonical);
  });

  it('should map platform-specific image elements', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('linkedin-image');
    expect(elements).toHaveProperty('pinterest-image');
    expect(elements).toHaveProperty('whatsapp-image');
    expect(elements['linkedin-image']).toBe(tags.linkedInImage);
    expect(elements['pinterest-image']).toBe(tags.pinterestImage);
    expect(elements['whatsapp-image']).toBe(tags.whatsAppImage);
  });

  it('should map article metadata elements', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('article-modified-time');
    expect(elements).toHaveProperty('article-section');
    expect(elements['article-modified-time']).toBe(tags.articleModifiedTime);
    expect(elements['article-section']).toBe(tags.articleSection);
  });

  it('should include all OG tags in elements', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('og-title');
    expect(elements).toHaveProperty('og-description');
    expect(elements).toHaveProperty('og-image');
    expect(elements).toHaveProperty('og-url');
    expect(elements).toHaveProperty('og-type');
    expect(elements).toHaveProperty('og-sitename');
  });

  it('should include all article metadata in elements', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('article-published-time');
    expect(elements).toHaveProperty('article-modified-time');
    expect(elements).toHaveProperty('article-author');
    expect(elements).toHaveProperty('article-section');
  });

  it('should include all Twitter card tags', () => {
    const tags = generateMetaTags(mockArticle);
    const elements = createMetaTagElements(tags);

    expect(elements).toHaveProperty('twitter-card');
    expect(elements).toHaveProperty('twitter-title');
    expect(elements).toHaveProperty('twitter-description');
    expect(elements).toHaveProperty('twitter-image');
    expect(elements).toHaveProperty('twitter-creator');
  });
});
