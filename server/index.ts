import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import healthRouter from "./health.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import { metricsMiddleware, setupMetricsEndpoint } from "./middleware/metricsMiddleware.js";
import { logger } from "./logger.js";

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

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

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
