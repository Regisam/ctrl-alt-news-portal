import { Router } from 'express';
import {
  trackArticleRead,
  registerArticleForRecommendations,
  getPersonalizedRecommendations,
  trackRecommendationClick,
  getUserProfile,
  getRecommendationStats,
} from './recommendations.js';

const router = Router();

// Story 17.4: Recommendation Engine endpoints
router.post('/personalized/track-read', trackArticleRead);
router.post('/personalized/register-article', registerArticleForRecommendations);
router.get('/personalized/:userId', getPersonalizedRecommendations);
router.post('/personalized/click/:userId/:articleId', trackRecommendationClick);
router.get('/personalized/profile/:userId', getUserProfile);
router.get('/personalized/stats', getRecommendationStats);

export default router;
