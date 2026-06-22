import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const baseLog = {
      timestamp,
      level,
      service: 'ctrl-alt-news-server',
      message,
    };

    return JSON.stringify({ ...baseLog, ...meta });
  })
);

const transports: winston.transport[] = [
  // Console output (always)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    ),
  }),

  // File output (error logs)
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
  }),

  // File output (all logs)
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: customFormat,
  }),
];

// Add Loki transport if configured (loaded asynchronously)
export async function initializeLokiTransport() {
  if (process.env.LOKI_URL) {
    const { default: LokiTransport } = await import('winston-loki');
    transports.push(
      new LokiTransport({
        host: process.env.LOKI_URL,
        labels: {
          app: 'ctrl-alt-news',
          environment: process.env.NODE_ENV || 'development',
        },
        format: customFormat,
      })
    );
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'ctrl-alt-news-server' },
  transports,
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
  })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});
