import { Alert } from '../lib/notificationManager.js';

export interface EscalationRule {
  severity: string;
  delayMs: number;
  actions: ('email' | 'slack' | 'page')[];
  condition?: () => boolean;
}

const defaultRules: EscalationRule[] = [
  {
    // AC5: Critical alerts page immediately
    severity: 'critical',
    delayMs: 0,
    actions: ['slack', 'email'],
  },
  {
    // AC4: High alerts escalate after 5 minutes
    severity: 'high',
    delayMs: 5 * 60 * 1000,
    actions: ['slack', 'email'],
  },
  {
    severity: 'medium',
    delayMs: 15 * 60 * 1000,
    actions: ['slack'],
  },
  {
    severity: 'low',
    delayMs: 30 * 60 * 1000,
    actions: ['slack'],
  },
];

const pendingEscalations: Map<string, NodeJS.Timeout> = new Map();

export function getEscalationRule(severity: string): EscalationRule {
  return (
    defaultRules.find((r) => r.severity === severity) || defaultRules[defaultRules.length - 1]
  );
}

export function scheduleEscalation(
  alert: Alert,
  callback: (alert: Alert, actions: string[]) => void
): void {
  const rule = getEscalationRule(alert.severity);

  if (rule.condition && !rule.condition()) {
    return;
  }

  // Cancel any existing escalation for this alert
  const existingTimeout = pendingEscalations.get(alert.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  if (rule.delayMs === 0) {
    // Immediate escalation
    callback(alert, rule.actions);
  } else {
    // Scheduled escalation
    const timeout = setTimeout(() => {
      callback(alert, rule.actions);
      pendingEscalations.delete(alert.id);
    }, rule.delayMs);

    pendingEscalations.set(alert.id, timeout);
  }
}

export function cancelEscalation(alertId: string): void {
  const timeout = pendingEscalations.get(alertId);
  if (timeout) {
    clearTimeout(timeout);
    pendingEscalations.delete(alertId);
  }
}

export function getEscalationStatus(alertId: string): {
  pending: boolean;
  severityLevel?: string;
} {
  const hasPending = pendingEscalations.has(alertId);
  return {
    pending: hasPending,
  };
}

export function clearAllEscalations(): void {
  pendingEscalations.forEach((timeout) => clearTimeout(timeout));
  pendingEscalations.clear();
}

export function getPendingEscalationCount(): number {
  return pendingEscalations.size;
}
