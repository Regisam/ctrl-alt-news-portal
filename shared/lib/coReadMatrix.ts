/**
 * Co-Read Matrix Builder (Story 13.2 - Phase 1, Task 1.2)
 * Constructs articles co-read by same users with engagement weighting
 */

export interface UserReadHistory {
  userId: string;
  articleIds: string[];
  engagements?: Map<string, { scrollDepth: number; timeSpent: number; isBookmarked: boolean }>;
}

export interface CoReadEntry {
  articleId1: string;
  articleId2: string;
  coReadCount: number;
  avgEngagementScore: number; // 0-1 weighted by engagement
}

export interface CoReadMatrix {
  entries: CoReadEntry[];
  articleCoReadMap: Map<string, Set<string>>; // article -> articles read with it
  lastUpdated: Date;
  computationTimeMs: number;
}

/**
 * Calculate engagement score for an article read by a user
 * Considers scroll depth, time spent, and bookmark status
 * Returns 0-1 normalized score
 */
function calculateEngagementScore(
  scrollDepth: number = 0,
  timeSpent: number = 0,
  isBookmarked: boolean = false
): number {
  let score = 0;

  // Scroll depth: 0-1
  score += scrollDepth * 0.5;

  // Time spent: cap at 10 minutes, normalized
  const timeScore = Math.min(timeSpent / 600, 10) / 10;
  score += timeScore * 0.35;

  // Bookmark boost
  if (isBookmarked) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

/**
 * Build co-read matrix from user read histories
 * Identifies articles read by same users and weights by engagement
 */
export function buildCoReadMatrix(userHistories: UserReadHistory[]): CoReadMatrix {
  const startTime = performance.now();
  const coReadMap = new Map<string, Map<string, { count: number; totalScore: number }>>();

  // Initialize co-read map
  for (const user of userHistories) {
    const articles = user.articleIds;

    // For each pair of articles read by this user
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const art1 = articles[i];
        const art2 = articles[j];

        // Normalize pair order (always smaller ID first)
        const [minArt, maxArt] = art1 < art2 ? [art1, art2] : [art2, art1];

        // Get engagement scores
        const eng1 = user.engagements?.get(art1) ?? {
          scrollDepth: 0.5,
          timeSpent: 180,
          isBookmarked: false,
        };
        const eng2 = user.engagements?.get(art2) ?? {
          scrollDepth: 0.5,
          timeSpent: 180,
          isBookmarked: false,
        };

        const score1 = calculateEngagementScore(
          eng1.scrollDepth,
          eng1.timeSpent,
          eng1.isBookmarked
        );
        const score2 = calculateEngagementScore(
          eng2.scrollDepth,
          eng2.timeSpent,
          eng2.isBookmarked
        );

        // Average engagement score
        const avgScore = (score1 + score2) / 2;

        // Add to co-read map
        if (!coReadMap.has(minArt)) {
          coReadMap.set(minArt, new Map());
        }

        const pairMap = coReadMap.get(minArt)!;
        const existing = pairMap.get(maxArt);

        if (existing) {
          existing.count++;
          existing.totalScore += avgScore;
        } else {
          pairMap.set(maxArt, { count: 1, totalScore: avgScore });
        }
      }
    }
  }

  // Convert to CoReadEntry array
  const entries: CoReadEntry[] = [];
  for (const [art1, pairs] of coReadMap.entries()) {
    for (const [art2, { count, totalScore }] of pairs.entries()) {
      entries.push({
        articleId1: art1,
        articleId2: art2,
        coReadCount: count,
        avgEngagementScore: totalScore / count,
      });
    }
  }

  // Build reverse lookup: article -> articles read with it
  const articleCoReadMap = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!articleCoReadMap.has(entry.articleId1)) {
      articleCoReadMap.set(entry.articleId1, new Set());
    }
    if (!articleCoReadMap.has(entry.articleId2)) {
      articleCoReadMap.set(entry.articleId2, new Set());
    }

    articleCoReadMap.get(entry.articleId1)!.add(entry.articleId2);
    articleCoReadMap.get(entry.articleId2)!.add(entry.articleId1);
  }

  const computationTimeMs = performance.now() - startTime;

  return {
    entries,
    articleCoReadMap,
    lastUpdated: new Date(),
    computationTimeMs,
  };
}

/**
 * Get articles co-read with a specific article, sorted by engagement
 */
export function getArticlesCoReadWith(
  articleId: string,
  matrix: CoReadMatrix,
  limit?: number
): CoReadEntry[] {
  const entries = matrix.entries
    .filter(
      (e) =>
        (e.articleId1 === articleId || e.articleId2 === articleId) &&
        e.coReadCount > 0
    )
    .sort((a, b) => {
      // Sort by engagement score (descending)
      if (b.avgEngagementScore !== a.avgEngagementScore) {
        return b.avgEngagementScore - a.avgEngagementScore;
      }
      // Then by co-read count (descending)
      return b.coReadCount - a.coReadCount;
    });

  return limit ? entries.slice(0, limit) : entries;
}

/**
 * Find highly co-engaged article pairs (above threshold)
 */
export function findStrongCoReads(
  matrix: CoReadMatrix,
  minCoReadCount: number = 3,
  minEngagementScore: number = 0.6
): CoReadEntry[] {
  return matrix.entries.filter(
    (e) => e.coReadCount >= minCoReadCount && e.avgEngagementScore >= minEngagementScore
  );
}

/**
 * Validate co-read matrix structure
 */
export function validateCoReadMatrix(matrix: CoReadMatrix): {
  valid: boolean;
  reason?: string;
} {
  for (const entry of matrix.entries) {
    if (entry.coReadCount < 1) {
      return {
        valid: false,
        reason: `Entry ${entry.articleId1}-${entry.articleId2} has coReadCount < 1`,
      };
    }

    if (!Number.isFinite(entry.avgEngagementScore) || entry.avgEngagementScore < 0 || entry.avgEngagementScore > 1) {
      return {
        valid: false,
        reason: `Entry ${entry.articleId1}-${entry.articleId2} has invalid engagement score ${entry.avgEngagementScore}`,
      };
    }
  }

  return { valid: true };
}
