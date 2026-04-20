import type { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { setupHealthRoute } from './health';
import { setupContactRoute } from './contact';
import { setupCommentsRoute } from './comments';
import { setupAuthRoute } from './auth';
import { setupAdminAuthRoute } from './admin/auth';
import { setupAdminUsersRoute } from './admin/users';
import { setupAdminArticlesRoute } from './admin/articles';
import { setupAdminAnalyticsRoute } from './admin/analytics';
import { setupUsersRoute } from './users';
import { setupModerationRoute } from './moderation';
import { setupKarmaRoute } from './karma';
import { setupNotificationsRoute } from './notifications';

export function setupRoutes(router: Router, io?: SocketIOServer): void {
  setupHealthRoute(router);
  setupContactRoute(router);
  setupCommentsRoute(router, io);
  setupAuthRoute(router);
  setupAdminAuthRoute(router);
  setupAdminUsersRoute(router);
  setupAdminArticlesRoute(router);
  setupAdminAnalyticsRoute(router);
  setupUsersRoute(router);
  setupModerationRoute(router);
  setupKarmaRoute(router, io);
  setupNotificationsRoute(router, io);
}
