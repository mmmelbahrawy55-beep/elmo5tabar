import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, STAGES, THRESHOLDS, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '8m', target: 300 },
    { duration: '5m', target: 600 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.01'],
    search_branch_duration: ['p(95)<1000'],
    search_tests_duration: ['p(95)<1500'],
    search_doctors_duration: ['p(95)<1000'],
    search_results_duration: ['p(95)<2000'],
    fulltext_search_duration: ['p(95)<3000'],
    analytics_query_duration: ['p(95)<5000'],
  },
  tags: { service: 'search', environment: __ENV.ENV || 'staging' },
};

const branchSearchDuration = new Trend('search_branch_duration', true);
const testsSearchDuration = new Trend('search_tests_duration', true);
const doctorsSearchDuration = new Trend('search_doctors_duration', true);
const resultsSearchDuration = new Trend('search_results_duration', true);
const fulltextSearchDuration = new Trend('fulltext_search_duration', true);
const analyticsQueryDuration = new Trend('analytics_query_duration', true);
const searchErrors = new Rate('search_errors');

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Abha', 'Hail', 'Najran', 'Jizan', 'Qatif', 'Yanbu', 'Taif'];
const LAB_TESTS = ['Complete Blood Count', 'Lipid Profile', 'Thyroid Function', 'Liver Function', 'Kidney Function', 'Vitamin D', 'Iron Studies', 'HbA1c', 'Blood Glucose', 'Urinalysis', 'PSA', 'CA-125', 'Vitamin B12', 'Ferritin', 'CRP', 'ESR', 'D-Dimer', 'Prothrombin Time', 'INR', 'Blood Culture'];
const DOCTOR_SPECIALTIES = ['Hematology', 'Microbiology', 'Pathology', 'Biochemistry', 'Immunology', 'Genetics', 'Radiology', 'Endocrinology', 'Infectious Disease'];

function getHeaders() {
  return {
    ...AUTH_HEADERS,
    Authorization: `Bearer ${__ENV.AUTH_TOKEN || ''}`,
    'X-Request-Id': `search-${randomString(16)}`,
  };
}

function randomSearchQuery() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = randomIntBetween(2, 8);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomArabicText() {
  const arabicChars = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
  const length = randomIntBetween(4, 10);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += arabicChars[Math.floor(Math.random() * arabicChars.length)];
  }
  return result;
}

export function setup() {
  const health = http.get(`${API_URL}/health`, { headers: AUTH_HEADERS });
  check(health, { 'search service reachable': (r) => r.status === 200 });
  return {};
}

export default function () {
  const rand = Math.random();

  group('Search and Query Flow', function () {
    if (rand < 0.2) {
      group('Search Branches by Location', function () {
        const lat = 24.7136 + (Math.random() - 0.5) * 0.2;
        const lng = 46.6753 + (Math.random() - 0.5) * 0.2;
        const city = SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)];

        const params = new URLSearchParams({
          q: Math.random() > 0.5 ? city : randomArabicText(),
          lat: lat.toString(),
          lng: lng.toString(),
          radius: String(randomIntBetween(5, 50)),
          limit: '20',
          services: Math.random() > 0.5 ? 'blood_test,urinalysis' : undefined,
          openNow: Math.random() > 0.5 ? 'true' : undefined,
          hasParking: Math.random() > 0.7 ? 'true' : undefined,
          isWheelchairAccessible: Math.random() > 0.7 ? 'true' : undefined,
        });

        const res = http.get(`${API_URL}/search/branches?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'search_branches' },
        });

        branchSearchDuration.add(res.timings.duration);

        check(res, {
          'search branches status is 200': (r) => r.status === 200,
          'search branches has results': (r) => r.json('branches') !== undefined || r.json('results') !== undefined,
          'search branches response time < 1s': (r) => r.timings.duration < 1000,
        });
      });
    } else if (rand < 0.4) {
      group('Search Lab Tests', function () {
        const testName = LAB_TESTS[Math.floor(Math.random() * LAB_TESTS.length)];
        const query = Math.random() > 0.3 ? testName : testName.split(' ')[0];

        const params = new URLSearchParams({
          q: query,
          category: Math.random() > 0.5 ? 'hematology' : undefined,
          isHomeCollection: Math.random() > 0.5 ? 'true' : undefined,
          requiresFasting: Math.random() > 0.5 ? 'true' : undefined,
          priceMin: Math.random() > 0.7 ? '50' : undefined,
          priceMax: Math.random() > 0.7 ? '500' : undefined,
          sortBy: 'popularity',
          limit: '30',
          locale: Math.random() > 0.5 ? 'ar' : 'en',
        });

        const res = http.get(`${API_URL}/search/tests?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'search_tests' },
        });

        testsSearchDuration.add(res.timings.duration);
        searchErrors.add(res.status !== 200);

        check(res, {
          'search tests status is 200': (r) => r.status === 200,
          'search tests has tests': (r) => r.json('tests') !== undefined || r.json('results') !== undefined,
          'search tests has count': (r) => r.json('total') !== undefined || r.json('count') !== undefined,
          'search tests response time < 1500ms': (r) => r.timings.duration < 1500,
        });
      });
    } else if (rand < 0.55) {
      group('Search Doctors', function () {
        const specialty = DOCTOR_SPECIALTIES[Math.floor(Math.random() * DOCTOR_SPECIALTIES.length)];

        const params = new URLSearchParams({
          q: Math.random() > 0.5 ? specialty : randomArabicText(),
          specialty: Math.random() > 0.5 ? specialty : undefined,
          branchId: Math.random() > 0.5 ? `BR-${String(randomIntBetween(1, 50)).padStart(4, '0')}` : undefined,
          gender: Math.random() > 0.5 ? 'male' : 'female',
          language: Math.random() > 0.7 ? 'English' : undefined,
          availableToday: Math.random() > 0.5 ? 'true' : undefined,
          ratingMin: Math.random() > 0.7 ? '4' : undefined,
          limit: '20',
        });

        const res = http.get(`${API_URL}/search/doctors?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'search_doctors' },
        });

        doctorsSearchDuration.add(res.timings.duration);

        check(res, {
          'search doctors status is 200': (r) => r.status === 200,
          'search doctors has doctors': (r) => r.json('doctors') !== undefined || r.json('results') !== undefined,
          'search doctors response time < 1s': (r) => r.timings.duration < 1000,
        });
      });
    } else if (rand < 0.7) {
      group('Search Results by Date/Test', function () {
        const testTypes = ['BLD', 'URINE', 'CULTURE', 'PATHOLOGY'];
        const testType = testTypes[Math.floor(Math.random() * testTypes.length)];

        const params = new URLSearchParams({
          patientId: `PAT-${randomString(10)}`,
          q: Math.random() > 0.5 ? testType : randomSearchQuery(),
          dateFrom: '2025-06-01',
          dateTo: new Date().toISOString().split('T')[0],
          type: testType,
          status: 'final',
          sortBy: 'collectedAt',
          sortOrder: 'desc',
          page: '1',
          limit: '20',
        });

        const res = http.get(`${API_URL}/search/results?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'search_results' },
        });

        resultsSearchDuration.add(res.timings.duration);

        check(res, {
          'search results status is 200': (r) => r.status === 200,
          'search results has data': (r) => r.json('results') !== undefined || r.json('data') !== undefined,
          'search results response time < 2s': (r) => r.timings.duration < 2000,
        });
      });
    } else if (rand < 0.85) {
      group('Full-Text Search Patients', function () {
        const searchParams = new URLSearchParams({
          q: Math.random() > 0.5 ? `Ahmed ${randomSearchQuery()}` : randomArabicText(),
          fields: 'fullName,idNumber,phone,email',
          fuzzy: Math.random() > 0.5 ? 'true' : 'false',
          matchType: Math.random() > 0.5 ? 'phrase_prefix' : 'best_fields',
          page: '1',
          limit: '20',
        });

        const res = http.get(`${API_URL}/search/patients?${searchParams.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'fulltext_search' },
        });

        fulltextSearchDuration.add(res.timings.duration);

        check(res, {
          'fulltext search status is 200': (r) => r.status === 200,
          'fulltext search has results': (r) => r.json('patients') !== undefined || r.json('hits') !== undefined,
          'fulltext search response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else {
      group('Analytics Queries', function () {
        const reportType = ['daily', 'weekly', 'monthly', 'yearly', 'custom'][Math.floor(Math.random() * 5)];
        const metric = ['appointments', 'revenue', 'patients', 'tests', 'cancellations', 'no_shows'][Math.floor(Math.random() * 6)];

        const params = new URLSearchParams({
          type: reportType,
          metric: metric,
          branchId: Math.random() > 0.3 ? `BR-${String(randomIntBetween(1, 50)).padStart(4, '0')}` : undefined,
          dateFrom: '2026-01-01',
          dateTo: new Date().toISOString().split('T')[0],
          groupBy: Math.random() > 0.5 ? 'day' : 'branch',
          format: 'json',
        });

        const res = http.get(`${API_URL}/analytics/${reportType}?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'analytics_query' },
        });

        analyticsQueryDuration.add(res.timings.duration);

        check(res, {
          'analytics query status is 200': (r) => r.status === 200,
          'analytics query has data': (r) => r.json('data') !== undefined || r.json('results') !== undefined,
          'analytics query response time < 5s': (r) => r.timings.duration < 5000,
        });
      });
    }
  });

  sleep(randomIntBetween(1, 2));
}
