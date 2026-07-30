import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import axios, { type AxiosInstance } from 'axios';

type UserRole = 'admin' | 'doctor' | 'patient';

interface TestData {
  admin: { email: string; password: string; name: string };
  doctor: { email: string; password: string; name: string };
  patient: { email: string; password: string; name: string; phone: string };
  branches: Array<{ id: string; nameAr: string; nameEn: string }>;
  testCategories: Array<{ id: string; nameAr: string; nameEn: string }>;
}

interface TestFixtures {
  authenticatedPage: { page: Page; role: UserRole; token: string };
  mobilePage: Page;
  apiClient: AxiosInstance;
  testData: TestData;
}

const SEEDED_TEST_DATA: TestData = {
  admin: { email: 'admin@almokhtabar.com', password: 'TestAdmin@123', name: 'المدير' },
  doctor: { email: 'doctor@almokhtabar.com', password: 'TestDoctor@123', name: 'د. أحمد' },
  patient: {
    email: 'patient@almokhtabar.com',
    password: 'TestPatient@123',
    name: 'محمد علي',
    phone: '+966501234567',
  },
  branches: [
    { id: 'br-001', nameAr: 'الرياض - الفرع الرئيسي', nameEn: 'Riyadh - Main Branch' },
    { id: 'br-002', nameAr: 'جدة - فرع السلامة', nameEn: 'Jeddah - Al-Salamah Branch' },
    { id: 'br-003', nameAr: 'الدمام - فرع الشاطئ', nameEn: 'Dammam - Al-Shati Branch' },
  ],
  testCategories: [
    { id: 'cat-001', nameAr: 'تحاليل الدم', nameEn: 'Blood Tests' },
    { id: 'cat-002', nameAr: 'تحاليل البول', nameEn: 'Urinalysis' },
    { id: 'cat-003', nameAr: 'الأشعة', nameEn: 'Radiology' },
  ],
};

async function loginAs(page: Page, email: string, password: string): Promise<string> {
  await page.goto('/ar/login');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="password-input"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  await page.waitForURL(/\/ar\/(dashboard|admin)/);
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  return token || '';
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const adminContext: BrowserContext = await browser.newContext({
      locale: 'ar-SA',
      storageState: undefined,
    });
    const adminPage: Page = await adminContext.newPage();
    const token = await loginAs(adminPage, SEEDED_TEST_DATA.admin.email, SEEDED_TEST_DATA.admin.password);
    await use({ page: adminPage, role: 'admin' as UserRole, token });
    await adminContext.close();
  },

  mobilePage: async ({ browser }, use) => {
    const mobileContext: BrowserContext = await browser.newContext({
      ...browser.contexts()[0]?._options,
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    const page: Page = await mobileContext.newPage();
    await use(page);
    await mobileContext.close();
  },

  apiClient: async ({ }, use) => {
    const client: AxiosInstance = axios.create({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    await use(client);
  },

  testData: async ({ }, use) => {
    await use(SEEDED_TEST_DATA);
  },
});

export { expect } from '@playwright/test';
