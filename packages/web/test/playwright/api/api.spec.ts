import { test, expect } from '../fixtures/test-fixtures';

test.describe('API Integration Tests', () => {
  test.describe('Health Check', () => {
    test('GET /api/v1/health returns 200 with service statuses', async ({ request }) => {
      const response = await request.get('/api/v1/health');
      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('database');
      expect(body).toHaveProperty('redis');
      expect(body.database).toMatch(/connected|ok|healthy/i);
      expect(body.redis).toMatch(/connected|ok|healthy/i);
    });

    test('health endpoint returns within timeout', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('/api/v1/health');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
      expect(response.ok()).toBe(true);
    });
  });

  test.describe('Authentication', () => {
    test('POST /api/v1/auth/login returns tokens for valid credentials', async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: {
          email: 'patient@almokhtabar.com',
          password: 'TestPatient@123',
        },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', 'patient@almokhtabar.com');
    });

    test('POST /api/v1/auth/login returns 401 for invalid credentials', async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: {
          email: 'wrong@email.com',
          password: 'WrongPass@123',
        },
      });
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('POST /api/v1/auth/register creates new user', async ({ request }) => {
      const testEmail = `api-register-${Date.now()}@test.com`;
      const response = await request.post('/api/v1/auth/register', {
        data: {
          name: 'مستخدم API',
          email: testEmail,
          phone: '+966501234571',
          password: 'ApiReg@123',
        },
      });
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', testEmail);
      expect(body).toHaveProperty('verification_sent', true);
    });

    test('POST /api/v1/auth/register returns 409 for duplicate email', async ({ request }) => {
      const response = await request.post('/api/v1/auth/register', {
        data: {
          name: 'Duplicate User',
          email: 'patient@almokhtabar.com',
          phone: '+966501234572',
          password: 'Duplicate@123',
        },
      });
      expect(response.status()).toBe(409);
    });

    test('POST /api/v1/auth/refresh returns new tokens', async ({ request }) => {
      const loginResponse = await request.post('/api/v1/auth/login', {
        data: { email: 'patient@almokhtabar.com', password: 'TestPatient@123' },
      });
      const loginBody = await loginResponse.json();
      const refreshToken = loginBody.refresh_token;

      const response = await request.post('/api/v1/auth/refresh', {
        data: { refresh_token: refreshToken },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
    });
  });

  test.describe('Appointments', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: { email: 'patient@almokhtabar.com', password: 'TestPatient@123' },
      });
      const body = await response.json();
      authToken = body.access_token;
    });

    test('GET /api/v1/appointments returns paginated results', async ({ request }) => {
      const response = await request.get('/api/v1/appointments?page=1&limit=10', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toHaveProperty('page', 1);
      expect(body.pagination).toHaveProperty('limit', 10);
      expect(body.pagination).toHaveProperty('total');
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /api/v1/appointments returns 401 without auth', async ({ request }) => {
      const response = await request.get('/api/v1/appointments');
      expect(response.status()).toBe(401);
    });

    test('POST /api/v1/appointments creates booking', async ({ request }) => {
      const response = await request.post('/api/v1/appointments', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          branch_id: 'br-001',
          doctor_id: 'dr-001',
          date: '2024-12-20',
          time: '10:00',
          test_type: 'تحليل دم شامل',
        },
      });
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('status', 'confirmed');
    });
  });

  test.describe('Lab Results', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: { email: 'patient@almokhtabar.com', password: 'TestPatient@123' },
      });
      const body = await response.json();
      authToken = body.access_token;
    });

    test('GET /api/v1/results returns list', async ({ request }) => {
      const response = await request.get('/api/v1/results?page=1&limit=10', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /api/v1/results/:id returns result details', async ({ request }) => {
      const listResponse = await request.get('/api/v1/results?page=1&limit=1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const listBody = await listResponse.json();
      const resultId = listBody.data[0]?.id;

      if (resultId) {
        const response = await request.get(`/api/v1/results/${resultId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('id', resultId);
        expect(body).toHaveProperty('test_name');
        expect(body).toHaveProperty('value');
        expect(body).toHaveProperty('reference_range');
        expect(body).toHaveProperty('status');
      }
    });
  });

  test.describe('Payments', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: { email: 'patient@almokhtabar.com', password: 'TestPatient@123' },
      });
      const body = await response.json();
      authToken = body.access_token;
    });

    test('POST /api/v1/payments/create-intent returns client secret', async ({ request }) => {
      const response = await request.post('/api/v1/payments/create-intent', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          amount: 25000,
          currency: 'sar',
          invoice_id: 'inv-001',
        },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('client_secret');
      expect(body).toHaveProperty('payment_intent_id');
    });

    test('GET /api/v1/payments/history returns list', async ({ request }) => {
      const response = await request.get('/api/v1/payments/history?page=1&limit=10', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  test.describe('Notifications', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: { email: 'patient@almokhtabar.com', password: 'TestPatient@123' },
      });
      const body = await response.json();
      authToken = body.access_token;
    });

    test('GET /api/v1/notifications returns list', async ({ request }) => {
      const response = await request.get('/api/v1/notifications?page=1&limit=20', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
    });
  });

  test.describe('Rate Limiting', () => {
    test('rate limited endpoints return 429 after threshold', async ({ request }) => {
      const loginPayload = {
        email: 'patient@almokhtabar.com',
        password: 'WrongPass@123',
      };

      let rateLimited = false;
      for (let i = 0; i < 30; i++) {
        const response = await request.post('/api/v1/auth/login', { data: loginPayload });
        if (response.status() === 429) {
          rateLimited = true;
          const body = await response.json();
          expect(body).toHaveProperty('error');
          expect(body.error).toContain('rate');
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });
  });
});
