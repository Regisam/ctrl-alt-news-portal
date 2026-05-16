/**
 * useLivePersonalizedFeed — Real-time feed hook (Story 12.6)
 *
 * Maintains SSE connection, applies delta updates, handles reconnection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Article } from '@shared/types';

export interface ScoredArticle extends Article {
  rankScore: number;
}

interface FeedDelta {
  type: 'feed_update' | 'batch_update' | 'heartbeat' | 'connection_established' | 'reconnection_data';
  messageId?: number;
  timestamp: number;
  userId?: string;
  delta?: {
    added?: Array<ScoredArticle & { position: number }>;
    removed?: Array<string | number>;
    reordered?: Array<{ id: string | number; position: number }>;
    updated?: Array<Partial<ScoredArticle>>;
  };
  updates?: Array<{
    messageId: number;
    timestamp: number;
    delta: FeedDelta['delta'];
  }>;
  missedMessageCount?: number;
}

interface UseLivePersonalizedFeedOptions {
  userId: string;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseLivePersonalizedFeedReturn {
  feed: ScoredArticle[];
  isConnected: boolean;
  error: Error | null;
  lastMessageId: number;
}

export function useLivePersonalizedFeed(
  options: UseLivePersonalizedFeedOptions
): UseLivePersonalizedFeedReturn {
  const { userId, enabled = true, maxRetries = 5, retryDelay = 1000 } = options;

  const [feed, setFeed] = useState<ScoredArticle[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessageId, setLastMessageId] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const backoffRef = useRef(retryDelay);

  // Apply delta to feed (AC3)
  const applyDelta = useCallback(
    (currentFeed: ScoredArticle[], delta: FeedDelta['delta']): ScoredArticle[] => {
      if (!delta) return currentFeed;

      let result = [...currentFeed];

      // Step 1: Remove articles
      if (delta.removed?.length) {
        const removeIds = new Set(delta.removed.map((id) => id.toString()));
        result = result.filter((a) => !removeIds.has(a.id.toString()));
      }

      // Step 2: Add articles (AC1)
      if (delta.added?.length) {
        delta.added.forEach(({ position, ...article }) => {
          // Insert at correct position
          if (position >= 0 && position <= result.length) {
            result.splice(position, 0, article as ScoredArticle);
          } else {
            result.push(article as ScoredArticle);
          }
        });
      }

      // Step 3: Update scores (AC2)
      if (delta.updated?.length) {
        delta.updated.forEach((update) => {
          const article = result.find((a) => a.id === update.id);
          if (article && update.rankScore !== undefined) {
            article.rankScore = update.rankScore;
          }
        });
      }

      // Step 4: Reorder articles
      if (delta.reordered?.length) {
        const positionMap = new Map(
          delta.reordered.map((r) => [r.id.toString(), r.position])
        );
        result.sort((a, b) => {
          const posA = positionMap.get(a.id.toString()) ?? result.indexOf(a);
          const posB = positionMap.get(b.id.toString()) ?? result.indexOf(b);
          return posA - posB;
        });
      }

      return result;
    },
    []
  );

  // Handle SSE message
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: FeedDelta = JSON.parse(event.data);

        switch (message.type) {
          case 'connection_established':
            setIsConnected(true);
            setError(null);
            retryCountRef.current = 0;
            backoffRef.current = retryDelay;
            break;

          case 'batch_update':
            if (message.updates) {
              setFeed((currentFeed) => {
                let newFeed = currentFeed;
                // Apply each update in order
                message.updates!.forEach((update) => {
                  newFeed = applyDelta(newFeed, update.delta);
                  if (update.messageId) {
                    setLastMessageId(update.messageId);
                  }
                });
                return newFeed;
              });
            }
            break;

          case 'reconnection_data':
            // Handle offline recovery (AC5)
            if (message.updates) {
              setFeed((currentFeed) => {
                let newFeed = currentFeed;
                message.updates!.forEach((update) => {
                  newFeed = applyDelta(newFeed, update.delta);
                  if (update.messageId) {
                    setLastMessageId(update.messageId);
                  }
                });
                return newFeed;
              });
            }
            break;

          case 'heartbeat':
            // Keep-alive ping (AC5 - detect disconnection)
            break;

          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (err) {
        console.error('Error processing SSE message:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to process message')
        );
      }
    },
    [applyDelta, retryDelay]
  );

  // Store connect function in ref to avoid circular dependency
  const connectRef = useRef<() => void>();

  // Connect to SSE
  const connect = useCallback(() => {
    if (!enabled || !userId) return;

    try {
      // Build URL with reconnection support (AC5)
      const url = new URL('/api/feed/stream', window.location.origin);
      url.searchParams.set('userId', userId);
      if (lastMessageId > 0) {
        url.searchParams.set('lastMessageId', lastMessageId.toString());
      }

      const eventSource = new EventSource(url.toString());

      eventSource.addEventListener('message', handleMessage);

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Exponential backoff reconnection (AC5)
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          backoffRef.current = Math.min(
            backoffRef.current * 1.5,
            30000 // Max 30s backoff
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current?.();
          }, backoffRef.current);
        } else {
          setError(
            new Error(
              `Failed to connect after ${maxRetries} attempts. Max retries exceeded.`
            )
          );
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to establish connection')
      );
    }
  }, [enabled, userId, lastMessageId, maxRetries, handleMessage]);

  // Update ref whenever connect changes
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Cleanup (AC8 - resource cleanup)
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount, cleanup on unmount (AC4)
  useEffect(() => {
    Promise.resolve().then(() => connect());

    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    feed,
    isConnected,
    error,
    lastMessageId,
  };
}
