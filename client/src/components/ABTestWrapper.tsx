import * as React from 'react';
import { useABTest, type ABExperiment } from '@/hooks/useABTest';

interface ABTestWrapperProps {
  experiment: ABExperiment;
  userId?: string;
  fallback?: React.ReactNode;
  children: {
    [variant: string]: React.ReactNode;
  };
}

/**
 * Component to conditionally render content based on A/B test variant
 * Usage:
 * <ABTestWrapper experiment={feedLayoutExp} userId={userId}>
 *   {{
 *     A: <PersonalizedFeed />,
 *     B: <LatestFeed />
 *   }}
 * </ABTestWrapper>
 */
export function ABTestWrapper({
  experiment,
  userId,
  fallback,
  children,
}: ABTestWrapperProps): React.ReactElement {
  const variant = useABTest(experiment, userId);

  // If experiment is disabled or variant not assigned, show fallback
  if (!variant) {
    return <>{fallback || children[experiment.variants[0]]}</>;
  }

  // Render variant-specific content
  const content = children[variant];
  if (!content) {
    console.warn(`No content found for variant ${variant} in experiment ${experiment.id}`);
    return <>{fallback || children[experiment.variants[0]]}</>;
  }

  return <>{content}</>;
}

/**
 * Conditional render hook for simpler inline usage
 * Usage: isVariantA ? <VariantA /> : <VariantB />
 */
export function useVariant(
  experiment: ABExperiment,
  userId?: string
): { isVariant: (variant: string) => boolean; variant: string | null } {
  const assignedVariant = useABTest(experiment, userId);

  return {
    isVariant: (variant: string) => assignedVariant === variant,
    variant: assignedVariant,
  };
}
