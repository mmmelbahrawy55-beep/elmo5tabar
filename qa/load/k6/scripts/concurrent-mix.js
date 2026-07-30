import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: [
    { duration: '10m', target: 2000 },
    { duration: '30m', target: 2000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000', 'max<10000'],
    http_req_failed: ['rate<0.02'],
    e2e_flow_duration: ['p(95)<15000'],
    appointment_booking_duration: ['p(95)<2000'],
    result_fetch_duration: ['p(95)<1500'],
    payment_processing_duration: ['p(95)<3000'],
  },
  tags: { service: 'concurrent-mix', environment: __ENV.ENV || 'staging' },
  userAgent: 'K6-MixedWorkload/1.0',
};

const e2eFlowDuration = new Trend('e2e_flow_duration', true);
const appointmentBookingDuration = new Trend('appointment_booking_duration', true);
const resultFetchDuration = new Trend('result_fetch_duration', true);
const paymentProcessingDuration = new Trend('payment_processing_duration', true);
const browseDuration = new Trend('browse_tests_duration', true);
const loginDuration = new Trend('login_duration', true);
const viewHistoryDuration = new Trend('view_history_duration', true);
const flowErrors = new Rate('e2e_flow_errors');
const successfulFlows = new Counter('successful_e2e_flows');
const failedFlows = new Counter('failed_e2e_flows');

const BRANCH_IDS = Array.from({ length: 50 }, (_, i) => `BR-${String(i + 1).padStart(4, '0')}`);
const SERVICE_IDS = ['BLD-FULL', 'BLD-BASIC', 'URINE-COMP', 'THYROID', 'LIPID', 'LIVER', 'KIDNEY', 'DIABETES', 'VITAMIN-D', 'IRON-STUDY'];
const DOCTOR_IDS = Array.from({ length: 30 }, (_, i) => `DOC-${String(i + 1).padStart(4, '0')}`);

function getHeaders(token) {
  return {
    ...AUTH_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Session-Id': `session-${randomString(16)}`,
  };
}

function randomPatientData() {
  return {
    patientId: `PAT-${randomString(10)}`,
    phone: `9665${Math.random().toString().slice(2, 11)}`,
    email: `patient.${randomString(8)}@example.com`,
    name: `Patient ${randomString(8)}`,
  };
}

export function setup() {
  const health = http.get(`${API_URL}/health`, { headers: AUTH_HEADERS });
  check(health, { 'API is reachable for mixed test': (r) => r.status === 200 });

  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER || 'mixed-test@almokhtabar.com',
    password: __ENV.TEST_PASS || 'Test@Mixed99',
  }), { headers: AUTH_HEADERS });

  const token = loginRes.status === 200 ? loginRes.json('token') : '';

  return {
    baseToken: token,
    patients: Array.from({ length: 100 }, () => randomPatientData()),
  };
}

export default function (data) {
  const startTime = Date.now();
  const patient = data.patients[Math.floor(Math.random() * data.patients.length)];
  let token = data.baseToken;
  const userSession = {
    token,
    patientId: patient.patientId,
    appointmentId: null,
    invoiceId: null,
    resultId: null,
  };

  let flowFailed = false;

  group('E2E Patient Journey', function () {
    group('Step 1: Login', function () {
      const res = http.post(`${API_URL}/auth/login`, JSON.stringify({
        email: patient.email || 'patient@almokhtabar.com',
        password: 'Test@1234',
      }), { headers: getHeaders(), tags: { step: 'login' } });

      loginDuration.add(res.timings.duration);

      if (res.status === 200) {
        userSession.token = res.json('token');
      }

      check(res, {
        'login successful': (r) => r.status === 200,
        'login response time < 2s': (r) => r.timings.duration < 2000,
      });

      if (res.status !== 200) flowFailed = true;
    });

    if (!flowFailed) {
      group('Step 2: Browse Lab Tests', function () {
        const res = http.get(`${API_URL}/search/tests?q=&limit=20&sortBy=popularity`, {
          headers: getHeaders(userSession.token),
          tags: { step: 'browse_tests' },
        });

        browseDuration.add(res.timings.duration);

        check(res, {
          'browse tests successful': (r) => r.status === 200,
          'browse tests has options': (r) => r.json('tests') !== undefined || r.json('results') !== undefined,
          'browse response time < 1s': (r) => r.timings.duration < 1000,
        });

        if (res.status !== 200) flowFailed = true;
      });
    }

    if (!flowFailed) {
      group('Step 3: Book Appointment', function () {
        const payload = JSON.stringify({
          branchId: BRANCH_IDS[Math.floor(Math.random() * BRANCH_IDS.length)],
          serviceId: SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)],
          doctorId: DOCTOR_IDS[Math.floor(Math.random() * DOCTOR_IDS.length)],
          preferredDate: new Date(Date.now() + randomIntBetween(1, 7) * 86400000).toISOString().split('T')[0],
          preferredTime: `${String(randomIntBetween(8, 17)).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
          patientId: patient.patientId,
          patientPhone: patient.phone,
          patientEmail: patient.email,
          source: 'web',
        });

        const res = http.post(`${API_URL}/appointments`, payload, {
          headers: { ...getHeaders(userSession.token), 'X-Idempotency-Key': randomString(32) },
          tags: { step: 'book_appointment' },
        });

        appointmentBookingDuration.add(res.timings.duration);

        if (res.status === 201) {
          userSession.appointmentId = res.json('appointment.id') || res.json('id');
        }

        check(res, {
          'appointment booking successful': (r) => r.status === 201,
          'appointment booking response time < 2s': (r) => r.timings.duration < 2000,
        });

        if (res.status !== 201) flowFailed = true;
      });
    }

    if (!flowFailed && userSession.appointmentId) {
      group('Step 4: View Queue Position', function () {
        const branchId = BRANCH_IDS[Math.floor(Math.random() * BRANCH_IDS.length)];

        const res = http.get(`${API_URL}/appointments/queue?branchId=${branchId}&date=${new Date().toISOString().split('T')[0]}`, {
          headers: getHeaders(userSession.token),
          tags: { step: 'view_queue' },
        });

        check(res, {
          'queue position fetched': (r) => r.status === 200,
          'queue response time < 500ms': (r) => r.timings.duration < 500,
        });

        if (res.status !== 200) flowFailed = true;
      });
    }

    if (!flowFailed) {
      group('Step 5: Receive Results', function () {
        const res = http.get(`${API_URL}/results?patientId=${patient.patientId}&limit=5`, {
          headers: getHeaders(userSession.token),
          tags: { step: 'fetch_results' },
        });

        resultFetchDuration.add(res.timings.duration);

        if (res.status === 200) {
          const results = res.json('results') || res.json('data') || [];
          if (results.length > 0) {
            userSession.resultId = results[0].id || results[0].resultId;
          }
        }

        check(res, {
          'results fetched': (r) => r.status === 200,
          'results response time < 1500ms': (r) => r.timings.duration < 1500,
        });

        if (res.status !== 200) flowFailed = true;
      });
    }

    if (!flowFailed) {
      group('Step 6: Make Payment', function () {
        const amount = [99, 149, 199, 299, 399][Math.floor(Math.random() * 5)];
        const payload = JSON.stringify({
          invoiceId: `INV-${Date.now()}-${randomString(8)}`,
          amount: amount,
          currency: 'SAR',
          paymentMethod: ['mada', 'visa', 'apple_pay'][Math.floor(Math.random() * 3)],
          source: 'web',
          description: 'Lab test payment',
        });

        const res = http.post(`${API_URL}/payments/stripe/charge`, payload, {
          headers: { ...getHeaders(userSession.token), 'X-Idempotency-Key': randomString(32) },
          tags: { step: 'make_payment' },
        });

        paymentProcessingDuration.add(res.timings.duration);

        if (res.status === 200 || res.status === 201) {
          userSession.invoiceId = res.json('transactionId') || res.json('id');
        }

        check(res, {
          'payment processed': (r) => r.status === 200 || r.status === 201,
          'payment response time < 3s': (r) => r.timings.duration < 3000,
        });

        if (res.status !== 200 && res.status !== 201) flowFailed = true;
      });
    }

    if (!flowFailed) {
      group('Step 7: View History', function () {
        const res = http.get(`${API_URL}/appointments/history?patientId=${patient.patientId}&limit=10`, {
          headers: getHeaders(userSession.token),
          tags: { step: 'view_history' },
        });

        viewHistoryDuration.add(res.timings.duration);

        check(res, {
          'history fetched': (r) => r.status === 200,
          'history response time < 1s': (r) => r.timings.duration < 1000,
        });

        if (res.status !== 200) flowFailed = true;
      });
    }
  });

  const totalDuration = Date.now() - startTime;
  e2eFlowDuration.add(totalDuration);

  if (flowFailed) {
    failedFlows.add(1);
    flowErrors.add(1);
  } else {
    successfulFlows.add(1);
  }

  check(null, {
    'e2e flow completed < 15s': () => totalDuration < 15000,
    'e2e flow completed successfully': () => !flowFailed,
  });

  sleep(randomIntBetween(2, 5));
}

export function teardown(data) {
  console.log(`Mixed workload test complete. ${data.patients.length} patient profiles used.`);
}
