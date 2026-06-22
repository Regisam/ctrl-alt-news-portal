import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// AC1: Set HTTP caching headers based on resource type
export function cacheHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Store original json for later use
  const originalJson = res.json;

  // AC1: Add caching headers based on path
  if (req.path.match(/\.(js|css|woff2|woff|ttf|eot|png|jpg|jpeg|svg|ico|gif)$/i)) {
    // Static assets: cache for 1 year (immutable)
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    // API endpoints: cache GET requests (5 minutes default)
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      // POST, PUT, DELETE: no cache
      res.set('Cache-Control', 'no-store');
    }
  } else if (req.path === '/index.html' || req.path === '/') {
    // HTML: always revalidate
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  // AC1: Add ETag support
  res.json = function (body: any) {
    const json = JSON.stringify(body);
    const etag = crypto.createHash('md5').update(json).digest('hex');

    // AC1: Set ETag
    res.set('ETag', `"${etag}"`);

    // AC1: Check If-None-Match (client has current version)
    if (req.get('If-None-Match') === `"${etag}"`) {
      res.status(304).send(); // Not Modified
      return res;
    }

    // AC1: Add Last-Modified
    res.set('Last-Modified', new Date().toUTCString());

    return originalJson.call(this, body);
  };

  next();
}

// AC1: Vary header (important for caching with different Accept headers)
export function varyHeaderMiddleware(req: Request, res: Response, next: NextFunction) {
  res.set('Vary', 'Accept-Encoding, Authorization');
  next();
}
