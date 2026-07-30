import { test, expect } from '../fixtures/test-fixtures';

test.describe('Internationalization', () => {
  test('switch language from AR to EN updates URL', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.locator('[data-testid="language-switcher"]').click();
    await page.locator('[data-testid="lang-option-en"]').click();
    await page.waitForURL(/\/en\//, { timeout: 10000 });

    expect(page.url()).toContain('/en/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('switch from EN to AR updates URL and direction', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.locator('[data-testid="language-switcher"]').click();
    await page.locator('[data-testid="lang-option-ar"]').click();
    await page.waitForURL(/\/ar\//, { timeout: 10000 });

    expect(page.url()).toContain('/ar/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('all static text is translated in AR', async ({ page }) => {
    await page.goto('/ar/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="login-title"]')).toContainText('تسجيل الدخول');
    await expect(page.locator('[data-testid="email-label"]')).toContainText('البريد الإلكتروني');
    await expect(page.locator('[data-testid="password-label"]')).toContainText('كلمة المرور');
    await expect(page.locator('[data-testid="login-submit"]')).toContainText('دخول');
  });

  test('all static text is translated in EN', async ({ page }) => {
    await page.goto('/en/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="login-title"]')).toContainText('Login');
    await expect(page.locator('[data-testid="email-label"]')).toContainText('Email');
    await expect(page.locator('[data-testid="password-label"]')).toContainText('Password');
    await expect(page.locator('[data-testid="login-submit"]')).toContainText('Sign In');
  });

  test('date formats change between AR and EN', async ({ page }) => {
    await page.goto('/ar/appointments');
    await page.waitForLoadState('networkidle');
    const arDate = await page.locator('[data-testid="current-date-display"]').textContent();
    expect(arDate).toBeTruthy();

    await page.goto('/en/appointments');
    await page.waitForLoadState('networkidle');
    const enDate = await page.locator('[data-testid="current-date-display"]').textContent();
    expect(enDate).toBeTruthy();

    expect(arDate).not.toEqual(enDate);
  });

  test('number formats differ between AR and EN', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForLoadState('networkidle');

    const arPrice = await page.locator('[data-testid="invoice-amount"]').first().textContent();
    await page.goto('/en/payments');
    await page.waitForLoadState('networkidle');
    const enPrice = await page.locator('[data-testid="invoice-amount"]').first().textContent();

    expect(await isArabicNumerals(arPrice!)).toBe(true);
    expect(await isArabicNumerals(enPrice!)).toBe(false);
  });

  test('RTL/LTR direction switches correctly', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    let bodyDir = await page.locator('body').evaluate(el => getComputedStyle(el).direction);
    expect(bodyDir).toBe('rtl');

    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    bodyDir = await page.locator('body').evaluate(el => getComputedStyle(el).direction);
    expect(bodyDir).toBe('ltr');
  });

  test('logo and text alignment changes with direction', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');
    const arLogoBox = await page.locator('[data-testid="header-logo"]').boundingBox();

    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const enLogoBox = await page.locator('[data-testid="header-logo"]').boundingBox();

    expect(arLogoBox!.x).toBeGreaterThan(enLogoBox!.x);
  });

  test('forms validation messages in correct language', async ({ page }) => {
    await page.goto('/ar/register');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="register-submit"]').click();
    await page.waitForTimeout(500);
    const arValidation = await page.locator('[data-testid="field-error"]').first().textContent();
    expect(arValidation).toBeTruthy();

    await page.goto('/en/register');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="register-submit"]').click();
    await page.waitForTimeout(500);
    const enValidation = await page.locator('[data-testid="field-error"]').first().textContent();
    expect(enValidation).toBeTruthy();

    expect(arValidation).not.toEqual(enValidation);
  });
});

async function isArabicNumerals(text: string): Promise<boolean> {
  const arabicDigits = /[٠-٩]/;
  return arabicDigits.test(text);
}
