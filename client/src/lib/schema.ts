import type { Article } from '@/lib/data';

interface SchemaConfig {
  siteUrl?: string;
  siteName?: string;
}

const DEFAULT_CONFIG: SchemaConfig = {
  siteUrl: 'https://ctrlaltnews.com',
  siteName: 'Ctrl Alt News',
};

const CATEGORY_IMAGES: Record<string, string> = {
  AI: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-2_1771963521000_na1fn_YWktbmV1cmFsLWFydGljbGU.jpg',
  SCIENCE: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-3_1771963525000_na1fn_c2NpZW5jZS1xdWFudHVtLWFydGljbGU.jpg',
  ROBOTICS: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-4_1771963533000_na1fn_cm9ib3RpY3MtYXJ0aWNsZQ.jpg',
  GADGETS: 'https://private-us-east-1.manuscdn.com/sessionFile/8E4srZkejjokDkWPPgZAIg/sandbox/2GN4erZULxc2C6fMKs09KK-img-5_1771963529000_na1fn_Z2FkZ2V0cy1zbWFydHdhdGNoLmpwZw.jpg',
};

function getPlaceholderImage(category: string): string {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['AI'];
}

function formatISO8601(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function sanitizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

function generateAuthorSlug(authorName: string): string {
  return authorName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export interface ArticleSchemaType {
  '@context': string;
  '@type': 'NewsArticle' | 'Article';
  headline: string;
  description: string;
  image: ImageObjectType[];
  datePublished: string;
  dateModified: string;
  author: PersonSchemaType;
  publisher: OrganizationSchemaType;
  articleSection: string;
}

export interface ImageObjectType {
  '@type': 'ImageObject';
  url: string;
  width: number;
  height: number;
}

export interface PersonSchemaType {
  '@type': 'Person';
  name: string;
  url: string;
}

export interface OrganizationSchemaType {
  '@type': 'Organization';
  name: string;
  logo: ImageObjectType;
  url: string;
}

export interface BreadcrumbListType {
  '@context': string;
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItemType[];
}

export interface BreadcrumbItemType {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export function generateArticleSchema(
  article: Article,
  config: SchemaConfig = DEFAULT_CONFIG
): ArticleSchemaType {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const title = article.title.en || article.title.pt;
  const description = (article.excerpt.en || article.excerpt.pt).substring(0, 160);
  const featuredImage = article.image || getPlaceholderImage(article.category);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: [
      {
        '@type': 'ImageObject',
        url: sanitizeUrl(featuredImage),
        width: 1200,
        height: 630,
      },
    ],
    datePublished: formatISO8601(article.date),
    dateModified: formatISO8601(article.date),
    author: {
      '@type': 'Person',
      name: article.author,
      url: `${mergedConfig.siteUrl}/author/${generateAuthorSlug(article.author)}`,
    },
    publisher: {
      '@type': 'Organization',
      name: mergedConfig.siteName || 'Ctrl Alt News',
      logo: {
        '@type': 'ImageObject',
        url: `${mergedConfig.siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
      url: mergedConfig.siteUrl || 'https://ctrlaltnews.com',
    },
    articleSection: article.category,
  };
}

export function generateBreadcrumbSchema(
  article: Article,
  config: SchemaConfig = DEFAULT_CONFIG
): BreadcrumbListType {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: mergedConfig.siteUrl || 'https://ctrlaltnews.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category,
        item: `${mergedConfig.siteUrl}/category/${article.category.toLowerCase()}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title.en || article.title.pt,
        item: `${mergedConfig.siteUrl}/article/${article.id}`,
      },
    ],
  };
}
