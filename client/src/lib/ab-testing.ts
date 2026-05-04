/**
 * A/B Testing Framework
 * Lightweight, localStorage-based variant assignment with deterministic hashing
 */

import crypto from 'crypto';

export interface ABExperiment {
  id: string;
  name: string;
  enabled: boolean;
  variants: string[]; // e.g., ['A', 'B']
  description?: string;
}

export interface ABTestState {
  experiments: Record<string, ABExperiment>;
  assignments: Record<string, string>; // experiment_id -> variant
}

const STORAGE_KEY = 'ctrl-alt-ab-experiments';

/**
 * Generate deterministic hash of user ID for consistent variant assignment
 * Uses simple string-based hashing (compatible with browser environment)
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Assign variant to user based on deterministic hash
 * Same user always gets same variant for same experiment
 */
export function assignVariant(
  userId: string,
  experimentId: string,
  variants: string[]
): string {
  if (variants.length === 0) {
    throw new Error('At least one variant must be provided');
  }

  const hash = hashUserId(`${userId}-${experimentId}`);
  const variantIndex = hash % variants.length;
  return variants[variantIndex];
}

/**
 * Get or create AB test state in localStorage
 */
function getABTestState(): ABTestState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load AB test state from localStorage:', error);
  }

  return {
    experiments: {},
    assignments: {},
  };
}

/**
 * Save AB test state to localStorage
 */
function saveABTestState(state: ABTestState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save AB test state to localStorage:', error);
  }
}

/**
 * Register an A/B test experiment
 */
export function registerExperiment(experiment: ABExperiment): void {
  const state = getABTestState();
  state.experiments[experiment.id] = experiment;
  saveABTestState(state);
}

/**
 * Get user's assigned variant for an experiment
 * Returns variant if experiment exists and is enabled, otherwise null
 */
export function getUserVariant(
  userId: string,
  experimentId: string
): string | null {
  const state = getABTestState();
  const experiment = state.experiments[experimentId];

  if (!experiment || !experiment.enabled) {
    return null;
  }

  // Check if assignment already cached
  if (state.assignments[experimentId]) {
    return state.assignments[experimentId];
  }

  // Assign new variant
  const variant = assignVariant(userId, experimentId, experiment.variants);
  state.assignments[experimentId] = variant;
  saveABTestState(state);

  return variant;
}

/**
 * Enable or disable an experiment
 */
export function setExperimentEnabled(experimentId: string, enabled: boolean): void {
  const state = getABTestState();
  if (state.experiments[experimentId]) {
    state.experiments[experimentId].enabled = enabled;
    saveABTestState(state);
  }
}

/**
 * Get all experiments
 */
export function getExperiments(): Record<string, ABExperiment> {
  const state = getABTestState();
  return state.experiments;
}

/**
 * Get all user assignments
 */
export function getUserAssignments(): Record<string, string> {
  const state = getABTestState();
  return state.assignments;
}

/**
 * Clear all A/B test data (for testing/reset)
 */
export function clearABTestData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear AB test data:', error);
  }
}

/**
 * Format variant as GA4 dimension value
 * e.g., "personalized_feed_v1" -> "personalized_feed_v1"
 */
export function formatGA4Dimension(experimentId: string, variant: string): string {
  return `${experimentId}_${variant}`.toLowerCase();
}

/**
 * Track GA4 event for variant assignment
 */
export function trackVariantAssignment(
  experimentId: string,
  variant: string
): void {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    return;
  }

  const dimensionKey = `custom_ab_variant_${experimentId}`;
  (window as any).gtag('config', {
    [dimensionKey]: variant,
  });

  // Also send event for tracking
  (window as any).gtag('event', 'ab_test_variant', {
    experiment_id: experimentId,
    variant: variant,
  });
}
