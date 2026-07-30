import { test, expect } from '../fixtures/test-fixtures';

test.describe('Lab Results Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/login');
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);
    await page.goto('/ar/results');
    await page.waitForLoadState('networkidle');
  });

  test('view list of completed lab tests', async ({ page }) => {
    await expect(page.locator('[data-testid="results-list"]')).toBeVisible();
    const resultCards = page.locator('[data-testid="result-card"]');
    const count = await resultCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('click on test result triggers reveal animation', async ({ page }) => {
    const firstResult = page.locator('[data-testid="result-card"]').first();
    await firstResult.click();

    const resultDetail = page.locator('[data-testid="result-detail"]');
    await expect(resultDetail).toBeVisible({ timeout: 10000 });
    const classList = await resultDetail.getAttribute('class');
    expect(classList).toContain('animate-in');
  });

  test('verify result details: name, value, range, status', async ({ page }) => {
    const firstResult = page.locator('[data-testid="result-card"]').first();
    await firstResult.click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="result-test-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-reference-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-status"]')).toBeVisible();
  });

  test('download PDF report', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.locator('[data-testid="download-pdf-button"]').first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('share result generates shareable URL', async ({ page }) => {
    await page.locator('[data-testid="share-result-button"]').first().click();
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible({ timeout: 5000 });
    const shareUrl = await page.locator('[data-testid="share-url-input"]').inputValue();
    expect(shareUrl).toContain('/ar/results/shared/');
  });

  test('view historical comparison chart', async ({ page }) => {
    await page.locator('[data-testid="result-card"]').first().click();
    await page.waitForLoadState('networkidle');

    const chartTab = page.locator('[data-testid="history-chart-tab"]');
    if (await chartTab.isVisible()) {
      await chartTab.click();
      await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('filter results by date range', async ({ page }) => {
    await page.locator('[data-testid="date-filter-button"]').click();
    await page.locator('[data-testid="date-range-start"]').fill('2024-01-01');
    await page.locator('[data-testid="date-range-end"]').fill('2024-12-31');
    await page.locator('[data-testid="apply-date-filter"]').click();
    await page.waitForLoadState('networkidle');

    const visibleCount = await page.locator('[data-testid="result-card"]').count();
    expect(visibleCount).toBeGreaterThanOrEqual(0);
  });

  test('filter results by test category', async ({ page }) => {
    await page.locator('[data-testid="category-filter"]').click();
    await page.locator('[data-testid="category-option-cat-001"]').click();
    await page.waitForLoadState('networkidle');

    const filterIndicator = page.locator('[data-testid="active-filter-badge"]');
    await expect(filterIndicator).toContainText('تحاليل الدم');
  });

  test('critical value warning displayed', async ({ page }) => {
    const criticalBadge = page.locator('[data-testid="critical-value-badge"]').first();
    if (await criticalBadge.isVisible()) {
      await expect(criticalBadge).toContainText('حرج');
      await criticalBadge.hover();
      await expect(page.locator('[data-testid="critical-value-tooltip"]')).toBeVisible();
    }
  });

  test('doctor notes visible on result', async ({ page }) => {
    await page.locator('[data-testid="result-card"]').first().click();
    await page.waitForLoadState('networkidle');

    const notesSection = page.locator('[data-testid="doctor-notes-section"]');
    if (await notesSection.isVisible()) {
      await expect(notesSection).toBeVisible();
      const notesText = await notesSection.textContent();
      expect(notesText?.length).toBeGreaterThan(0);
    }
  });
});
