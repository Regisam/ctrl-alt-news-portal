import type { Router } from 'express';
import { setupHealthRoute } from './health';
import { setupContactRoute } from './contact';
import { setupCommentsRoute } from './comments';

export function setupRoutes(router: Router): void {
  setupHealthRoute(router);
  setupContactRoute(router);
  setupCommentsRoute(router);
}
