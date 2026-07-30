import { test, expect } from '../fixtures/test-fixtures';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/login');
    await page.waitForLoadState('networkidle');
  });

  test('navigate to login page and verify RTL rendering', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-testid="login-title"]')).toBeVisible();
    const title = await page.locator('[data-testid="login-title"]').textContent();
    expect(title).toContain('تسجيل الدخول');
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/, { timeout: 15000 });
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('login with invalid credentials shows error message in Arabic', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('wrong@email.com');
    await page.locator('[data-testid="password-input"]').fill('WrongPass@123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('[data-testid="login-error"]').textContent();
    expect(errorText).toContain('بيانات الدخول غير صحيحة');
  });

  test('login with locked account shows locked message', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('locked@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('Locked@123');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.locator('[data-testid="account-locked-banner"]')).toBeVisible({ timeout: 10000 });
    const lockedText = await page.locator('[data-testid="account-locked-banner"]').textContent();
    expect(lockedText).toContain('حسابك مقفل');
  });

  test('forgot password sends email confirmation', async ({ page }) => {
    await page.locator('[data-testid="forgot-password-link"]').click();
    await page.waitForURL('/ar/forgot-password');
    await page.locator('[data-testid="forgot-email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="forgot-submit"]').click();
    await expect(page.locator('[data-testid="email-sent-confirmation"]')).toBeVisible({ timeout: 10000 });
    const confirmText = await page.locator('[data-testid="email-sent-confirmation"]').textContent();
    expect(confirmText).toContain('تم إرسال');
  });

  test('register new account sends verification email', async ({ page }) => {
    await page.locator('[data-testid="register-link"]').click();
    await page.waitForURL('/ar/register');
    await page.locator('[data-testid="register-name-input"]').fill('مستخدم جديد');
    await page.locator('[data-testid="register-email-input"]').fill(`newuser${Date.now()}@test.com`);
    await page.locator('[data-testid="register-phone-input"]').fill('+966501234568');
    await page.locator('[data-testid="register-password-input"]').fill('NewUser@123');
    await page.locator('[data-testid="register-confirm-password-input"]').fill('NewUser@123');
    await page.locator('[data-testid="register-submit"]').click();
    await expect(page.locator('[data-testid="verification-email-sent"]')).toBeVisible({ timeout: 15000 });
  });

  test('MFA setup displays QR code', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);

    await page.goto('/ar/settings/security');
    await page.locator('[data-testid="enable-mfa-button"]').click();
    await expect(page.locator('[data-testid="mfa-qr-code"]')).toBeVisible({ timeout: 10000 });
    const qrSrc = await page.locator('[data-testid="mfa-qr-code"] img').getAttribute('src');
    expect(qrSrc).toBeTruthy();
  });

  test('MFA verification with TOTP succeeds', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('mfa-user@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('MFAUser@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/mfa-challenge/);

    await page.locator('[data-testid="totp-input"]').fill('123456');
    await page.locator('[data-testid="totp-verify-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/, { timeout: 10000 });
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('password reset flow allows new password', async ({ page }) => {
    const resetToken = 'test-reset-token-valid';
    await page.goto(`/ar/reset-password?token=${resetToken}`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="new-password-input"]').fill('NewPass@123');
    await page.locator('[data-testid="confirm-password-input"]').fill('NewPass@123');
    await page.locator('[data-testid="reset-submit"]').click();
    await expect(page.locator('[data-testid="password-reset-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('session persists across page reload', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);

    await page.goto('/ar/appointments');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/ar/appointments');

    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/ar/appointments');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('logout redirects to login page', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="user-menu"]').click();
    await page.locator('[data-testid="logout-button"]').click();
    await page.waitForURL(/\/ar\/login/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/ar/admin/dashboard');
    await page.waitForURL(/\/ar\/login/, { timeout: 10000 });
    await expect(page.locator('[data-testid="login-title"]')).toBeVisible();
  });
});
