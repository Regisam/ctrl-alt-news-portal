import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './src/logger';
import { errorHandler, asyncHandler } from './src/middleware/errorHandler';
import { requestLogger } from './src/middleware/requestLogger';
import { setupRoutes } from './src/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const app = express();
  const server = createServer(app);
  const apiRouter = express.Router();

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

  // Setup API routes (must be before static files)
  setupRoutes(apiRouter);
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

  // Error handling middleware (must be last)
  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  try {
    server.listen(port, () => {
      logger.info(`Server started successfully`, { port });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer().catch((error) => {
  logger.error('Unhandled promise rejection', { error });
  process.exit(1);
});
