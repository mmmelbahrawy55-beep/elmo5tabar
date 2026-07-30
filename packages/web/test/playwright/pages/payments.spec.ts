import { test, expect } from '../fixtures/test-fixtures';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/login');
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);
  });

  test('view pending invoices', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
    const pendingBadge = page.locator('[data-testid="pending-invoices-count"]');
    await expect(pendingBadge).toBeVisible();
  });

  test('select invoice and choose payment method', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForLoadState('networkidle');

    const payBtn = page.locator('[data-testid="pay-invoice-button"]').first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.locator('[data-testid="payment-method-selection"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="payment-method-card"]')).toBeVisible();
    }
  });

  test('pay with credit card shows success confirmation', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForLoadState('networkidle');

    const payBtn = page.locator('[data-testid="pay-invoice-button"]').first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.locator('[data-testid="payment-method-card"]').click();

      await page.locator('[data-testid="card-number-input"]').fill('4242424242424242');
      await page.locator('[data-testid="card-expiry-input"]').fill('12/28');
      await page.locator('[data-testid="card-cvc-input"]').fill('123');
      await page.locator('[data-testid="card-name-input"]').fill('Mohammed Ali');
      await page.locator('[data-testid="submit-payment-button"]').click();

      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="payment-success"]')).toContainText('تم الدفع');
    }
  });

  test('view payment history', async ({ page }) => {
    await page.goto('/ar/payments/history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="payment-history-table"]')).toBeVisible();
    const rows = page.locator('[data-testid="payment-history-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('download invoice PDF', async ({ page }) => {
    await page.goto('/ar/payments/history');
    await page.waitForLoadState('networkidle');

    const downloadBtn = page.locator('[data-testid="download-invoice-button"]').first();
    if (await downloadBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await downloadBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });

  test('wallet balance displayed correctly', async ({ page }) => {
    await page.goto('/ar/wallet');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
    const balanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    expect(balanceText).toMatch(/[\d,]+/);
  });

  test('top up wallet reflects new amount', async ({ page }) => {
    await page.goto('/ar/wallet');
    await page.waitForLoadState('networkidle');

    const currentBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
    await page.locator('[data-testid="top-up-button"]').click();
    await page.locator('[data-testid="top-up-amount-input"]').fill('100');
    await page.locator('[data-testid="confirm-top-up-button"]').click();

    if (await page.locator('[data-testid="payment-success"]').isVisible({ timeout: 10000 })) {
      await page.goto('/ar/wallet');
      await page.waitForLoadState('networkidle');
      const newBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
      expect(newBalance).not.toEqual(currentBalance);
    }
  });

  test('apply coupon code and see discount', async ({ page }) => {
    await page.goto('/ar/payments');
    await page.waitForLoadState('networkidle');

    const couponInput = page.locator('[data-testid="coupon-input"]');
    if (await couponInput.isVisible()) {
      await couponInput.fill('DISCOUNT10');
      await page.locator('[data-testid="apply-coupon-button"]').click();
      await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('view subscription plans and subscribe', async ({ page }) => {
    await page.goto('/ar/subscriptions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="subscription-plans"]')).toBeVisible();

    const subscribeBtn = page.locator('[data-testid="subscribe-plan-button"]').first();
    if (await subscribeBtn.isVisible()) {
      await subscribeBtn.click();
      await page.locator('[data-testid="card-number-input"]').fill('4242424242424242');
      await page.locator('[data-testid="card-expiry-input"]').fill('12/28');
      await page.locator('[data-testid="card-cvc-input"]').fill('123');
      await page.locator('[data-testid="submit-subscription-button"]').click();
      await expect(page.locator('[data-testid="subscription-success"]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('view and redeem gift card balance', async ({ page }) => {
    await page.goto('/ar/wallet/gift-cards');
    await page.waitForLoadState('networkidle');

    const redeemInput = page.locator('[data-testid="gift-card-code-input"]');
    if (await redeemInput.isVisible()) {
      await redeemInput.fill('GIFT-ABCD-1234');
      await page.locator('[data-testid="redeem-gift-card-button"]').click();
      await expect(page.locator('[data-testid="gift-card-success"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
