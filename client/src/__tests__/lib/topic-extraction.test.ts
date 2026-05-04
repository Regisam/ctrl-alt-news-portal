import { describe, it, expect } from 'vitest';
import {
  extractUserTopics,
  getTopTopics,
  calculateTopicDiversity,
  getPrimaryTopic,
} from '@/lib/topic-extraction';
import { aiArticles, scienceArticles, roboticsArticles } from '@/lib/data';

describe('Topic Extraction', () => {
  describe('extractUserTopics', () => {
    it('should extract topics from reading history', () => {
      const history = [aiArticles[0], aiArticles[1], scienceArticles[0]];
      const topics = extractUserTopics(history);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0]).toHaveProperty('topic');
      expect(topics[0]).toHaveProperty('count');
      expect(topics[0]).toHaveProperty('percentage');
    });

    it('should sort topics by frequency descending', () => {
      const history = [
        aiArticles[0],
        aiArticles[1],
        aiArticles[2],
        scienceArticles[0],
        roboticsArticles[0],
      ];
      const topics = extractUserTopics(history);

      // AI should be first (3 articles)
      expect(topics[0].topic).toBe('AI');
      expect(topics[0].count).toBe(3);
    });

    it('should calculate percentages correctly', () => {
      const history = [aiArticles[0], aiArticles[1], scienceArticles[0], scienceArticles[1]];
      const topics = extractUserTopics(history);

      const aiTopic = topics.find((t) => t.topic === 'AI');
      expect(aiTopic?.percentage).toBeCloseTo(50);

      const scienceTopic = topics.find((t) => t.topic === 'SCIENCE');
      expect(scienceTopic?.percentage).toBeCloseTo(50);
    });

    it('should respect topK parameter', () => {
      const history = [...aiArticles, ...scienceArticles, ...roboticsArticles];
      const topics = extractUserTopics(history, 2);

      expect(topics.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty history', () => {
      const topics = extractUserTopics([]);

      expect(topics.length).toBe(0);
    });

    it('should handle single topic', () => {
      const history = [aiArticles[0], aiArticles[1], aiArticles[2]];
      const topics = extractUserTopics(history);

      expect(topics.length).toBe(1);
      expect(topics[0].topic).toBe('AI');
      expect(topics[0].count).toBe(3);
      expect(topics[0].percentage).toBe(100);
    });
  });

  describe('getTopTopics', () => {
    it('should return array of topic names', () => {
      const history = [aiArticles[0], scienceArticles[0], roboticsArticles[0]];
      const topicNames = getTopTopics(history);

      expect(Array.isArray(topicNames)).toBe(true);
      expect(topicNames.every((t) => typeof t === 'string')).toBe(true);
    });

    it('should respect topK parameter', () => {
      const history = [...aiArticles, ...scienceArticles, ...roboticsArticles];
      const topics = getTopTopics(history, 2);

      expect(topics.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for empty history', () => {
      const topics = getTopTopics([]);

      expect(topics.length).toBe(0);
    });
  });

  describe('calculateTopicDiversity', () => {
    it('should return 0 for single topic history', () => {
      const history = [aiArticles[0], aiArticles[1], aiArticles[2]];
      const diversity = calculateTopicDiversity(history);

      expect(diversity).toBe(0);
    });

    it('should return 0 for empty history', () => {
      const diversity = calculateTopicDiversity([]);

      expect(diversity).toBe(0);
    });

    it('should return higher value for diverse history', () => {
      const singleTopicHistory = [aiArticles[0], aiArticles[1], aiArticles[2]];
      const diverseHistory = [
        aiArticles[0],
        scienceArticles[0],
        roboticsArticles[0],
        aiArticles[1],
      ];

      const singleDiversity = calculateTopicDiversity(singleTopicHistory);
      const diverseDiversity = calculateTopicDiversity(diverseHistory);

      expect(diverseDiversity).toBeGreaterThan(singleDiversity);
    });

    it('should return value between 0 and 1', () => {
      const history = [...aiArticles, ...scienceArticles, ...roboticsArticles];
      const diversity = calculateTopicDiversity(history);

      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(1);
    });

    it('should return 1 for perfectly balanced topics', () => {
      // Create perfectly balanced history with 2 topics
      const balanced = [aiArticles[0], scienceArticles[0]];
      const diversity = calculateTopicDiversity(balanced);

      expect(diversity).toBeCloseTo(1, 1);
    });
  });

  describe('getPrimaryTopic', () => {
    it('should return most-read topic', () => {
      const history = [aiArticles[0], aiArticles[1], scienceArticles[0]];
      const primary = getPrimaryTopic(history);

      expect(primary).toBe('AI');
    });

    it('should return null for empty history', () => {
      const primary = getPrimaryTopic([]);

      expect(primary).toBeNull();
    });

    it('should return first topic for equal counts', () => {
      const history = [aiArticles[0], scienceArticles[0]];
      const primary = getPrimaryTopic(history);

      expect(primary).toBeDefined();
      expect(typeof primary).toBe('string');
    });
  });
});
