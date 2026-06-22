import { Router } from 'express';
import { reportBuilder } from '../lib/reportBuilder.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Create custom report
router.post('/create', (req, res) => {
  try {
    const { name, description, metrics, filters, chartType, comparison, branding } = req.body;

    if (!name || !Array.isArray(metrics) || !filters) {
      return res.status(400).json({ error: 'name, metrics array, and filters required' });
    }

    const report = reportBuilder.createReport({
      name,
      description,
      metrics,
      filters,
      chartType,
      comparison,
      branding,
    });

    res.json({
      message: 'Report created',
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create report', { error });
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// AC2: Save report as template
router.post('/:reportId/save-template', (req, res) => {
  try {
    const { reportId } = req.params;
    const { templateName } = req.body;

    if (!templateName) {
      return res.status(400).json({ error: 'templateName required' });
    }

    const template = reportBuilder.saveTemplate(reportId, templateName);

    res.json({
      message: 'Report saved as template',
      template,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to save template', { error });
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// AC2: Load from template
router.post('/load-template/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;

    const report = reportBuilder.loadTemplate(templateId);

    res.json({
      message: 'Report loaded from template',
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to load template', { error });
    res.status(500).json({ error: 'Failed to load template' });
  }
});

// AC3: Generate report
router.post('/:reportId/generate', (req, res) => {
  try {
    const { reportId } = req.params;

    const generated = reportBuilder.generateReport(reportId);

    res.json({
      message: 'Report generated',
      report: generated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to generate report', { error });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// AC3: Export as JSON
router.get('/:reportId/export/json', (req, res) => {
  try {
    const { reportId } = req.params;

    const json = reportBuilder.exportAsJSON(reportId);

    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="report-${reportId}.json"`);
    res.send(json);
  } catch (error) {
    logger.error('Failed to export JSON', { error });
    res.status(500).json({ error: 'Failed to export' });
  }
});

// AC3: Export as CSV
router.get('/:reportId/export/csv', (req, res) => {
  try {
    const { reportId } = req.params;

    const csv = reportBuilder.exportAsCSV(reportId);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="report-${reportId}.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('Failed to export CSV', { error });
    res.status(500).json({ error: 'Failed to export' });
  }
});

// AC7: Get shareable link
router.get('/:reportId/share', (req, res) => {
  try {
    const { reportId } = req.params;

    const shareToken = reportBuilder.getShareToken(reportId);
    const shareUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/reports/shared/${shareToken}`;

    res.json({
      message: 'Shareable link generated',
      shareUrl,
      shareToken,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to generate share link', { error });
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

// AC10: Get report history
router.get('/:reportId/history', (req, res) => {
  try {
    const { reportId } = req.params;

    const history = reportBuilder.getHistory(reportId);

    res.json({
      timestamp: new Date().toISOString(),
      reportId,
      versions: history.length,
      history,
    });
  } catch (error) {
    logger.error('Failed to get history', { error });
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// AC2: List templates
router.get('/templates/list', (_req, res) => {
  try {
    const templates = reportBuilder.listTemplates();

    res.json({
      timestamp: new Date().toISOString(),
      count: templates.length,
      templates,
    });
  } catch (error) {
    logger.error('Failed to list templates', { error });
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// List all reports
router.get('/list', (_req, res) => {
  try {
    const reports = reportBuilder.listReports();

    res.json({
      timestamp: new Date().toISOString(),
      count: reports.length,
      reports,
    });
  } catch (error) {
    logger.error('Failed to list reports', { error });
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Get specific report
router.get('/:reportId', (req, res) => {
  try {
    const { reportId } = req.params;

    const report = reportBuilder.getReport(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error) {
    logger.error('Failed to get report', { error });
    res.status(500).json({ error: 'Failed to get report' });
  }
});

export default router;
