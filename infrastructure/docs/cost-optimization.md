# Al Mokhtabar Laboratory Platform - Cost Optimization Guide

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Owner**: DevOps Team

---

## Table of Contents

1. [Compute Optimization](#1-compute-optimization)
2. [Storage Optimization](#2-storage-optimization)
3. [Data Transfer Optimization](#3-data-transfer-optimization)
4. [Monitoring Cost Optimization](#4-monitoring-cost-optimization)
5. [Database Cost Optimization](#5-database-cost-optimization)
6. [Network Cost Optimization](#6-network-cost-optimization)
7. [Monthly Cost Estimates](#7-monthly-cost-estimates)
8. [Savings Plan](#8-savings-plan)
9. [Cost Monitoring & Alerts](#9-cost-monitoring--alerts)

---

## 1. Compute Optimization

### 1.1 EKS Spot Instances

| Node Group | Instance Type | On-Demand Price/hr | Spot Price/hr | Savings | Min Nodes | Max Nodes |
|-----------|--------------|-------------------|---------------|---------|-----------|-----------|
| System (always on-demand) | t3.medium | .0416 | N/A | N/A | 2 | 3 |
| Workers (spot) | m6i.large | .096 | ~.0288 | ~70% | 3 | 10 |
| Workers (spot) | c6i.large | .086 | ~.0258 | ~70% | 2 | 8 |
| AI/ML (spot with PVD) | g5.xlarge | .006 | ~.302 | ~70% | 0 | 4 |
| **Subtotal (spot)** | | **.19/hr** | **~.36/hr** | **~70%** | | |

**Spot Interruption Handling:**
- Deploy aws-node-termination-handler DaemonSet
- Use 	opologySpreadConstraints to spread pods across spot pools
- Configure PodDisruptionBudget with maxUnavailable=1

### 1.2 RDS Reserved Instances

| Instance | On-Demand/hr | 1yr Partial | 1yr All-Upfront | 3yr Partial | 3yr All-Upfront |
|---------|-------------|-------------|-----------------|-------------|-----------------|
| db.r6g.large (prod) | .246 | .156 (-37%) | .138 (-44%) | .108 (-56%) | .098 (-60%) |
| db.r6g.xlarge (replica) | .492 | .312 (-37%) | .276 (-44%) | .216 (-56%) | .196 (-60%) |
| cache.r6g.large | .185 | .117 (-37%) | .104 (-44%) | .081 (-56%) | .074 (-60%) |

### 1.3 Dev/Staging Cost Savings

Dev/Staging Monthly Cost with Shutdown:
- Running 24/7: /month
- Running 10hr/day, 5 days/week: ~/month
- Annual savings: ~,324

### 1.4 Autoscaling Configuration

Backend HPA:
- minReplicas: 3, maxReplicas: 15
- CPU target: 70%, Memory target: 80%
- Scale-down stabilization: 5 min
- Scale-up: immediate, up to 100% per 15s

### 1.5 Cluster Autoscaler Hard Limits

- Workers spot: min=3, max=10 nodes
- AI spot: min=0, max=4 nodes (GPU cost control)

---

## 2. Storage Optimization

### 2.1 S3 Lifecycle Policies

| Rule | Prefix | Transition | Expiration |
|------|--------|-----------|------------|
| IA transition | lab-results/ | Standard -> IA (30d) | - |
| Glacier transition | lab-results/ | IA -> Glacier (90d) | - |
| Deep Archive | lab-results/ | Glacier -> Deep Archive (365d) | - |
| Deletion | lab-results/ | - | Delete after 2555d (7yr) |
| Temp cleanup | temp/ | - | Delete after 7d |

**Monthly Cost Comparison (100GB uploads):**
| Storage Class | $/GB/mo | 100GB Cost | Retrieval Cost |
|--------------|---------|-----------|---------------|
| S3 Standard | .023 | .30 | Free |
| S3 Intelligent-Tiering | .023/.0125 | .78 avg | Free |
| S3 Standard-IA | .0125 | .25 | .01/GB |
| S3 Glacier Instant | .004 | .40 | .03/GB |
| S3 Glacier Deep Archive | .00099 | .10 | .09/GB |

### 2.2 EBS Volume Optimization

- Use gp3 instead of gp2 (20% cheaper: .08/GB vs .10/GB)
- gp3 includes 3000 IOPS and 125 MB/s baseline (no extra cost)
- Enable EBS encryption by default

### 2.3 EFS Infrequent Access

- EFS Standard: .30/GB/mo
- EFS IA: .025/GB/mo (92% savings for infrequent access)
- Policy: transition_to_ia after 30 days, transition_to_primary after 1 access

### 2.4 RDS Storage Optimization

- Start with 200GB allocated, auto-scale up to 1TB
- Use gp3 storage (not io1 - 80% cheaper)
- PostgreSQL TOAST compression enabled by default in PG16

---

## 3. Data Transfer Optimization

### 3.1 Cloudflare vs CloudFront

**Correct Strategy:**
- Cloudflare CDN (Pro plan): /mo, unlimited bandwidth
- Direct ALB-to-internet: only for uncached API responses (~/mo for 10TB)
- Avoid CloudFront: /mo for 10TB (more expensive than ALB direct)
- S3 presigned URLs for client uploads (free data transfer in)

**Savings: ~/mo vs CloudFront approach**

### 3.2 API Response Compression

- Brotli level 4: ~75% bandwidth reduction
- Gzip level 4 as fallback
- Compress: JSON, HTML, CSS, JS
- Proxy body size limit: 10MB

### 3.3 Multi-AZ Traffic Optimization

- Keep pods and DB in same AZ when possible (free intra-AZ traffic)
- Use topology spread to minimize cross-AZ traffic
- Read replicas in same AZ as consuming service
- Estimated cross-AZ cost: ~/mo

---

## 4. Monitoring Cost Optimization

### 4.1 Prometheus Retention

- Hot data retention: 15 days (fast query)
- Retention size limit: 50GB
- Thanos/Cortex: disabled (cost saving for current scale)
- Estimated: ~/mo for EBS volume

### 4.2 CloudWatch Logs Retention

- Set retention to 30 days on ALL log groups
- 30 day retention: ~/mo
- Infinite retention: ~/mo+
- Automatic application via AWS CLI/CloudFormation

### 4.3 ELK Index Lifecycle

| Phase | Duration | Action | Storage Class |
|-------|----------|--------|---------------|
| Hot | 0-7 days | Rollover at 50GB | SSD |
| Warm | 7-30 days | Migrate to warm nodes | HDD |
| Cold | 30-90 days | Freeze index | HDD (searchable) |
| Delete | 90+ days | Delete | - |

### 4.4 APM Sampling

- OpenTelemetry Collector: 10% probabilistic sampling
- Head-based sampling (trace integrity preserved)
- Datadog APM: based on ingested spans (pay per GB)
- Estimated APM cost at 10% sampling: ~/mo vs ,000/mo at 100%

---

## 5. Database Cost Optimization

### 5.1 Connection Pooling

- RDS Proxy: reduces connection overhead (~/mo)
- Without proxy: each pod maintains 5-10 connections (40 pods = 200-400 connections)
- With proxy: multiplexes connections, reducing RDS load
- RDS Proxy cost: ~/mo (well worth it vs RDS upgrade)

### 5.2 Read Replicas for Analytics

- Analytics/reporting queries go to read replica
- Keeps primary CPU low (avoids scaling up)
- db.r6g.large replica: ~/mo on-demand, ~/mo reserved

### 5.3 Archive Old Data

- Partition tables by date (monthly)
- pg_partman for automatic partition management
- Move partitions older than 2 years to S3 via pg_parquet
- Query archived data via AWS S3 Select / Athena

### 5.4 Unused Index Management

`sql
-- Find unused indexes
SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  idx_scan AS scans,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan < 100
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
`
- Each unused index costs write overhead + storage
- Estimated savings: -50/mo by dropping unused indexes

### 5.5 Vacuum Tuning

`sql
-- Auto-vacuum production settings
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '1min';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 1000;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.01;
`
- Prevents bloat which wastes storage ()
- Regular vacuum = consistent performance = no need to scale up

---

## 6. Network Cost Optimization

### 6.1 NAT Gateway

- Single-AZ NAT Gateway: ~/mo + .045/GB data
- Multi-AZ NAT Gateway: ~/mo + .045/GB data
- Use single-AZ for dev, multi-AZ for prod only
- Estimated NAT cost: /mo (prod)

### 6.2 VPC Endpoints

| Endpoint | Type | Cost/mo | Savings |
|----------|------|---------|---------|
| S3 Gateway | Gateway |  | NAT + data transfer |
| DynamoDB Gateway | Gateway |  | NAT + data transfer |
| ECR Interface | Interface | ~/mo per AZ | Data stays in VPC |
| CloudWatch Interface | Interface | ~/mo per AZ | Data stays in VPC |
| SSM Interface | Interface | ~/mo per AZ | No NAT needed |

- Gateway endpoints are FREE (no hourly charge)
- Interface endpoints: ~/mo per AZ per endpoint, plus .01/GB data

### 6.3 Direct Connect / VPN

- Site-to-Site VPN: ~/mo (virtual private gateway)
- Direct Connect: min /mo (1Gbps)
- Recommendation: VPN for initial setup, Direct Connect for > 500GB/mo hybrid traffic

---

## 7. Monthly Cost Estimates

### 7.1 Production Environment (On-Demand Pricing)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| **Compute (EKS)** | | |
| System nodes | 2 x t3.medium on-demand |  |
| Worker nodes | 5 x m6i.large spot (avg) |  |
| GPU nodes | 1 x g5.xlarge spot (avg) |  |
| EKS control plane | Per cluster |  |
| | _Compute subtotal_ | **** |
| **Database** | | |
| RDS PostgreSQL prod | db.r6g.large Multi-AZ |  |
| RDS read replica | db.r6g.large single-AZ |  |
| RDS Proxy | Per instance |  |
| ElastiCache Redis | cache.r6g.large Multi-AZ |  |
| | _Database subtotal_ | **** |
| **Storage** | | |
| EBS (MeiliSearch + other) | 200GB gp3 |  |
| EFS (persistent) | 100GB Standard + IA |  |
| S3 (uploads + backups) | 500GB total (avg tier) |  |
| | _Storage subtotal_ | **** |
| **Networking** | | |
| NAT Gateway | Single-AZ |  |
| NAT data processing | ~500GB |  |
| ALB | Per month + data |  |
| Data transfer out | ~5TB/month |  |
| VPC endpoints | 3 interfaces x 2 AZ |  |
| | _Network subtotal_ | **** |
| **Monitoring** | | |
| Prometheus/Grafana | On EBS (50GB) |  |
| CloudWatch Logs | 30-day retention |  |
| CloudWatch Metrics | Custom + detailed |  |
| Sentry | Team plan |  |
| | _Monitoring subtotal_ | **** |
| **Third Party** | | |
| Cloudflare Pro | Per domain |  |
| Twilio SMS | ~10,000 OTPs/mo |  |
| WhatsApp Cloud API | Per 1000 conversations |  |
| Auth0 | Professional plan |  |
| Datadog APM | 10% sampling |  |
| PagerDuty | Team plan |  |
| GitHub Team | Per user |  |
| HashiCorp Cloud | Terraform + Vault |  |
| | _Third party subtotal_ | **** |
| **TOTAL PRODUCTION** | | **,391** |

### 7.2 DR Environment (Azure - Standby)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| AKS cluster | 2 x D2s_v3 (minimum) |  |
| Azure PostgreSQL | Flexible Server, Geo-redundant |  |
| Azure Redis Cache | Premium 1GB |  |
| Azure DNS | Primary zone |  |
| Azure Blob Storage | RA-GRS, 100GB |  |
| | **TOTAL DR** | **** |

### 7.3 GCP AI/ML Environment

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| GKE GPU node | 1 x g2-standard-4 (T4 GPU) |  |
| Cloud SQL replica | db-perf-optimized-2, 100GB |  |
| Vertex AI training | 20 hours/month |  |
| BigQuery | 500GB processed |  |
| | **TOTAL GCP** | **** |

### 7.4 Total Monthly Cost Summary

| Environment | On-Demand | With Reserved (3yr all-upfront) | With Spot + Reserved + Lifecycle |
|------------|-----------|-------------------------------|----------------------------------|
| Production (AWS) | ,391 | ,750 | ,450 |
| DR (Azure standby) |  |  |  |
| AI/ML (GCP) |  |  |  |
| **TOTAL** | **,614** | **,700** | **,400** |

---

## 8. Savings Plan

### 8.1 Quick Wins (Week 1)

| Action | Effort | Monthly Savings | Annual Savings |
|--------|--------|----------------|----------------|
| Set CloudWatch log retention to 30 days | 1 hour |  | ,240 |
| Enable S3 lifecycle policies | 2 hours |  |  |
| Right-size dev/staging with shutdown schedule | 2 hours |  | ,324 |
| Remove unused EBS volumes | 1 hour |  |  |
| **Total quick wins** | **6 hours** | **** | **,524** |

### 8.2 Medium-Term (Month 1-3)

| Action | Effort | Monthly Savings | Annual Savings |
|--------|--------|----------------|----------------|
| Purchase RDS reserved instances (3yr) | 1 day |  | ,400 |
| Purchase ElastiCache reserved instances (3yr) | 1 day |  |  |
| Enable spot instances for worker nodes | 1 week |  | ,000 |
| Implement HPA right-sizing | 1 week |  | ,200 |
| Switch EBS gp2 to gp3 | 2 hours |  |  |
| **Total medium-term** | | **** | **,680** |

### 8.3 Long-Term (Month 3-6)

| Action | Effort | Monthly Savings | Annual Savings |
|--------|--------|----------------|----------------|
| Implement cost allocation tags | 2 days |  (tracking) |  |
| Set up AWS Budgets + alerts | 1 day |  (prevention) |  |
| Remove unused indexes in PostgreSQL | 1 day |  |  |
| Archive old data to S3 | 1 week |  | ,200 |
| Enable S3 Intelligent-Tiering | 1 day |  |  |
| Implement VPC endpoints (reduce NAT) | 2 days |  |  |
| **Total long-term** | | **** | **,160** |

### 8.4 Total Potential Savings

| Phase | Monthly | Annual | Cumulative Monthly |
|-------|---------|--------|-------------------|
| Current (on-demand) | ,614 | ,368 | - |
| After quick wins | ,737 | ,844 |  |
| After medium-term | ,097 | ,164 | ,517 |
| After long-term | ,917 | ,004 | ,697 |
| **Target state** | **~,400** | **~,800** | **,214 savings** |

---

## 9. Cost Monitoring & Alerts

### 9.1 AWS Budgets

| Budget Name | Amount | Threshold | Action |
|-------------|--------|-----------|--------|
| almokhtaber-monthly | ,000 | 80% (,200) | Slack alert |
| almokhtaber-monthly | ,000 | 100% (,000) | PagerDuty alert |
| almokhtaber-ec2-monthly |  | 90% () | Email DevOps |
| almokhtaber-rds-monthly |  | 90% () | Email DevOps |
| almokhtaber-data-transfer |  | 80% () | Slack alert |

### 9.2 Cost Allocation Tags

`	ext
Required tags on ALL resources:
- Environment: production | staging | dev | dr
- Service: backend | web | ai-service | monitoring | database | network
- CostCenter: engineering | devops | compliance
- Owner: team-name | individual-name
- Terraform: true (if managed)
- AutoStop: true | false (for dev/staging)
`

### 9.3 Cost Monitoring Dashboard

Grafana dashboard "AWS Cost & Usage" includes:
- Daily cost by service (ECS, RDS, NAT, S3, Data Transfer)
- Daily cost by environment (prod, staging, dev)
- Month-to-date vs budget
- Forecast vs budget
- Spot savings vs on-demand equivalent
- Reserved instance coverage %
- Top 10 cost contributors
- Cost anomaly detection (sudden spikes)

### 9.4 Cost Anomaly Detection

`python
# AWS Cost Anomaly Detection
# Monitors for >20% daily cost increase vs 7-day rolling average

# Monitor scope:
# - AWS services: EC2, RDS, ElastiCache, NAT Gateway, Data Transfer
# - Linked accounts: production, staging, development
# - Alert frequency: daily (if anomaly detected)

# Actions:
# - Severity LOW (>20% increase): Slack #cost-alerts
# - Severity MEDIUM (>50% increase): Email devops@
# - Severity HIGH (>100% increase): PagerDuty + Slack @devops-lead
`

### 9.5 Monthly Cost Review Process

`	ext
Week 1: Automated cost report generated
Week 2: DevOps team reviews report
  - Compare actual vs budget
  - Investigate anomalies
  - Identify optimization opportunities
Week 3: Implement optimizations
Week 4: Report savings to CTO

Reports:
- AWS Cost Explorer (daily)
- Grafana cost dashboard (real-time)
- Monthly cost report (PDF via QuickSight)
- Quarterly savings report (to CTO)
`

---

*End of Cost Optimization Guide. For questions contact devops@almokhtabar.sa*
