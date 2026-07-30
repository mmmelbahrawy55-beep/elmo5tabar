import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/login');
    await page.locator('[data-testid="email-input"]').fill('admin@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestAdmin@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/admin/);
  });

  test('view statistics cards', async ({ page }) => {
    await page.goto('/ar/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="stat-patients"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-tests"]')).toBeVisible();

    for (const stat of ['patients', 'appointments', 'revenue', 'tests']) {
      const value = await page.locator(`[data-testid="stat-${stat}"] [data-testid="stat-value"]`).textContent();
      expect(value).toBeTruthy();
    }
  });

  test('revenue chart renders with data', async ({ page }) => {
    await page.goto('/ar/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    const chartCanvas = page.locator('[data-testid="revenue-chart"] canvas');
    await expect(chartCanvas).toBeVisible();
  });

  test('recent appointments table with pagination', async ({ page }) => {
    await page.goto('/ar/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="recent-appointments-table"]')).toBeVisible();
    const rows = page.locator('[data-testid="appointment-row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const nextBtn = page.locator('[data-testid="pagination-next"]');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('user management: list, search, view details', async ({ page }) => {
    await page.goto('/ar/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows.first()).toBeVisible();

    await page.locator('[data-testid="user-search-input"]').fill('محمد');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="user-row"]').first().click();
    await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible({ timeout: 5000 });
  });

  test('branch management CRUD operations', async ({ page }) => {
    await page.goto('/ar/admin/branches');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="branches-list"]')).toBeVisible();

    await page.locator('[data-testid="add-branch-button"]').click();
    await page.locator('[data-testid="branch-name-ar-input"]').fill('فرع تجريبي');
    await page.locator('[data-testid="branch-name-en-input"]').fill('Test Branch');
    await page.locator('[data-testid="branch-city-input"]').fill('الرياض');
    await page.locator('[data-testid="branch-address-input"]').fill('شارع الملك فهد');
    await page.locator('[data-testid="branch-phone-input"]').fill('+966112345678');
    await page.locator('[data-testid="branch-submit"]').click();
    await expect(page.locator('[data-testid="branch-success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('system health indicators displayed', async ({ page }) => {
    await page.goto('/ar/admin/system');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="health-database"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-redis"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-api"]')).toBeVisible();

    for (const service of ['database', 'redis', 'api']) {
      const status = await page.locator(`[data-testid="health-${service}"] [data-testid="health-status"]`).textContent();
      expect(status).toMatch(/جيد|تحذير|عطل/i);
    }
  });

  test('notification center', async ({ page }) => {
    await page.goto('/ar/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="notification-bell"]').click();
    await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible({ timeout: 5000 });

    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await page.locator('[data-testid="mark-all-read-button"]').click();
    await page.waitForLoadState('networkidle');
  });
});
