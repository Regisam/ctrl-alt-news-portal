import type { Express } from 'express';
import express from 'express';
import { setupRoutes } from './src/routes/index';
import logger from './src/logger';
import { errorHandler } from './src/middleware/errorHandler';
import { requestLogger } from './src/middleware/requestLogger';

export function setupApiMiddleware(app: Express): void {
  // Middleware: Request logging
  app.use(requestLogger);

  // Middleware: JSON parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware: CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Routes
  setupRoutes(app);

  // Middleware: Error handling (must be last)
  app.use(errorHandler);
}

export function createApiServer(): Express {
  const app = express();

  // Middleware: Request logging
  app.use(requestLogger);

  // Middleware: JSON parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware: CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Routes
  setupRoutes(app);

  // Middleware: Error handling (must be last)
  app.use(errorHandler);

  return app;
}
