interface Article {
  id: number;
  title: { en: string; pt: string };
  excerpt: { en: string; pt: string };
  category: 'AI' | 'SCIENCE' | 'ROBOTICS' | 'GADGETS';
  author: string;
  date: string;
  readTime: string;
  views: string;
  image: string;
  featured?: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

interface SitemapConfig {
  siteUrl: string;
  baseUrl?: string;
}

const DEFAULT_CONFIG: SitemapConfig = {
  siteUrl: "https://ctrlaltnews.com",
  baseUrl: "https://ctrlaltnews.com",
};

const CATEGORIES = ["AI", "SCIENCE", "ROBOTICS", "GADGETS"];

export function generateSitemapXML(
  articles: Article[],
  config: SitemapConfig = DEFAULT_CONFIG,
): string {
  const siteUrl = config.siteUrl || DEFAULT_CONFIG.siteUrl;
  const baseUrl = (config.baseUrl || DEFAULT_CONFIG.baseUrl) as string;

  const entries: SitemapEntry[] = [];

  // Homepage
  entries.push({
    loc: baseUrl,
    lastmod: formatISO8601(new Date()),
    changefreq: "daily",
    priority: 1.0,
  });

  // Category pages
  CATEGORIES.forEach((category) => {
    entries.push({
      loc: `${baseUrl}/category/${category.toLowerCase()}`,
      lastmod: formatISO8601(new Date()),
      changefreq: "daily",
      priority: 0.8,
    });
  });

  // Article pages
  articles.forEach((article) => {
    const titleText = typeof article.title === "string"
      ? article.title
      : (article.title as any).en || Object.values(article.title)[0];
    const slug = generateSlug(titleText);
    const lastmodDate = article.updatedAt || article.publishedAt || article.date || new Date().toISOString();
    entries.push({
      loc: `${baseUrl}/article/${article.id}/${slug}`,
      lastmod: formatISO8601(new Date(lastmodDate)),
      changefreq: "weekly",
      priority: 0.6,
    });
  });

  return generateSitemapXMLString(entries);
}

function generateSitemapXMLString(entries: SitemapEntry[]): string {
  const xmlEntries = entries
    .map(
      (entry) =>
        `  <url>
    <loc>${escapeXML(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

function formatISO8601(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateCanonicalURL(
  baseUrl: string,
  articleTitle: string,
  articleId: string,
): string {
  const slug = generateSlug(articleTitle);
  return `${baseUrl}/article/${articleId}/${slug}`;
}

export function validateSitemapXML(xml: string): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    if (doc.getElementsByTagName("parsererror").length > 0) {
      return false;
    }

    const urlset = doc.getElementsByTagName("urlset");
    if (urlset.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
