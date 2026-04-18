import type { Router } from 'express';
import { setupHealthRoute } from './health';
import { setupContactRoute } from './contact';
import { setupCommentsRoute } from './comments';
import { setupAuthRoute } from './auth';
import { setupUsersRoute } from './users';
import { setupModerationRoute } from './moderation';

export function setupRoutes(router: Router): void {
  setupHealthRoute(router);
  setupContactRoute(router);
  setupCommentsRoute(router);
  setupAuthRoute(router);
  setupUsersRoute(router);
  setupModerationRoute(router);
}
