import * as React from 'react';
import {
  getUserVariant,
  registerExperiment,
  trackVariantAssignment,
  type ABExperiment,
} from '@/lib/ab-testing';

export type { ABExperiment };

/**
 * Hook to get user's assigned variant for an A/B test experiment
 * Returns the assigned variant (e.g., 'A' or 'B') or null if experiment is disabled
 */
export function useABTest(experiment: ABExperiment, userId: string = ''): string | null {
  const [variant, setVariant] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Generate user ID if not provided (use localStorage or generate new)
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const storageKey = 'ctrl-alt-user-id';
      let storedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (!storedId) {
        storedId = `user-${Math.random().toString(36).substring(7)}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, storedId);
        }
      }
      effectiveUserId = storedId;
    }

    // Register experiment if not already registered
    registerExperiment(experiment);

    // Get user's variant
    const assignedVariant = getUserVariant(effectiveUserId, experiment.id);

    // Track assignment in GA4
    if (assignedVariant) {
      trackVariantAssignment(experiment.id, assignedVariant);
    }

    setVariant(assignedVariant);
    setIsLoading(false);
  }, [experiment, userId]);

  return variant;
}

/**
 * Hook to get multiple experiments' variants at once
 * Returns object mapping experiment IDs to their assigned variants
 */
export function useABTests(
  experiments: ABExperiment[],
  userId: string = ''
): Record<string, string | null> {
  const [variants, setVariants] = React.useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Generate user ID if not provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const storageKey = 'ctrl-alt-user-id';
      let storedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (!storedId) {
        storedId = `user-${Math.random().toString(36).substring(7)}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, storedId);
        }
      }
      effectiveUserId = storedId;
    }

    const result: Record<string, string | null> = {};

    experiments.forEach((experiment) => {
      // Register experiment
      registerExperiment(experiment);

      // Get variant
      const variant = getUserVariant(effectiveUserId, experiment.id);
      result[experiment.id] = variant;

      // Track in GA4
      if (variant) {
        trackVariantAssignment(experiment.id, variant);
      }
    });

    setVariants(result);
    setIsLoading(false);
  }, [experiments, userId]);

  return variants;
}
