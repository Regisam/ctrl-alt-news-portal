# SLA Tracking & Uptime Monitoring Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

SLA monitoring tracks system uptime and ensures compliance with service level agreements.

## Features

- **AC1-4**: Uptime tracking (minute samples)
- **AC2-3**: SLA calculation (configurable targets)
- **AC5**: Alert when at risk
- **AC6-8**: Downtime analysis + historical trends
- **AC10-11**: CSV export + maintenance windows
- **365-day** data retention

## SLA Targets

```
Standard:   99.0%  (alert at 98.5%)
Premium:    99.5%  (alert at 99.0%)
Enterprise: 99.9%  (alert at 99.7%)
```

Allowed downtime per month (30 days):
- 99.0% = 43.2 minutes
- 99.5% = 21.6 minutes
- 99.9% = 4.32 minutes

## Endpoints

### Current Status
```bash
GET /api/sla/status
```

Returns uptime for 1/7/30/90 days + alert status

### SLA Compliance
```bash
GET /api/sla/compliance/:days
```

Calculate compliance for specific window

### Downtime Analysis
```bash
GET /api/sla/downtime/:days
```

Downtime events + analysis for window

### Historical Trends
```bash
GET /api/sla/history?days=7&interval=60
```

Uptime trend data by interval

### Set SLA Target
```bash
POST /api/sla/target/{standard|premium|enterprise}
```

Configure SLA threshold

### Alert Status
```bash
GET /api/sla/alert-status
```

Check if alert should fire

### Export Report
```bash
GET /api/sla/export/csv?days=30
```

Download CSV report

## Response Format

```json
{
  "timestamp": "2026-06-22T10:30:45Z",
  "status": {
    "current": {"uptime": 99.95, "target": 99.0, "compliant": true},
    "sevenDay": {"uptime": 99.80, "target": 99.0, "compliant": true},
    "thirtyDay": {"uptime": 99.75, "target": 99.0, "compliant": true},
    "ninetyDay": {"uptime": 99.70, "target": 99.0, "compliant": true}
  }
}
```

## Downtime Event

```json
{
  "startTime": "2026-06-21T14:20:00Z",
  "endTime": "2026-06-21T14:25:30Z",
  "duration": 330000,
  "durationMinutes": 5.5,
  "reason": "Database connection timeout",
  "resolved": true
}
```

## Grace Period

Blips under 30 seconds don't count as downtime.

## Best Practices

1. **Monitor daily**: Check /api/sla/status
2. **Export weekly**: CSV reports for stakeholders
3. **Alert thresholds**: Set to trigger before SLA breach
4. **Maintenance windows**: Exclude planned downtime
5. **Track trends**: Historical data identifies patterns

## Troubleshooting

### Uptime showing 100%?

Check if health checks are being recorded.

### Alert not firing?

Verify alert threshold is configured correctly.

---

**See also**: docs/guides/monitoring-guide.md
