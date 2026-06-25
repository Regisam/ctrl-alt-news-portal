import { logger } from '../logger.js';

// AC1-9: Alert types
export interface AlertThreshold {
  id: string;
  name: string;
  metric: 'response_time' | 'error_rate' | 'active_users' | 'email_bounce' | 'push_fail';
  threshold: number;
  operator: '>' | '<' | '>=';
  duration: number; // minutes
  enabled: boolean;
  escalate: boolean;
  channels: ('slack' | 'email')[];
}

export interface Alert {
  id: string;
  thresholdId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric: string;
  value: number;
  createdAt: Date;
  resolvedAt?: Date;
  acknowledged: boolean;
  silencedUntil?: Date;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  action: 'triggered' | 'escalated' | 'resolved' | 'silenced' | 'acknowledged';
  timestamp: Date;
  details: string;
}

class AlertingService {
  private thresholds: Map<string, AlertThreshold> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: AlertHistory[] = [];
  private alertCount: Map<string, number> = new Map();

  // AC1: Configure threshold
  configureThreshold(threshold: AlertThreshold): void {
    this.thresholds.set(threshold.id, threshold);
    logger.info('Alert threshold configured', { thresholdId: threshold.id, name: threshold.name });
  }

  // AC1: Get threshold
  getThreshold(id: string): AlertThreshold | null {
    return this.thresholds.get(id) || null;
  }

  // AC1: Get all thresholds
  getAllThresholds(): AlertThreshold[] {
    return Array.from(this.thresholds.values());
  }

  // AC1: Update threshold
  updateThreshold(id: string, updates: Partial<AlertThreshold>): boolean {
    const threshold = this.thresholds.get(id);
    if (!threshold) return false;

    Object.assign(threshold, updates);
    logger.info('Alert threshold updated', { thresholdId: id });
    return true;
  }

  // AC2-3: Check metric against thresholds
  checkMetric(metric: string, value: number): Alert[] {
    const triggeredAlerts: Alert[] = [];

    for (const threshold of this.thresholds.values()) {
      if (!threshold.enabled || threshold.metric !== metric) continue;

      // AC3: Check threshold breach
      const breached = this.checkBreach(value, threshold.threshold, threshold.operator);

      if (breached) {
        const alert = this.createAlert(threshold, value);
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  // AC3: Check if threshold is breached
  private checkBreach(value: number, threshold: number, operator: '>' | '<' | '>='): boolean {
    if (operator === '>') return value > threshold;
    if (operator === '<') return value < threshold;
    if (operator === '>=') return value >= threshold;
    return false;
  }

  // AC3: Create alert
  private createAlert(threshold: AlertThreshold, value: number): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      thresholdId: threshold.id,
      severity: this.calculateSeverity(threshold, value),
      title: threshold.name,
      message: `${threshold.name}: ${value} (threshold: ${threshold.threshold})`,
      metric: threshold.metric,
      value,
      createdAt: new Date(),
      acknowledged: false,
    };

    this.activeAlerts.set(alert.id, alert);

    // AC6: Deduplication - check if similar alert exists
    const existingAlert = this.findExistingAlert(threshold.id);
    if (existingAlert && !this.isDuplicate(existingAlert, alert)) {
      // AC7: Escalate if persisting
      if (threshold.escalate) {
        this.escalateAlert(alert);
      }
    }

    this.recordHistory(alert.id, 'triggered', `Alert triggered for ${threshold.name}`);

    logger.warn('Alert triggered', { alertId: alert.id, severity: alert.severity });

    return alert;
  }

  // AC6: Find existing alert for threshold
  private findExistingAlert(thresholdId: string): Alert | null {
    for (const alert of this.activeAlerts.values()) {
      if (alert.thresholdId === thresholdId && !alert.resolvedAt) {
        return alert;
      }
    }
    return null;
  }

  // AC6: Check if alert is duplicate
  private isDuplicate(existing: Alert, current: Alert): boolean {
    const timeDiff = Math.abs(current.createdAt.getTime() - existing.createdAt.getTime());
    return timeDiff < 60 * 1000; // Within 1 minute
  }

  // AC7: Escalate alert severity
  private escalateAlert(alert: Alert): void {
    if (alert.severity === 'info') {
      alert.severity = 'warning';
    } else if (alert.severity === 'warning') {
      alert.severity = 'critical';
    }

    this.recordHistory(alert.id, 'escalated', `Alert escalated to ${alert.severity}`);
    logger.warn('Alert escalated', { alertId: alert.id, severity: alert.severity });
  }

  // AC8: Create custom alert rule
  createCustomRule(rule: { name: string; condition: string; channels: string[] }): AlertThreshold {
    // Parse custom condition (simplified)
    const threshold: AlertThreshold = {
      id: `rule-${Date.now()}`,
      name: rule.name,
      metric: 'response_time',
      threshold: 200,
      operator: '>',
      duration: 5,
      enabled: true,
      escalate: true,
      channels: rule.channels as ('slack' | 'email')[],
    };

    this.configureThreshold(threshold);
    return threshold;
  }

  // AC9: Silence alert
  silenceAlert(alertId: string, durationMinutes: number): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.silencedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.recordHistory(alertId, 'silenced', `Alert silenced for ${durationMinutes} minutes`);

    logger.info('Alert silenced', { alertId, durationMinutes });
    return true;
  }

  // AC5: Acknowledge alert
  acknowledgeAlert(alertId: string, message?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.recordHistory(alertId, 'acknowledged', message || 'Alert acknowledged');

    logger.info('Alert acknowledged', { alertId });
    return true;
  }

  // AC5: Resolve alert
  resolveAlert(alertId: string, message?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolvedAt = new Date();
    this.recordHistory(alertId, 'resolved', message || 'Alert resolved');

    logger.info('Alert resolved', { alertId });
    return true;
  }

  // AC5: Get alert history
  getAlertHistory(alertId: string): AlertHistory[] {
    return this.alertHistory.filter((h) => h.alertId === alertId);
  }

  // AC5: Record history
  private recordHistory(alertId: string, action: string, details: string): void {
    const history: AlertHistory = {
      id: `history-${Date.now()}`,
      alertId,
      action: action as any,
      timestamp: new Date(),
      details,
    };

    this.alertHistory.push(history);

    // Keep last 1000 records
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  // AC10: Get dashboard data
  getDashboardData() {
    const active = Array.from(this.activeAlerts.values()).filter((a) => !a.resolvedAt);
    const critical = active.filter((a) => a.severity === 'critical');
    const warning = active.filter((a) => a.severity === 'warning');

    return {
      totalActive: active.length,
      critical: critical.length,
      warning: warning.length,
      activeAlerts: active.slice(0, 10),
      allThresholds: this.getAllThresholds().length,
    };
  }

  // Calculate severity based on threshold breach amount
  private calculateSeverity(threshold: AlertThreshold, value: number): 'info' | 'warning' | 'critical' {
    const breach = Math.abs(value - threshold.threshold);
    const breachPercent = (breach / threshold.threshold) * 100;

    if (breachPercent > 50) return 'critical';
    if (breachPercent > 25) return 'warning';
    return 'info';
  }

  // Clear
  clear(): void {
    this.thresholds.clear();
    this.activeAlerts.clear();
    this.alertHistory = [];
    logger.info('Alerting service cleared');
  }
}

export const alertingService = new AlertingService();
