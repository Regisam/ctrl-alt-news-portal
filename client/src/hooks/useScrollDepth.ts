import { useEffect, useRef, useCallback, useState } from 'react';
import {
  calculateScrollDepth,
  estimateReadingTime,
  getScrollMilestone,
  emitGA4Event,
  storeMetrics,
  ScrollMetrics,
} from '../lib/behavioral-analytics';

export interface UseScrollDepthOptions {
  articleId: number;
  wordCount?: number;
  debounceMs?: number;
}

export function useScrollDepth({
  articleId,
  wordCount = 0,
  debounceMs = 500,
}: UseScrollDepthOptions): ScrollMetrics | null {
  const [metrics, setMetrics] = useState<ScrollMetrics | null>(null);
  const scrollDepthRef = useRef(0);
  const passedMilestonesRef = useRef<Set<number>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const articleStartedRef = useRef(false);

  const readingTime = estimateReadingTime(wordCount);

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    const scrollHeight = window.scrollY;
    const clientHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const scrollDepth = calculateScrollDepth(
      scrollHeight,
      clientHeight,
      documentHeight
    );

    scrollDepthRef.current = scrollDepth;

    // Emit article_started event on first scroll
    if (!articleStartedRef.current) {
      articleStartedRef.current = true;
      emitGA4Event({
        eventName: 'article_started',
        readingTime,
      });
    }

    // Check for milestone crossings
    const currentMilestone = getScrollMilestone(scrollDepth);
    if (currentMilestone && !passedMilestonesRef.current.has(currentMilestone)) {
      passedMilestonesRef.current.add(currentMilestone);
      emitGA4Event({
        eventName: 'article_scrolled',
        scrollDepth,
        milestone: currentMilestone,
      });
    }

    // Debounced metrics update and storage
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newMetrics: ScrollMetrics = {
        articleId,
        scrollDepth,
        timeSpent,
        readingTime,
        completed: scrollDepth >= 100,
        timestamp: Date.now(),
      };

      setMetrics(newMetrics);
      storeMetrics(articleId, {
        scrollDepth,
        timeSpent,
        readingTime,
        completed: scrollDepth >= 100,
      });

      // Emit article_completed when reaching 100%
      if (scrollDepth >= 100 && !passedMilestonesRef.current.has(100)) {
        emitGA4Event({
          eventName: 'article_completed',
          scrollDepth: 100,
          readingTime,
        });
      }
    }, debounceMs);
  }, [articleId, readingTime, debounceMs]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Final metrics storage on unmount
      const finalTimeSpent = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      storeMetrics(articleId, {
        scrollDepth: scrollDepthRef.current,
        timeSpent: finalTimeSpent,
        readingTime,
        completed: scrollDepthRef.current >= 100,
      });
    };
  }, [articleId, handleScroll, readingTime]);

  return metrics;
}
