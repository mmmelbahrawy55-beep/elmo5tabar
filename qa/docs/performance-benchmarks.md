# Performance Benchmarks

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | SRE / QA Engineering |

---

## 1. API Performance Benchmarks

### 1.1 Endpoint Latency Targets

| Endpoint | Method | p50 | p95 | p99 | Max |
|---|---|---|---|---|---|
| POST /api/v1/auth/login | POST | < 200ms | < 500ms | < 1000ms | 2000ms |
| POST /api/v1/auth/register | POST | < 300ms | < 800ms | < 1500ms | 3000ms |
| POST /api/v1/auth/refresh | POST | < 100ms | < 300ms | < 500ms | 1000ms |
| POST /api/v1/auth/forgot-password | POST | < 200ms | < 500ms | < 1000ms | 2000ms |
| GET /api/v1/appointments | GET | < 100ms | < 300ms | < 500ms | 1000ms |
| POST /api/v1/appointments | POST | < 200ms | < 500ms | < 1000ms | 2000ms |
| GET /api/v1/appointments/slots | GET | < 150ms | < 400ms | < 800ms | 1500ms |
| GET /api/v1/results | GET | < 100ms | < 300ms | < 500ms | 1000ms |
| GET /api/v1/results/:id | GET | < 100ms | < 300ms | < 500ms | 1000ms |
| GET /api/v1/results/:id/pdf | GET | < 500ms | < 1000ms | < 2000ms | 3000ms |
| POST /api/v1/payments/charge | POST | < 500ms | < 1000ms | < 2000ms | 3000ms |
| GET /api/v1/payments/history | GET | < 100ms | < 300ms | < 500ms | 1000ms |
| POST /api/v1/payments/refund | POST | < 500ms | < 1000ms | < 2000ms | 3000ms |
| GET /api/v1/branches | GET | < 50ms | < 150ms | < 300ms | 500ms |
| GET /api/v1/tests | GET | < 50ms | < 150ms | < 300ms | 500ms |
| GET /api/v1/notifications | GET | < 100ms | < 200ms | < 400ms | 800ms |
| POST /api/v1/notifications/send | POST | < 300ms | < 800ms | < 1500ms | 3000ms |
| GET /api/v1/patients/:id | GET | < 50ms | < 150ms | < 300ms | 500ms |
| POST /graphql | POST | < 200ms | < 500ms | < 1000ms | 2000ms |
| GET /api/v1/search | GET | < 100ms | < 200ms | < 400ms | 800ms |

### 1.2 Throughput Targets

| Module | Target RPS | Burst RPS | Scaling Strategy |
|---|---|---|---|
| Auth | 1,000 | 5,000 | Horizontal pod autoscaling (HPA) |
| Appointments | 500 | 2,000 | HPA + DB read replicas |
| Results | 300 | 1,000 | HPA + CDN for PDFs |
| Payments | 200 | 500 | HPA + queue-based processing |
| Notifications | 300 | 1,000 | Queue-based + worker pool |
| Search | 500 | 2,000 | Elasticsearch cluster |
| Branches | 800 | 3,000 | Cached (Redis, TTL 5min) |
| Tests Catalog | 800 | 3,000 | Cached (Redis, TTL 10min) |
| GraphQL | 400 | 1,500 | HPA + DataLoader |
| Webhook Receive | 500 | 3,000 | Queue immediately + ACK |

### 1.3 Error Rate Budget

| Status Code | Budget | Alert Threshold |
|---|---|---|
| 4xx (client errors) | < 5% of requests | > 8% |
| 5xx (server errors) | < 1% of requests | > 0.5% |
| Timeout (> SLO) | < 1% of requests | > 2% |
| Rate limited (429) | < 0.1% of requests | > 0.5% |

---

## 2. Database Benchmarks

### 2.1 Query Performance

| Query Category | p95 Target | Worst Allowed | Cache Strategy |
|---|---|---|---|
| Simple lookups (by PK) | < 10ms | < 50ms | Redis (TTL 5min) |
| List queries (with pagination) | < 30ms | < 100ms | Redis (TTL 2min) |
| Search queries (ILIKE/tsvector) | < 50ms | < 200ms | Elasticsearch |
| Aggregation queries (COUNT, SUM) | < 100ms | < 500ms | Materialized views (refresh 1h) |
| Join queries (3+ tables) | < 50ms | < 200ms | Denormalized where possible |
| Write operations (INSERT/UPDATE) | < 20ms | < 100ms | Write-behind cache |
| Transaction (2+ writes) | < 50ms | < 200ms | N/A |

### 2.2 Connection Pool

| Environment | Max Connections | Pool Size Per Instance | Wait Timeout |
|---|---|---|---|
| Production | 150 | 20 per pod (10 pods) | 5s |
| Staging | 50 | 10 per pod (5 pods) | 5s |
| Dev | 20 | 10 per pod (2 pods) | 10s |

### 2.3 Cache Performance

| Cache Layer | Hit Rate Target | Eviction Policy | Memory Limit |
|---|---|---|---|
| Redis (Session) | > 99% | allkeys-lru | 4 GB |
| Redis (Data Cache) | > 95% | allkeys-lru | 8 GB |
| Redis (Rate Limit) | N/A | volatile-ttl | 1 GB |
| CDN (Static Assets) | > 98% | LRU | N/A |
| CDN (PDF Reports) | > 80% | LRU | N/A |
| Browser Cache | > 90% | max-age headers | N/A |

### 2.4 Slow Query Thresholds

| Duration | Action |
|---|---|
| > 100ms | Logged as slow query in Datadog |
| > 500ms | Alert sent to #database-alerts Slack channel |
| > 1000ms | PagerDuty notification to SRE team |
| > 5000ms | Automatic query kill + incident creation |

---

## 3. Frontend Performance Benchmarks

### 3.1 Lighthouse Targets

| Category | Target | Minimum Acceptable | Measurement |
|---|---|---|---|
| Performance | 100 | 95 | Lighthouse CI |
| Accessibility | 100 | 95 | axe-core + Lighthouse |
| Best Practices | 100 | 95 | Lighthouse |
| SEO | 100 | 95 | Lighthouse |
| PWA | Pass all audits | Pass core audits | Lighthouse |

### 3.2 Core Web Vitals

| Metric | Target | Poor (needs fix) | Measurement Tool |
|---|---|---|---|
| FCP (First Contentful Paint) | < 1.5s | > 3.0s | Lighthouse / RUM |
| LCP (Largest Contentful Paint) | < 2.5s | > 4.0s | Lighthouse / RUM |
| FID (First Input Delay) | < 100ms | > 300ms | RUM (Datadog) |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 | Lighthouse / RUM |
| TBT (Total Blocking Time) | < 200ms | > 500ms | Lighthouse |
| SI (Speed Index) | < 3.0s | > 4.5s | Lighthouse |
| TTFB (Time to First Byte) | < 800ms | > 1800ms | Lighthouse / RUM |

### 3.3 Bundle Size Budgets

| Asset | Budget | Warning | Critical |
|---|---|---|---|
| Main JS bundle | < 150 KB (gzipped) | > 150 KB | > 250 KB |
| Vendor JS bundle | < 80 KB (gzipped) | > 80 KB | > 120 KB |
| CSS bundle | < 30 KB (gzipped) | > 30 KB | > 50 KB |
| Homepage HTML | < 20 KB (gzipped) | > 20 KB | > 40 KB |
| Font files | < 50 KB (all variants) | > 50 KB | > 100 KB |
| Hero image | < 100 KB (WebP) | > 100 KB | > 200 KB |
| Total page weight | < 500 KB | > 500 KB | > 1 MB |

### 3.4 Asset Optimization Requirements

| Asset Type | Requirement |
|---|---|
| Images | WebP format, srcset for responsive, lazy loading, preload LCP image |
| Fonts | WOFF2 format, display: swap, subset Arabic + Latin chars, preload critical fonts |
| JavaScript | Code splitting by route, dynamic import for heavy components, tree-shaking |
| CSS | PurgeCSS for unused styles, critical CSS inline for above-fold |
| Third-party | Defer non-critical, load async, self-host where possible |
| Animations | CSS animations preferred, will-change for GPU-accelerated, reduced-motion media query |

---

## 4. Concurrent User & Availability SLOs

### 4.1 Concurrency Targets

| Metric | Target | Measurement |
|---|---|---|
| Concurrent users (peak) | 10,000 | Datadog APM |
| Daily active users | 100,000 | Analytics |
| Requests per minute (peak) | 50,000 | Datadog APM |
| Active WebSocket connections | 5,000 | Datadog APM |
| Background job queue depth | < 1,000 (at any time) | RabbitMQ management |

### 4.2 Response Time SLOs

| User Facing | Target | Critical |
|---|---|---|
| Web page load (p95) | < 2.0s | > 4.0s |
| Web page load (p99) | < 3.0s | > 5.0s |
| API response (p95) | < 500ms | > 1000ms |
| API response (p99) | < 1000ms | > 2000ms |
| Search results (p95) | < 200ms | > 500ms |
| PDF generation (p95) | < 2.0s | > 5.0s |
| File upload (p95, 5MB) | < 5.0s | > 10.0s |
| Notification delivery (p95) | < 30s | > 60s |

### 4.3 Availability SLOs

| Service Level | Target | Monthly Allowable Downtime |
|---|---|---|
| Overall platform uptime | 99.95% | 21 minutes 54 seconds |
| API availability | 99.9% | 43 minutes 48 seconds |
| Payment processing | 99.99% | 4 minutes 22 seconds |
| Database availability | 99.995% | 2 minutes 11 seconds |
| CDN availability | 99.99% | 4 minutes 22 seconds |
| Notification delivery | 99.5% | 3 hours 39 minutes |

### 4.4 Error Budget Calculation

| SLO Target | Monthly Error Budget | Quarterly Error Budget | Annual Error Budget |
|---|---|---|---|
| 99.99% | 4m 22s | 13m 7s | 52m 34s |
| 99.95% | 21m 54s | 1h 5m | 4h 22m |
| 99.9% | 43m 48s | 2h 11m | 8h 45m |
| 99.5% | 3h 39m | 10h 58m | 43h 49m |

**Error Budget Policy:**
- When remaining error budget < 50%: deployments limited to once per day
- When remaining error budget < 25%: only hotfix deploys allowed
- When remaining error budget < 10%: all deploys frozen, incident review triggered
- When error budget exhausted: full incident post-mortem, process improvement required

---

## 5. Load Testing Scenarios

### 5.1 k6 Test Profiles

| Scenario | vUs | Duration | Ramp | Endpoints Tested |
|---|---|---|---|---|
| **Average Load** | 500 | 30m | 5m ramp-up | All critical APIs |
| **Peak Load** | 2,000 | 15m | 3m ramp-up | All critical APIs |
| **Stress Test** | 5,000 | 10m | 2m ramp-up | Login, appointments, results |
| **Spike Test** | 0 -> 3,000 | 30s spike | Instant | Login, search |
| **Soak Test** | 1,000 | 12 hours | 10m ramp-up | All critical APIs |
| **Endurance Test** | 500 | 48 hours | 10m ramp-up | Core read endpoints |

### 5.2 k6 Thresholds (All Scenarios)

```javascript
export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  http_reqs: ['rate>50'],          // minimum throughput
  iteration_duration: ['p(95)<2000'],
  checks: ['rate>0.99'],
};
```

### 5.3 Load Test Execution

| Phase | Pre-requisite | Approval |
|---|---|---|
| 1. Test script review | Script reviewed by QA + Dev | QA Lead |
| 2. Staging readiness | Staging environment scaled to production replica count | DevOps |
| 3. Baseline run | Run average load, record baseline metrics | QA Engineer |
| 4. Scenario execution | Execute all scenarios in order (avg -> peak -> stress -> spike) | QA Engineer |
| 5. Metrics analysis | Compare against baseline, identify regressions | QA + SRE |
| 6. Report generation | Generate HTML report, upload to S3 | CI Pipeline |

### 5.4 Load Test Artifacts

| Artifact | Format | Retention |
|---|---|---|
| k6 JSON metrics | JSON | 90 days |
| k6 HTML report | HTML | 90 days |
| Datadog dashboard snapshot | PNG | Indefinite |
| Grafana performance dashboard | Snapshot link | Indefinite |
| Comparison report vs. previous run | Markdown | Indefinite |

---

## 6. Performance Regression Thresholds

| Metric | Acceptable Regression | Investigate Immediately | Rollback Required |
|---|---|---|---|
| API p95 latency | < 5% increase | 5-15% increase | > 15% increase |
| API p99 latency | < 10% increase | 10-20% increase | > 20% increase |
| Error rate | < 0.5% increase | 0.5-2% increase | > 2% increase |
| Throughput (RPS) | < 5% decrease | 5-10% decrease | > 10% decrease |
| Lighthouse Performance | < 3 point drop | 3-5 point drop | > 5 point drop |
| LCP | < 100ms increase | 100-300ms increase | > 300ms increase |
| CLS | < 0.02 increase | 0.02-0.05 increase | > 0.05 increase |
| DB query p95 | < 10ms increase | 10-50ms increase | > 50ms increase |
| Cache hit rate | < 1% decrease | 1-3% decrease | > 3% decrease |

---

## 7. Monitoring & Alerting

### 7.1 Performance Alerts

| Alert Name | Condition | Severity | Notification |
|---|---|---|---|
| High API Latency (p95) | p95 > 500ms for 5 min | Warning | Slack #perf-alerts |
| Critical API Latency (p99) | p99 > 1000ms for 2 min | Critical | PagerDuty |
| High Error Rate | 5xx rate > 1% for 2 min | Critical | PagerDuty |
| Slow DB Queries | Slow query count > 10/min | Warning | Slack #database-alerts |
| Cache Hit Rate Drop | Hit rate < 90% for 5 min | Warning | Slack #perf-alerts |
| Lighthouse Regression | Any category drops below 90 | Critical | Slack #frontend-alerts |
| Service Degradation | Any endpoint p95 > 2x baseline | Critical | PagerDuty |

### 7.2 Performance Dashboard (Grafana)

The performance dashboard includes the following panels:

1. **API Latency Heatmap** - All endpoints, p50/p95/p99, colored by severity
2. **Throughput Overview** - RPS by module, with historical comparison
3. **Error Rate Timeline** - 4xx vs 5xx rates, stacked area chart
4. **Database Performance** - Query latency, connection count, cache hit ratio
5. **Redis Performance** - Hit rate, memory usage, eviction rate, command latency
6. **Frontend Core Web Vitals** - LCP, FID, CLS from RUM data
7. **Lighthouse Scores** - Historical trend across CI runs
8. **Load Test Results** - Latest k6 run summary with comparison

---

## Appendix A: Performance Test Environment

| Resource | Development | Staging | Production |
|---|---|---|---|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **Memory** | 4 GB | 16 GB | 32+ GB |
| **DB Instance** | Docker (t3.small equiv) | db.r6g.large | db.r6g.2xlarge (Multi-AZ) |
| **Cache** | Single Redis | Redis Cluster (2 shards) | Redis Cluster (4 shards) |
| **Workers** | 1 pod | 3 pods | 10+ pods (HPA) |

## Appendix B: Tool Configuration

### Lighthouse CI Configuration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttlingMethod: 'provided',
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### k6 Configuration

```javascript
// k6/options.js
export const baseOptions = {
  vus: 500,
  duration: '30m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  ext: {
    loadimpact: {
      projectID: 12345,
      name: 'Al Mokhtabar - Average Load',
    },
  },
};
```
