import type { Router } from 'express';
import { setupHealthRoute } from './health';

export function setupRoutes(router: Router): void {
  setupHealthRoute(router);
}
