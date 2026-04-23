import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './src/logger';
import { errorHandler, notFoundHandler, asyncHandler } from './src/middleware/errorHandler';
import { requestLogger } from './src/middleware/requestLogger';
import { setupRoutes } from './src/routes';
import { initializeWebSocket } from './src/websocket';
import { startNotificationCleanup } from './src/services/notification-cleanup';
import { cacheService } from './src/services/cache';
import { warmupCache } from './src/services/cache-warmup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const app = express();
  const server = createServer(app);
  const apiRouter = express.Router();

  // Initialize Cache Service
  await cacheService.connect();
  const cacheHealth = await cacheService.health();
  logger.info(`Cache service: ${cacheHealth.status} - ${cacheHealth.message}`);

  // Warm up the cache (non-blocking)
  warmupCache().catch((error) => {
    logger.warn('Cache warm-up error (non-critical)', { error });
  });

  // Middleware Stack
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Initialize WebSocket server first
  const io = initializeWebSocket(server);
  logger.info('WebSocket server initialized on /socket.io');

  // Setup API routes (must be before static files)
  setupRoutes(apiRouter, io);
  app.use('/api', apiRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes (must be last before error handler)
  app.get('*', (_req: Request, res: Response): void => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // 404 handler for non-API routes
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  try {
    server.listen(port, () => {
      logger.info(`Server started successfully`, { port });
      // Start background cleanup scheduler
      startNotificationCleanup();
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Unhandled promise rejection', { error });
  process.exit(1);
});
