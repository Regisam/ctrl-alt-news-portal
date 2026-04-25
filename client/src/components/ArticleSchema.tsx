import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/schema';
import type { Article } from '@/lib/data';

interface ArticleSchemaProps {
  article: Article;
  siteUrl?: string;
  siteName?: string;
}

export function ArticleSchema({
  article,
  siteUrl = 'https://ctrlaltnews.com',
  siteName = 'Ctrl Alt News',
}: ArticleSchemaProps) {
  const articleSchema = generateArticleSchema(article, { siteUrl, siteName });
  const breadcrumbSchema = generateBreadcrumbSchema(article, { siteUrl, siteName });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

export default ArticleSchema;
