const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://almokhtabar.com';
const API_URL = `${BASE_URL}/api/v1`;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const BASELINE_FILE = path.join(__dirname, '../../reports/benchmark-baseline.json');
const REPORT_FILE = path.join(__dirname, '../../reports/api-benchmark-results.json');

const ENDPOINTS = [
  { name: 'GET /health', method: 'GET', path: '/health', weight: 1 },
  { name: 'GET /branches', method: 'GET', path: '/branches?limit=20', weight: 3 },
  { name: 'GET /search/tests', method: 'GET', path: '/search/tests?q=blood&limit=10', weight: 3 },
  { name: 'GET /search/doctors', method: 'GET', path: '/search/doctors?specialty=Hematology', weight: 2 },
  { name: 'GET /appointments/slots', method: 'GET', path: '/appointments/slots?branchId=BR-0001&date=2026-08-01', weight: 3 },
  { name: 'POST /auth/login', method: 'POST', path: '/auth/login', weight: 5 },
  { name: 'POST /appointments', method: 'POST', path: '/appointments', weight: 4 },
  { name: 'GET /results', method: 'GET', path: '/results?patientId=PAT-001&limit=10', weight: 3 },
  { name: 'GET /results/:id/download', method: 'GET', path: '/results/R-BLD-001/download?format=pdf', weight: 2 },
  { name: 'POST /payments/stripe/charge', method: 'POST', path: '/payments/stripe/charge', weight: 2 },
  { name: 'GET /analytics/daily', method: 'GET', path: '/analytics/daily?metric=appointments&dateFrom=2026-01-01&dateTo=2026-07-30', weight: 1 },
];

function makeRequest(method, urlPath, body = null) {
  const url = new URL(`${API_URL}${urlPath}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ar-SA',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
      timeout: 30000,
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
        const durationMs = Number(end - start) / 1e6;
        const body = Buffer.concat(chunks).toString();
        resolve({
          status: res.statusCode,
          duration: durationMs,
          bodyLength: Buffer.byteLength(body),
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, duration: 30000, bodyLength: 0, headers: {}, error: 'timeout' });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function calculateStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  return {
    min: sorted[0],
    max: sorted[len - 1],
    avg: sorted.reduce((a, b) => a + b, 0) / len,
    median: len % 2 === 0 ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2 : sorted[Math.floor(len / 2)],
    p50: sorted[Math.floor(len * 0.50)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
    count: len,
    sum: sorted.reduce((a, b) => a + b, 0),
  };
}

function calculateThroughput(results, totalTimeMs) {
  const totalRequests = results.reduce((sum, r) => sum + r.samples.length, 0);
  return totalRequests / (totalTimeMs / 1000);
}

function loadBaseline() {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn(`Could not load baseline: ${e.message}`);
  }
  return null;
}

function compareWithBaseline(current, baseline) {
  const regressions = [];
  for (const endpoint of current) {
    const prev = baseline.find(b => b.name === endpoint.name);
    if (prev) {
      const diff = ((endpoint.p95 - prev.p95) / prev.p95) * 100;
      if (diff > 10) {
        regressions.push({
          endpoint: endpoint.name,
          previousP95: prev.p95,
          currentP95: endpoint.p95,
          diffPercent: diff.toFixed(2),
          status: 'FAIL',
        });
      }
    }
  }
  return regressions;
}

async function run() {
  console.log('========================================');
  console.log('  API Performance Benchmarks');
  console.log(`  Target: ${API_URL}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  const results = [];
  const SAMPLES_PER_ENDPOINT = 10;

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Benchmarking ${endpoint.name}... `);

    const samples = [];
    for (let i = 0; i < SAMPLES_PER_ENDPOINT; i++) {
      let body = null;
      if (endpoint.method === 'POST') {
        if (endpoint.path.includes('/auth/login')) {
          body = { email: 'benchmark@almokhtabar.com', password: 'Bench@1234' };
        } else if (endpoint.path.includes('/appointments')) {
          body = { branchId: 'BR-0001', serviceId: 'BLD-FULL', preferredDate: '2026-08-01', patientId: 'PAT-BENCH' };
        } else if (endpoint.path.includes('/payments/stripe/charge')) {
          body = { amount: 100, currency: 'SAR', paymentMethod: 'mada' };
        }
      }

      const result = await makeRequest(endpoint.method, endpoint.path, body);
      samples.push(result);
    }

    const durations = samples.map(s => s.duration);
    const statuses = samples.map(s => s.status);
    const bodyLengths = samples.map(s => s.bodyLength);

    const stats = calculateStats(durations);
    const errorRate = statuses.filter(s => s >= 400 || s === 0).length / statuses.length;

    results.push({
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      samples: samples.map(s => ({ duration: s.duration, status: s.status, bodyLength: s.bodyLength })),
      ...stats,
      errorRate,
      statuses: calculateStats(statuses),
      bodyLength: calculateStats(bodyLengths),
    });

    console.log(`p50=${stats.p50.toFixed(2)}ms, p95=${stats.p95.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms, errors=${(errorRate * 100).toFixed(1)}%`);
  }

  const totalTimeMs = results.reduce((sum, r) => sum + r.sum, 0);
  const throughput = calculateThroughput(results, totalTimeMs);

  const report = {
    timestamp: new Date().toISOString(),
    target: API_URL,
    totalEndpoints: ENDPOINTS.length,
    totalRequests: results.reduce((sum, r) => sum + r.count, 0),
    totalTimeMs: totalTimeMs.toFixed(2),
    throughputRps: throughput.toFixed(2),
    results,
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${REPORT_FILE}`);

  const baseline = loadBaseline();
  if (baseline) {
    console.log('\n--- Baseline Comparison ---');
    const regressions = compareWithBaseline(results, baseline.results || baseline);
    if (regressions.length > 0) {
      console.log('REGRESSIONS DETECTED (>10%):');
      regressions.forEach(r => {
        console.log(`  FAIL: ${r.endpoint} - ${r.previousP95.toFixed(2)}ms -> ${r.currentP95.toFixed(2)}ms (${r.diffPercent}%)`);
      });
      process.exitCode = 1;
    } else {
      console.log('No regressions detected. All within threshold.');
    }
  }

  // Save as new baseline
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(report, null, 2));
  console.log(`\nBaseline updated: ${BASELINE_FILE}`);

  console.log('\n========================================');
  console.log('  Benchmark Complete');
  console.log(`  Throughput: ${throughput.toFixed(2)} req/s`);
  console.log(`  Total time: ${(totalTimeMs / 1000).toFixed(2)}s`);
  console.log('========================================');
}

run().catch(console.error);
