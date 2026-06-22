console.log(">>> [1] Server file loaded");
import express, { type Request, type Response, type NextFunction } from "express";
console.log(">>> [2] Express imported");
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import healthRouter from "./health.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import { metricsMiddleware, setupMetricsEndpoint } from "./middleware/metricsMiddleware.js";
import { rateLimiterMiddleware } from "./middleware/rateLimiter.js";
import { securityHeadersMiddleware, httpsRedirectMiddleware } from "./middleware/securityHeaders.js";
import { inputValidationMiddleware } from "./middleware/inputValidation.js";
import { cacheHeadersMiddleware, varyHeaderMiddleware } from "./middleware/cacheHeaders.js";
import { errorHandlerMiddleware, setupErrorHandlers } from "./middleware/errorHandler.js";
import { logger, initializeLokiTransport } from "./logger.js";
import { errorAggregator } from "./lib/errorAggregator.js";
import { uptimeTracker } from "./lib/uptimeTracker.js";
import { initializeHealthChecks, getHealthCheckStatus } from "./middleware/healthCheckScheduler.js";
import { generateSitemapXML } from "./lib/sitemap.js";
import { handleFeedStream, broadcastFeedUpdate, feedStreamHealth } from "./api/feed-stream.js";
import digestRouter from "./api/digest.js";
import topicRecommendationsRouter from "./api/topic-recommendations.js";
import monitoringRouter from "./api/monitoring.js";
import notificationsRouter from "./api/notifications.js";
import rateLimitRouter from "./api/rateLimit.js";
import errorAnalyticsRouter from "./api/errorAnalytics.js";
import slaMonitoringRouter from "./api/slaMonitoring.js";
import performanceRouter from "./api/performance.js";
import backupAdminRouter from "./api/backupAdmin.js";
import complianceRouter from "./api/compliance.js";
import loadTestRouter from "./api/loadTest.js";
import authRouter from "./src/routes/auth.js";
import usersRouter from "./src/routes/users.js";
import moderationRouter from "./src/routes/moderation.js";
import reputationRouter from "./src/routes/reputation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("✓ startServer() called");

  // Setup global error handlers
  setupErrorHandlers();

  const app = express();
  console.log("✓ Express app created");
  const server = createServer(app);
  console.log("✓ HTTP server created");

  // Initialize Loki transport if LOKI_URL is set
  await initializeLokiTransport();

  // Initialize dependency health checks (Story 16.7)
  initializeHealthChecks();

  // Body parser middleware (before logging middleware)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());
  console.log("✓ Body parser middleware added");

  // Security headers middleware (Story 16.8)
  app.use(securityHeadersMiddleware);
  console.log("✓ Security headers added");

  // HTTPS redirect (Story 16.8)
  if (process.env.NODE_ENV === 'production') {
    app.use(httpsRedirectMiddleware);
  }

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

  // Cache headers middleware (Story 16.9)
  app.use(cacheHeadersMiddleware);
  app.use(varyHeaderMiddleware);
  console.log("✓ Cache headers middleware added");

  // Input validation middleware (Story 16.8)
  app.use(inputValidationMiddleware);

  // Rate limiting middleware (Story 16.4)
  app.use(rateLimiterMiddleware);

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

  // Authentication endpoints (Story 3.1-3.2)
  app.use('/api/auth', authRouter);

  // User profile endpoints (Story 3.3)
  app.use('/api/user', usersRouter);
  app.use('/api/users', usersRouter);

  // Moderation endpoints (Story 3.5)
  app.use('/api', moderationRouter);

  // Reputation endpoints (Story 3.6)
  app.use('/api', reputationRouter);

  // Monitoring & metrics endpoints (Story 16.1)
  app.use('/api/monitoring', monitoringRouter);

  // Notifications & alerting endpoints (Story 16.2)
  app.use('/api/notifications', notificationsRouter);

  // Rate limiting admin endpoints (Story 16.4)
  app.use('/api/rate-limit', rateLimitRouter);

  // Error analytics endpoints (Story 16.5)
  app.use('/api/error-analytics', errorAnalyticsRouter);

  // SLA monitoring endpoints (Story 16.6)
  app.use('/api/sla', slaMonitoringRouter);

  // Performance monitoring endpoints (Story 16.9)
  app.use('/api/performance', performanceRouter);

  // Backup & disaster recovery endpoints (Story 16.10)
  app.use('/api/backup', backupAdminRouter);

  // Compliance & audit logging endpoints (Story 16.11)
  app.use('/api/compliance', complianceRouter);

  // Load testing & capacity planning endpoints (Story 16.12)
  app.use('/api/load-test', loadTestRouter);

  // Error handler middleware (must be last)
  app.use(errorHandlerMiddleware);

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

  console.log(`✓ About to listen on port ${port}`);
  server.listen(port, () => {
    console.log(`✓✓✓ Server running on http://localhost:${port}/`);
  });
  console.log("✓ server.listen() called");
}

console.log(">>> Server starting...");
startServer().catch((err) => {
  console.error("ERROR in startServer:", err);
  process.exit(1);
});
