# Al Mokhtabar Laboratory Platform - Production Readiness Checklist

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Owner**: DevOps Team

---

## Instructions

- [ ] Mark each item as `[x]` when verified
- [ ] Record who verified and the date
- [ ] If an item is N/A, mark as `[N/A]` and note the reason
- [ ] Re-run this checklist before every major production deployment

---

## 1. DNS & SSL

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 1.1 | Cloudflare proxy enabled | DNS records proxied through Cloudflare (orange cloud) | [ ] | | |
| 1.2 | TLS 1.3 enabled | Minimum TLS version set to 1.2, TLS 1.3 enabled | [ ] | | |
| 1.3 | Full (strict) SSL | Cloudflare SSL set to Full (strict) - requires valid origin cert | [ ] | | |
| 1.4 | HSTS preload | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` | [ ] | | |
| 1.5 | DNSSEC enabled | DNSSEC configured at registrar + Cloudflare | [ ] | | |
| 1.6 | CAA records | Certification Authority Authorization records configured | [ ] | | |
| 1.7 | Auto HTTPS Rewrite | Cloudflare Automatic HTTPS Rewrites enabled | [ ] | | |
| 1.8 | Always Use HTTPS | Cloudflare Always Use HTTPS enabled | [ ] | | |
| 1.9 | Certificate auto-renewal | cert-manager ClusterIssuer configured with Let's Encrypt | [ ] | | |
| 1.10 | SSL Labs A+ rating | Tested at ssllabs.com - grade A+ | [ ] | | |
| 1.11 | Subdomain enumeration | All expected subdomains have DNS records (api, admin, www, grafana) | [ ] | | |
| 1.12 | Reverse DNS (PTR) | PTR records configured for mail servers if applicable | [ ] | | |

## 2. Security

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 2.1 | WAF managed rules enabled | Cloudflare WAF with OWASP + Cloudflare Managed rulesets | [ ] | | |
| 2.2 | WAF custom rules for healthcare | Custom rules blocking sensitive data exfiltration patterns | [ ] | | |
| 2.3 | Rate limiting configured | Per-IP (100/min) and per-user (1000/hr) rate limits | [ ] | | |
| 2.4 | DDoS protection active | Cloudflare DDoS (L3/L4/L7) + AWS Shield Advanced | [ ] | | |
| 2.5 | CSP headers strict | Content-Security-Policy: default-src 'self'; script-src 'self' 'strict-dynamic'; ... | [ ] | | |
| 2.6 | CORS restricted | Access-Control-Allow-Origin: https://almokhtabar.sa only | [ ] | | |
| 2.7 | CSRF tokens enabled | Double-submit cookie pattern or SameSite=Strict | [ ] | | |
| 2.8 | X-Content-Type-Options | Header: nosniff | [ ] | | |
| 2.9 | X-Frame-Options | Header: DENY | [ ] | | |
| 2.10 | Referrer-Policy | Header: strict-origin-when-cross-origin | [ ] | | |
| 2.11 | Permissions-Policy | Header restricting camera, microphone, geolocation | [ ] | | |
| 2.12 | Secrets management | Vault integrated with K8s; no secrets in env vars or config files | [ ] | | |
| 2.13 | Secrets rotation | Database passwords rotated (90 days), API keys rotated (30 days) | [ ] | | |
| 2.14 | Container scanning | Trivy scan passes in CI with no CRITICAL/HIGH findings | [ ] | | |
| 2.15 | IRSA configured | IAM Roles for Service Accounts used for AWS access | [ ] | | |
| 2.16 | Pod Security Standards | Restricted profile enforced on almokhtaber namespace | [ ] | | |
| 2.17 | Network policies | Default-deny network policy; allowed ingress/egress only as needed | [ ] | | |
| 2.18 | OPA/Gatekeeper policies | Policies: no privileged, no hostNetwork, read-only rootfs, resource limits | [ ] | | |
| 2.19 | Falco runtime security | Falco deployed and monitoring for anomalous syscalls | [ ] | | |
| 2.20 | Audit logging | CloudTrail + application-level audit log enabled | [ ] | | |
| 2.21 | Security.txt | `/.well-known/security.txt` published | [ ] | | |
| 2.22 | Bug bounty reference | Security policy linked from security.txt | [ ] | | |
| 2.23 | JWT rotation | Access tokens: 15min expiry; Refresh tokens: 7d with rotation | [ ] | | |
| 2.24 | Input validation | Server-side validation on all inputs; HTML sanitization | [ ] | | |
| 2.25 | SQL injection prevention | Parameterized queries via Prisma; no raw SQL | [ ] | | |
| 2.26 | RDS encryption at rest | RDS encrypted with KMS CMK | [ ] | | |
| 2.27 | EBS encryption by default | All EBS volumes encrypted | [ ] | | |
| 2.28 | S3 bucket policies | Block public access enabled on all S3 buckets | [ ] | | |
| 2.29 | VPC endpoints | Gateway endpoints for S3 + DynamoDB; Interface for ECR, CW, SSM | [ ] | | |
| 2.30 | mTLS for service mesh | Service-to-service mTLS enabled (linkerd or istio) | [ ] | | |

## 3. Database

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 3.1 | Multi-AZ enabled | RDS deployed across 3 AZs for high availability | [ ] | | |
| 3.2 | Automated backups | 35-day retention, automated daily snapshots | [ ] | | |
| 3.3 | Point-in-time recovery | PITR enabled (restore to any point within retention) | [ ] | | |
| 3.4 | Performance Insights | Enabled with 7-day retention | [ ] | | |
| 3.5 | Enhanced Monitoring | 60-second granularity | [ ] | | |
| 3.6 | RDS Proxy configured | Connection pooling with IAM authentication | [ ] | | |
| 3.7 | Connection pooling limits | pgBouncer or RDS Proxy max connections set appropriately | [ ] | | |
| 3.8 | Storage auto-scaling | Maximum storage threshold set (e.g., 1TB max) | [ ] | | |
| 3.9 | Encryption at rest | KMS CMK for RDS encryption | [ ] | | |
| 3.10 | Encryption in transit | TLS enforced for all client connections | [ ] | | |
| 3.11 | Deletion protection | RDS deletion protection enabled | [ ] | | |
| 3.12 | Auto minor version upgrade | Enabled | [ ] | | |
| 3.13 | Read replica configured | For analytics workloads; lag monitoring in place | [ ] | | |
| 3.14 | Unused index cleanup | `pg_stat_user_indexes` reviewed; unused indexes dropped | [ ] | | |
| 3.15 | Vacuum configured | Auto-vacuum tuned for production workload | [ ] | | |
| 3.16 | Connection limits | max_connections = 200 (via parameter group) | [ ] | | |
| 3.17 | Database migration tested | Prisma migrate deploy run successfully | [ ] | | |
| 3.18 | Seed data verified | Production seed data (tests, insurance, branches) imported | [ ] | | |
| 3.19 | Disaster recovery test | Restore from snapshot tested in non-production | [ ] | | |
| 3.20 | Cross-region backup | Automated copy of snapshots to DR region | [ ] | | |

## 4. Monitoring

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 4.1 | Prometheus deployed | Scraping all targets (K8s, nodes, apps, DB, Redis) | [ ] | | |
| 4.2 | Grafana deployed | OAuth login configured; admin password rotated | [ ] | | |
| 4.3 | Kubernetes dashboards | Cluster, Node, Pod, Deployment dashboards imported | [ ] | | |
| 4.4 | PostgreSQL dashboard | Key metrics: connections, cache hit ratio, replication lag | [ ] | | |
| 4.5 | Redis dashboard | Key metrics: memory, hit rate, connected clients, latency | [ ] | | |
| 4.6 | Application dashboard | Request rate, error rate, latency (p50/p95/p99), business KPIs | [ ] | | |
| 4.7 | Alert rules configured | High error rate, high latency, queue backlog, DB pool, disk space | [ ] | | |
| 4.8 | Alertmanager configured | Routes to PagerDuty (critical), Slack (info) | [ ] | | |
| 4.9 | PagerDuty integration | Service + Escalation policy configured | [ ] | | |
| 4.10 | Slack integration | #deployments, #alerts, #incidents channels configured | [ ] | | |
| 4.11 | Log shipping configured | Fluent Bit -> OpenSearch / ELK | [ ] | | |
| 4.12 | Log retention set | Hot 7d -> Warm 30d -> Cold 90d -> Delete | [ ] | | |
| 4.13 | CloudWatch log retention | 30-day retention on all log groups | [ ] | | |
| 4.14 | Uptime monitoring | CloudWatch Synthetics canary every 5 minutes | [ ] | | |
| 4.15 | External uptime monitoring | UptimeRobot or Checkly configured (external perspective) | [ ] | | |
| 4.16 | SLO tracking | Service Level Objectives defined and measured | [ ] | | |
| 4.17 | Error tracking | Sentry configured for frontend + backend | [ ] | | |
| 4.18 | APM configured | Datadog APM or OpenTelemetry with 10% sampling | [ ] | | |
| 4.19 | Distributed tracing | Trace correlation across backend -> AI -> queue worker | [ ] | | |
| 4.20 | Cost monitoring | AWS Cost Explorer + Grafana cost dashboard | [ ] | | |
| 4.21 | Dashboard annotations | Deployments automatically annotated on Grafana dashboards | [ ] | | |

## 5. CI/CD

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 5.1 | Build passes | `npm run build` succeeds for all applications | [ ] | | |
| 5.2 | Unit tests pass | `npm run test` - all tests passing | [ ] | | |
| 5.3 | E2E tests pass | `npm run test:e2e` - all integration tests passing | [ ] | | |
| 5.4 | Lint passes | ESLint: no errors | [ ] | | |
| 5.5 | TypeScript compiles | `tsc --noEmit`: no type errors | [ ] | | |
| 5.6 | Security scan passes | Trivy: 0 CRITICAL, 0 HIGH findings | [ ] | | |
| 5.7 | SonarQube quality gate | Quality Gate: A (no bugs, no vulnerabilities) | [ ] | | |
| 5.8 | Dependency audit | `npm audit`: 0 critical vulnerabilities | [ ] | | |
| 5.9 | Container image signing | Images signed with cosign | [ ] | | |
| 5.10 | SBOM generated | Software Bill of Materials generated (CycloneDX format) | [ ] | | |
| 5.11 | Image tagged with SHA | Images tagged with git commit SHA | [ ] | | |
| 5.12 | GHCR configured | GitHub Container Registry: private packages | [ ] | | |
| 5.13 | Environment approval gates | Production requires CTO + DevOps Lead approval | [ ] | | |
| 5.14 | Branch protection rules | main branch: 2 reviews, status checks required | [ ] | | |
| 5.15 | Deployment to staging first | Pipeline promotes staging -> production | [ ] | | |
| 5.16 | Automated rollback trigger | Failed canary analysis triggers automatic rollback | [ ] | | |
| 5.17 | Notification on deploy | Slack notification on every deployment | [ ] | | |
| 5.18 | Terraform plan in CI | CI runs `terraform plan` and uploads plan artifact | [ ] | | |

## 6. Performance

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 6.1 | Lighthouse Performance >= 90 | Desktop audit score | [ ] | | |
| 6.2 | Lighthouse Accessibility >= 90 | Desktop audit score | [ ] | | |
| 6.3 | Lighthouse Best Practices >= 90 | Desktop audit score | [ ] | | |
| 6.4 | Lighthouse SEO >= 90 | Desktop audit score | [ ] | | |
| 6.5 | LCP < 2.5s | Largest Contentful Paint | [ ] | | |
| 6.6 | FID < 100ms | First Input Delay | [ ] | | |
| 6.7 | CLS < 0.1 | Cumulative Layout Shift | [ ] | | |
| 6.8 | TTFB < 800ms | Time to First Byte (from KSA) | [ ] | | |
| 6.9 | First Load JS < 300KB | Main entry bundle size | [ ] | | |
| 6.10 | Image optimization | WebP format, lazy loading, responsive sizes | [ ] | | |
| 6.11 | Font optimization | Arabic fonts preloaded, subset if possible | [ ] | | |
| 6.12 | CDN cache hit ratio > 70% | Cloudflare caching static assets effectively | [ ] | | |
| 6.13 | Brotli compression | Level 4 for HTML/CSS/JS, Level 1 for dynamic API | [ ] | | |
| 6.14 | Code splitting | Dynamic imports for route-based chunking | [ ] | | |
| 6.15 | Tree shaking | Dead code elimination verified | [ ] | | |
| 6.16 | API response compression | gzip/brotli for JSON responses > 1KB | [ ] | | |
| 6.17 | Database query optimization | N+1 queries resolved; indexes on hot queries | [ ] | | |
| 6.18 | Redis caching strategy | Cache TTLs appropriate; cache hit rate > 80% | [ ] | | |

## 7. Compliance

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 7.1 | HIPAA BA agreement | Business Associate Agreement signed with AWS | [ ] | | |
| 7.2 | HIPAA encryption controls | Encrypted at rest (AES-256) and in transit (TLS 1.2+) | [ ] | | |
| 7.3 | HIPAA audit controls | CloudTrail + app audit logs; access logs retained 6 years | [ ] | | |
| 7.4 | HIPAA access controls | IAM least privilege; RBAC; MFA enforced | [ ] | | |
| 7.5 | HIPAA integrity controls | Backups tested; checksums on PHI data | [ ] | | |
| 7.6 | HIPAA person/entity auth | Unique user IDs; automatic logout after 15min inactivity | [ ] | | |
| 7.7 | HIPAA transmission security | TLS 1.2+ for all data in transit | [ ] | | |
| 7.8 | HIPAA contingency plan | Disaster recovery plan documented and tested | [ ] | | |
| 7.9 | GDPR data mapping | Data flow map: what data, where stored, how processed | [ ] | | |
| 7.10 | GDPR consent management | Cookie consent; explicit consent for data processing | [ ] | | |
| 7.11 | GDPR right to erasure | Account deletion API implemented; cascades to all systems | [ ] | | |
| 7.12 | GDPR data portability | User data export API (JSON/CSV) | [ ] | | |
| 7.13 | GDPR DPA | Data Processing Agreement with all sub-processors | [ ] | | |
| 7.14 | GDPR breach notification | 72-hour notification procedure documented | [ ] | | |
| 7.15 | NPHIES integration | Saudi health data exchange standards met | [ ] | | |
| 7.16 | NPHIES data sovereignty | Patient data stored within KSA (me-south-1) | [ ] | | |
| 7.17 | NPHIES audit trail | All access to patient records logged with timestamp + user | [ ] | | |
| 7.18 | CCHI compliance | Saudi Commission for Health Specialties requirements met | [ ] | | |
| 7.19 | CCHI licensing | Laboratory licenses displayed on platform | [ ] | | |
| 7.20 | ZATCA compliance | E-invoicing (Fatoora) integration; QR codes on invoices | [ ] | | |
| 7.21 | ZATCA reporting | Real-time reporting for B2B transactions; simplified for B2C | [ ] | | |
| 7.22 | PCI-DSS (if card data) | Tokenization via 3rd party (Stripe/Tap); no raw card data | [ ] | | |
| 7.23 | Data retention policy | PHI retained per KSA law (25 years); other data per policy | [ ] | | |
| 7.24 | Privacy policy published | Privacy policy + terms of service on website | [ ] | | |
| 7.25 | Cookie policy | Cookie banner with granular consent options | [ ] | | |

## 8. Availability

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 8.1 | HPA configured | Backend: min=3, max=15; Web: min=2, max=10; AI: min=2, max=8 | [ ] | | |
| 8.2 | PDB configured | PodDisruptionBudget: maxUnavailable=1 for all services | [ ] | | |
| 8.3 | Multi-AZ deployment | Worker nodes spread across 3 AZs | [ ] | | |
| 8.4 | Readiness probes | All deployments have readiness probe configured | [ ] | | |
| 8.5 | Liveness probes | All deployments have liveness probe configured | [ ] | | |
| 8.6 | Graceful shutdown | preStop hook and SIGTERM handling implemented | [ ] | | |
| 8.7 | Anti-affinity rules | Pods scheduled on different nodes | [ ] | | |
| 8.8 | Circuit breakers | Microservice circuit breaker pattern implemented | [ ] | | |
| 8.9 | Bulkhead pattern | Thread pools isolated per service dependency | [ ] | | |
| 8.10 | Retry with backoff | Exponential backoff for external API calls | [ ] | | |
| 8.11 | Timeouts configured | Database: 10s; External API: 5s; Queue: 30s | [ ] | | |
| 8.12 | Graceful degradation | Feature flags; fallback responses when dependencies down | [ ] | | |
| 8.13 | DR failover tested | Azure DR failover < 5 min RTO | [ ] | | |
| 8.14 | Cross-region read replicas | GCP read replica for analytics queries | [ ] | | |
| 8.15 | Redis Multi-AZ | ElastiCache Multi-AZ with automatic failover | [ ] | | |
| 8.16 | Global load balancing | Traffic Manager / Cloudflare Load Balancing for multi-region | [ ] | | |

## 9. Scaling

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 9.1 | Cluster autoscaler deployed | Scale up in < 5 min; scale down for underutilized nodes | [ ] | | |
| 9.2 | HPA target CPU: 70% | Backend scales at 70% CPU utilization | [ ] | | |
| 9.3 | HPA target memory: 80% | Memory-based scaling for memory-intensive workloads | [ ] | | |
| 9.4 | Custom metrics HPA | Queue length > 500 -> scale workers | [ ] | | |
| 9.5 | Connection pooling limits | pgBouncer max connections sized for peak load | [ ] | | |
| 9.6 | Redis cluster mode | Cluster mode enabled when > 50GB data | [ ] | | |
| 9.7 | MeiliSearch indexing limits | Index size limits set; search timeouts configured | [ ] | | |
| 9.8 | Database storage auto-scaling | RDS auto-scaling enabled: max 1TB | [ ] | | |
| 9.9 | ALB idle timeout | Set to 60s (appropriate for API) | [ ] | | |
| 9.10 | WebSocket scaling | Socket.IO with Redis adapter; horizontal scaling | [ ] | | |
| 9.11 | Queue worker concurrency | Bull queue concurrency per worker configured | [ ] | | |
| 9.12 | Rate limiting at ingress | Global rate limit before requests reach pods | [ ] | | |

## 10. Cost

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 10.1 | Reserved instances (3yr) | RDS + ElastiCache reserved instances purchased | [ ] | | |
| 10.2 | Spot instances | EKS worker nodes using spot (60% savings) | [ ] | | |
| 10.3 | Spot interruption handling | Spot termination handler DaemonSet deployed | [ ] | | |
| 10.4 | Dev/staging shut down | Dev/staging instances stop outside business hours | [ ] | | |
| 10.5 | S3 lifecycle policies | Standard -> IA (30d) -> Glacier (90d) -> Delete (365d) | [ ] | | |
| 10.6 | EBS gp3 volumes | gp3 for all EBS volumes (not gp2) | [ ] | | |
| 10.7 | EFS IA enabled | Lifecycle policy: move to IA after 30 days | [ ] | | |
| 10.8 | CloudFront for egress | Cheaper than direct ALB data transfer | [ ] | | |
| 10.9 | Prometheus retention limits | Hot: 15d, Cold: 45d | [ ] | | |
| 10.10 | CloudWatch log retention | 30-day retention (not infinite) | [ ] | | |
| 10.11 | ELK index lifecycle | Hot 7d -> Warm 30d -> Cold 90d -> Delete | [ ] | | |
| 10.12 | APM sampling rate | 10% (not 100%) | [ ] | | |
| 10.13 | NAT Gateway single-AZ | Single-AZ NAT for cost; multi-AZ only for prod | [ ] | | |
| 10.14 | Budget alerts set | AWS Budgets: $5,000 monthly with 80%/100% alerts | [ ] | | |
| 10.15 | Unused resources cleanup | Unused EIPs, volumes, load balancers identified and removed | [ ] | | |
| 10.16 | Cost allocation tags | Resources tagged with Environment, Service, CostCenter | [ ] | | |

## 11. Observability

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 11.1 | Distributed tracing | OpenTelemetry traces for all API requests | [ ] | | |
| 11.2 | Trace sampling | Head-based sampling: 10% | [ ] | | |
| 11.3 | Span attributes | Span includes: http.method, http.url, http.status_code, db.system | [ ] | | |
| 11.4 | Centralized logging | All logs shipped to Elasticsearch/OpenSearch | [ ] | | |
| 11.5 | Structured logging | JSON format: timestamp, level, service, message, traceId | [ ] | | |
| 11.6 | Real User Monitoring (RUM) | Lighthouse CW RUM or Datadog RUM | [ ] | | |
| 11.7 | Synthetic monitoring | CloudWatch Synthetics + Checkly for critical flows | [ ] | | |
| 11.8 | Business KPIs dashboard | Daily active users, orders, revenue, test completion rate | [ ] | | |
| 11.9 | Audit trail | All changes to PHI logged with before/after values | [ ] | | |
| 11.10 | Performance regression detection | Automatic detection of performance degradation | [ ] | | |
| 11.11 | SLA/SLO dashboard | Uptime, latency, error budget dashboards | [ ] | | |

## 12. Integration

| # | Item | Description | Status | Verified By | Date |
|---|------|-------------|--------|-------------|------|
| 12.1 | Email verified | SMTP/ SES configured; transactional emails tested | [ ] | | |
| 12.2 | SMS tested | Twilio: OTP, appointment reminders sent successfully | [ ] | | |
| 12.3 | WhatsApp tested | WhatsApp Cloud API: templates approved and tested | [ ] | | |
| 12.4 | Push notifications | FCM: iOS + Android push notifications tested | [ ] | | |
| 12.5 | Stripe integration | Payment intents, webhooks, refunds tested | [ ] | | |
| 12.6 | Tap Payments | Tap integration tested (MADA, Apple Pay, STC Pay) | [ ] | | |
| 12.7 | Google OAuth | Login with Google tested | [ ] | | |
| 12.8 | Apple OAuth | Login with Apple tested | [ ] | | |
| 12.9 | OTP delivery | OTP via SMS and email tested end-to-end | [ ] | | |
| 12.10 | MeiliSearch indexing | Full-text search indexing working; results ranked correctly | [ ] | | |
| 12.11 | File uploads | PDF/JPEG/PNG upload to S3; virus scanning tested | [ ] | | |
| 12.12 | PDF generation | Lab report PDF generation working (Arabic + English) | [ ] | | |
| 12.13 | Webhook receivers | Stripe + Tap payment webhooks processed successfully | [ ] | | |
| 12.14 | ZATCA e-invoicing | QR generation; invoice reporting tested | [ ] | | |
| 12.15 | Auth0 integration | Auth0 for SSO; MFA tested | [ ] | | |
| 12.16 | NPHIES EHR integration | Interoperability with KSA health systems verified | [ ] | | |

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | | | |
| CTO | | | |
| Security Officer | | | |
| Compliance Officer | | | |

---

## Deployment Summary

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| Deployment duration | < 15 min | | [ ] |
| Zero-downtime deployment | Yes | | [ ] |
| RTO (rollback) | < 2 min | | [ ] |
| RPO (data loss) | < 5 min | | [ ] |
| Lighthouse score | >= 90 | | [ ] |
| SSL Labs grade | A+ | | [ ] |
| Security scan findings | 0 CRITICAL | | [ ] |

---

*End of Production Checklist. For questions contact devops@almokhtabar.sa*
