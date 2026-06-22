# Disaster Recovery Runbook

**Version**: 1.0  
**Last Updated**: 2026-06-22  
**RTO**: 1 hour  
**RPO**: 15 minutes

## Overview

Procedures to recover from data loss or service failure.

## Backup Strategy

**Frequency**: Daily at 00:00 UTC

**Retention**: 30 days

**Verification**: Automatic (test restore on each backup)

**Location**: AWS S3 (encrypted)

**Encryption**: AES-256 at rest

## Check Backup Status

```bash
GET /api/backup/stats
```

Response:
```json
{
  "totalBackups": 30,
  "verifiedBackups": 29,
  "failedBackups": 0,
  "totalSizeGB": "150.50",
  "oldestBackup": "2026-05-23T00:00:00Z",
  "newestBackup": "2026-06-22T00:00:00Z"
}
```

## Recovery Scenarios

### Scenario 1: Accidental Data Deletion

**Detection**: Monitoring alert (data integrity check fails)

**Recovery Steps**:

1. **Identify when data was deleted**:
   ```bash
   # Find backup before deletion time
   curl "http://localhost:3000/api/backup/backup-at-time?timestamp=2026-06-20T10:00:00Z"
   ```

2. **Restore from backup**:
   ```bash
   curl -X POST "http://localhost:3000/api/backup/restore/backup-1718918400000"
   ```

3. **Verify data integrity**:
   - Check record counts
   - Verify user accounts
   - Check article data

**RTO**: 30 minutes

### Scenario 2: Database Corruption

**Detection**: Monitoring alert (query errors, data inconsistencies)

**Recovery Steps**:

1. **Create fresh backup** (if not corrupted):
   ```bash
   curl -X POST "http://localhost:3000/api/backup/create"
   ```

2. **Restore from last verified backup**:
   ```bash
   # Get latest verified backup
   curl "http://localhost:3000/api/backup/list?days=7"
   
   # Restore it
   curl -X POST "http://localhost:3000/api/backup/restore/backup-ID"
   ```

3. **Run integrity checks**:
   - FSCK on database
   - Verify indexes
   - Check constraints

**RTO**: 45 minutes

### Scenario 3: Complete Disk Failure

**Detection**: All queries fail, database unreachable

**Recovery Steps**:

1. **Provision new database server**:
   - Infrastructure team creates new VM
   - Attach storage
   - Install database software

2. **Restore from backup**:
   ```bash
   curl -X POST "http://localhost:3000/api/backup/restore/backup-LATEST"
   ```

3. **Update connection strings**:
   - Update environment variables
   - Restart application

4. **Verify service**:
   - Health check passes
   - Queries responding
   - Data available

**RTO**: 1 hour

### Scenario 4: Ransomware Attack

**Detection**: Files encrypted, payment demand received

**Recovery Steps**:

1. **Isolate infected servers**:
   - Disconnect from network
   - Stop application

2. **Assess impact**:
   - Which systems compromised?
   - Which backups are clean?

3. **Restore from unencrypted backup**:
   - Find oldest clean backup (before infection)
   - Restore to fresh infrastructure

4. **Rebuild infected systems**:
   - Don't use backups if infected
   - Rebuild from clean images

**RTO**: 2 hours  
**Data Loss**: Up to 24 hours (since last backup)

## Testing Backup & Recovery

**Monthly DR Drill** (last Friday of month):

1. **Create snapshot**: 
   - List all backups
   - Note backup ID

2. **Restore to test DB**:
   - Restore backup to isolated test instance
   - Verify data integrity
   - Measure restore time

3. **Document results**:
   - RTO achieved: _____ min
   - RPO: 15 min (standard)
   - Issues found: ___________

4. **Post-drill review**:
   - What went wrong?
   - Can we improve?
   - Update this runbook

## Backup Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/backup/create` | POST | Create manual backup |
| `/api/backup/list` | GET | List backups |
| `/api/backup/stats` | GET | Backup statistics |
| `/api/backup/verify/:id` | POST | Verify specific backup |
| `/api/backup/restore/:id` | POST | Restore from backup |
| `/api/backup/backup-at-time` | GET | Find backup at timestamp |

## RTO/RPO Targets

**RTO (Recovery Time Objective)**: 1 hour
- Time from disaster detection to service recovery

**RPO (Recovery Point Objective)**: 15 minutes
- Maximum acceptable data loss

**Current Backup**: 24 hours (daily 00:00 UTC)
- **Actual RPO**: 24 hours (not meeting 15-min target)
- **Improvement needed**: Implement hourly backups

## Contacts

**On-Call Engineer**: [TBD]  
**Database Team**: [TBD]  
**Infrastructure Team**: [TBD]

---

**See also**: docs/guides/monitoring-guide.md, docs/runbooks/incident-response.md
