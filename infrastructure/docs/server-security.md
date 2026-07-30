# Al Mokhtabar Laboratory Platform - Server Security Hardening Guide

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Classification**: CONFIDENTIAL

---

## Table of Contents

1. [OS Hardening (CIS Benchmarks)](#1-os-hardening-cis-benchmarks)
2. [Kubernetes Security](#2-kubernetes-security)
3. [Application Security](#3-application-security)
4. [Network Security](#4-network-security)
5. [Secrets Management](#5-secrets-management)
6. [Compliance Controls](#6-compliance-controls)

---

## 1. OS Hardening (CIS Benchmarks)

### 1.1 Base Image Selection

```dockerfile
# Dockerfile - Backend (NestJS)
FROM node:20.11-alpine3.19 AS base
RUN apk add --no-cache dumb-init curl ca-certificates tzdata

# Use distroless for production runtime
FROM gcr.io/distroless/nodejs20-debian12 AS runtime
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=base /etc/ssl/certs /etc/ssl/certs
COPY --from=base /usr/share/zoneinfo /usr/share/zoneinfo

# Non-root user
USER 1001:1001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

```dockerfile
# Dockerfile - Web (Next.js)
FROM node:20.11-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.11-alpine3.19 AS runner
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
```

```dockerfile
# Dockerfile - AI Service (Python FastAPI)
FROM python:3.12-slim-bookworm AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --system --uid 1001 --disabled-python appuser
USER appuser
WORKDIR /app
COPY --chown=appuser:appuser . .
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.2 CIS Benchmark Controls Applied

| # | CIS Control | Implementation | Verification |
|---|------------|---------------|--------------|
| 1.1.1 | Filesystem partitioning | /tmp, /var, /var/log, /var/log/audit on separate partitions | `mount \| grep -E '(/tmp|/var/log)'` |
| 1.1.8 | Nodev on /var/log/audit | `nodev` mount option | `mount \| grep /var/log/audit` |
| 1.1.20 | Sticky bit on world-writable dirs | `chmod 1777 /tmp` | `df --local -P \| awk '{if(NR>1) print $6}' \| xargs -I '{}' find '{}' -xdev -type d \( -perm -0002 -a ! -perm -1000 \) 2>/dev/null` |
| 1.4.3 | SELinux/AppArmor enabled | AppArmor in enforcing mode | `aa-status \| grep -c 'profiles are in enforce'` |
| 1.5.1 | ASLR enabled | kernel.randomize_va_space = 2 | `sysctl kernel.randomize_va_space` |
| 1.5.2 | Core dumps restricted | fs.suid_dumpable = 0 | `sysctl fs.suid_dumpable` |
| 1.5.3 | PREEMPT_RT disabled | N/A for Alpine/distroless | |
| 1.6.1 | Restrict kernel params | /etc/sysctl.d/hardening.conf | See below |
| 2.1 | Remove unnecessary services | Minimal installation, no X11 | `lsof -i -P -n \| grep LISTEN` |
| 3.1 | auditd installed | auditd configured for HIPAA | `auditctl -l` |
| 4.1 | Secure SSH config | Password auth disabled, key-only, protocol 2 | `sshd -T` |
| 5.1 | User/group config | No root login, unique UIDs | `cat /etc/passwd` |

### 1.3 Kernel Hardening (sysctl)

```ini
# /etc/sysctl.d/hardening.conf
# Al Mokhtabar Laboratory - Kernel Hardening

# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv6.conf.all.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# ASLR
kernel.randomize_va_space = 2

# Core dumps
fs.suid_dumpable = 0

# Kernel panic on OOM
vm.panic_on_oom = 1
kernel.panic = 10

# Restrict ptrace
kernel.yama.ptrace_scope = 1

# Disable perf events for unprivileged users
kernel.perf_event_paranoid = 3

# Restrict kptr
kernel.kptr_restrict = 2

# Disable dmesg for unprivileged
kernel.dmesg_restrict = 1

# Disable bpf JIT
net.core.bpf_jit_enable = 0

# TCP hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_rfc1337 = 1
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_sack = 0
net.ipv4.tcp_dsack = 0

# Disable IPv6 if not needed
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
```

### 1.4 Fail2ban Configuration

```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16

[sshd]
enabled = true
port = 22
logpath = %(sshd_log)s
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = %(nginx_error_log)s
maxretry = 3

[nginx-botsearch]
enabled = true
port = http,https
logpath = %(nginx_access_log)s
maxretry = 10

[nginx-nohome]
enabled = true
port = http,https
logpath = %(nginx_access_log)s
maxretry = 3
```

### 1.5 Auditd Rules for HIPAA

```bash
# /etc/audit/rules.d/hipaa.rules
# Al Mokhtabar Laboratory - HIPAA Audit Rules

# Remove existing rules
-D

# Buffer size
-b 8192

# Failure mode
-f 1

# Record all login/logout events
-w /var/log/wtmp -p wa -k logins
-w /var/log/btmp -p wa -k logins
-w /var/log/lastlog -p wa -k logins

# Record all sudo usage
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers

# Record user/group modifications
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# Record system time changes
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b64 -S clock_settime -k time-change
-a always,exit -F arch=b32 -S clock_settime -k time-change

# Record file deletion
-a always,exit -F arch=b64 -S unlink -S unlinkat -S rename -S renameat -k delete
-a always,exit -F arch=b32 -S unlink -S unlinkat -S rename -S renameat -k delete

# Record privilege escalation
-a always,exit -F arch=b64 -S execve -C uid!=euid -F euid=0 -k priv_esc
-a always,exit -F arch=b32 -S execve -C uid!=euid -F euid=0 -k priv_esc

# Record network configuration changes
-w /etc/hosts -p wa -k network
-w /etc/network/ -p wa -k network

# Record system startup
-w /etc/init.d/ -p wa -k startup
-w /etc/systemd/ -p wa -k startup

# Record kernel module loading
-w /etc/modprobe.conf -p wa -k modules
-a always,exit -F arch=b64 -S init_module -S delete_module -k modules
-a always,exit -F arch=b32 -S init_module -S delete_module -k modules

# Record access to PHI directories
-w /data/patients -p wa -k PHI
-w /data/records -p wa -k PHI
-w /data/lab_results -p wa -k PHI

# Record application log access
-w /var/log/app/ -p wa -k app_logs

# Record database access (if local)
-w /var/lib/postgresql/ -p wa -k database

# Make the configuration immutable
-e 2
```

---

## 2. Kubernetes Security

### 2.1 Pod Security Standards

```yaml
# Apply to namespace
apiVersion: v1
kind: Namespace
metadata:
  name: almokhtaber
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: latest
```

### 2.2 Network Policies

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: almokhtaber
spec:
  podSelector: {}
  policyTypes:
    - Ingress
---
# Default deny all egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: almokhtaber
spec:
  podSelector: {}
  policyTypes:
    - Egress
---
# Allow ingress from ingress controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: almokhtaber
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: almokhtaber
          podSelector:
            matchLabels:
              app.kubernetes.io/component: controller
      ports:
        - port: 3000
        - port: 3001
---
# Allow backend to access database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-database
  namespace: almokhtaber
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 10.0.3.0/24  # Data subnet
      ports:
        - port: 5432
        - port: 6379
        - port: 7700
---
# Allow DNS resolution
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-dns
  namespace: almokhtaber
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
---
# Allow egress to external APIs (Stripe, Twilio, etc.)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-external-api
  namespace: almokhtaber
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - port: 443
          protocol: TCP
```

### 2.3 RBAC Configuration

```yaml
# ServiceAccount for backend
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-service-account
  namespace: almokhtaber
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/backend-service-role
---
# Role with minimal permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
  namespace: almokhtaber
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "list", "watch"]
---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-role-binding
  namespace: almokhtaber
subjects:
  - kind: ServiceAccount
    name: backend-service-account
    namespace: almokhtaber
roleRef:
  kind: Role
  name: backend-role
  apiGroup: rbac.authorization.k8s.io
```

### 2.4 OPA/Gatekeeper Policies

```yaml
# ConstraintTemplate: disallow-privileged-containers
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8spspprivilegedcontainer
spec:
  crd:
    spec:
      names:
        kind: K8sPSPPrivilegedContainer
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8spspprivilegedcontainer
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.privileged
          msg := sprintf("Privileged container '%v' is not allowed", [container.name])
        }
---
# Constraint: No privileged containers
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: no-privileged-containers
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces:
      - "almokhtaber"
---
# ConstraintTemplate: require-readonly-rootfs
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8spspreadonlyrootfs
spec:
  crd:
    spec:
      names:
        kind: K8sPSPReadOnlyRootFilesystem
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8spspreadonlyrootfs
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.readOnlyRootFilesystem
          msg := sprintf("Container '%v' must have readOnlyRootFilesystem set to true", [container.name])
        }
---
# ConstraintTemplate: require-resource-limits
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredresources
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredResources
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredresources
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits
          msg := sprintf("Container '%v' must have resource limits defined", [container.name])
        }
---
# ConstraintTemplate: allowed-registries-only
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8sallowedrepos
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRepos
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sallowedrepos
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          image := container.image
          not startswith(image, "ghcr.io/almokhtaber/")
          not startswith(image, "registry.almokhtabar.sa/")
          msg := sprintf("Container image '%v' is not from an allowed registry", [image])
        }
---
# Constraint: Allowed registries
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRepos
metadata:
  name: allowed-registries
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces:
      - "almokhtaber"
  parameters:
    repos:
      - "ghcr.io/almokhtaber/"
      - "registry.almokhtabar.sa/"
```

### 2.5 Container Image Scanning (Trivy)

```yaml
# .github/workflows/security-scan.yml
name: Container Security Scan
on:
  pull_request:
    paths:
      - 'apps/**'
      - 'Dockerfile*'
  push:
    branches: [main]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build images
        run: |
          docker build -t ghcr.io/almokhtaber/backend:${{ github.sha }} -f apps/backend/Dockerfile apps/backend
          docker build -t ghcr.io/almokhtaber/web:${{ github.sha }} -f apps/web/Dockerfile apps/web
          docker build -t ghcr.io/almokhtaber/ai-service:${{ github.sha }} -f apps/ai-service/Dockerfile apps/ai-service

      - name: Scan backend image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/almokhtaber/backend:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-backend.sarif'
          severity: 'CRITICAL,HIGH,MEDIUM'
          exit-code: '1'
          vuln-type: 'os,library'
          scanners: 'vuln,secret,misconfig'

      - name: Scan web image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/almokhtaber/web:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-web.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          vuln-type: 'os,library'

      - name: Scan AI service image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/almokhtaber/ai-service:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-ai.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          vuln-type: 'os,library,python'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-backend.sarif
          category: backend

      - name: Scan Kubernetes manifests (IaC)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: './infrastructure/kubernetes'
          format: 'sarif'
          output: 'trivy-k8s.sarif'
          severity: 'CRITICAL,HIGH'
          scanners: 'misconfig'
```

### 2.6 Falco Runtime Security

```yaml
# values-falco.yaml for helm deployment
# Falco runtime security configuration

driver:
  kind: ebpf

falco:
  rules:
    - /etc/falco/rules.d/custom-rules.yaml

  customRules:
    custom-rules.yaml: |-
      - rule: Write below binary dir
        desc: Attempt to write to any binary directory
        condition: >
          bin_dir and evt.dir = < and open_write
          and not proc.name in (dpkg, yum, rpm, update)
          and not container.image.repository in (ghcr.io/almokhtaber/backend)
        output: >
          File below binary dir: user=%user.name command=%proc.cmdline
          file=%fd.name container=%container.info
        priority: CRITICAL
        tags: [filesystem, mitre_persistence]

      - rule: Launch SSH Server in Container
        desc: Detect ssh server started inside container
        condition: >
          spawned_process and proc.name = sshd
          and container.id != host
        output: >
          SSH server launched in container: user=%user.name
          command=%proc.cmdline container=%container.info
        priority: WARNING
        tags: [network, mitre_lateral_movement]

      - rule: Read sensitive file from container
        desc: Detect read of sensitive files in containers
        condition: >
          open_read and container.id != host
          and fd.name in (/etc/shadow, /etc/passwd, /etc/kubernetes/admin.conf)
        output: >
          Sensitive file read: user=%user.name file=%fd.name
          command=%proc.cmdline container=%container.info
        priority: WARNING
        tags: [filesystem, mitre_credential_access]

      - rule: Unauthorized process execution
        desc: Detect execution of unexpected binaries
        condition: >
          spawned_process
          and container.id != host
          and not proc.name in (node, npm, npx, python, python3, uvicorn,
                               curl, wget, sh, bash, sleep, tail, cat, ls,
                               ps, env, aws, kubectl, helm)
        output: >
          Unexpected process: user=%user.name command=%proc.cmdline
          proc.name=%proc.name container=%container.info
        priority: NOTICE
        tags: [process, mitre_execution]

      - rule: Netcat Remote Code Execution
        desc: Detect netcat used for remote access
        condition: >
          spawned_process and
          (proc.name = nc or proc.name = ncat or proc.name = netcat)
        output: >
          Netcat process: user=%user.name command=%proc.cmdline
          container=%container.info
        priority: CRITICAL
        tags: [network, mitre_execution]

      - list: shell_binaries
        items: [sh, bash, zsh, dash, ash, busybox]

      - rule: Shell spawned in container
        desc: Detect shell execution in pods
        condition: >
          spawned_process and proc.name in (shell_binaries)
          and container.id != host
          and not proc.pname in (kubectl, helm, node, python3)
        output: >
          Shell execution: user=%user.name command=%proc.cmdline
          pname=%proc.pname container=%container.info
        priority: WARNING
        tags: [shell, mitre_execution]

falco:
  jsonOutput: true
  jsonIncludeMessage: true
  output:
    rate: 10000
    maxBurst: 20000
  syscallEventDrops:
    actions:
      - log
      - alert
    rate: 0.01
    maxBurst: 10
  outputs:
    rate: 10000
    maxBurst: 20000

integrations:
  pagerduty:
    enabled: true
    routingKey: ${PAGERDUTY_ROUTING_KEY}

  slack:
    enabled: true
    webhook: ${SLACK_WEBHOOK}
    channel: '#security-alerts'
```

---

## 3. Application Security

### 3.1 OWASP Top 10 Mitigations

| OWASP Risk | Mitigation | Verification |
|-----------|------------|--------------|
| A01: Broken Access Control | RBAC + JWT validation on every request | Unit tests + integration tests |
| A02: Cryptographic Failures | TLS 1.3, AES-256-GCM for data at rest | SSL Labs scan, security audit |
| A03: Injection | Prisma parameterized queries, DOMPurify for HTML | OWASP ZAP scan |
| A04: Insecure Design | Threat modeling, security review in PRs | Architecture review |
| A05: Security Misconfiguration | CIS benchmarks, automated config scanning | Trivy misconfig scan |
| A06: Vulnerable Components | Dependabot, Trivy, npm audit, Renovate bot | Weekly dependency scan |
| A07: Auth Failures | Auth0, MFA, short-lived JWT, refresh rotation | Auth flow tests |
| A08: Data Integrity Failures | Signed images, SBOM, cosign verification | CI/CD pipeline |
| A09: Logging Failures | Structured logging, audit trail, centralized logging | ELK dashboards |
| A10: SSRF | Restrict outbound traffic, validate URLs, allowlist | Network policies |

### 3.2 API Rate Limiting

```typescript
// apps/backend/src/common/guards/rate-limit.guard.ts
// Example rate limiting configuration

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: any): Promise<string> {
    // Rate limit by user ID if authenticated, otherwise by IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  }
}

// Configuration
// throttler configuration in app.module.ts
// Default: 100 requests per 60 seconds
// Auth endpoints: 10 requests per 60 seconds
// Search endpoints: 30 requests per 60 seconds
// Upload endpoints: 5 requests per 60 seconds
```

### 3.3 JWT Configuration

```typescript
// apps/backend/src/auth/config/jwt.config.ts

export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET, // 256-bit key
    expiresIn: '15m', // Short-lived
    issuer: 'almokhtabar.sa',
    audience: 'api.almokhtabar.sa',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET, // Different key
    expiresIn: '7d',
    rotationEnabled: true, // New refresh token on every refresh
    reuseDetection: true, // Detect stolen tokens
  },
  // Additional security measures:
  // - JWT signed with RS256 (asymmetric)
  // - Public key published at /.well-known/jwks.json
  // - Token binding (enforce same IP/user-agent on refresh)
  // - Revocation list in Redis for force-logout
};
```

### 3.4 CSP Headers

```typescript
// apps/backend/src/common/middleware/security-headers.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'strict-dynamic' 'nonce-${res.locals.nonce}' https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.almokhtabar.sa wss://ws.almokhtabar.sa https://sentry.almokhtabar.sa",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );

    // Strict Transport Security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection (deprecated but still used by some browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );

    // Cross-Origin-Embedder-Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin-Opener-Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove X-Powered-By
    res.removeHeader('X-Powered-By');

    next();
  }
}
```

### 3.5 CORS Configuration

```typescript
// apps/backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://almokhtabar.sa',
      'https://www.almokhtabar.sa',
      'https://admin.almokhtabar.sa',
      'https://staging.almokhtabar.sa',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'Accept-Encoding',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours (preflight cache)
  });

  // Security.txt
  app.getHttpAdapter().get('/.well-known/security.txt', (req, res) => {
    res.type('text/plain').send(`
      Contact: mailto:security@almokhtabar.sa
      Expires: 2027-07-30T00:00:00.000Z
      Encryption: https://almokhtabar.sa/.well-known/pgp-key.txt
      Acknowledgments: https://almokhtabar.sa/bug-bounty
      Preferred-Languages: en, ar
      Policy: https://almokhtabar.sa/security-policy
    `);
  });

  await app.listen(3000);
}
bootstrap();
```

---

## 4. Network Security

### 4.1 Network Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ WAF      │  │ DDoS     │  │ Bot Mgmt │  │ CDN    │ │
│  │ Managed  │  │ L3/L4/L7 │  │ ML-based │  │ Cache  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │ TLS 1.3
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS CloudFront                         │
│  (Alternative route for CDN-only content)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS WAF Regional                       │
│  Rate-based rules │ IP allowlist │ Managed rules        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Application Load Balancer                   │
│  TLS 1.3 │ HSTS │ Security headers                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              EKS NGINX Ingress Controller                 │
│  mTLS │ Request validation │ Rate limiting               │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Backend Pods  │    │   Web Pods      │
│   (NestJS)      │    │   (Next.js)     │
│   Port 3000     │    │   Port 3000     │
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      │
┌─────────────────┐             │
│   AI Pods       │             │
│   (FastAPI)     │             │
│   Port 8000     │             │
└────────┬────────┘             │
         │                      │
         ▼                      │
┌─────────────────┐             │
│   Data Layer     │◄────────────┘
│   RDS │ Redis   │
│   MeiliSearch   │
│   (Private)     │
└─────────────────┘
```

### 4.2 Cloudflare IP Allowlist for ALB

```powershell
# Update ALB security group to only allow Cloudflare IPs
$CF_IPS = curl.exe -s "https://api.cloudflare.com/client/v4/ips" | ConvertFrom-Json

# Create security group rule for each Cloudflare IPv4 range
$CF_IPS.result.ipv4_cidrs | ForEach-Object {
    aws ec2 authorize-security-group-ingress `
        --group-id sg-xxxxx `
        --protocol tcp `
        --port 443 `
        --cidr $_ `
        --profile almokhtaber-prod
}

# Also add IPv6 if applicable
$CF_IPS.result.ipv6_cidrs | ForEach-Object {
    aws ec2 authorize-security-group-ingress `
        --group-id sg-xxxxx `
        --protocol tcp `
        --port 443 `
        --cidr $_ `
        --profile almokhtaber-prod
}
```

### 4.3 VPC Flow Logs

```hcl
# Terraform: VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_s3_bucket.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }

  tags = {
    Name        = "almokhtaber-vpc-flow-logs"
    Environment = "production"
    Compliance  = "HIPAA"
  }
}
```

### 4.4 Bastion Host Access (SSM Session Manager)

```hcl
# Bastion host should only be accessed via AWS SSM Session Manager
# No SSH keys, no public IP, no security group inbound rules

resource "aws_instance" "bastion" {
  ami                    = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type          = "t3.nano"
  subnet_id              = aws_subnet.public[0].id
  iam_instance_profile   = aws_iam_instance_profile.ssm_profile.name

  # No key pair - access only via SSM
  # No security group ingress rules

  tags = {
    Name = "almokhtaber-bastion-prod"
  }
}
```

---

## 5. Secrets Management

### 5.1 HashiCorp Vault with K8s Auth

```hcl
# vault-config.hcl (see separate file at infrastructure/security/vault/vault-config.hcl)
# This section covers the integration with Kubernetes

# Enable Kubernetes auth method
vault auth enable kubernetes

# Configure K8s auth
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)"
```

### 5.2 Vault CSI Provider for Pod Injection

```yaml
# Example deployment with Vault sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: almokhtaber
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "backend-service"
        vault.hashicorp.com/agent-inject-secret-database: "secret/almokhtaber/database"
        vault.hashicorp.com/agent-inject-template-database: |
          {{- with secret "secret/almokhtaber/database" -}}
          export DATABASE_URL="postgresql://{{ .Data.data.username }}:{{ .Data.data.password }}@{{ .Data.data.host }}:5432/{{ .Data.data.database }}"
          {{- end -}}
        vault.hashicorp.com/agent-inject-secret-redis: "secret/almokhtaber/redis"
        vault.hashicorp.com/agent-inject-template-redis: |
          {{- with secret "secret/almokhtaber/redis" -}}
          export REDIS_URL="redis://:{{ .Data.data.password }}@{{ .Data.data.host }}:6379"
          {{- end -}}
        vault.hashicorp.com/agent-inject-secret-stripe: "secret/almokhtaber/stripe"
        vault.hashicorp.com/agent-inject-template-stripe: |
          {{- with secret "secret/almokhtaber/stripe" -}}
          export STRIPE_SECRET_KEY="{{ .Data.data.secret_key }}"
          export STRIPE_WEBHOOK_SECRET="{{ .Data.data.webhook_secret }}"
          {{- end -}}
    spec:
      serviceAccountName: backend-service-account
      containers:
        - name: backend
          image: ghcr.io/almokhtaber/backend:latest
          env:
            - name: VAULT_ADDR
              value: "https://vault.almokhtabar.sa:8200"
          envFrom:
            - secretRef:
                name: vault-token  # Only for sidecar to authenticate
```

### 5.3 Dynamic Database Credentials

```hcl
# Vault database secrets engine for PostgreSQL
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/almokhtaber-pg \
    plugin_name="postgresql-database-plugin" \
    allowed_roles="backend-dynamic-role" \
    connection_url="postgresql://{{username}}:{{password}}@almokhtaber-pg-prod.xxxxx.me-south-1.rds.amazonaws.com:5432/almokhtaber_prod?sslmode=verify-full" \
    username="vault_admin" \
    password="<initial-password>"

# Create dynamic role (credentials are short-lived)
vault write database/roles/backend-dynamic-role \
    db_name="almokhtaber-pg" \
    creation_statements="CREATE USER \"{{name}}\" WITH PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Application gets credentials dynamically
# vault read database/creds/backend-dynamic-role
# Returns: username, password, lease_duration
```

### 5.4 Secrets Rotation Policy

| Secret Type | Rotation Period | Method | Responsible Team |
|------------|----------------|--------|-----------------|
| Database passwords (static) | 90 days | Vault rotation | DevOps |
| Database credentials (dynamic) | 1 hour TTL | Automatic | Vault |
| JWT signing keys (access) | 30 days | Key rotation script | Backend |
| JWT signing keys (refresh) | 90 days | Key rotation script | Backend |
| API keys (Stripe, Twilio, etc.) | 90 days | Manual + CI check | Backend |
| Encryption keys (KMS CMK) | 1 year (auto) | AWS automatic | AWS |
| TLS certificates | 90 days | cert-manager auto | cert-manager |
| SSH keys (if any) | 180 days | Access review | DevOps |
| Cloudflare API token | 90 days | Manual | DevOps |
| GitHub tokens | 90 days | Manual | DevOps |

### 5.5 Offline Master Key Backup

```
Physical Location: Al Rajhi Bank Safe Deposit Box #837
Contact: Marwan Al-Abdulkarim (CTO)
Access: Requires 2 of 3 signatories (CTO, CEO, Security Officer)

Contents:
- HSM backup key (YubiHSM2) in anti-static bag
- GPG-encrypted master key file on encrypted USB (Trezor Model T passphrase)
- Paper copy of Shamir secret shares (5 shares, 3 required)
- Printed QR code to cold wallet backup

Emergency Access Procedure:
1. Schedule access with bank (48hr notice minimum)
2. Two authorized signatories present ID
3. Retrieve box contents in private room
4. Follow emergency key recovery procedure in SOP-EMERGENCY-001
5. Document all access in audit log
6. Re-seal box with new tamper-evident bag
```

---

## 6. Compliance Controls

### 6.1 HIPAA Controls Mapping

| HIPAA Rule | Requirement | Implementation | Verification Method | Documentation |
|-----------|-------------|---------------|--------------------|--------------|
| 164.308(a)(1) | Risk Analysis | Annual third-party penetration test | Pentest report | SOP-RISK-001 |
| 164.308(a)(3) | Workforce Security | RBAC + MFA + termination automation | Access review quarterly | SOP-ACCESS-001 |
| 164.308(a)(4) | Information Access Mgmt | Just-in-time access via Vault | Audit logs review | SOP-JIT-001 |
| 164.308(a)(5) | Security Awareness | Annual training + phishing simulation | Training records | SOP-TRAIN-001 |
| 164.308(a)(6) | Incident Response | PagerDuty + runbooks | Tabletop exercises quarterly | SOP-IR-001 |
| 164.308(a)(7) | Contingency Plan | Multi-region DR + backups | DR test semi-annual | SOP-DR-001 |
| 164.308(a)(8) | Evaluation | Internal audit bi-annual | Audit findings | SOP-AUDIT-001 |
| 164.310(a) | Facility Access | AWS data center physical security | AWS SOC 2 report | AWS compliance |
| 164.310(b) | Workstation Security | Company-managed laptops + disk encryption | MDM compliance check | SOP-MDM-001 |
| 164.310(c) | Device/Media Control | Encrypted backup + secure disposal | Asset inventory | SOP-ASSET-001 |
| 164.312(a) | Access Control | Unique user ID + emergency access + auto-logoff | Auth0 logs | SOP-AUTH-001 |
| 164.312(b) | Audit Controls | CloudTrail + app audit logs + database audit | SIEM dashboards | SOP-AUDIT-001 |
| 164.312(c) | Integrity | Checksums + change control | Code review + CI/CD | SOP-CHANGE-001 |
| 164.312(d) | Person/Auth | MFA + biometric (mobile) | Auth0 configuration | SOP-MFA-001 |
| 164.312(e) | Transmission Security | TLS 1.3 + network encryption | SSL Labs A+ | SOP-TLS-001 |
| 164.314(a) | BA Agreements | Signed BAAs with AWS, Auth0, Stripe, Twilio | BAA repository | SOP-BAA-001 |
| 164.316(a) | Policies/Procedures | Documented + version controlled | Wiki + git | SOP-INDEX-001 |
| 164.316(b) | Documentation Retention | 6-year minimum retention | S3 lifecycle policy | SOP-RETENTION-001 |

### 6.2 GDPR Controls Mapping

| GDPR Article | Requirement | Implementation | Data Subject Rights |
|-------------|-------------|---------------|-------------------|
| Art. 5 | Lawful processing | Consent management (Cookiebot) | Consent withdrawal |
| Art. 7 | Consent | Granular opt-in/opt-out per purpose | Preference center |
| Art. 12 | Transparent communication | Privacy policy in Arabic + English | N/A |
| Art. 15 | Right of access | User data export API | GET /api/user/data |
| Art. 16 | Right to rectification | Profile editing UI | PATCH /api/user/profile |
| Art. 17 | Right to erasure | Account deletion with cascade | DELETE /api/user |
| Art. 18 | Right to restrict | Temporary account freeze | PATCH /api/user/restrict |
| Art. 20 | Data portability | Export in JSON/CSV | GET /api/user/export |
| Art. 21 | Right to object | Marketing opt-out | PATCH /api/user/preferences |
| Art. 25 | Data protection by design | Privacy review in PR template | PR checklist |
| Art. 28 | Data processors | DPAs with all sub-processors | BAA repository |
| Art. 30 | Records of processing | Data flow mapping tool | Data inventory |
| Art. 32 | Security of processing | TLS + encryption + access controls | Security scan |
| Art. 33 | Breach notification | 72-hour notification procedure | Incident response |
| Art. 35 | DPIA | Conducted for patient data processing | DPIA document |
| Art. 37 | DPO appointment | DPO contact published | privacy@almokhtabar.sa |

### 6.3 Saudi NPHIES Requirements

| Requirement | Implementation | Verification |
|------------|---------------|--------------|
| Health data sovereignty (stored in KSA) | Primary region: me-south-1 (Bahrain/AWS) | AWS region verification |
| NPHIES message format (HL7 FHIR) | FHIR R4 API endpoints | FHIR validation tool |
| Patient identifier (NPHIES ID) | National ID / Iqama linkage | Identity verification flow |
| Claim submission format | Claim submission via NPHIES gateway | Integration test |
| Audit trail for health data access | Immutable audit log in database | Audit log review |
| Interoperability standards | HL7 FHIR + CDA support | Compliance audit |
| Data retention (25 years for KSA) | S3 Glacier for long-term archive | Lifecycle policy |

### 6.4 CCHI Requirements

| Requirement | Implementation |
|------------|---------------|
| Healthcare facility license | License number displayed on website footer |
| Professional licenses | Practitioner license verification API |
| Quality indicators | Published on public dashboard |
| Patient rights charter | Displayed in patient portal |
| Complaint handling | Complaint submission API + SLA tracking |
| Pricing transparency | Published price list for all lab tests |
| Waiting time standards | Appointment scheduling with time tracking |
| Infection control | Lab results with quality control indicators |

### 6.5 ZATCA E-Invoicing (Fatoora)

```typescript
// apps/backend/src/invoicing/zatca/zatca.service.ts

@Injectable()
export class ZatcaService {
  async generateInvoice(invoice: InvoiceDto): Promise<ZatcaInvoice> {
    // Phase 1 (current): Simplified e-invoice
    // Phase 2 (future): Real-time reporting for B2B

    const xmlInvoice = this.buildXml(invoice);
    const qrCode = this.generateQrCode(invoice);

    return {
      invoiceNumber: invoice.id,
      qrCode: qrCode, // Base64 PNG
      xmlHash: crypto.createHash('sha256').update(xmlInvoice).digest('hex'),
      generatedAt: new Date().toISOString(),
    };
  }

  private generateQrCode(invoice: InvoiceDto): string {
    // ZATCA QR code format (TLV encoding):
    // 1. Seller name (tag 1)
    // 2. VAT number (tag 2)
    // 3. Invoice timestamp (tag 3)
    // 4. Invoice total (tag 4)
    // 5. VAT total (tag 5)

    const tlvData = Buffer.concat([
      this.encodeTLV(1, 'Al Mokhtabar Laboratory'),
      this.encodeTLV(2, '310123456789012'), // VAT from ZATCA
      this.encodeTLV(3, new Date().toISOString()),
      this.encodeTLV(4, invoice.total.toFixed(2)),
      this.encodeTLV(5, invoice.vat.toFixed(2)),
    ]);

    // Base64-encoded TLV
    return tlvData.toString('base64');
  }

  private encodeTLV(tag: number, value: string): Buffer {
    const valueBuffer = Buffer.from(value, 'utf-8');
    const tagBuffer = Buffer.from([tag]);
    const lengthBuffer = Buffer.from([valueBuffer.length]);
    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
  }
}
```

---

*End of Server Security Hardening Guide. This document is confidential - do not distribute outside the devops and security teams. For questions, contact security@almokhtabar.sa*
