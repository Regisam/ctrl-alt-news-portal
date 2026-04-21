import { cacheService } from './cache';

export class CacheInvalidationManager {
  static async invalidateArticles(): Promise<void> {
    await cacheService.invalidate('articles:*');
    await cacheService.invalidate('article:*');
  }

  static async invalidateArticle(id: string): Promise<void> {
    await cacheService.invalidate(`article:${id}`);
    await this.invalidateArticles();
  }

  static async invalidateCategories(): Promise<void> {
    await cacheService.invalidate('categories:*');
  }

  static async invalidateSearch(): Promise<void> {
    await cacheService.invalidate('search:*');
  }

  static async invalidateUsers(): Promise<void> {
    await cacheService.invalidate('user:*');
  }

  static async invalidateComments(articleId?: string): Promise<void> {
    if (articleId) {
      await cacheService.invalidate(`comments:${articleId}:*`);
    } else {
      await cacheService.invalidate('comments:*');
    }
    await this.invalidateArticles();
  }

  static async invalidateAll(): Promise<void> {
    await cacheService.clear();
  }
}
