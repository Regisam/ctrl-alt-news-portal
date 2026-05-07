import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaEncoder, type ArticleWithPosition } from '../../services/DeltaEncoder';

describe('DeltaEncoder', () => {
  let encoder: DeltaEncoder;
  const userId = 'user-123';

  beforeEach(() => {
    encoder = new DeltaEncoder();
  });

  const createArticle = (
    id: string,
    title: string,
    rankScore: number = 0.8
  ): ArticleWithPosition => ({
    id,
    title,
    category: 'AI',
    author: 'Author',
    date: '2026-05-06',
    url: `https://example.com/${id}`,
    rankScore,
    position: 0,
  });

  describe('encodeDelta', () => {
    it('should return empty delta on first call (no previous state)', () => {
      const feed = [createArticle('1', 'Article 1', 0.9)];

      const delta = encoder.encodeDelta(feed, userId);

      expect(delta.delta.added).toHaveLength(1);
      expect(delta.delta.removed).toBeUndefined();
      expect(delta.delta.reordered).toBeUndefined();
      expect(delta.delta.updated).toBeUndefined();
      expect(delta.messageId).toBe(1);
    });

    it('should detect added articles', () => {
      const feed1 = [createArticle('1', 'Article 1', 0.9)];
      const feed2 = [
        createArticle('1', 'Article 1', 0.9),
        createArticle('2', 'Article 2', 0.8),
      ];

      encoder.encodeDelta(feed1, userId);
      const delta = encoder.encodeDelta(feed2, userId);

      expect(delta.delta.added).toHaveLength(1);
      expect(delta.delta.added?.[0].id).toBe('2');
      expect(delta.delta.removed).toBeUndefined();
    });

    it('should detect removed articles', () => {
      const feed1 = [
        createArticle('1', 'Article 1', 0.9),
        createArticle('2', 'Article 2', 0.8),
      ];
      const feed2 = [createArticle('1', 'Article 1', 0.9)];

      encoder.encodeDelta(feed1, userId);
      const delta = encoder.encodeDelta(feed2, userId);

      expect(delta.delta.removed).toHaveLength(1);
      expect(delta.delta.removed?.[0]).toBe('2');
      expect(delta.delta.added).toBeUndefined();
    });

    it('should detect reordered articles', () => {
      const feed1 = [
        createArticle('1', 'Article 1', 0.9),
        createArticle('2', 'Article 2', 0.8),
      ];
      const feed2 = [
        createArticle('2', 'Article 2', 0.8),
        createArticle('1', 'Article 1', 0.9),
      ];

      encoder.encodeDelta(feed1, userId);
      const delta = encoder.encodeDelta(feed2, userId);

      expect(delta.delta.reordered).toHaveLength(2);
      expect(delta.delta.added).toBeUndefined();
      expect(delta.delta.removed).toBeUndefined();
    });

    it('should detect updated article scores', () => {
      const feed1 = [createArticle('1', 'Article 1', 0.9)];
      const feed2 = [createArticle('1', 'Article 1', 0.7)]; // Score changed

      encoder.encodeDelta(feed1, userId);
      const delta = encoder.encodeDelta(feed2, userId);

      expect(delta.delta.updated).toHaveLength(1);
      expect(delta.delta.updated?.[0].rankScore).toBe(0.7);
    });

    it('should detect multiple changes (add + remove + reorder)', () => {
      const feed1 = [
        createArticle('1', 'Article 1', 0.9),
        createArticle('2', 'Article 2', 0.8),
      ];
      const feed2 = [
        createArticle('2', 'Article 2', 0.8),
        createArticle('3', 'Article 3', 0.85),
      ];

      encoder.encodeDelta(feed1, userId);
      const delta = encoder.encodeDelta(feed2, userId);

      expect(delta.delta.added).toHaveLength(1); // Article 3
      expect(delta.delta.removed).toHaveLength(1); // Article 1
      expect(delta.delta.reordered).toHaveLength(1); // Article 2
    });

    it('should increment messageId on each call', () => {
      const feed = [createArticle('1', 'Article 1', 0.9)];

      const delta1 = encoder.encodeDelta(feed, userId);
      expect(delta1.messageId).toBe(1);

      const delta2 = encoder.encodeDelta(feed, userId);
      expect(delta2.messageId).toBe(2);

      const delta3 = encoder.encodeDelta(feed, userId);
      expect(delta3.messageId).toBe(3);
    });

    it('should include timestamp in delta', () => {
      const feed = [createArticle('1', 'Article 1', 0.9)];
      const before = Date.now();

      const delta = encoder.encodeDelta(feed, userId);

      const after = Date.now();
      expect(delta.timestamp).toBeGreaterThanOrEqual(before);
      expect(delta.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('applyDelta (static)', () => {
    it('should add articles', () => {
      const feed: ArticleWithPosition[] = [
        { ...createArticle('1', 'Article 1'), position: 0 },
      ];

      const result = DeltaEncoder.applyDelta(feed, {
        added: [
          {
            ...createArticle('2', 'Article 2'),
            position: 1,
          },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('2');
    });

    it('should remove articles', () => {
      const feed: ArticleWithPosition[] = [
        { ...createArticle('1', 'Article 1'), position: 0 },
        { ...createArticle('2', 'Article 2'), position: 1 },
      ];

      const result = DeltaEncoder.applyDelta(feed, {
        removed: ['1'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should update article scores', () => {
      const feed: ArticleWithPosition[] = [
        { ...createArticle('1', 'Article 1', 0.9), position: 0 },
      ];

      const result = DeltaEncoder.applyDelta(feed, {
        updated: [{ id: '1', rankScore: 0.7 }],
      });

      expect(result[0].rankScore).toBe(0.7);
    });

    it('should handle empty delta', () => {
      const feed: ArticleWithPosition[] = [
        { ...createArticle('1', 'Article 1'), position: 0 },
      ];

      const result = DeltaEncoder.applyDelta(feed, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('reset', () => {
    it('should reset encoder state', () => {
      const feed = [createArticle('1', 'Article 1', 0.9)];

      encoder.encodeDelta(feed, userId);
      encoder.reset();

      const delta = encoder.encodeDelta(feed, userId);
      expect(delta.messageId).toBe(1); // Resets to 1
      expect(delta.delta.added).toHaveLength(1); // Treats as new
    });
  });

  describe('getMessageId', () => {
    it('should return current message counter', () => {
      const feed = [createArticle('1', 'Article 1', 0.9)];

      encoder.encodeDelta(feed, userId);
      expect(encoder.getMessageId()).toBe(1);

      encoder.encodeDelta(feed, userId);
      expect(encoder.getMessageId()).toBe(2);
    });
  });
});
