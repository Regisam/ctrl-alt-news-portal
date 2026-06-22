import { logger } from '../logger.js';
import { uptimeTracker } from './uptimeTracker.js';

export interface SLATarget {
  name: string;
  targetPercent: number; // e.g., 99.9
  alertThreshold: number; // e.g., 99.8 (alert when dropping to this)
}

// AC3: Configurable SLA targets
const DEFAULT_TARGETS: Record<string, SLATarget> = {
  standard: { name: 'Standard (99%)', targetPercent: 99.0, alertThreshold: 98.5 },
  premium: { name: 'Premium (99.5%)', targetPercent: 99.5, alertThreshold: 99.0 },
  enterprise: { name: 'Enterprise (99.9%)', targetPercent: 99.9, alertThreshold: 99.7 },
};

class SLACalculator {
  private slaTarget: SLATarget = DEFAULT_TARGETS.standard;
  private lastAlertTime: number = 0;
  private readonly ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between alerts

  setSLATarget(targetName: keyof typeof DEFAULT_TARGETS): void {
    this.slaTarget = DEFAULT_TARGETS[targetName];
    logger.info('SLA target updated', { target: this.slaTarget.name });
  }

  // AC2: Calculate SLA compliance
  calculateSLACompliance(windowDays: number = 30): {
    uptime: number;
    target: number;
    compliant: boolean;
    allowedDowntime: number;
    remainingDowntime: number;
  } {
    const uptime = uptimeTracker.calculateUptime(windowDays);
    const target = this.slaTarget.targetPercent;
    const compliant = uptime >= target;

    // Calculate allowed downtime in minutes for the window
    const totalMinutes = windowDays * 24 * 60;
    const allowedDowntimePercent = 100 - target;
    const allowedDowntime = Math.round((allowedDowntimePercent / 100) * totalMinutes);

    // Calculate remaining downtime before breaching SLA
    const actualDowntimePercent = 100 - uptime;
    const actualDowntime = Math.round((actualDowntimePercent / 100) * totalMinutes);
    const remainingDowntime = Math.max(0, allowedDowntime - actualDowntime);

    return {
      uptime: Math.round(uptime * 100) / 100,
      target,
      compliant,
      allowedDowntime,
      remainingDowntime,
    };
  }

  // AC5: Check if SLA alert should fire
  checkSLAAlert(): { shouldAlert: boolean; reason?: string } {
    const uptime = uptimeTracker.calculateUptime(7); // Check last 7 days

    // Don't alert too frequently
    const timeSinceLastAlert = Date.now() - this.lastAlertTime;
    if (timeSinceLastAlert < this.ALERT_COOLDOWN_MS) {
      return { shouldAlert: false };
    }

    // Alert if projected to miss target
    if (uptime < this.slaTarget.alertThreshold) {
      this.lastAlertTime = Date.now();
      logger.warn('SLA alert triggered', {
        uptime,
        alertThreshold: this.slaTarget.alertThreshold,
        target: this.slaTarget.targetPercent,
      });

      return {
        shouldAlert: true,
        reason: `Uptime ${uptime}% is below alert threshold ${this.slaTarget.alertThreshold}%`,
      };
    }

    return { shouldAlert: false };
  }

  // Get current SLA status
  getSLAStatus(): {
    current: { uptime: number; target: number; compliant: boolean };
    sevenDay: { uptime: number; target: number; compliant: boolean };
    thirtyDay: { uptime: number; target: number; compliant: boolean };
    ninetyDay: { uptime: number; target: number; compliant: boolean };
    alertStatus: boolean;
  } {
    return {
      current: this.calculateSLACompliance(1),
      sevenDay: this.calculateSLACompliance(7),
      thirtyDay: this.calculateSLACompliance(30),
      ninetyDay: this.calculateSLACompliance(90),
      alertStatus: this.checkSLAAlert().shouldAlert,
    };
  }

  getSLATargets(): SLATarget {
    return this.slaTarget;
  }
}

export const slaCalculator = new SLACalculator();
