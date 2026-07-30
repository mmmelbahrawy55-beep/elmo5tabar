import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, STAGES, THRESHOLDS, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: [
    { duration: '5m', target: 200 },
    { duration: '10m', target: 500 },
    { duration: '10m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'max<3000'],
    http_req_failed: ['rate<0.01'],
    slot_list_duration: ['p(95)<800'],
    appointment_create_duration: ['p(95)<1500'],
    appointment_reschedule_duration: ['p(95)<1500'],
    queue_position_duration: ['p(95)<500'],
  },
  tags: { service: 'appointments', environment: __ENV.ENV || 'staging' },
};

const slotListDuration = new Trend('slot_list_duration', true);
const appointmentCreateDuration = new Trend('appointment_create_duration', true);
const appointmentRescheduleDuration = new Trend('appointment_reschedule_duration', true);
const appointmentCancelDuration = new Trend('appointment_cancel_duration', true);
const queuePositionDuration = new Trend('queue_position_duration', true);
const historyDuration = new Trend('appointment_history_duration', true);
const createErrors = new Rate('appointment_create_errors');
const cancelErrors = new Rate('appointment_cancel_errors');
const rescheduleErrors = new Rate('appointment_reschedule_errors');

const BRANCH_IDS = Array.from({ length: 50 }, (_, i) => `BR-${String(i + 1).padStart(4, '0')}`);
const SERVICE_IDS = ['BLD-FULL', 'BLD-BASIC', 'URINE-COMP', 'THYROID', 'LIPID', 'LIVER', 'KIDNEY', 'DIABETES', 'VITAMIN-D', 'IRON-STUDY'];
const DOCTOR_IDS = Array.from({ length: 30 }, (_, i) => `DOC-${String(i + 1).padStart(4, '0')}`);

function getAuthToken() {
  return __ENV.AUTH_TOKEN || '';
}

function getHeaders() {
  return {
    ...AUTH_HEADERS,
    Authorization: `Bearer ${getAuthToken()}`,
    'X-Idempotency-Key': randomString(32),
  };
}

function randomFutureDate(daysAhead = 14) {
  const now = new Date();
  const future = new Date(now.getTime() + randomIntBetween(1, daysAhead) * 86400000);
  return future.toISOString().split('T')[0];
}

function randomTimeSlot() {
  const hours = [8, 9, 10, 11, 13, 14, 15, 16, 17];
  const hour = hours[Math.floor(Math.random() * hours.length)];
  return `${String(hour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;
}

export function setup() {
  const healthCheck = http.get(`${API_URL}/health`, { headers: AUTH_HEADERS });
  check(healthCheck, { 'API is reachable': (r) => r.status === 200 });

  const branch = http.get(`${API_URL}/branches?limit=1`, {
    headers: { ...AUTH_HEADERS, Authorization: `Bearer ${getAuthToken()}` },
  });

  return { branchCount: branch.json('total') || 50 };
}

export default function (data) {
  const rand = Math.random();
  const appointmentId = `APT-${Date.now()}-${randomString(8)}`;
  const patientId = `PAT-${randomString(10)}`;

  group('Appointment Workflow', function () {
    if (rand < 0.3) {
      group('List Available Slots', function () {
        const params = new URLSearchParams({
          branchId: BRANCH_IDS[Math.floor(Math.random() * BRANCH_IDS.length)],
          date: randomFutureDate(),
          serviceId: SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)],
          doctorId: DOCTOR_IDS[Math.floor(Math.random() * DOCTOR_IDS.length)],
        });

        const res = http.get(`${API_URL}/appointments/slots?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'list_slots' },
        });

        slotListDuration.add(res.timings.duration);

        check(res, {
          'list slots status is 200': (r) => r.status === 200,
          'list slots has data': (r) => r.json('slots') !== undefined,
          'list slots response time < 800ms': (r) => r.timings.duration < 800,
        });
      });
    } else if (rand < 0.55) {
      group('Create Appointment', function () {
        const payload = JSON.stringify({
          branchId: BRANCH_IDS[Math.floor(Math.random() * BRANCH_IDS.length)],
          serviceId: SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)],
          doctorId: DOCTOR_IDS[Math.floor(Math.random() * DOCTOR_IDS.length)],
          preferredDate: randomFutureDate(),
          preferredTime: randomTimeSlot(),
          patientId: patientId,
          patientPhone: `9665${Math.random().toString().slice(2, 11)}`,
          patientEmail: `patient.${randomString(8)}@example.com`,
          notes: Math.random() > 0.7 ? randomString(50) : '',
          isWalkIn: false,
          isUrgent: Math.random() > 0.9,
          source: 'web',
        });

        const res = http.post(`${API_URL}/appointments`, payload, {
          headers: getHeaders(),
          tags: { action: 'create_appointment' },
        });

        appointmentCreateDuration.add(res.timings.duration);
        createErrors.add(res.status !== 201);

        check(res, {
          'create appointment status is 201': (r) => r.status === 201,
          'create appointment has id': (r) => r.json('appointment.id') !== undefined,
          'create appointment has queue position': (r) => r.json('appointment.queuePosition') !== undefined,
          'create appointment response time < 1500ms': (r) => r.timings.duration < 1500,
        });
      });
    } else if (rand < 0.65) {
      group('Reschedule Appointment', function () {
        const targetId = `APT-${randomString(12)}`;

        const payload = JSON.stringify({
          appointmentId: targetId,
          newDate: randomFutureDate(21),
          newTime: randomTimeSlot(),
          reason: 'Work schedule conflict',
        });

        const res = http.put(`${API_URL}/appointments/${targetId}/reschedule`, payload, {
          headers: getHeaders(),
          tags: { action: 'reschedule_appointment' },
        });

        appointmentRescheduleDuration.add(res.timings.duration);
        rescheduleErrors.add(res.status !== 200);

        check(res, {
          'reschedule status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'reschedule response time < 1500ms': (r) => r.timings.duration < 1500,
        });
      });
    } else if (rand < 0.75) {
      group('Cancel Appointment', function () {
        const targetId = `APT-${randomString(12)}`;

        const payload = JSON.stringify({
          appointmentId: targetId,
          reason: Math.random() > 0.5 ? 'Patient request' : 'Doctor unavailable',
          notifyPatient: true,
        });

        const res = http.post(`${API_URL}/appointments/${targetId}/cancel`, payload, {
          headers: getHeaders(),
          tags: { action: 'cancel_appointment' },
        });

        appointmentCancelDuration.add(res.timings.duration);
        cancelErrors.add(res.status !== 200);

        check(res, {
          'cancel appointment status is 200 or 404': (r) => r.status === 200 || r.status === 404,
          'cancel response time < 1500ms': (r) => r.timings.duration < 1500,
        });
      });
    } else if (rand < 0.9) {
      group('Get Queue Position', function () {
        const branchId = BRANCH_IDS[Math.floor(Math.random() * BRANCH_IDS.length)];
        const serviceId = SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)];

        const res = http.get(`${API_URL}/appointments/queue?branchId=${branchId}&serviceId=${serviceId}&date=${randomFutureDate(1)}`, {
          headers: getHeaders(),
          tags: { action: 'queue_position' },
        });

        queuePositionDuration.add(res.timings.duration);

        check(res, {
          'queue position status is 200': (r) => r.status === 200,
          'queue position has data': (r) => r.json('queue') !== undefined,
          'queue position response time < 500ms': (r) => r.timings.duration < 500,
        });
      });
    } else {
      group('Get Appointment History', function () {
        const params = new URLSearchParams({
          patientId: patientId,
          page: String(randomIntBetween(1, 5)),
          limit: '20',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          status: Math.random() > 0.5 ? 'completed' : 'all',
        });

        const res = http.get(`${API_URL}/appointments/history?${params.toString()}`, {
          headers: getHeaders(),
          tags: { action: 'appointment_history' },
        });

        historyDuration.add(res.timings.duration);

        check(res, {
          'appointment history status is 200': (r) => r.status === 200,
          'appointment history has appointments': (r) => r.json('appointments') !== undefined,
          'appointment history response time < 1000ms': (r) => r.timings.duration < 1000,
        });
      });
    }
  });

  sleep(randomIntBetween(1, 2));
}

export function teardown(data) {
  console.log(`Completed appointment load test. Branches available: ${data.branchCount}`);
}
