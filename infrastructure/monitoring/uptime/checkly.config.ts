import { Check, BrowserCheck, ApiCheck, CheckGroup, AlertChannel, SlackAlertChannel, EmailAlertChannel } from "checkly/constructs";

const alertChannels = [
  SlackAlertChannel({
    name: "production-slack",
    url: process.env.SLACK_WEBHOOK_URL ?? "",
    channel: "#uptime-alerts",
  }),
  EmailAlertChannel({
    name: "engineering-email",
    address: "engineering@almokhtabar.com",
  }),
];

const productionGroup = new CheckGroup("production-checks", {
  name: "Al Mokhtabar Production",
  locations: ["us-east-1", "eu-west-1", "me-central-1", "ap-southeast-1"],
  alertChannels,
  alertSettings: {
    escalationType: "RUN_BASED",
    runBasedEscalation: { failedRunCount: 2 },
    reminders: { amount: 3, interval: 300 },
  },
  tags: ["production", "almokhtabar"],
  environmentVariables: [
    { key: "BASE_URL", value: "https://almokhtabar.com" },
    { key: "API_URL", value: "https://almokhtabar.com/api/v1" },
  ],
});

// ---- Browser Checks ----

new BrowserCheck("login-flow", {
  name: "Login Flow - User Authentication",
  group: productionGroup,
  code: {
    entrypoint: "./checks/browser/login.spec.ts",
    content: `
import { BrowserCheck } from '@checkly/playwright/fixtures/monitor';
import { expect } from '@playwright/test';

const loginUrl = process.env.BASE_URL + '/login';

BrowserCheck('Login Flow', async ({ page }) => {
  const response = await page.goto(loginUrl, { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);

  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL ?? '');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD ?? '');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  expect(page.url()).toContain('/dashboard');

  await page.screenshot({ path: 'login-success.png' });
});
    `.trim(),
  },
  locations: ["us-east-1", "me-central-1"],
  frequency: 5,
  maxMatch: 2,
  retryStrategy: { type: "FIXED", baseBackoffSeconds: 10, maxRetries: 2, sameRegion: true },
});

new BrowserCheck("appointment-booking", {
  name: "Appointment Booking Flow",
  group: productionGroup,
  code: {
    entrypoint: "./checks/browser/appointment.spec.ts",
    content: `
import { BrowserCheck } from '@checkly/playwright/fixtures/monitor';
import { expect } from '@playwright/test';

BrowserCheck('Appointment Booking', async ({ page }) => {
  await page.goto(process.env.BASE_URL + '/appointments', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Book Appointment")');
  await page.fill('input[name="date"]', '2024-12-20');
  await page.selectOption('select[name="testType"]', 'blood-test');
  await page.click('button:has-text("Confirm")');
  await page.waitForSelector('text=Appointment Confirmed', { timeout: 10000 });
  await page.screenshot({ path: 'booking-success.png' });
});
    `.trim(),
  },
  frequency: 10,
});

new BrowserCheck("result-viewing", {
  name: "View Test Results",
  group: productionGroup,
  code: {
    entrypoint: "./checks/browser/results.spec.ts",
    content: `
import { BrowserCheck } from '@checkly/playwright/fixtures/monitor';
import { expect } from '@playwright/test';

BrowserCheck('View Results', async ({ page }) => {
  await page.goto(process.env.BASE_URL + '/results', { waitUntil: 'networkidle' });
  await page.waitForSelector('table', { timeout: 10000 });
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeGreaterThan(0);
  await page.click('table tbody tr:first-child a:has-text("View")');
  await page.waitForSelector('text=Test Details', { timeout: 10000 });
  await page.screenshot({ path: 'results-success.png' });
});
    `.trim(),
  },
  frequency: 10,
});

new BrowserCheck("payment-flow", {
  name: "Payment Processing Flow",
  group: productionGroup,
  code: {
    entrypoint: "./checks/browser/payment.spec.ts",
    content: `
import { BrowserCheck } from '@checkly/playwright/fixtures/monitor';
import { expect } from '@playwright/test';

BrowserCheck('Payment Flow', async ({ page }) => {
  await page.goto(process.env.BASE_URL + '/checkout', { waitUntil: 'networkidle' });
  await page.fill('input[name="cardNumber"]', '4242424242424242');
  await page.fill('input[name="expiry"]', '12/26');
  await page.fill('input[name="cvc"]', '123');
  await page.click('button:has-text("Pay Now")');
  await page.waitForSelector('text=Payment Successful', { timeout: 15000 });
  await page.screenshot({ path: 'payment-success.png' });
});
    `.trim(),
  },
  frequency: 15,
});

// ---- API Checks ----

new ApiCheck("health-check", {
  name: "API Health Check",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/health",
    assertions: [
      { source: "STATUS_CODE", property: "", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.status", comparison: "EQUALS", target: "healthy" },
      { source: "RESPONSE_TIME", property: "", comparison: "LESS_THAN", target: "500" },
    ],
  },
  frequency: 1,
});

new ApiCheck("login-endpoint", {
  name: "POST /api/v1/auth/login",
  group: productionGroup,
  request: {
    method: "POST",
    url: process.env.API_URL + "/auth/login",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify({
      email: process.env.TEST_USER_EMAIL ?? "",
      password: process.env.TEST_USER_PASSWORD ?? "",
    }),
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.token", comparison: "HAS_KEY" },
      { source: "RESPONSE_TIME", comparison: "LESS_THAN", target: "2000" },
    ],
  },
  frequency: 5,
});

new ApiCheck("appointments-endpoint", {
  name: "GET /api/v1/appointments",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/appointments",
    headers: [{ key: "Authorization", value: "Bearer ${AUTH_TOKEN}" }],
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "RESPONSE_TIME", comparison: "LESS_THAN", target: "1000" },
      { source: "JSON_BODY", property: "$.data", comparison: "IS_ARRAY" },
    ],
  },
  frequency: 5,
});

new ApiCheck("results-endpoint", {
  name: "GET /api/v1/results",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/results",
    headers: [{ key: "Authorization", value: "Bearer ${AUTH_TOKEN}" }],
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "RESPONSE_TIME", comparison: "LESS_THAN", target: "2000" },
    ],
  },
  frequency: 5,
});

new ApiCheck("profile-endpoint", {
  name: "GET /api/v1/profile",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/profile",
    headers: [{ key: "Authorization", value: "Bearer ${AUTH_TOKEN}" }],
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.name", comparison: "HAS_KEY" },
    ],
  },
  frequency: 10,
});

new ApiCheck("notifications-endpoint", {
  name: "GET /api/v1/notifications",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/notifications",
    headers: [{ key: "Authorization", value: "Bearer ${AUTH_TOKEN}" }],
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "RESPONSE_TIME", comparison: "LESS_THAN", target: "1500" },
    ],
  },
  frequency: 10,
});

// ---- Infrastructure Checks ----

new ApiCheck("ssl-certificate", {
  name: "SSL Certificate Check",
  group: productionGroup,
  request: {
    method: "GET",
    url: "https://almokhtabar.com",
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "SSL_CERTIFICATE", property: "validTo", comparison: "GREATER_THAN", target: `${Math.floor(Date.now() / 1000) + 2592000}` },
      { source: "SSL_CERTIFICATE", property: "issuer", comparison: "HAS_KEY" },
    ],
  },
  frequency: 60,
  locations: ["us-east-1", "eu-west-1", "me-central-1"],
});

new ApiCheck("dns-propagation", {
  name: "DNS Propagation Check",
  group: productionGroup,
  request: {
    method: "GET",
    url: "https://dns.google/resolve?name=almokhtabar.com&type=A",
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.Answer[0].data", comparison: "IS_IP" },
    ],
  },
  frequency: 60,
  locations: ["us-east-1", "eu-west-1", "ap-southeast-1", "sa-east-1", "me-central-1"],
});

new ApiCheck("cdn-edge-check", {
  name: "CDN Edge Cache Status",
  group: productionGroup,
  request: {
    method: "GET",
    url: "https://almokhtabar.com",
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "HEADERS", property: "x-cache", comparison: "MATCHES", target: "(Hit|Miss|RefreshHit)" },
      { source: "HEADERS", property: "cf-ray", comparison: "HAS_KEY" },
    ],
  },
  frequency: 10,
  locations: ["us-east-1", "eu-west-1", "me-central-1"],
});

new ApiCheck("postgres-connection", {
  name: "Database Connection Health",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/health/database",
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.database", comparison: "EQUALS", target: "connected" },
      { source: "RESPONSE_TIME", comparison: "LESS_THAN", target: "1000" },
    ],
  },
  frequency: 5,
});

new ApiCheck("redis-connection", {
  name: "Redis Connection Health",
  group: productionGroup,
  request: {
    method: "GET",
    url: process.env.API_URL + "/health/redis",
    assertions: [
      { source: "STATUS_CODE", comparison: "EQUALS", target: "200" },
      { source: "JSON_BODY", property: "$.redis", comparison: "EQUALS", target: "connected" },
    ],
  },
  frequency: 5,
});
