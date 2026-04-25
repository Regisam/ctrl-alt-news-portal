import type { Article } from '@/lib/data';
import { generateCanonicalURL } from '@/lib/sitemap';

interface MetaTagsConfig {
  siteName?: string;
  siteUrl?: string;
  twitterHandle?: string;
}

const DEFAULT_CONFIG: MetaTagsConfig = {
  siteName: 'Ctrl Alt News',
  siteUrl: 'https://ctrlaltnews.com',
  twitterHandle: '@ctrlaltnews',
};

const CATEGORY_IMAGES: Record<string, string> = {
  AI: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-2_1771963521000_na1fn_YWktbmV1cmFsLWFydGljbGU.jpg',
  SCIENCE: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-3_1771963525000_na1fn_c2NpZW5jZS1xdWFudHVtLWFydGljbGU.jpg',
  ROBOTICS: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-4_1771963533000_na1fn_cm9ib3RpY3MtYXJ0aWNsZQ.jpg',
  GADGETS: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-5_1771963529000_na1fn_Z2FkZ2V0cy1zbWFydHdhdGNo.jpg',
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function sanitizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

export interface GeneratedMetaTags {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  ogSiteName: string;
  articlePublishedTime: string;
  articleAuthor: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCreator: string;
  canonical: string;
  author: string;
}

export function generateMetaTags(
  article: Article,
  config: MetaTagsConfig = DEFAULT_CONFIG,
  lang: 'en' | 'pt' = 'en'
): GeneratedMetaTags {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const title = article.title[lang] || article.title.en;
  const excerpt = article.excerpt[lang] || article.excerpt.en;
  const description = truncate(excerpt, 160);
  const featuredImage = article.image || CATEGORY_IMAGES[article.category];
  const articleUrl = generateCanonicalURL(mergedConfig.siteUrl!, title, article.id.toString());

  return {
    title: truncate(title, 60),
    description,
    keywords: `${article.category.toLowerCase()}, news, tech, ${article.category}`,
    ogTitle: truncate(title, 100),
    ogDescription: description,
    ogImage: sanitizeUrl(featuredImage),
    ogUrl: articleUrl,
    ogType: 'article',
    ogSiteName: mergedConfig.siteName || 'Ctrl Alt News',
    articlePublishedTime: article.date,
    articleAuthor: article.author,
    twitterCard: 'summary_large_image',
    twitterTitle: truncate(title, 70),
    twitterDescription: truncate(excerpt, 200),
    twitterImage: sanitizeUrl(featuredImage),
    twitterCreator: mergedConfig.twitterHandle || '@ctrlaltnews',
    canonical: articleUrl,
    author: article.author,
  };
}

export function createMetaTagElements(tags: GeneratedMetaTags): Record<string, string> {
  return {
    'meta-title': tags.title,
    'meta-description': tags.description,
    'meta-keywords': tags.keywords,
    'meta-author': tags.author,
    'og-title': tags.ogTitle,
    'og-description': tags.ogDescription,
    'og-image': tags.ogImage,
    'og-url': tags.ogUrl,
    'og-type': tags.ogType,
    'og-sitename': tags.ogSiteName,
    'article-published-time': tags.articlePublishedTime,
    'article-author': tags.articleAuthor,
    'twitter-card': tags.twitterCard,
    'twitter-title': tags.twitterTitle,
    'twitter-description': tags.twitterDescription,
    'twitter-image': tags.twitterImage,
    'twitter-creator': tags.twitterCreator,
    'canonical': tags.canonical,
  };
}
