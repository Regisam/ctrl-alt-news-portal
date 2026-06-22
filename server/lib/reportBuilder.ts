import { logger } from '../logger.js';

// AC1: Report configuration
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  metrics: string[]; // e.g., ['views', 'engagement', 'shares']
  filters: {
    startDate: string;
    endDate: string;
    category?: string;
    author?: string;
  };
  chartType?: 'line' | 'bar' | 'pie' | 'table';
  comparison?: 'yoy' | 'mom' | 'none'; // AC8
  branding?: {
    logo?: string;
    title?: string;
    colors?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// AC2: Report template
export interface ReportTemplate {
  id: string;
  name: string;
  config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: string;
}

// Generated report
export interface GeneratedReport {
  id: string;
  configId: string;
  generatedAt: string;
  data: Record<string, any>;
  exportUrl?: string;
  shareToken?: string;
  version: number;
}

class ReportBuilder {
  private configs: Map<string, ReportConfig> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();
  private reports: Map<string, GeneratedReport> = new Map();
  private history: Map<string, GeneratedReport[]> = new Map();

  // AC1: Create/update report configuration
  createReport(config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): ReportConfig {
    const id = `report-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const fullConfig: ReportConfig = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(id, fullConfig);
    logger.info('Report created', { id, name: config.name });

    return fullConfig;
  }

  // AC2: Save as template
  saveTemplate(reportId: string, templateName: string): ReportTemplate {
    const config = this.configs.get(reportId);
    if (!config) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const template: ReportTemplate = {
      id: templateId,
      name: templateName,
      config: {
        name: config.name,
        description: config.description,
        metrics: config.metrics,
        filters: config.filters,
        chartType: config.chartType,
        comparison: config.comparison,
        branding: config.branding,
      },
      createdAt: new Date().toISOString(),
    };

    this.templates.set(templateId, template);
    logger.info('Report template saved', { templateId, name: templateName });

    return template;
  }

  // AC2: Load from template
  loadTemplate(templateId: string): ReportConfig {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.createReport(template.config);
  }

  // AC3: Generate report (prepare data)
  generateReport(reportId: string): GeneratedReport {
    const config = this.configs.get(reportId);
    if (!config) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const id = `generated-${Date.now()}`;
    const data: Record<string, any> = {};

    // Simulate data generation for requested metrics
    for (const metric of config.metrics) {
      if (config.comparison === 'yoy') {
        data[metric] = {
          current: Math.floor(Math.random() * 10000),
          previous: Math.floor(Math.random() * 10000),
          changePercent: Math.floor(Math.random() * 100 - 50),
        };
      } else if (config.comparison === 'mom') {
        data[metric] = {
          current: Math.floor(Math.random() * 5000),
          previous: Math.floor(Math.random() * 5000),
          changePercent: Math.floor(Math.random() * 50 - 25),
        };
      } else {
        data[metric] = Math.floor(Math.random() * 10000);
      }
    }

    // Add metadata
    data.metadata = {
      dateRange: {
        start: config.filters.startDate,
        end: config.filters.endDate,
      },
      filters: config.filters,
      generatedAt: new Date().toISOString(),
    };

    const report: GeneratedReport = {
      id,
      configId: reportId,
      generatedAt: new Date().toISOString(),
      data,
      shareToken: `share-${Math.random().toString(36).substring(7)}`,
      version: 1,
    };

    this.reports.set(id, report);

    // AC10: Track history
    if (!this.history.has(reportId)) {
      this.history.set(reportId, []);
    }
    this.history.get(reportId)!.push(report);

    logger.info('Report generated', { id, configId: reportId });

    return report;
  }

  // AC3: Export formats
  exportAsJSON(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    return JSON.stringify(report.data, null, 2);
  }

  exportAsCSV(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    // Simple CSV export
    const rows: string[] = [];
    rows.push('Metric,Value');

    for (const [key, value] of Object.entries(report.data)) {
      if (key !== 'metadata') {
        if (typeof value === 'object') {
          rows.push(`${key},${JSON.stringify(value)}`);
        } else {
          rows.push(`${key},${value}`);
        }
      }
    }

    return rows.join('\n');
  }

  // AC7: Generate shareable link
  getShareToken(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    return report.shareToken || '';
  }

  // AC10: Get report history
  getHistory(configId: string): GeneratedReport[] {
    return this.history.get(configId) || [];
  }

  getReport(reportId: string): ReportConfig | null {
    return this.configs.get(reportId) || null;
  }

  getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.get(templateId) || null;
  }

  listTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  listReports(): ReportConfig[] {
    return Array.from(this.configs.values());
  }
}

export const reportBuilder = new ReportBuilder();
