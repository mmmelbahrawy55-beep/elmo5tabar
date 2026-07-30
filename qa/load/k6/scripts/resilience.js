import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, AUTH_HEADERS } from '../config.js';

export const options = {
  vus: 50,
  duration: '15m',
  thresholds: {
    http_req_duration: ['p(95)<5000', 'max<10000'],
    http_req_failed: ['rate<0.05'],
    circuit_breaker_open: ['rate==0'],
    fallback_activated: ['rate<0.2'],
    retry_success_rate: ['rate>0.8'],
  },
  tags: { service: 'resilience', test_type: 'chaos', environment: __ENV.ENV || 'staging' },
};

const fallbackActivated = new Rate('fallback_activated');
const circuitBreakerOpen = new Rate('circuit_breaker_open');
const retrySuccessRate = new Rate('retry_success_rate');
const rateLimitDetected = new Rate('rate_limit_detected');
const authRefreshRecovery = new Trend('auth_refresh_recovery_time');
const malformedJsonErrors = new Rate('malformed_json_errors');

const SCENARIOS = [
  'redis_fallback',
  'replica_failover',
  'high_latency',
  'rate_limit',
  'token_expiry',
  'malformed_json',
];

function getHeaders(token) {
  return {
    ...AUTH_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Chaos-Test': 'true',
    'X-Request-Id': `chaos-${randomString(16)}`,
  };
}

export function setup() {
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER || 'admin@almokhtabar.com',
    password: __ENV.TEST_PASS || 'admin-password',
  }), { headers: AUTH_HEADERS });

  const token = loginRes.status === 200 ? loginRes.json('token') : '';

  return { token, startTime: Date.now() };
}

export default function (data) {
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

  group(`Chaos: ${scenario}`, function () {
    switch (scenario) {
      case 'redis_fallback':
        testRedisFallback(data);
        break;
      case 'replica_failover':
        testReplicaFailover(data);
        break;
      case 'high_latency':
        testHighLatency(data);
        break;
      case 'rate_limit':
        testRateLimit(data);
        break;
      case 'token_expiry':
        testTokenExpiry(data);
        break;
      case 'malformed_json':
        testMalformedJson(data);
        break;
    }
  });

  sleep(randomIntBetween(2, 5));
}

function testRedisFallback(data) {
  group('Redis Disconnect -> DB Fallback', function () {
    const res = http.get(`${API_URL}/appointments/queue?branchId=BR-0001&date=${new Date().toISOString().split('T')[0]}`, {
      headers: { ...getHeaders(data.token), 'X-Chaos-Inject': 'redis-disconnect' },
      tags: { scenario: 'redis_fallback' },
    });

    const isFallback = res.headers['X-Cache'] === 'db-fallback' ||
                       res.headers['X-Fallback'] === 'true' ||
                       res.json('_metadata')?.cacheLayer === 'db';

    if (isFallback) fallbackActivated.add(1);

    check(res, {
      'redis fallback status is 200': (r) => r.status === 200,
      'redis fallback returns valid data': (r) => r.json('queue') !== undefined || r.json('data') !== undefined,
      'redis fallback response time < 2s': (r) => r.timings.duration < 2000,
      'redis fallback activated': () => isFallback,
    });
  });
}

function testReplicaFailover(data) {
  group('Read Replica Down -> Primary Handles Reads', function () {
    const res = http.get(`${API_URL}/branches?limit=10`, {
      headers: { ...getHeaders(data.token), 'X-Chaos-Inject': 'replica-down' },
      tags: { scenario: 'replica_failover' },
    });

    check(res, {
      'replica failover status is 200': (r) => r.status === 200,
      'replica failover returns data': (r) => r.json('branches') !== undefined || r.json('data') !== undefined,
      'replica failover response time < 3s': (r) => r.timings.duration < 3000,
    });
  });
}

function testHighLatency(data) {
  group('High DB Latency -> Circuit Breaker', function () {
    const slowRes = http.get(`${API_URL}/search/tests?q=blood&delay=2000`, {
      headers: { ...getHeaders(data.token), 'X-Chaos-Inject': 'db-latency-2000ms' },
      tags: { scenario: 'high_latency_slow' },
      timeout: '10s',
    });

    const immediateRes = http.get(`${API_URL}/search/tests?q=blood`, {
      headers: { ...getHeaders(data.token) },
      tags: { scenario: 'high_latency_fast' },
      timeout: '5s',
    });

    const isCircuitOpen = slowRes.status === 503 ||
                          immediateRes.headers['X-Circuit-Breaker'] === 'open' ||
                          immediateRes.status === 503;

    if (isCircuitOpen) circuitBreakerOpen.add(1);

    check(slowRes, {
      'high latency request handled gracefully': (r) => r.status === 200 || r.status === 503 || r.status === 504,
    });

    check(immediateRes, {
      'immediate request after latency spike is 200': (r) => r.status === 200,
      'circuit breaker behavior observed': () => isCircuitOpen,
    });
  });
}

function testRateLimit(data) {
  group('Rate Limit Exceeded', function () {
    const requests = [];
    for (let i = 0; i < 110; i++) {
      requests.push(http.get(`${API_URL}/search/branches?q=Riyadh`, {
        headers: { ...getHeaders(data.token), 'X-Rate-Test': String(i) },
        tags: { scenario: 'rate_limit', requestIndex: String(i) },
      }));
    }

    const rateLimited = requests.filter(r => r.status === 429);

    if (rateLimited.length > 0) rateLimitDetected.add(1);

    const hasRetryAfter = rateLimited.some(r =>
      r.headers['Retry-After'] !== undefined || r.headers['retry-after'] !== undefined
    );

    check(requests[requests.length - 1], {
      'rate limit exceeded with 429': () => rateLimited.length > 0,
      'retry-after header present': () => hasRetryAfter,
      'rate limit response has retry metadata': (r) => r.body && (r.body.includes('retryAfter') || r.body.includes('retry_after')),
    });
  });
}

function testTokenExpiry(data) {
  group('Auth Token Expired -> Refresh Flow', function () {
    const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNTE2MjM5MDIyfQ.';

    const failedRes = http.get(`${API_URL}/appointments?limit=5`, {
      headers: { ...getHeaders(expiredToken) },
      tags: { scenario: 'token_expired_initial' },
    });

    check(failedRes, {
      'expired token returns 401': (r) => r.status === 401,
    });

    if (failedRes.status === 401 && data.token) {
      const refreshStart = Date.now();
      const refreshRes = http.post(`${API_URL}/auth/refresh`, JSON.stringify({
        refreshToken: __ENV.REFRESH_TOKEN || 'dummy-refresh',
      }), { headers: AUTH_HEADERS, tags: { scenario: 'token_refresh' } });

      authRefreshRecovery.add(Date.now() - refreshStart);

      if (refreshRes.status === 200) {
        const newToken = refreshRes.json('token');
        const retryRes = http.get(`${API_URL}/appointments?limit=5`, {
          headers: getHeaders(newToken),
          tags: { scenario: 'token_retry' },
        });

        retrySuccessRate.add(retryRes.status === 200);

        check(retryRes, {
          'retry after refresh succeeds': (r) => r.status === 200,
          'refresh recovery time < 2s': () => (Date.now() - refreshStart) < 2000,
        });
      }
    }
  });
}

function testMalformedJson(data) {
  group('Malformed JSON -> Validation Error', function () {
    const malformedPayloads = [
      '{invalid-json}',
      'not-json-at-all',
      '{"email": "not-an-email", "password": "short"}',
      '{"email": "test@test.com", "password": "12"}',
      '{"email": "", "password": ""}',
      '{"email": null, "password": 12345}',
      '{"email": "test@test.com", "password": "Test@1234", "__proto__": {"isAdmin": true}}',
      '{"email": "test@test.com", "password": "Test@1234", "constructor": {"prototype": {"isAdmin": true}}}',
      `${'A'.repeat(10001)}`,
    ];

    const payload = malformedPayloads[Math.floor(Math.random() * malformedPayloads.length)];

    const res = http.post(`${API_URL}/auth/register`, payload, {
      headers: getHeaders(data.token),
      tags: { scenario: 'malformed_json' },
    });

    const isValidError = res.status === 400 ||
                         res.status === 422 ||
                         res.status === 413;

    if (isValidError) malformedJsonErrors.add(1);

    check(res, {
      'malformed input returns appropriate error': (r) => isValidError,
      'error response has validation message': (r) => {
        if (!r.body) return false;
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined || body.error !== undefined || body.errors !== undefined;
        } catch {
          return false;
        }
      },
      'error content-type is json': (r) => (r.headers['Content-Type'] || '').includes('json'),
    });
  });
}

export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`Resilience test completed in ${duration}ms. All chaos scenarios executed.`);
}
