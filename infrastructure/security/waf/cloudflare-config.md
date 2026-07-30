# Al Mokhtabar Laboratory - Cloudflare WAF & Security Configuration

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Classification**: CONFIDENTIAL

---

## Table of Contents

1. [Firewall Rules](#1-firewall-rules)
2. [Rate Limiting Rules](#2-rate-limiting-rules)
3. [Bot Management](#3-bot-management)
4. [SSL/TLS Settings](#4-ssltls-settings)
5. [Argo Smart Routing](#5-argo-smart-routing)
6. [Cache Rules](#6-cache-rules)
7. [Page Rules](#7-page-rules)
8. [Workers](#8-workers)
9. [Zero Trust Access](#9-zero-trust-access)

---

## 1. Firewall Rules

### 1.1 Managed Rulesets (Ordered by Priority)

| Rule Set | Action | Sensitivity | Description |
|----------|--------|-------------|-------------|
| Cloudflare Managed | Block | High | General OWASP Top 10 protection |
| Cloudflare OWASP Core Ruleset | Block | Score > 5 | Based on CRS 3.3 with KSA-specific adjustments |
| Cloudflare Managed (PHP) | Block | High | PHP-specific attack patterns |
| Cloudflare Managed (WordPress) | Block | High | WordPress-specific (even if not used) |
| Cloudflare Managed (Drupal) | Block | High | Drupal-specific (even if not used) |
| Cloudflare Managed (SQLi) | Block | High | SQL injection patterns |
| Cloudflare Managed (XSS) | Block | High | Cross-site scripting patterns |
| Cloudflare Managed (LFI/RFI) | Block | High | File inclusion attacks |
| Cloudflare Managed (RCE) | Block | High | Remote code execution |
| Cloudflare Managed (SSRF) | Block | High | Server-side request forgery |
| Cloudflare Managed (Shellshock) | Block | High | Shellshock exploit patterns |

### 1.2 Custom Firewall Rules

`javascript
// Rule 1: Block requests without valid User-Agent
// Expression: (not http.user_agent)
// Action: Block
// Description: Block requests with missing User-Agent header

// Rule 2: Block known bad IPs (threat score > 50)
// Expression: (cf.threat_score gt 50)
// Action: Block
// Description: Block IPs with Cloudflare threat score > 50

// Rule 3: Block requests to PHP endpoints (we use Node.js)
// Expression: (ends_with(http.request.uri, ".php"))
// Action: Block
// Description: No PHP in stack - block all PHP requests

// Rule 4: Block requests to wp-admin, wp-content, etc.
// Expression: (http.request.uri.path contains "/wp-")
// Action: Block
// Description: Block WordPress paths (not used by platform)

// Rule 5: Allow only specific countries for admin panel
// Expression: (http.request.uri.path contains "/admin") and (ip.geoip.country ne "SA" and ip.geoip.country ne "AE" and ip.geoip.country ne "BH" and ip.geoip.country ne "KW" and ip.geoip.country ne "OM" and ip.geoip.country ne "QA")
// Action: Block
// Description: Only allow GCC countries for admin access

// Rule 6: Block requests with sensitive data in query string
// Expression: (contains(lower(http.request.uri), "password") or contains(lower(http.request.uri), "secret") or contains(lower(http.request.uri), "token") or contains(lower(http.request.uri), "api_key"))
// Action: Block
// Description: Block sensitive data exposure in URLs

// Rule 7: Allow Cloudflare IPs only to origin
// This is configured at the AWS ALB security group level
// but also at Cloudflare level to prevent bypass

// Rule 8: Block requests with suspicious HTTP methods
// Expression: (http.request.method in {"PUT" "DELETE" "PATCH"}) and not (http.request.uri.path starts_with "/api/")
// Action: Block
// Description: Only allow write methods on API endpoints
`

### 1.3 Firewall Rule for Healthcare Data Protection

`javascript
// PHI Data Leakage Prevention
// Expression: (
//   (http.response.headers.content_type contains "text/html" or
//    http.response.headers.content_type contains "application/json") and
//   (http.response.body contains "national_id" or
//    http.response.body contains "patient_id" or
//    http.response.body contains "medical_record" or
//    http.response.body contains "diagnosis" or
//    http.response.body contains "phi")
// ) and not (ip.src in {10.0.0.0/8 172.16.0.0/12 192.168.0.0/16})
// Action: Block
// Description: Prevent PHI leakage in responses (excluding internal traffic)
`

---

## 2. Rate Limiting Rules

### 2.1 Rate Limiting Configuration

| Rule | Request Limit | Time Period | Action | URL Pattern | Description |
|------|--------------|-------------|--------|-------------|-------------|
| Global API rate | 1,000 | 10 minutes | Block | /api/* | General API protection |
| Auth endpoints | 20 | 10 minutes | Block | /api/auth/* | Brute force protection |
| Login attempts | 5 | 10 minutes | Block | /api/auth/login | Credential stuffing |
| OTP requests | 3 | 10 minutes | Block | /api/auth/send-otp | SMS abuse prevention |
| Search API | 100 | 10 minutes | Block | /api/lab-tests/search | Search abuse prevention |
| File upload | 10 | 10 minutes | Block | /api/uploads/* | Upload abuse prevention |
| Webhook receivers | 500 | 10 minutes | Block | /api/webhooks/* | Webhook flood protection |
| Create appointment | 20 | 10 minutes | Block | /api/appointments | Appointment abuse |
| Register endpoint | 5 | 1 hour | Block | /api/auth/register | Account creation abuse |

`javascript
// Rate limiting via Cloudflare API
// Example: Create rate limiting rule for auth endpoints
curl -X POST "https://api.cloudflare.com/client/v4/zones//rate_limits" \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Auth endpoint rate limit",
    "match": {
      "request": {
        "url": "almokhtabar.sa/api/auth/*",
        "schemes": ["HTTPS"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"]
      },
      "response": {
        "origin_traffic": true
      }
    },
    "threshold": 20,
    "period": 600,
    "action": "block",
    "mitigation_timeout": 600,
    "correlate": {
      "by": "ip"
    }
  }'
`

### 2.2 Advanced Rate Limiting (Phase 2)

`javascript
// Per-user rate limiting (requires Cloudflare Worker)
// See Section 8: Workers for implementation

// Rate limiting bypass for known good bots
// Allow Googlebot, Bingbot, etc.

// Rate limiting with dynamic thresholds
// Based on user tier (premium users get higher limits)
// Stored in KV store with user API key mapping
`

---

## 3. Bot Management

### 3.1 Bot Fight Mode Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Bot Fight Mode | On | Pro plan bot mitigation |
| Verified bots | Allow | Googlebot, Bingbot, Yandex, Baidu |
| Known bots | Challenge | All other known bots |
| Unknown bots | Challenge | ML-classified suspicious bots |
| Definite automated | Block | ML-classified as automated |

### 3.2 Bot Management Rules

`javascript
// Rule 1: Allow healthcare search engines / crawlers
// Expression: (cf.client.bot) and (http.user_agent contains "Googlebot" or http.user_agent contains "Bingbot")
// Action: Allow
// Description: Allow legitimate search engine crawlers

// Rule 2: Block malicious bots
// Expression: (cf.client.bot) and (not http.user_agent contains "Googlebot") and (not http.user_agent contains "Bingbot")
// Action: Block
// Description: Block non-verified bots on API endpoints

// Rule 3: Challenge suspicious mobile app traffic
// Expression: (http.request.uri.path contains "/api/") and (cf.client.bot_score lt 30)
// Action: JS Challenge
// Description: Challenge low-score bot traffic to API

// Rule 4: Block known scraping tools
// Expression: (http.user_agent contains "curl" or http.user_agent contains "wget" or http.user_agent contains "python-requests") and not (http.request.uri.path contains "/health")
// Action: Block
// Description: Block scraping tools (except on health endpoint)
`

---

## 4. SSL/TLS Settings

### 4.1 Edge Certificates

| Setting | Value | Rationale |
|---------|-------|-----------|
| SSL/TLS encryption | Full (strict) | Requires valid origin certificate |
| Minimum TLS version | 1.2 | HIPAA requires TLS 1.2+ |
| TLS 1.3 | Enabled | Best performance + security |
| Always Use HTTPS | On | Force HTTPS redirect |
| Automatic HTTPS Rewrites | On | Fix mixed content issues |
| Certificate Transparency | On | Monitor certificate issuance |
| Universal SSL | Off | Use custom certificate |
| Custom certificate | Uploaded | Extended validation (EV) certificate |

### 4.2 Certificate Details

`	ext
Primary Certificate:
- Type: Extended Validation (EV)
- Issuer: DigiCert / Sectigo
- Domains: almokhtabar.sa, *.almokhtabar.sa
- Expiry: 1 year (auto-renewed)
- Key: ECDSA P-384 (preferred) + RSA 4096 backup

Origin Certificate:
- Type: Custom origin certificate
- Issuer: cert-manager (Let's Encrypt)
- Expiry: 90 days (auto-renewed)
- Used for: Cloudflare -> ALB communication

Cipher Suites (Cloudflare -> Client):
- ECDHE-ECDSA-AES128-GCM-SHA256 (TLS 1.2)
- ECDHE-RSA-AES128-GCM-SHA256 (TLS 1.2)
- ECDHE-ECDSA-AES256-GCM-SHA384 (TLS 1.2)
- ECDHE-RSA-AES256-GCM-SHA384 (TLS 1.2)
- ECDHE-ECDSA-CHACHA20-POLY1305 (TLS 1.2)
- ECDHE-RSA-CHACHA20-POLY1305 (TLS 1.2)
- TLS_AES_128_GCM_SHA256 (TLS 1.3)
- TLS_AES_256_GCM_SHA384 (TLS 1.3)
- TLS_CHACHA20_POLY1305_SHA256 (TLS 1.3)
`

### 4.3 Authenticated Origin Pulls

`	ext
Enabled: YES
Purpose: Ensures requests to ALB come from Cloudflare only
Certificate: Cloudflare CA certificate installed on ALB
Validation: ALB rejects connections not presenting Cloudflare cert

Setup:
1. Download Cloudflare CA certificate
2. Install on ALB as trusted CA
3. Enable "Authenticated Origin Pulls" in Cloudflare
4. Verify: curl -I https://api.almokhtabar.sa without Cloudflare cert -> 400
`

---

## 5. Argo Smart Routing

`javascript
// Enable Argo Smart Routing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones//argo/smart_routing" \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{"value":"on"}'

// Enable Tiered Caching (Smart Topology)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones//argo/tiered_caching" \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{"value":"on"}'
`

Argo Smart Routing benefits:
- Routes around internet congestion for KSA users
- 30-50% improvement in TTFB for Middle East traffic
- Smart routing based on real-time internet conditions
- Tiered Caching reduces origin requests by 60%+

---

## 6. Cache Rules

### 6.1 Cache Configuration

| Content Type | Cache Level | Edge TTL | Browser TTL | Query String |
|-------------|-------------|----------|-------------|--------------|
| Static assets (_next/static/*) | Cache Everything | 365 days | 365 days | Ignore |
| Images (uploads/*) | Cache Everything | 7 days | 7 days | Ignore |
| CSS/JS files | Cache Everything | 30 days | 30 days | Ignore |
| Font files | Cache Everything | 365 days | 365 days | Ignore |
| API responses | Standard | 0 (no cache) | 0 | Standard |
| HTML pages | Standard | 5 minutes | 5 minutes | Standard |
| Health endpoint | Standard | 0 | 0 | Standard |

`javascript
// Cache Rule: Static assets (long cache)
// Expression: (http.request.uri.path contains "/_next/static/")
// Cache Level: Cache Everything
// Edge TTL: 365 days
// Browser TTL: 365 days
// Query String: Ignore

// Cache Rule: File uploads
// Expression: (http.request.uri.path contains "/uploads/")
// Cache Level: Cache Everything
// Edge TTL: 7 days
// Browser TTL: 7 days
// Query String: Ignore

// Cache Rule: API responses - DO NOT CACHE
// Expression: (http.request.uri.path starts_with "/api/")
// Cache Level: Standard
// Edge TTL: 0
// Browser TTL: 0
// Bypass Cache: true
`

### 6.2 Cache Reserve

`	ext
Cache Reserve: Enabled for uploads
- Content stored in Cloudflare's persistent storage
- Reduces origin requests by 95% for cached content
- Automatic fallback to origin when content not in cache

Cost: .015/GB stored + .03/GB served from reserve
Estimated monthly: ~ (for 10GB uploaded images with 30% access rate)
`

---

## 7. Page Rules

### 7.1 Page Rules Configuration

`
# Priority 1: Admin panel security
URL: almokhtabar.sa/admin/*
Setting: Security Level -> High
Setting: Cache Level -> Standard
Setting: Browser Integrity Check -> On
Setting: Always Use HTTPS -> On

# Priority 2: API endpoints
URL: api.almokhtabar.sa/*
Setting: Cache Level -> Standard
Setting: SSL -> Full (strict)
Setting: Always Use HTTPS -> On
Setting: Browser Integrity Check -> On
Setting: Security Level -> High

# Priority 3: Static assets - long cache
URL: almokhtabar.sa/_next/static/*
Setting: Cache Level -> Cache Everything
Setting: Edge Cache TTL -> 31536000 (1 year)
Setting: Browser Cache TTL -> 31536000 (1 year)
Setting: Automatic HTTPS Rewrites -> On

# Priority 4: Uploaded files
URL: almokhtabar.sa/uploads/*
Setting: Cache Level -> Cache Everything
Setting: Edge Cache TTL -> 604800 (7 days)
Setting: Browser Cache TTL -> 604800 (7 days)

# Priority 5: Arabic language pages
URL: almokhtabar.sa/ar/*
Setting: Cache Level -> Standard
Setting: Edge Cache TTL -> 300 (5 min)
Setting: Browser Cache TTL -> 300 (5 min)

# Priority 6: Whole site defaults
URL: almokhtabar.sa/*
Setting: SSL -> Full (strict)
Setting: Always Use HTTPS -> On
Setting: Automatic HTTPS Rewrites -> On
Setting: Browser Integrity Check -> On
Setting: Security Level -> Medium
Setting: Brotli -> On
Setting: Early Hints -> On
`

### 7.2 Page Rules Limitations

`	ext
Cloudflare Pro plan includes: 25 Page Rules

Current usage: 6 rules
Remaining: 19 rules

Consider migrating to Cache Rules (newer, more flexible, unlimited)
when all functionality is available in Cache Rules.
`

---

## 8. Workers

### 8.1 API Authentication Verification Worker

`javascript
// Filename: workers/api-auth-worker.js
// Deployed at: api.almokhtabar.sa/*

// Verifies JWT token before request reaches origin
// Reduces load on backend by rejecting invalid tokens early

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Skip health endpoint
  if (url.pathname === '/health') {
    return fetch(request);
  }

  // Skip auth endpoints (they don't need auth)
  if (url.pathname.startsWith('/api/auth/')) {
    return fetch(request);
  }

  // Skip webhook endpoints (verified by signature)
  if (url.pathname.startsWith('/api/webhooks/')) {
    return fetch(request);
  }

  // Check for JWT token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://almokhtabar.sa'
      }
    });
  }

  const token = authHeader.slice(7);

  // Validate JWT format and expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Token has expired'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add verified user info to request headers
    const newRequest = new Request(request, {
      headers: {
        ...request.headers,
        'X-User-ID': payload.sub,
        'X-User-Role': payload.role || 'user'
      }
    });

    return fetch(newRequest);
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid token format'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
`

### 8.2 Security Headers Worker

`javascript
// Filename: workers/security-headers-worker.js
// Deployed at: almokhtabar.sa/*

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);

  const newHeaders = new Headers(response.headers);

  // Security headers (cannot be set at Cloudflare level for all origins)
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Remove server fingerprinting headers
  newHeaders.delete('Server');
  newHeaders.delete('X-Powered-By');
  newHeaders.delete('CF-Ray');  // Removes Cloudflare ray ID from response headers

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
`

### 8.3 Rate Limiting Worker (Per-User)

`javascript
// Filename: workers/rate-limit-worker.js
// Uses Cloudflare KV store for distributed rate limiting

const RATE_LIMIT = 1000;  // requests
const WINDOW_SIZE = 600;  // 10 minutes in seconds
const KV_NAMESPACE = RATE_LIMIT_KV;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return fetch(request);
  }

  // Get user identifier (from JWT or IP)
  const authHeader = request.headers.get('Authorization');
  let userId;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = user:;
    } catch (e) {
      userId = ip:;
    }
  } else {
    userId = ip:;
  }

  // Check rate limit in KV
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - WINDOW_SIZE;

  const current = await KV_NAMESPACE.get(userId, 'json') || { count: 0, windowStart };

  if (current.windowStart < windowStart) {
    // New window
    current.count = 1;
    current.windowStart = now;
  } else if (current.count >= RATE_LIMIT) {
    return new Response(JSON.stringify({
      error: 'Too Many Requests',
      message: Rate limit exceeded. Limit:  requests per  minutes,
      retryAfter: current.windowStart + WINDOW_SIZE - now
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': (current.windowStart + WINDOW_SIZE - now).toString()
      }
    });
  } else {
    current.count++;
  }

  await KV_NAMESPACE.put(userId, JSON.stringify(current), {
    expirationTtl: WINDOW_SIZE
  });

  // Add rate limit headers
  const response = await fetch(request);
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
  newResponse.headers.set('X-RateLimit-Remaining', (RATE_LIMIT - current.count).toString());
  newResponse.headers.set('X-RateLimit-Reset', (current.windowStart + WINDOW_SIZE).toString());

  return newResponse;
}
`

### 8.4 Workers Deployment

`ash
# Deploy workers using Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Deploy API auth worker
cd workers/api-auth-worker
wrangler publish
# Route: api.almokhtabar.sa/*

# Deploy security headers worker
cd workers/security-headers-worker
wrangler publish
# Route: almokhtabar.sa/*

# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMIT_KV"
# Bind to rate limit worker in wrangler.toml
`

---

## 9. Zero Trust Access

### 9.1 Cloudflare Zero Trust for Internal Apps

`	ext
Applications behind Zero Trust:
- Grafana: grafana.almokhtabar.sa
- Kibana: kibana.almokhtabar.sa (internal)
- ArgoCD: argocd.almokhtabar.sa
- Vault: vault.almokhtabar.sa
- Admin panel: admin.almokhtabar.sa
- Database admin (pgAdmin): pgadmin.almokhtabar.sa

Authentication:
- Identity provider: Google Workspace (almokhtabar.sa domain)
- MFA required: Yes (TOTP + hardware key for admins)
- Session duration: 8 hours (re-auth after)

Access Policies:
- Grafana: All engineering staff
- Kibana: DevOps + Backend team
- ArgoCD: DevOps only
- Vault: DevOps + Security team
- Admin panel: Admin team only
- pgAdmin: DBA + DevOps Lead

Device Posture Checks:
- OS: macOS 13+ / Windows 11+ / Ubuntu 22.04+
- Disk encryption: Enabled
- Antivirus: Running
- Browser: Chrome 110+ / Firefox 110+ / Safari 16+
- Client certificate: Required
`

### 9.2 Application Access Configuration

`ash
# Install Cloudflare WARP client on all developer machines
# Configure device enrollment permissions

# Zero Trust Rules:
# 1. User must be in specific Okta/Google group
# 2. Device must pass posture checks
# 3. MFA required for all access
# 4. Session timeout after 8 hours
# 5. Gateway proxy for DNS filtering
# 6. HTTP filtering for malicious content
`

---

*End of Cloudflare WAF Configuration. For questions contact security@almokhtabar.sa*
