import { Request, Response, NextFunction } from 'express';

// AC1: Security headers middleware
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // AC1: Content-Security-Policy
  res.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:"
  );

  // AC1: X-Frame-Options (prevent clickjacking)
  res.set('X-Frame-Options', 'DENY');

  // AC1: X-Content-Type-Options (prevent MIME type sniffing)
  res.set('X-Content-Type-Options', 'nosniff');

  // AC1: X-XSS-Protection (enable XSS protection in browsers)
  res.set('X-XSS-Protection', '1; mode=block');

  // AC1: Referrer-Policy (control referrer information)
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // AC1: Permissions-Policy (control feature access)
  res.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // AC1: Strict-Transport-Security (HTTPS only)
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // AC5: Set secure SameSite cookies
  res.set('Set-Cookie', 'HttpOnly; Secure; SameSite=Strict');

  // AC1: Remove Server header (information disclosure)
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');

  next();
}

// AC2: HTTPS redirect middleware
export function httpsRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
}
