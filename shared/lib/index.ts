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
// Recommendation Engine Integration (Story 13.5)
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
} from './recommendationEngine';
