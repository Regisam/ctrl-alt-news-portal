export interface ScrollMetrics {
  articleId: number;
  scrollDepth: number;
  timeSpent: number;
  readingTime: number;
  completed: boolean;
  timestamp: number;
}

export interface BehavioralEvent {
  eventName: string;
  scrollDepth?: number;
  readingTime?: number;
  milestone?: number;
}

const MILESTONES = [25, 50, 75, 100];
const AVG_READING_SPEED = 200; // words per minute

export function calculateScrollDepth(
  scrollHeight: number,
  clientHeight: number,
  documentHeight: number
): number {
  const totalScroll = documentHeight - clientHeight;
  if (totalScroll <= 0) return 0;
  const depth = (scrollHeight / totalScroll) * 100;
  return Math.min(Math.max(Math.round(depth), 0), 100);
}

export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 0;
  const minutes = wordCount / AVG_READING_SPEED;
  return Math.max(Math.round(minutes), 1);
}

export function getScrollMilestone(scrollDepth: number): number | null {
  // Return the highest milestone that has been reached
  let result: number | null = null;
  for (const milestone of MILESTONES) {
    if (scrollDepth >= milestone) {
      result = milestone;
    } else {
      break;
    }
  }
  return result;
}

export function emitGA4Event(event: BehavioralEvent): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as any).gtag;
  if (!gtag) return;

  const eventData: Record<string, unknown> = {
    event_category: 'behavioral_analytics',
    event_label: 'article_engagement',
  };

  if (event.scrollDepth !== undefined) {
    eventData.scroll_depth = event.scrollDepth;
  }

  if (event.readingTime !== undefined) {
    eventData.reading_time_minutes = event.readingTime;
  }

  if (event.milestone !== undefined) {
    eventData.milestone_percentage = event.milestone;
  }

  gtag('event', event.eventName, eventData);
}

export function storeMetrics(
  articleId: number,
  metrics: Omit<ScrollMetrics, 'articleId' | 'timestamp'>
): void {
  try {
    const storageKey = `behavioral-metrics-${articleId}`;
    const record: ScrollMetrics = {
      articleId,
      ...metrics,
      timestamp: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(record));
  } catch (error) {
    console.error('Failed to store behavioral metrics:', error);
  }
}

export function retrieveMetrics(articleId: number): ScrollMetrics | null {
  try {
    const storageKey = `behavioral-metrics-${articleId}`;
    const data = localStorage.getItem(storageKey);
    if (!data) return null;
    return JSON.parse(data) as ScrollMetrics;
  } catch (error) {
    console.error('Failed to retrieve behavioral metrics:', error);
    return null;
  }
}

export function clearMetrics(articleId: number): void {
  try {
    const storageKey = `behavioral-metrics-${articleId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear behavioral metrics:', error);
  }
}
