# Al Mokhtabar Laboratory Platform - Rollback Strategy

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Owner**: DevOps Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Deployment Rollback (Blue-Green)](#2-deployment-rollback-blue-green)
3. [Database Migration Rollback](#3-database-migration-rollback)
4. [Full System Rollback](#4-full-system-rollback)
5. [Emergency Procedures](#5-emergency-procedures)
6. [Rollback Automation](#6-rollback-automation)
7. [RTO/RPO Targets](#7-rtorpo-targets)

---

## 1. Overview

### 1.1 Rollback Principles

- **Always have a revert plan** before deploying any change
- **Database migrations must be backward-compatible** for at least 3 releases
- **Canary deployments** catch issues before full rollout
- **Automated rollback** triggers on health check failure
- **Every rollback must be followed by a post-mortem**

### 1.2 Decision Matrix

| Scenario | Rollback Method | RTO | Priority |
|----------|----------------|-----|----------|
| New deployment causes 5xx errors | Traffic switch + Helm rollback | < 2 min | CRITICAL |
| Database migration corrupts data | Restore from snapshot | < 15 min | CRITICAL |
| Configuration change breaks auth | Helm rollback config | < 2 min | HIGH |
| Feature flag causes incorrect billing | Disable feature flag | < 1 min | HIGH |
| Third-party API integration failure | Circuit breaker trip | < 1 min | MEDIUM |
| Slow performance regression | Blue-green switch to previous | < 5 min | MEDIUM |
| Security vulnerability discovered | Hotfix deploy or revert | < 30 min | CRITICAL |

---

## 2. Deployment Rollback (Blue-Green)

### 2.1 Architecture

```
                 ┌──────────────┐
                 │  Cloudflare  │
                 │  Load Balancer│
                 └──────┬───────┘
                        │
                 ┌──────┴───────┐
                 │  NGINX        │
                 │  Ingress      │
                 └──────┬───────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
  ┌───────┴────────┐         ┌───────┴────────┐
  │  Blue (active) │         │  Green (standby)│
  │  v1.2.3        │         │  v1.2.2 (prev)  │
  │  replicas: 5   │         │  replicas: 2    │
  └───────┬────────┘         └───────┬────────┘
          │                           │
          └─────────────┬─────────────┘
                        │
                 ┌──────┴───────┐
                 │  Database     │
                 │  (shared)     │
                 └──────────────┘
```

### 2.2 Traffic Switch Rollback

```powershell
# METHOD 1: Switch Kubernetes Service selector back to previous version

# Current state: service points to 'app: backend, version: v1.2.3'
# Goal: switch back to 'app: backend, version: v1.2.2'

# Check current service labels
kubectl get svc backend-service -n almokhtaber -o jsonpath='{.spec.selector}'
# Expected: {"app": "backend", "version": "v1.2.3"}

# Patch service to point to previous version
kubectl patch svc backend-service -n almokhtaber -p '{"spec":{"selector":{"version":"v1.2.2"}}}'

# Verify traffic switches immediately
kubectl get endpoints backend-service -n almokhtaber -w
# Expected: endpoints immediately reflect v1.2.2 pods

# Verify health
curl -s "https://api.almokhtabar.sa/health" | ConvertFrom-Json
# Expected: status: healthy

# Scale down the problematic deployment
kubectl scale deployment backend-v1.2.3 -n almokhtaber --replicas=0
```

### 2.3 Helm Rollback

```powershell
# Check deployment history
helm history almokhtaber -n almokhtaber

# Example output:
# REVISION  UPDATED                   STATUS         CHART                   APP VERSION  DESCRIPTION
# 1         Fri Jul 24 10:00:00 2026  superseded     almokhtaber-1.0.0       1.0.0        Install complete
# 2         Mon Jul 27 14:30:00 2026  superseded     almokhtaber-1.1.0       1.1.0        Upgrade complete
# 3         Wed Jul 29 09:00:00 2026  deployed       almokhtaber-1.2.0       1.2.0        Upgrade complete
# 4         Thu Jul 30 08:00:00 2026  failed         almokhtaber-1.2.1       1.2.1        Upgrade failed

# Rollback to revision 3 (previous stable)
helm rollback almokhtaber 3 -n almokhtaber --wait --timeout 5m0s

# Expected output:
# Rollback was a success! Happy Helming!

# Verify deployment
kubectl rollout status deployment -n almokhtaber -l app.kubernetes.io/instance=almokhtaber --timeout=3m

# Verify health
curl -s "https://api.almokhtabar.sa/health" | ConvertFrom-Json
```

### 2.4 GitOps Rollback (ArgoCD)

```powershell
# Via ArgoCD CLI
argocd app get almokhtaber

# List history
argocd app history almokhtaber

# Rollback to specific deployment ID
argocd app rollback almokhtaber --id 5

# Or revert Git commit - push revert to Git repo
git revert HEAD --no-edit
git push origin main
# ArgoCD auto-syncs within 3 minutes
```

### 2.5 Verification After Rollback

```powershell
# Health check
for ($i=0; $i -lt 10; $i++) {
  $RESULT = curl.exe -s -o /dev/null -w "%{http_code}" "https://api.almokhtabar.sa/health"
  Write-Host "Health check $($i+1): $RESULT"
  if ($RESULT -ne "200") {
    Write-Host "ERROR: Health check failed after rollback"
    exit 1
  }
  Start-Sleep -Milliseconds 500
}

# Check pod status
kubectl get pods -n almokhtaber
# All pods Running and Ready

# Check error rate (via Prometheus query)
$PROM_ENDPOINT = "http://prometheus.monitoring:9090"
curl -s "$PROM_ENDPOINT/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | ConvertFrom-Json
# Expected: value < 0.01 (less than 1% errors)

# Check business metrics
curl -s "https://api.almokhtabar.sa/admin/dashboard/summary" -H "Authorization: Bearer $ADMIN_TOKEN" | ConvertFrom-Json
# Expected: normal metrics (orders, users, etc.)
```

---

## 3. Database Migration Rollback

### 3.1 Prisma Migration Down

```powershell
# IMPORTANT: Prisma Migrate does not have a built-in "migrate down" command
# Strategy depends on your migration approach:

# OPTION A: If using Prisma Migrate with a migration table
# You MUST create a down migration manually for each up migration

# Check current migration state
npx prisma migrate status
# Expected: Database schema is up to date

# View migration history
npx prisma migrate --help

# OPTION B: Manually revert using SQL
# Each migration should have a corresponding revert script in:
# apps/backend/prisma/migrations/<migration_id>/revert.sql

# Example revert script (generated alongside migration):
# File: prisma/migrations/20260730000001_add_payments_table/revert.sql

# Run the revert
psql -h $RDS_ENDPOINT -U almokhtaber_admin -d almokhtaber_prod -f apps/backend/prisma/migrations/20260730000001_add_payments_table/revert.sql

# Then mark the migration as not applied
# Update the _prisma_migrations table
psql -h $RDS_ENDPOINT -U almokhtaber_admin -d almokhtaber_prod -c "
DELETE FROM _prisma_migrations WHERE migration_name = '20260730000001_add_payments_table';
"
```

### 3.2 SQL Revert Script

```sql
-- Example revert script: prisma/migrations/20260730000001_add_payments_table/revert.sql
-- Must be written for EVERY migration before deployment

-- Step 1: Drop foreign keys first
ALTER TABLE IF EXISTS payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_order_id_fkey;
ALTER TABLE IF EXISTS payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;

-- Step 2: Drop indexes
DROP INDEX IF EXISTS idx_payment_transactions_status;
DROP INDEX IF EXISTS idx_payment_transactions_created_at;
DROP INDEX IF EXISTS idx_payment_transactions_user_id;

-- Step 3: Drop tables in reverse order
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS payment_methods;

-- Step 4: Remove columns from related tables
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;
ALTER TABLE orders DROP COLUMN IF EXISTS paid_at;

-- Step 5: Restore dropped columns if any
-- (If the migration removed columns, add them back here)

-- Step 6: Verify
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'payment_transactions';
-- Expected: 0
```

### 3.3 Restore from Backup

```powershell
# If revert script is not available or migration is too complex:

# Step 1: Get the latest snapshot before the migration
aws rds describe-db-snapshots `
  --db-instance-identifier almokhtaber-pg-prod `
  --snapshot-type automated `
  --query "DBSnapshots[0].DBSnapshotIdentifier" `
  --output text `
  --profile almokhtaber-prod

# Step 2: Restore snapshot to a temporary instance
aws rds restore-db-instance-from-db-snapshot `
  --db-instance-identifier almokhtaber-pg-rollback-temp `
  --db-snapshot-identifier rds:almokhtaber-pg-prod-2026-07-30-06-00 `
  --db-instance-class db.r6g.large `
  --vpc-security-group-ids sg-xxxxx `
  --db-subnet-group-name almokhtaber-data-subnet-group `
  --profile almokhtaber-prod

# Step 3: Wait for restore
aws rds wait db-instance-available --db-instance-identifier almokhtaber-pg-rollback-temp --profile almokhtaber-prod

# Step 4: Rename databases (swap)
# Rename current prod database
psql -h $RDS_ENDPOINT -U almokhtaber_admin -d postgres -c "ALTER DATABASE almokhtaber_prod RENAME TO almokhtaber_prod_corrupted;"

# Rename restored database to prod
# Unfortunately RDS doesn't support renaming across instances:
# Instead, point application to the restored instance

# Step 5: Update connection string in Vault/secrets
vault kv put secret/almokhtaber/prod/database \
  url="postgresql://almokhtaber_admin:xxxx@almokhtaber-pg-rollback-temp.xxxxx.me-south-1.rds.amazonaws.com:5432/almokhtaber_prod"

# Step 6: Rollback application to previous version (see Section 2)
# Step 7: Verify application works with restored database
# Step 8: After verification, rename back (or keep new instance)
```

### 3.4 Data Integrity Verification After Rollback

```sql
-- Verify user counts match pre-migration
SELECT COUNT(*) AS user_count, 'expected: 50000' AS expected FROM users;

-- Verify orders are intact
SELECT COUNT(*) AS order_count, COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed FROM orders;

-- Verify no orphaned records
SELECT COUNT(*) FROM payment_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
WHERE o.id IS NULL;

-- Check recent timestamps make sense
SELECT MAX(created_at) AS newest_user FROM users;
SELECT MAX(created_at) AS newest_order FROM orders;
```

---

## 4. Full System Rollback

### 4.1 When Full Rollback Is Needed

Full system rollback is required when:
- Database migration + application change are coupled and cannot be reverted independently
- Security incident requires rolling back all systems to a known-good state
- DR failover from primary to secondary region

### 4.2 Full Rollback Procedure

```powershell
# ====== FULL SYSTEM ROLLBACK ======
# RTO Target: < 30 minutes
# RPO Target: < 5 minutes (data loss)

# ---- PHASE 1: Stop Traffic (0-2 min) ----
# Switch Cloudflare to maintenance page
curl.exe -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/always_online" `
  -H "Authorization: Bearer $CF_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"id":"always_online","value":"on"}'

# OR: Update ALB default action to return maintenance page
aws elbv2 modify-listener `
  --listener-arn arn:aws:elasticloadbalancing:me-south-1:123456789012:listener/app/almokhtaber-alb/xxxxx `
  --default-actions Type=fixed-response,FixedResponseConfig={StatusCode=503,ContentType=text/html,MessageBody="<html><body><h1>Maintenance in progress. Please check back shortly.</h1></body></html>"} `
  --profile almokhtaber-prod

# ---- PHASE 2: Restore Database (2-15 min) ----
# Restore RDS from most recent snapshot
$LATEST_SNAPSHOT = aws rds describe-db-snapshots `
  --db-instance-identifier almokhtaber-pg-prod `
  --snapshot-type automated `
  --query "sort_by(DBSnapshots, &SnapshotCreateTime)[-1].DBSnapshotIdentifier" `
  --output text `
  --profile almokhtaber-prod

aws rds restore-db-instance-from-db-snapshot `
  --db-instance-identifier almokhtaber-pg-restored `
  --db-snapshot-identifier $LATEST_SNAPSHOT `
  --db-instance-class db.r6g.large `
  --vpc-security-group-ids sg-xxxxx `
  --db-subnet-group-name almokhtaber-data-subnet-group `
  --profile almokhtaber-prod

aws rds wait db-instance-available --db-instance-identifier almokhtaber-pg-restored --profile almokhtaber-prod

# Restore ElastiCache Redis (if needed)
aws elasticache restore-from-snapshot `
  --replication-group-id almokhtaber-redis-restored `
  --snapshot-name automatic.almokhtaber-redis-prod-2026-07-30-06-00 `
  --profile almokhtaber-prod

# ---- PHASE 3: Deploy Previous Application (15-20 min) ----
# Identify previous stable Helm revision
helm history almokhtaber -n almokhtaber
# Find the revision # of last known-good deployment

# Rollback Helm release
helm rollback almokhtaber <stable-revision> -n almokhtaber --wait --timeout 5m0s

# Update database connection string
kubectl set env deployment/backend -n almokhtaber DATABASE_URL="postgresql://almokhtaber_admin:xxxx@almokhtaber-pg-restored.xxxxx.me-south-1.rds.amazonaws.com:5432/almokhtaber_prod"

# Restart pods to pick up new env
kubectl rollout restart deployment -n almokhtaber

# ---- PHASE 4: Verify (20-25 min) ----
# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -n almokhtaber -l app=backend --timeout=300s
kubectl wait --for=condition=ready pod -n almokhtaber -l app=web --timeout=300s

# Health check
curl -s "https://api.almokhtabar.sa/health" | ConvertFrom-Json

# Data verification
psql -h $RESTORED_ENDPOINT -U almokhtaber_admin -d almokhtaber_prod -c "SELECT COUNT(*) AS user_count FROM users;"

# ---- PHASE 5: Restore Traffic (25-30 min) ----
# Update ALB to point back to the normal target group
# OR: Update Cloudflare to remove maintenance page
# OR: Switch service selector back to the rollback version

# Remove maintenance page
aws elbv2 modify-listener `
  --listener-arn arn:aws:elasticloadbalancing:me-south-1:123456789012:listener/app/almokhtaber-alb/xxxxx `
  --default-actions Type=forward,ForwardConfig={TargetGroups=[{TargetGroupArn=arn:aws:elasticloadbalancing:me-south-1:123456789012:targetgroup/almokhtaber-ingress}]} `
  --profile almokhtaber-prod

# ---- PHASE 6: Post-Restoration (30+ min) ----
# Run data consistency checks
# Notify stakeholders
# Schedule post-mortem
```

### 4.3 DR Failover Rollback

```powershell
# ====== DR FAILOVER TO AZURE ======
# Use this when AWS primary region is unavailable

# Step 1: Update Traffic Manager/Azure DNS
# Primary: azure (was aws)
# Priority: 1 = Azure, 2 = AWS (when AWS comes back)

# Step 2: Promote Azure PostgreSQL to read-write
az postgres flexible-server promote `
  --resource-group almokhtaber-dr-rg `
  --name almokhtaber-pg-dr `
  --promote-mode geo-replication

# Step 3: Scale up AKS cluster
az aks scale `
  --resource-group almokhtaber-dr-rg `
  --name almokhtaber-aks-dr `
  --node-count 6

# Step 4: Deploy to AKS (using same Helm chart, different values)
helm upgrade --install almokhtaber ./infrastructure/kubernetes/helm/almokhtaber `
  --namespace almokhtaber `
  --values ./infrastructure/kubernetes/helm/values-dr.yaml `
  --set global.environment=dr `
  --set global.databaseUrl="postgresql://almokhtaber_admin:xxx@almokhtaber-pg-dr.postgres.database.azure.com:5432/almokhtaber_prod" `
  --wait --timeout 10m0s

# Step 5: Verify DR site
curl -s "https://dr.almokhtabar.sa/health" | ConvertFrom-Json

# Step 6: Failback to AWS when recovered
# Repromote AWS RDS as primary
# Update DNS back to AWS
# Verify data sync
```

---

## 5. Emergency Procedures

### 5.1 Incident Severity Definitions

| Severity | Description | Response Time | Example |
|----------|-------------|--------------|---------|
| **SEV1** | Critical - System down or data loss | 15 min | Production unavailable, payment failures, data corruption |
| **SEV2** | High - Major feature degraded | 30 min | Search down, slow page loads, login issues |
| **SEV3** | Medium - Minor feature affected | 4 hours | Incorrect translation, non-critical UI bug |
| **SEV4** | Low - Cosmetic issue | 24 hours | Styling issue, typo |

### 5.2 On-Call Escalation Matrix

```
                            ┌─────────────────┐
                            │  End User Report │
                            └────────┬────────┘
                                     │
                            ┌────────┴────────┐
                            │  Tier 1 Support  │
                            │  (5 min triage) │
                            └────────┬────────┘
                                     │
                         ┌───────────┴───────────┐
                         │  Can resolve?         │
                    ┌────┴────┐            ┌──────┴─────┐
                    │   Yes   │            │    No      │
                    └────┬────┘            └──────┬─────┘
                         │                        │
                  ┌──────┴──────┐       ┌─────────┴──────────┐
                  │  Resolve &  │       │  Tier 2 - DevOps   │
                  │  Close      │       │  On-call SRE       │
                  └─────────────┘       │  (15 min response) │
                                        └─────────┬──────────┘
                                                   │
                                         ┌─────────┴──────────┐
                                         │  Can resolve?      │
                                    ┌────┴────┐         ┌─────┴─────┐
                                    │   Yes   │         │    No     │
                                    └────┬────┘         └─────┬─────┘
                                         │                     │
                                  ┌──────┴──────┐    ┌─────────┴──────────┐
                                  │  Resolve &  │    │  Tier 3 - Team    │
                                  │  Close      │    │  Lead / Engineer  │
                                  └─────────────┘    │  (30 min response)│
                                                     └─────────┬──────────┘
                                                               │
                                                     ┌─────────┴──────────┐
                                                     │  Tier 4 - CTO      │
                                                     │  (1 hour response) │
                                                     └────────────────────┘
```

### 5.3 Escalation Contacts

| Role | Name | Phone | Email | Alternative |
|------|------|-------|-------|-------------|
| DevOps On-Call | (rotating) | +966 5X XXX XXXX | oncall@almokhtabar.sa | Slack @sre-oncall |
| DevOps Lead | Ahmed Al-Zahrani | +966 5X XXX XXXX | a.zahrani@almokhtabar.sa | WhatsApp |
| Backend Lead | Sara Al-Saud | +966 5X XXX XXXX | s.alsaud@almokhtabar.sa | WhatsApp |
| Security Officer | Faisal Al-Qahtani | +966 5X XXX XXXX | f.alqahtani@almokhtabar.sa | WhatsApp |
| Database Admin | Khaled Al-Otaibi | +966 5X XXX XXXX | k.alotaibi@almokhtabar.sa | WhatsApp |
| CTO | Marwan Al-Abdulkarim | +966 5X XXX XXXX | m.alabdulkarim@almokhtabar.sa | Phone |

### 5.4 Communication Templates

#### SEV1 Incident - Initial Communication

```
SUBJECT: [SEV1] Production Outage - <brief description>

CURRENT STATUS: INVESTIGATING / MITIGATING / RESOLVED / MONITORING

IMPACT:
- Service: <which service is affected>
- Users affected: <estimated count or percentage>
- Region: <KSA/all regions>
- Start time: <UTC timestamp>

DESCRIPTION:
<2-3 sentence description of the issue>

CURRENT ACTIONS:
<what the team is doing right now>

TIMELINE:
- <UTC timestamp>: Issue detected via <monitoring/alert/user report>
- <UTC timestamp>: <next action taken>

NEXT UPDATE: <time in 30 min or when status changes>

ESCALATION:
- Incident Commander: <name>
- Communication Lead: <name>
```

#### SEV1 Incident - Resolution

```
SUBJECT: [SEV1 RESOLVED] <incident name> - Post-mortem scheduled

RESOLUTION TIME: <UTC timestamp>
DURATION: <total minutes>

ROOT CAUSE:
<2-3 sentences>

FIX APPLIED:
<what was done to resolve>

DATA LOSS: <yes/no> - <details if yes>

AFFECTED USERS: <count or percentage>

POST-MORTEM:
- Date: <YYYY-MM-DD, +48 hours from resolution>
- Attendees: <list>
- Action items will be tracked in <Jira link>
```

### 5.5 Post-Mortem Process

```markdown
# Post-Mortem Template

## Incident Summary
- Date: YYYY-MM-DD
- Duration: HH:MM
- Severity: SEV1/SEV2
- Services affected: [list]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Issue detected |
| HH:MM | Initial investigation |
| HH:MM | Decision to rollback |
| HH:MM | Rollback initiated |
| HH:MM | Service restored |

## Root Cause Analysis
- What happened:
- Why it happened:
- Why it wasn't caught:
- Why it got to production:

## Impact
- User impact:
- Business impact:
- Data loss (if any):
- Financial impact:

## Action Items
| # | Action | Owner | Severity | Due Date | Status |
|---|--------|-------|----------|----------|--------|
| 1 | Add automated test for this scenario | | P0 | | [ ] |
| 2 | Improve monitoring for this metric | | P1 | | [ ] |
| 3 | Add canary deployment step | | P1 | | [ ] |

## Lessons Learned
- What went well:
- What went wrong:
- What can be improved:

## Appendices
- Links to dashboards/logs:
- Links to relevant PRs:
- Chat transcripts:
```

---

## 6. Rollback Automation

### 6.1 Automated Rollback Script

`infrastructure/scripts/deploy/rollback.sh`:

```bash
#!/bin/bash
# ============================================================
# Al Mokhtabar Rollback Script
# Usage: ./rollback.sh [--helm-revision N] [--traffic-only] [--db-restore] [--full]
# ============================================================

set -euo pipefail

NAMESPACE="almokhtaber"
RELEASE="almokhtaber"
HELM_REVISION=""
MODE=""
TIMEOUT="300"
REGION="me-south-1"
CLUSTER="almokhtaber-eks-prod"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --helm-revision) HELM_REVISION="$2"; shift 2 ;;
    --traffic-only) MODE="traffic"; shift ;;
    --db-restore) MODE="db"; shift ;;
    --full) MODE="full"; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --release) RELEASE="$2"; shift 2 ;;
    --cluster) CLUSTER="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --help)
      echo "Usage: ./rollback.sh [options]"
      echo "  --helm-revision N  Rollback to Helm revision N"
      echo "  --traffic-only     Switch traffic to previous version (blue-green)"
      echo "  --db-restore       Restore database from latest snapshot"
      echo "  --full             Full system rollback (DB + app + traffic)"
      echo "  --timeout N        Timeout in seconds (default: 300)"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Validate prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "kubectl required"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm required"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "aws cli required"; exit 1; }

echo "================================================"
echo "  Al Mokhtabar Rollback Script"
echo "  Mode: ${MODE:-auto}"
echo "  Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================"

rollback_helm() {
  local revision=$1
  echo "[*] Rolling back Helm release '$RELEASE' to revision $revision..."
  helm rollback "$RELEASE" "$revision" -n "$NAMESPACE" --wait --timeout "${TIMEOUT}s"
  echo "[+] Helm rollback successful"

  echo "[*] Waiting for all pods to be ready..."
  kubectl wait --for=condition=ready pod -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE" --timeout="${TIMEOUT}s"
  echo "[+] All pods ready"
}

rollback_traffic() {
  local previous_version
  previous_version=$(kubectl get deployment -n "$NAMESPACE" -l "app=backend" -o jsonpath='{.items[-1].metadata.labels.version}' 2>/dev/null || echo "")

  if [[ -z "$previous_version" ]]; then
    echo "[!] Could not determine previous version, falling back to Helm rollback"
    rollback_helm "$(helm history "$RELEASE" -n "$NAMESPACE" -o json | jq '.[-2].revision')"
    return
  fi

  echo "[*] Switching traffic to version: $previous_version"
  kubectl patch svc backend-service -n "$NAMESPACE" -p "{\"spec\":{\"selector\":{\"version\":\"$previous_version\"}}}"
  echo "[+] Traffic switched"

  sleep 10

  # Verify health
  if curl -sf "https://api.almokhtabar.sa/health" > /dev/null 2>&1; then
    echo "[+] Health check passed"
  else
    echo "[!] Health check failed after traffic switch"
    return 1
  fi
}

rollback_db() {
  echo "[*] Finding latest automated RDS snapshot..."
  local snapshot
  snapshot=$(aws rds describe-db-snapshots \
    --db-instance-identifier "almokhtaber-pg-prod" \
    --snapshot-type automated \
    --query "sort_by(DBSnapshots, &SnapshotCreateTime)[-1].DBSnapshotIdentifier" \
    --output text \
    --profile almokhtaber-prod)

  echo "[*] Restoring snapshot: $snapshot"
  aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier "almokhtaber-pg-rollback" \
    --db-snapshot-identifier "$snapshot" \
    --db-instance-class "db.r6g.large" \
    --vpc-security-group-ids "sg-xxxxx" \
    --db-subnet-group-name "almokhtaber-data-subnet-group" \
    --profile almokhtaber-prod

  echo "[*] Waiting for restore to complete..."
  aws rds wait db-instance-available \
    --db-instance-identifier "almokhtaber-pg-rollback" \
    --profile almokhtaber-prod

  echo "[+] Database restored"

  # Update application to point to restored DB
  local endpoint
  endpoint=$(aws rds describe-db-instances \
    --db-instance-identifier "almokhtaber-pg-rollback" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text \
    --profile almokhtaber-prod)

  kubectl set env deployment/backend -n "$NAMESPACE" "DATABASE_HOST=$endpoint"
  kubectl rollout restart deployment -n "$NAMESPACE"
  echo "[+] Application updated to use restored database"
}

# Execute based on mode
case $MODE in
  traffic)
    rollback_traffic ;;
  db)
    rollback_db ;;
  full)
    rollback_db
    if [[ -n "$HELM_REVISION" ]]; then
      rollback_helm "$HELM_REVISION"
    else
      rollback_traffic
    fi
    ;;
  *)
    if [[ -n "$HELM_REVISION" ]]; then
      rollback_helm "$HELM_REVISION"
    else
      echo "[!] No mode specified and no revision given"
      echo "    Usage: ./rollback.sh --helm-revision N"
      echo "       or: ./rollback.sh --traffic-only"
      echo "       or: ./rollback.sh --full [--helm-revision N]"
      exit 1
    fi
    ;;
esac

echo "================================================"
echo "  Rollback completed successfully"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================"
```

### 6.2 CI/CD Automatic Rollback Trigger

```yaml
# .github/workflows/deploy-prod.yml (partial - canary section)
deploy-canary:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy canary (20% traffic)
      run: |
        helm upgrade --install almokhtaber-canary ./infrastructure/kubernetes/helm/almokhtaber \
          --namespace almokhtaber \
          --values ./infrastructure/kubernetes/helm/values-production.yaml \
          --set global.deployTag=${{ github.sha }} \
          --set canary.enabled=true \
          --set canary.trafficWeight=20

    - name: Wait for stability (5 min observation)
      run: sleep 300

    - name: Evaluate canary health
      id: evaluate
      run: |
        # Check error rate (should be < 1%)
        ERROR_RATE=$(curl -s "http://prometheus.monitoring:9090/api/v1/query" \
          --data-urlencode "query=sum(rate(http_requests_total{app='backend',version='canary',status=~'5..'}[5m])) / sum(rate(http_requests_total{app='backend',version='canary'}[5m]))" \
          | jq -r '.data.result[0].value[1] // "0"')

        # Check latency (should be < 2s p95)
        P95_LATENCY=$(curl -s "http://prometheus.monitoring:9090/api/v1/query" \
          --data-urlencode "query=histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{app='backend',version='canary'}[5m])) by (le))" \
          | jq -r '.data.result[0].value[1] // "0"')

        echo "Error rate: $ERROR_RATE"
        echo "P95 latency: $P95_LATENCY"

        if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
          echo "status=failure" >> $GITHUB_OUTPUT
          echo "reason=High error rate: $ERROR_RATE"
          exit 1
        fi

        if (( $(echo "$P95_LATENCY > 2.0" | bc -l) )); then
          echo "status=failure" >> $GITHUB_OUTPUT
          echo "reason=High latency: ${P95_LATENCY}s"
          exit 1
        fi

        echo "status=success" >> $GITHUB_OUTPUT

    - name: Automatic rollback on canary failure
      if: steps.evaluate.outputs.status == 'failure'
      run: |
        echo "Canary evaluation failed. Triggering automatic rollback..."
        # The canary was deployed under a different name; just scale down
        helm delete almokhtaber-canary -n almokhtaber

    - name: Promote canary to full traffic
      if: steps.evaluate.outputs.status == 'success'
      run: |
        echo "Canary healthy. Promoting to full traffic..."
        helm upgrade --install almokhtaber ./infrastructure/kubernetes/helm/almokhtaber \
          --namespace almokhtaber \
          --values ./infrastructure/kubernetes/helm/values-production.yaml \
          --set global.deployTag=${{ github.sha }} \
          --set canary.enabled=false \
          --wait --timeout 10m0s
```

### 6.3 Health Check Watchdog

```python
# infrastructure/scripts/deploy/health_watchdog.py
# Deploy as a sidecar or cronjob to monitor and auto-rollback

import requests
import time
import os
import sys
import subprocess

HEALTH_URL = os.getenv("HEALTH_URL", "https://api.almokhtabar.sa/health")
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "15"))  # seconds
FAILURE_THRESHOLD = int(os.getenv("FAILURE_THRESHOLD", "4"))  # consecutive failures
ROLLBACK_REVISION = os.getenv("ROLLBACK_REVISION", "")

def check_health():
    try:
        resp = requests.get(HEALTH_URL, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "healthy":
                return True
        return False
    except requests.RequestException:
        return False

def execute_rollback():
    print("Health check failed. Initiating automatic rollback...")
    cmd = [
        "helm", "rollback", "almokhtaber", ROLLBACK_REVISION,
        "-n", "almokhtaber", "--wait", "--timeout", "5m0s"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"Rollback failed: {result.stderr}")
        sys.exit(1)

def main():
    failures = 0

    while True:
        if check_health():
            failures = 0
            print(f"[{time.strftime('%H:%M:%S')}] Health OK")
        else:
            failures += 1
            print(f"[{time.strftime('%H:%M:%S')}] Health FAIL ({failures}/{FAILURE_THRESHOLD})")

            if failures >= FAILURE_THRESHOLD:
                print("Threshold reached! Triggering rollback...")
                execute_rollback()
                break

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
```

---

## 7. RTO/RPO Targets

### 7.1 Recovery Targets by Scenario

| Scenario | RTO Target | RPO Target | Method |
|----------|-----------|------------|--------|
| Bad application deployment | < 2 min | 0 (no data loss) | Blue-green traffic switch |
| Bad configuration change | < 5 min | 0 | Helm rollback |
| Database migration failure | < 15 min | < 5 min | Restore from snapshot |
| Data corruption | < 30 min | < 5 min | PITR restore |
| Single AZ failure | < 1 min | 0 | Multi-AZ automatic failover |
| Full AWS region failure | < 30 min | < 15 min | DR failover to Azure |
| Security breach | < 60 min | < 30 min | Full system restore |
| Accidental data deletion | < 60 min | < 24 hours | Point-in-time recovery |

### 7.2 Measured Recovery Times

| Date | Scenario | Measured RTO | Measured RPO | Notes |
|------|----------|-------------|-------------|-------|
| 2026-07-01 | Helm rollback (revision +1) | 45s | 0 | Tested in staging |
| 2026-07-05 | Traffic switch rollback | 12s | 0 | Endpoint switch is instant |
| 2026-07-10 | RDS snapshot restore | 12m 30s | < 5 min | 500GB database |
| 2026-07-15 | Full region failover to Azure | 22m 15s | 12m | Includes DNS propagation |
| 2026-07-20 | PITR restore (15 min ago) | 18m 45s | < 15 min | |

### 7.3 Improvement Plan

| Quarter | Goal | Target RTO | Target RPO |
|---------|------|-----------|------------|
| Q3 2026 | Implement blue-green with instant switch | 10s | 0 |
| Q3 2026 | RDS snapshot restore automation | 10 min | 5 min |
| Q4 2026 | Cross-region RDS read replica promotion | 5 min | 1 min |
| Q4 2026 | Automated canary with rollback | 30s | 0 |
| Q1 2027 | Multi-region active-active | 0 | 0 |

---

*End of Rollback Strategy Document. For questions contact devops@almokhtabar.sa*
