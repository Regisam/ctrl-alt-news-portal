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
import { dtoHandlerMiddleware } from "./middleware/dtoHandler.js";
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
import analyticsRouter from "./api/analytics.js";
import contentAnalyticsRouter from "./api/contentAnalytics.js";
import reportsRouter from "./api/reports.js";
import recommendationsRouter from "./api/recommendationsRouter.js";
import recommendationsUnifiedRouter from "./api/recommendationsUnified.js";
import commentsRouter from "./api/comments.js";
import emojiRouter from "./api/emoji.js";
import followingRouter from "./api/following.js";
import notificationsSmartRouter from "./api/notificationsSmart.js";
import profilesRouter from "./api/profiles.js";
import publicProfilesRouter from "./api/public-profiles.js";
import discoveryRouter from "./api/discovery.js";
import reputationAPIRouter from "./api/reputationAPI.js";
import authV2Router from "./api/authV2.js";
import searchRouter from "./api/search.js";
import adminRouter from "./api/admin.js";
import recommendationsV3Router from "./api/recommendationsV3.js";
import pushRouter from "./api/push.js";
import transactionalRouter from "./api/transactional.js";
import analyticsLiveRouter from "./api/analytics-live.js";
import alertsRouter from "./api/alerts.js";
import experimentsRouter from "./api/experiments.js";
import userBehaviorRouter from "./api/user-behavior.js";
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

  // Initialize dependency health checks (Story 16.7) — skip in test mode and production
  // Disabled: async initialization can crash the server startup in Railway
  // if (process.env.NODE_ENV !== 'test') {
  //   initializeHealthChecks();
  // }

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

  // DTO handler middleware (Story 20.3)
  app.use(dtoHandlerMiddleware);

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

  // Auth with persistence (Story 21.2)
  app.use('/api/auth-v2', authV2Router);

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

  // User behavior analytics endpoints (Story 17.1)
  app.use('/api/analytics', analyticsRouter);

  // Content performance analytics endpoints (Story 17.2)
  app.use('/api/content-analytics', contentAnalyticsRouter);

  // Custom reports endpoints (Story 17.3)
  app.use('/api/reports', reportsRouter);

  // Unified recommendations endpoints (Story 20.2)
  app.use('/api/recommendations-v2', recommendationsUnifiedRouter);

  // Legacy recommendation endpoints (for backward compatibility)
  app.use('/api/recommendations', recommendationsRouter);

  // Comments & discussions endpoints (Story 18.1)
  app.use('/api/comments', commentsRouter);

  // Emoji reactions endpoints (Story 18.2)
  app.use('/api/emoji', emojiRouter);

  // Following & subscriptions endpoints (Story 18.3)
  app.use('/api/following', followingRouter);

  // Smart notifications endpoints (Story 18.4)
  app.use('/api/notifications-smart', notificationsSmartRouter);

  // User profiles endpoints (Story 19.1)
  app.use('/api/profiles', profilesRouter);

  // Public profiles endpoints (Story 19.2)
  app.use('/api/public-profiles', publicProfilesRouter);

  // User discovery endpoints (Story 19.3)
  app.use('/api/discovery', discoveryRouter);

  // Advanced search endpoints (Story 22.2)
  app.use('/api/search', searchRouter);

  // Admin & moderation endpoints (Story 23.2)
  app.use('/api/admin', adminRouter);

  // Content recommendations v3 (Story 23.3)
  app.use('/api/recommendations-v3', recommendationsV3Router);

  // Push notifications (Story 24.2)
  app.use('/api/push', pushRouter);

  // Transactional emails (Story 24.3)
  app.use('/api/transactional', transactionalRouter);

  // Real-time analytics (Story 25.1)
  app.use('/api/analytics-live', analyticsLiveRouter);

  // Performance alerting (Story 25.2)
  app.use('/api/alerts', alertsRouter);

  // A/B testing (Story 25.3)
  app.use('/api/experiments', experimentsRouter);

  // User behavior analytics (Story 25.4)
  app.use('/api/user-behavior', userBehaviorRouter);

  // User reputation endpoints (Story 19.4)
  app.use('/api/reputation', reputationAPIRouter);

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
