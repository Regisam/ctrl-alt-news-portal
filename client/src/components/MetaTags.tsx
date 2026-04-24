import { Helmet } from 'react-helmet-async';
import { generateMetaTags } from '@/lib/meta-tags';
import type { Article } from '@/lib/data';

interface MetaTagsProps {
  article: Article;
  lang?: 'en' | 'pt';
  siteUrl?: string;
  siteName?: string;
  twitterHandle?: string;
}

export function MetaTags({
  article,
  lang = 'en',
  siteUrl = 'https://ctrlaltnews.com',
  siteName = 'Ctrl Alt News',
  twitterHandle = '@ctrlaltnews',
}: MetaTagsProps) {
  const tags = generateMetaTags(article, { siteUrl, siteName, twitterHandle }, lang);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{tags.title} | {siteName}</title>
      <meta name="title" content={tags.title} />
      <meta name="description" content={tags.description} />
      <meta name="keywords" content={tags.keywords} />
      <meta name="author" content={tags.author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* Open Graph Tags (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content={tags.ogType} />
      <meta property="og:url" content={tags.ogUrl} />
      <meta property="og:title" content={tags.ogTitle} />
      <meta property="og:description" content={tags.ogDescription} />
      <meta property="og:image" content={tags.ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={tags.ogSiteName} />
      <meta property="article:published_time" content={tags.articlePublishedTime} />
      <meta property="article:author" content={tags.articleAuthor} />
      <meta property="article:section" content={article.category} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={tags.twitterCard} />
      <meta name="twitter:url" content={tags.ogUrl} />
      <meta name="twitter:title" content={tags.twitterTitle} />
      <meta name="twitter:description" content={tags.twitterDescription} />
      <meta name="twitter:image" content={tags.twitterImage} />
      <meta name="twitter:creator" content={twitterHandle} />

      {/* Canonical URL */}
      <link rel="canonical" href={tags.canonical} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content={lang === 'pt' ? 'Portuguese' : 'English'} />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
}

export default MetaTags;
