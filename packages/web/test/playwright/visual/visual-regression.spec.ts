import { test, expect } from '../fixtures/test-fixtures';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState('networkidle');
  });

  test('home page screenshot matches baseline', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-page.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('login page screenshot matches baseline', async ({ page }) => {
    await page.goto('/ar/login');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('appointment calendar screenshot matches baseline', async ({ page }) => {
    await page.goto('/ar/appointments');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="appointment-calendar"]')).toHaveScreenshot('appointment-calendar.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('results page with animation captured', async ({ page }) => {
    await page.goto('/ar/results');
    await page.waitForTimeout(1000);

    await page.locator('[data-testid="result-card"]').first().click();
    await page.waitForTimeout(1500);

    await expect(page.locator('[data-testid="result-detail"]')).toHaveScreenshot('result-detail-animated.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    });
  });

  test('payment checkout form screenshot', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForTimeout(500);

    const payBtn = page.locator('[data-testid="pay-invoice-button"]').first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="payment-form"]')).toHaveScreenshot('payment-checkout.png', {
        maxDiffPixelRatio: 0.1,
      });
    }
  });

  test('admin dashboard screenshot', async ({ page }) => {
    await page.goto('/ar/login');
    await page.locator('[data-testid="email-input"]').fill('admin@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestAdmin@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/admin/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('mobile home page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ar');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('mobile-home.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('mobile login page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ar/login');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('mobile-login.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('RTL vs LTR comparison on home page', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-rtl.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });

    await page.goto('/en');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-ltr.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: true,
    });
  });

  test('dark mode vs light mode comparison', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForTimeout(500);

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const currentTheme = isDark ? 'dark' : 'light';

      await expect(page).toHaveScreenshot(`home-${currentTheme}.png`, {
        maxDiffPixelRatio: 0.1,
        fullPage: true,
      });

      await themeToggle.click();
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot(`home-${currentTheme === 'dark' ? 'light' : 'dark'}.png`, {
        maxDiffPixelRatio: 0.1,
        fullPage: true,
      });
    }
  });
});
