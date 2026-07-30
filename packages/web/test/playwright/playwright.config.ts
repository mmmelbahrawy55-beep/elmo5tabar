import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ['html', { outputFolder: '../../qa/reports/playwright' }],
    ['json', { outputFile: '../../qa/reports/playwright/results.json' }],
    ['junit', { outputFile: '../../qa/reports/playwright/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    permissions: ['geolocation'],
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'ar-SA' },
    },
    {
      name: 'chromium-en',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], locale: 'ar-SA' },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 15'], locale: 'ar-SA' },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
