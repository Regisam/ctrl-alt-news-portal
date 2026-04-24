import { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';
import { getTracer, getOrGenerateRequestId } from '../tracing';

const tracer = getTracer();

/**
 * Express middleware to trace HTTP requests
 * - Creates span for each request
 * - Records method, path, status, duration
 * - Propagates request ID through trace context
 */
export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = getOrGenerateRequestId(req.headers as Record<string, string>);
  const startTime = Date.now();

  // Create span for HTTP request
  const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': req.path,
      'http.host': req.hostname,
      'http.scheme': req.protocol,
      'http.request_id': requestId,
      'http.user_agent': req.get('user-agent') || '',
    },
  });

  // Add user ID if authenticated
  if ((req as any).user?.id) {
    span.setAttribute('http.user_id', (req as any).user.id);
  }

  // Propagate request ID to response headers (for downstream tracing)
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-trace-id', requestId);

  // Run handler in span context
  context.with(trace.setSpan(context.active(), span), () => {
    // Track response completion
    const originalSend = res.send;

    res.send = function (...args: any[]) {
      const duration = Date.now() - startTime;

      // Record response attributes
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_content_length': res.get('content-length') || 0,
        'http.duration_ms': duration,
      });

      // Mark errors
      if (res.statusCode >= 400) {
        span.setAttributes({
          'http.error': true,
          'http.error_message': res.statusMessage || `HTTP ${res.statusCode}`,
        });
      }

      // End span
      span.end();

      // Call original send
      return originalSend.apply(res, args);
    };

    next();
  });
}

/**
 * Helper middleware to add custom attributes to current span
 * Usage: req.setSpanAttribute('key', 'value')
 */
export function extendTracingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const span = trace.getActiveSpan();

  (req as any).setSpanAttribute = (key: string, value: string | number | boolean) => {
    if (span) {
      span.setAttribute(key, value);
    }
  };

  next();
}
