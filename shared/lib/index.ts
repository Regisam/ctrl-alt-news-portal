/**
 * Shared Library Index - Exports recommendation and ML components
 */

// ============================================================================
// Click Prediction Model (Story 13.5)
// ============================================================================
export {
  UserEngagementHistory,
  ClickPrediction,
  TrainingExample,
  TrainingConfig,
  TrainingMetrics as ClickPredictionTrainingMetrics,
  ModelState,
  normalizeEngagementProfile,
  encodeUserSequence,
  ClickPredictionModel,
  ClickPredictionCache,
  batchPredictWithCaching,
  predictForNewUser,
  predictForNewArticle,
  fallbackToCollaborativeFiltering,
} from './clickPredictionModel';

// ============================================================================
// Recommendation Engine Integration (Story 13.5 + 13.6)
// ============================================================================
export {
  ArticleForRanking,
  RankedArticleWithClickPrediction,
  IntegrationConfig,
  getDefaultIntegrationConfig,
  rankArticles,
  rankArticlesForUsers,
  getTopK,
  filterByClickThreshold,
  enforceTopicDiversity,
  generateRankingExplanation,
  PerformanceMetrics,
  rankArticlesWithMonitoring,
  IntegrationConfigWithSerendipity,
  getDefaultConfigWithSerendipity,
  rankArticlesWithSerendipityIntegration,
  rankArticlesWithSerendipityForUsers,
} from './recommendationEngine';

// ============================================================================
// Serendipity Scoring Engine (Story 13.6)
// ============================================================================
export {
  SerendipityInput,
  ArticleFeature,
  SerendipityRanking,
  TopicEmbeddings,
  CollaborativeContext,
  SerendipityThresholds,
  DiversityConstraint,
  DEFAULT_SERENDIPITY_THRESHOLDS,
  DEFAULT_DIVERSITY_CONSTRAINT,
  cosineSimilarity,
  computeTopicDistance,
  computeCollaborativeNovelty,
  blendSerendipityScore,
  SerendipityScorer,
  ArticleForRanking as ArticleForRankingSerendipity,
  RankedArticleWithSerendipity,
  rankArticlesWithSerendipity,
  predictForNewUser as predictForNewUserSerendipity,
  predictForNewArticle as predictForNewArticleSerendipity,
} from './serendipityScorer';
