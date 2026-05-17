import express, { type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import healthRouter from "./health.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import { metricsMiddleware, setupMetricsEndpoint } from "./middleware/metricsMiddleware.js";
import { logger } from "./logger.js";
import { generateSitemapXML } from "../client/src/lib/sitemap.js";
import { handleFeedStream, broadcastFeedUpdate, feedStreamHealth } from "./api/feed-stream.js";
import digestRouter from "./api/digest.js";
import topicRecommendationsRouter from "./api/topic-recommendations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Body parser middleware (before logging middleware)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Logging middleware (early in the chain)
  app.use(loggingMiddleware);

  // Compression middleware (gzip by default, brotli for supported browsers)
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // Metrics middleware (early in the chain, after logging)
  app.use(metricsMiddleware);

  // Setup metrics endpoint
  setupMetricsEndpoint(app);

  // Client logs endpoint
  app.post('/api/logs', (req, res) => {
    const { level, message, context, timestamp } = req.body;
    logger.log(level || 'info', message, {
      source: 'client',
      user_agent: req.get('user-agent'),
      ...context,
    });
    res.json({ status: 'ok' });
  });

  // Health check endpoints (before static files)
  app.use(healthRouter);

  // Mock articles for sitemap generation (in production, fetch from database)
  const mockArticles = [
    {
      id: 1,
      title: { en: "AI Revolution", pt: "Revolução da IA" },
      excerpt: { en: "Latest AI breakthroughs", pt: "Últimas descobertas em IA" },
      category: "AI" as const,
      author: "Tech Writer",
      date: "2026-04-25",
      readTime: "5 min",
      views: "1.2K",
      image: "https://example.com/ai.jpg",
      publishedAt: "2026-04-25",
    },
  ];

  // Sitemap endpoint
  app.get("/sitemap.xml", (_req, res) => {
    try {
      const sitemap = generateSitemapXML(mockArticles, {
        siteUrl: process.env.SITE_URL || "https://ctrlaltnews.com",
        baseUrl: process.env.SITE_URL || "https://ctrlaltnews.com",
      });
      res.header("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      logger.error("Sitemap generation error", { error });
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (_req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /article/
Allow: /category/
Allow: /search

Disallow: /admin
Disallow: /api/internal
Disallow: /api/auth

Sitemap: ${process.env.SITE_URL || "https://ctrlaltnews.com"}/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  // Real-time feed stream endpoints (Story 12.6)
  app.get('/api/feed/stream', handleFeedStream);
  app.post('/api/feed/stream/update', broadcastFeedUpdate);
  app.get('/api/feed/stream/health', feedStreamHealth);

  // Smart Digest endpoints (Story 12.7)
  app.use('/api/digest', digestRouter);

  // Topic Recommendations endpoints (Story 13.7)
  app.use('/api', topicRecommendationsRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Cache headers for static assets
  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (_req.url.match(/\.(js|css|woff2|woff|ttf|eot)$/)) {
      // Versioned assets: cache for 1 year
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (_req.url === "/index.html") {
      // HTML: no cache (revalidate on every request)
      res.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
    next();
  });

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
