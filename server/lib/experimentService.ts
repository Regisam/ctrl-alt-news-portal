import { logger } from '../logger.js';

// AC1-9: Experiment types
export interface Variant {
  id: string;
  name: string;
  description: string;
  traffic: number; // percentage 0-100
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  variants: Variant[];
  targetingRules?: string[];
  startDate: Date;
  endDate?: Date;
  winner?: string;
  minSampleSize: number;
  confidenceLevel: number; // 0.95 = 95%
}

export interface ExperimentMetric {
  experimentId: string;
  userId: string;
  variantId: string;
  metricName: string;
  value: number;
  timestamp: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  winner: boolean;
}

class ExperimentService {
  private experiments: Map<string, Experiment> = new Map();
  private userVariants: Map<string, string> = new Map(); // userId → variantId
  private metrics: ExperimentMetric[] = [];
  private results: Map<string, ExperimentResult[]> = new Map();

  // AC1: Create experiment
  createExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
    this.results.set(experiment.id, []);

    logger.info('Experiment created', { experimentId: experiment.id, name: experiment.name });
  }

  // AC1: Get experiment
  getExperiment(id: string): Experiment | null {
    return this.experiments.get(id) || null;
  }

  // AC1: List experiments
  listExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  // AC1: Update experiment
  updateExperiment(id: string, updates: Partial<Experiment>): boolean {
    const experiment = this.experiments.get(id);
    if (!experiment) return false;

    Object.assign(experiment, updates);
    logger.info('Experiment updated', { experimentId: id });
    return true;
  }

  // AC1: Start experiment
  startExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (!experiment) return false;

    experiment.status = 'running';
    experiment.startDate = new Date();

    logger.info('Experiment started', { experimentId: id });
    return true;
  }

  // AC2: Assign user to variant
  assignUserToVariant(experimentId: string, userId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return '';

    // AC7: Check targeting rules
    if (experiment.targetingRules && !this.evaluateTargetingRules(userId, experiment.targetingRules)) {
      return '';
    }

    // AC2-3: Allocate based on traffic percentage
    const variant = this.selectVariant(experiment.variants);
    const variantKey = `${experimentId}:${userId}`;

    this.userVariants.set(variantKey, variant.id);

    logger.debug('User assigned to variant', { experimentId, userId, variantId: variant.id });

    return variant.id;
  }

  // AC3: Select variant based on traffic
  private selectVariant(variants: Variant[]): Variant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.traffic;
      if (random < cumulative) {
        return variant;
      }
    }

    return variants[0];
  }

  // AC7: Evaluate targeting rules
  private evaluateTargetingRules(userId: string, rules: string[]): boolean {
    // Simplified evaluation - in production, use more sophisticated rule engine
    return true;
  }

  // AC8: Evaluate feature flag
  isFeatureFlagEnabled(experimentId: string, userId: string, featureName: string): boolean {
    const variantKey = `${experimentId}:${userId}`;
    const variantId = this.userVariants.get(variantKey);

    if (!variantId) {
      return false;
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    // Feature flag enabled for this variant
    return true;
  }

  // AC4: Track metric
  trackMetric(experimentId: string, userId: string, metricName: string, value: number): void {
    const variantKey = `${experimentId}:${userId}`;
    const variantId = this.userVariants.get(variantKey);

    if (!variantId) {
      logger.warn('User not in experiment', { experimentId, userId });
      return;
    }

    const metric: ExperimentMetric = {
      experimentId,
      userId,
      variantId,
      metricName,
      value,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    logger.debug('Metric tracked', { experimentId, userId, metricName, value });
  }

  // AC5-6: Calculate results
  calculateResults(experimentId: string): ExperimentResult[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    const results: ExperimentResult[] = [];
    const experimentMetrics = this.metrics.filter((m) => m.experimentId === experimentId);

    // Group by variant
    const variantMetrics = new Map<string, ExperimentMetric[]>();

    for (const variant of experiment.variants) {
      const metrics = experimentMetrics.filter((m) => m.variantId === variant.id);
      variantMetrics.set(variant.id, metrics);
    }

    // Calculate stats for each variant
    for (const [variantId, metrics] of variantMetrics.entries()) {
      const totalUsers = new Set(metrics.map((m) => m.userId)).size;
      const conversions = metrics.filter((m) => m.value > 0).length;
      const conversionRate = totalUsers > 0 ? conversions / totalUsers : 0;

      // AC5: Calculate confidence
      const confidence = this.calculateConfidence(conversions, totalUsers);

      results.push({
        experimentId,
        variantId,
        totalUsers,
        conversions,
        conversionRate,
        confidence,
        winner: false,
      });
    }

    // AC9: Determine winner
    const winner = this.determineWinner(results, experiment.confidenceLevel);
    if (winner) {
      const winnerResult = results.find((r) => r.variantId === winner);
      if (winnerResult) {
        winnerResult.winner = true;
        experiment.winner = winner;
      }
    }

    this.results.set(experimentId, results);

    return results;
  }

  // AC5: Calculate statistical confidence
  private calculateConfidence(conversions: number, totalUsers: number): number {
    if (totalUsers < 30) return 0; // Not enough data
    if (conversions === 0) return 0;

    // Simplified Z-score calculation
    const p = conversions / totalUsers;
    const se = Math.sqrt((p * (1 - p)) / totalUsers);
    const z = Math.abs(p - 0.5) / se;

    // Convert Z-score to confidence (simplified)
    return Math.min(z / 1.96, 1.0); // 95% confidence threshold
  }

  // AC9: Determine winner based on confidence
  private determineWinner(results: ExperimentResult[], confidenceLevel: number): string | null {
    // Find variant with highest conversion rate that meets confidence threshold
    const qualified = results.filter((r) => r.confidence >= confidenceLevel).sort((a, b) => b.conversionRate - a.conversionRate);

    return qualified.length > 0 ? qualified[0].variantId : null;
  }

  // AC9: Stop experiment (early stopping)
  stopExperiment(experimentId: string, reason: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    experiment.status = 'stopped';
    experiment.endDate = new Date();

    // Calculate final results
    this.calculateResults(experimentId);

    logger.info('Experiment stopped', { experimentId, reason });
    return true;
  }

  // AC10: Get experiment history
  getExperimentHistory(): Experiment[] {
    return Array.from(this.experiments.values()).filter((e) => e.status === 'completed' || e.status === 'stopped');
  }

  // AC6: Get results
  getResults(experimentId: string): ExperimentResult[] {
    return this.results.get(experimentId) || [];
  }

  // AC11: Export data
  exportResults(experimentId: string): { metrics: ExperimentMetric[]; results: ExperimentResult[] } {
    const metrics = this.metrics.filter((m) => m.experimentId === experimentId);
    const results = this.results.get(experimentId) || [];

    return { metrics, results };
  }

  // Clear
  clear(): void {
    this.experiments.clear();
    this.userVariants.clear();
    this.metrics = [];
    this.results.clear();

    logger.info('Experiment service cleared');
  }
}

export const experimentService = new ExperimentService();
