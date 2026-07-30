import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, STAGES, THRESHOLDS, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'max<4000'],
    http_req_failed: ['rate<0.01'],
    result_list_duration: ['p(95)<1000'],
    result_detail_duration: ['p(95)<1000'],
    result_download_duration: ['p(95)<3000'],
    result_share_duration: ['p(95)<2000'],
  },
  tags: { service: 'results', environment: __ENV.ENV || 'staging' },
};

const listDuration = new Trend('result_list_duration', true);
const detailDuration = new Trend('result_detail_duration', true);
const downloadDuration = new Trend('result_download_duration', true);
const comparisonDuration = new Trend('result_comparison_duration', true);
const shareDuration = new Trend('result_share_duration', true);
const verifyDuration = new Trend('result_verify_duration', true);
const downloadErrors = new Rate('result_download_errors');

const RESULT_TYPES = ['BLD', 'URINE', 'CULTURE', 'PATHOLOGY', 'RADIOLOGY', 'GENETIC'];
const RESULT_STATUSES = ['final', 'preliminary', 'amended', 'cancelled'];

function getHeaders() {
  return {
    ...AUTH_HEADERS,
    Authorization: `Bearer ${__ENV.AUTH_TOKEN || ''}`,
    'X-Trace-Id': `trace-${randomString(16)}`,
  };
}

function generateResultId() {
  const prefixes = ['R-BLD', 'R-URN', 'R-CUL', 'R-PTH', 'R-RAD', 'R-GEN'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}-${Date.now()}-${randomString(8)}`;
}

export function setup() {
  const health = http.get(`${API_URL}/health`, { headers: AUTH_HEADERS });
  check(health, { 'result service reachable': (r) => r.status === 200 });
  return {};
}

export default function () {
  const rand = Math.random();
  const resultId = generateResultId();
  const patientId = `PAT-${randomString(10)}`;

  group('Result Viewing Flow', function () {
    if (rand < 0.3) {
      group('List Results', function () {
        const params = new URLSearchParams({
          patientId: patientId,
          page: String(randomIntBetween(1, 10)),
          limit: '20',
          type: RESULT_TYPES[Math.floor(Math.random() * RESULT_TYPES.length)],
          status: RESULT_STATUSES[Math.floor(Math.random() * RESULT_STATUSES.length)],
          sortBy: 'collectedAt',
          sortOrder: 'desc',
          dateFrom: '2025-01-01',
          dateTo: new Date().toISOString().split('T')[0],
        });

        const res = http.get(`${API_URL}/results?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'list_results' },
        });

        listDuration.add(res.timings.duration);

        check(res, {
          'list results status is 200': (r) => r.status === 200,
          'list results has data': (r) => r.json('results') !== undefined || r.json('data') !== undefined,
          'list results has pagination': (r) => r.json('total') !== undefined || r.json('pagination') !== undefined,
          'list results response time < 1s': (r) => r.timings.duration < 1000,
        });
      });
    } else if (rand < 0.55) {
      group('View Result Detail', function () {
        const res = http.get(`${API_URL}/results/${resultId}`, {
          headers: getHeaders(),
          tags: { action: 'view_result_detail' },
        });

        detailDuration.add(res.timings.duration);

        check(res, {
          'result detail status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'result detail response time < 1s': (r) => r.timings.duration < 1000,
        });

        if (res.status === 200) {
          check(res, {
            'result has test details': (r) => r.json('tests') !== undefined || r.json('analytes') !== undefined,
            'result has reference ranges': (r) => r.json('referenceRanges') !== undefined,
          });
        }
      });
    } else if (rand < 0.7) {
      group('Download PDF', function () {
        const format = Math.random() > 0.3 ? 'pdf' : 'csv';
        const res = http.get(`${API_URL}/results/${resultId}/download?format=${format}`, {
          headers: getHeaders(),
          tags: { action: 'download_pdf' },
          responseType: 'text',
        });

        downloadDuration.add(res.timings.duration);
        downloadErrors.add(res.status !== 200);

        check(res, {
          'download status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'download response time < 3s': (r) => r.timings.duration < 3000,
        });

        if (res.status === 200) {
          check(res, {
            'download has content-type': (r) => r.headers['Content-Type'] !== undefined,
            'download has content-length': (r) => parseInt(r.headers['Content-Length'] || '0') > 0,
          });
        }
      });
    } else if (rand < 0.8) {
      group('View Comparison', function () {
        const comparisonType = Math.random() > 0.5 ? 'historical' : 'range';

        let url;
        if (comparisonType === 'historical') {
          url = `${API_URL}/results/${resultId}/comparison?type=historical&months=${randomIntBetween(1, 12)}`;
        } else {
          url = `${API_URL}/results/${resultId}/comparison?type=range&start=2025-01-01&end=${new Date().toISOString().split('T')[0]}`;
        }

        const res = http.get(url, {
          headers: getHeaders(),
          tags: { action: 'view_comparison' },
        });

        comparisonDuration.add(res.timings.duration);

        check(res, {
          'comparison status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'comparison response time < 2s': (r) => r.timings.duration < 2000,
        });
      });
    } else if (rand < 0.9) {
      group('Share Result Link', function () {
        const payload = JSON.stringify({
          resultId: resultId,
          expiresInHours: randomIntBetween(1, 72),
          password: Math.random() > 0.3 ? randomString(12) : undefined,
          allowedViews: ['view', 'download'],
          notifyViaEmail: Math.random() > 0.5,
          recipientEmail: `recipient.${randomString(8)}@example.com`,
        });

        const res = http.post(`${API_URL}/results/${resultId}/share`, payload, {
          headers: getHeaders(),
          tags: { action: 'share_result' },
        });

        shareDuration.add(res.timings.duration);

        check(res, {
          'share result status is 201 or 404': (r) => r.status === 201 || r.status === 404,
          'share result has share link': (r) => r.status !== 201 || r.json('shareUrl') !== undefined,
          'share result response time < 2s': (r) => r.timings.duration < 2000,
        });
      });
    } else {
      group('Verify Signature', function () {
        const signatureToken = randomString(128);
        const res = http.get(`${API_URL}/results/verify?token=${signatureToken}&resultId=${resultId}`, {
          headers: getHeaders(),
          tags: { action: 'verify_signature' },
        });

        verifyDuration.add(res.timings.duration);

        check(res, {
          'verify signature status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'verify signature response time < 2s': (r) => r.timings.duration < 2000,
        });
      });
    }
  });

  sleep(randomIntBetween(1, 3));
}
