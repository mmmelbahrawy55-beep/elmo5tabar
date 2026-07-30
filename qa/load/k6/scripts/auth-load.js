import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.1/index.js';
import { BASE_URL, API_URL, STAGES, THRESHOLDS, AUTH_HEADERS } from '../config.js';

export const options = {
  stages: STAGES.stress,
  thresholds: {
    http_req_duration: ['p(95)<2000', 'max<5000'],
    http_req_failed: ['rate<0.01'],
    auth_register_duration: ['p(95)<3000'],
    auth_login_duration: ['p(95)<2000'],
    auth_mfa_duration: ['p(95)<3000'],
    auth_refresh_duration: ['p(95)<2000'],
    mfa_validation_errors: ['rate<0.05'],
  },
  tags: { service: 'auth', environment: __ENV.ENV || 'staging' },
};

const registerDuration = new Trend('auth_register_duration', true);
const loginDuration = new Trend('auth_login_duration', true);
const refreshDuration = new Trend('auth_refresh_duration', true);
const mfaDuration = new Trend('auth_mfa_duration', true);
const forgotPasswordDuration = new Trend('auth_forgot_password_duration', true);
const verifyEmailDuration = new Trend('auth_verify_email_duration', true);
const registerErrors = new Rate('auth_register_errors');
const loginErrors = new Rate('auth_login_errors');
const mfaValidationErrors = new Rate('auth_mfa_validation_errors');
const totalUsers = new Counter('auth_total_users_created');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
];

function randomPhone() {
  const prefix = '9665';
  const suffix = Math.random().toString().slice(2, 11);
  return `${prefix}${suffix}`;
}

function randomEmail() {
  const domains = ['gmail.com', 'outlook.sa', 'hotmail.com', 'yahoo.com'];
  return `test.${randomString(8)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function getHeaders(token) {
  return {
    ...AUTH_HEADERS,
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function setup() {
  const adminToken = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: __ENV.ADMIN_EMAIL || 'admin@almokhtabar.com',
    password: __ENV.ADMIN_PASSWORD || 'admin-password',
  }), { headers: AUTH_HEADERS });

  check(adminToken, {
    'admin login successful': (r) => r.status === 200,
  });

  return { adminToken: adminToken.json('token') };
}

export default function (data) {
  const rand = Math.random();
  const userEmail = randomEmail();
  const userPhone = randomPhone();
  const userPassword = `Test@${randomString(8)}`;
  const authState = {};

  group('Authentication Flow', function () {
    if (rand < 0.1) {
      group('Register', function () {
        const payload = JSON.stringify({
          email: userEmail,
          password: userPassword,
          phone: userPhone,
          fullName: `Test User ${randomString(6)}`,
          nationality: 'SA',
          dateOfBirth: '1990-01-15',
          idNumber: Math.random().toString().slice(2, 12),
          preferredLanguage: Math.random() > 0.5 ? 'ar' : 'en',
        });

        const res = http.post(`${API_URL}/auth/register`, payload, {
          headers: getHeaders(),
          tags: { action: 'register' },
        });

        registerDuration.add(res.timings.duration);
        registerErrors.add(res.status !== 201);

        check(res, {
          'register status is 201': (r) => r.status === 201,
          'register response has userId': (r) => r.json('user.id') !== undefined,
          'register response has token': (r) => r.json('token') !== undefined,
          'register response time < 3s': (r) => r.timings.duration < 3000,
        });

        if (res.status === 201) {
          totalUsers.add(1);
          authState.token = res.json('token');
          authState.userId = res.json('user.id');
          authState.refreshToken = res.json('refreshToken');
        }
      });
    } else if (rand < 0.5) {
      group('Login', function () {
        const credentials = [
          { email: __ENV.TEST_USER_1 || 'patient1@almokhtabar.com', password: __ENV.TEST_PASS_1 || 'Test@1234' },
          { email: __ENV.TEST_USER_2 || 'patient2@almokhtabar.com', password: __ENV.TEST_PASS_2 || 'Test@5678' },
        ];
        const cred = credentials[Math.floor(Math.random() * credentials.length)];

        const res = http.post(`${API_URL}/auth/login`, JSON.stringify({
          email: cred.email,
          password: cred.password,
          deviceId: randomString(16),
        }), {
          headers: getHeaders(),
          tags: { action: 'login' },
        });

        loginDuration.add(res.timings.duration);
        loginErrors.add(res.status !== 200);

        check(res, {
          'login status is 200': (r) => r.status === 200,
          'login has access token': (r) => r.json('token') !== undefined,
          'login has refresh token': (r) => r.json('refreshToken') !== undefined,
          'login response time < 2s': (r) => r.timings.duration < 2000,
        });

        if (res.status === 200) {
          authState.token = res.json('token');
          authState.refreshToken = res.json('refreshToken');
          authState.mfaRequired = res.json('mfaRequired') || false;
        }
      });
    } else if (rand < 0.7) {
      group('Refresh Token', function () {
        const refreshToken = authState.refreshToken || __ENV.REFRESH_TOKEN || 'dummy-refresh-token';

        const res = http.post(`${API_URL}/auth/refresh`, JSON.stringify({
          refreshToken: refreshToken,
        }), {
          headers: getHeaders(),
          tags: { action: 'refresh' },
        });

        refreshDuration.add(res.timings.duration);

        check(res, {
          'refresh status is 200': (r) => r.status === 200,
          'refresh has new token': (r) => r.json('token') !== undefined,
          'refresh response time < 2s': (r) => r.timings.duration < 2000,
        });

        if (res.status === 200) {
          authState.token = res.json('token');
        }
      });
    } else if (rand < 0.8) {
      group('Forgot Password', function () {
        const res = http.post(`${API_URL}/auth/forgot-password`, JSON.stringify({
          email: randomEmail(),
        }), {
          headers: getHeaders(),
          tags: { action: 'forgot_password' },
        });

        forgotPasswordDuration.add(res.timings.duration);

        check(res, {
          'forgot password status is 200 or 429': (r) => r.status === 200 || r.status === 429,
          'forgot password response time < 2s': (r) => r.timings.duration < 2000,
        });
      });
    } else if (rand < 0.9) {
      group('Verify Email', function () {
        const token = randomString(64);
        const res = http.post(`${API_URL}/auth/verify-email`, JSON.stringify({
          token: token,
          email: randomEmail(),
        }), {
          headers: getHeaders(),
          tags: { action: 'verify_email' },
        });

        verifyEmailDuration.add(res.timings.duration);

        check(res, {
          'verify email status is 200 or 400': (r) => r.status === 200 || r.status === 400,
          'verify email response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    } else {
      group('MFA Validate', function () {
        const mfaPayload = JSON.stringify({
          userId: authState.userId || 'dummy-user-id',
          code: String(randomIntBetween(100000, 999999)),
          method: Math.random() > 0.5 ? 'totp' : 'sms',
        });

        const res = http.post(`${API_URL}/auth/mfa/validate`, mfaPayload, {
          headers: getHeaders(authState.token),
          tags: { action: 'mfa_validate' },
        });

        mfaDuration.add(res.timings.duration);
        mfaValidationErrors.add(res.status !== 200);

        check(res, {
          'mfa validate status is 200 or 401': (r) => r.status === 200 || r.status === 401,
          'mfa validate response time < 3s': (r) => r.timings.duration < 3000,
        });
      });
    }
  });

  sleep(randomIntBetween(1, 3));
}

export function teardown(data) {
  const summary = http.get(`${API_URL}/auth/health`, {
    headers: { ...getHeaders(data.adminToken) },
  });

  check(summary, {
    'auth health endpoint reachable': (r) => r.status === 200,
  });
}
