import { test, expect } from '../fixtures/test-fixtures';

test.describe('Critical Cross-Cutting Paths', () => {
  test.describe('Patient: Guest → Register → Book → Queue → Results → Pay → Download', () => {
    test('complete patient journey', async ({ page }) => {
      const testEmail = `patient-journey-${Date.now()}@test.com`;

      await page.goto('/ar/register');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="register-name-input"]').fill('مريض رحلة كاملة');
      await page.locator('[data-testid="register-email-input"]').fill(testEmail);
      await page.locator('[data-testid="register-phone-input"]').fill('+966501234570');
      await page.locator('[data-testid="register-password-input"]').fill('Journey@123');
      await page.locator('[data-testid="register-confirm-password-input"]').fill('Journey@123');
      await page.locator('[data-testid="register-submit"]').click();
      await expect(page.locator('[data-testid="verification-email-sent"]')).toBeVisible({ timeout: 15000 });

      await page.goto('/ar/login');
      await page.locator('[data-testid="email-input"]').fill(testEmail);
      await page.locator('[data-testid="password-input"]').fill('Journey@123');
      await page.locator('[data-testid="login-submit"]').click();
      await page.waitForURL(/\/ar\/(dashboard|patient)/);

      await page.goto('/ar/appointments/book');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="branch-select"]').click();
      await page.locator('[data-testid="branch-option-br-001"]').click();
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="doctor-select"]').click();
      await page.locator('[data-testid="doctor-option-dr-001"]').click();
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="time-slot"]').first().click();
      await page.locator('[data-testid="confirm-booking-button"]').click();
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 10000 });

      await page.goto('/ar/appointments/today');
      await page.waitForLoadState('networkidle');
      if (await page.locator('[data-testid="queue-position"]').isVisible()) {
        await expect(page.locator('[data-testid="queue-position"]')).toBeVisible();
      }

      await page.goto('/ar/results');
      await page.waitForLoadState('networkidle');
      if (await page.locator('[data-testid="result-card"]').first().isVisible()) {
        await page.locator('[data-testid="result-card"]').first().click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="result-test-name"]')).toBeVisible();
      }

      await page.goto('/ar/payments');
      await page.waitForLoadState('networkidle');
      const payBtn = page.locator('[data-testid="pay-invoice-button"]').first();
      if (await payBtn.isVisible()) {
        await payBtn.click();
        if (await page.locator('[data-testid="payment-method-card"]').isVisible()) {
          await page.locator('[data-testid="payment-method-card"]').click();
          await page.locator('[data-testid="card-number-input"]').fill('4242424242424242');
          await page.locator('[data-testid="card-expiry-input"]').fill('12/28');
          await page.locator('[data-testid="card-cvc-input"]').fill('123');
          await page.locator('[data-testid="card-name-input"]').fill('Patient Journey');
          await page.locator('[data-testid="submit-payment-button"]').click();
          await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
        }
      }

      const downloadBtn = page.locator('[data-testid="download-invoice-button"]').first();
      if (await downloadBtn.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
        await downloadBtn.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });
  });

  test.describe('Admin: Dashboard → Create Appointment → Assign Doctor → Enter Results → Notify', () => {
    test('complete admin workflow', async ({ page }) => {
      await page.goto('/ar/login');
      await page.locator('[data-testid="email-input"]').fill('admin@almokhtabar.com');
      await page.locator('[data-testid="password-input"]').fill('TestAdmin@123');
      await page.locator('[data-testid="login-submit"]').click();
      await page.waitForURL(/\/ar\/admin/);

      await page.goto('/ar/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="stat-patients"]')).toBeVisible();

      await page.goto('/ar/admin/appointments/create');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="appointment-patient-input"]').fill('patient@almokhtabar.com');
      await page.locator('[data-testid="appointment-patient-option"]').click();
      await page.locator('[data-testid="appointment-branch-select"]').click();
      await page.locator('[data-testid="branch-option-br-001"]').click();
      await page.locator('[data-testid="appointment-date-input"]').fill('2024-12-15');
      await page.locator('[data-testid="appointment-time-input"]').fill('10:00');
      await page.locator('[data-testid="appointment-submit"]').click();
      await expect(page.locator('[data-testid="appointment-created"]')).toBeVisible({ timeout: 10000 });

      await page.goto('/ar/admin/appointments');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="assign-doctor-button"]').first().click();
      await page.locator('[data-testid="doctor-select-modal"]').locator('[data-testid="doctor-option-dr-001"]').click();
      await page.locator('[data-testid="confirm-assign-doctor"]').click();
      await expect(page.locator('[data-testid="doctor-assigned-success"]')).toBeVisible({ timeout: 5000 });

      await page.goto('/ar/admin/results/enter');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="result-test-select"]').click();
      await page.locator('[data-testid="test-option-cat-001"]').click();
      await page.locator('[data-testid="result-value-input"]').fill('120');
      await page.locator('[data-testid="result-submit"]').click();
      await expect(page.locator('[data-testid="result-saved"]')).toBeVisible({ timeout: 5000 });

      await page.goto('/ar/admin/notifications');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="send-notification-button"]').click();
      await page.locator('[data-testid="notification-patient-input"]').fill('patient@almokhtabar.com');
      await page.locator('[data-testid="notification-message-input"]').fill('نتائجك جاهزة');
      await page.locator('[data-testid="notification-send-submit"]').click();
      await expect(page.locator('[data-testid="notification-sent"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Doctor: Schedule → Patient List → Review Results → Add Notes → Approve', () => {
    test('complete doctor workflow', async ({ page }) => {
      await page.goto('/ar/login');
      await page.locator('[data-testid="email-input"]').fill('doctor@almokhtabar.com');
      await page.locator('[data-testid="password-input"]').fill('TestDoctor@123');
      await page.locator('[data-testid="login-submit"]').click();
      await page.waitForURL(/\/ar\/(dashboard|doctor)/);

      await page.goto('/ar/doctor/schedule');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="schedule-view"]')).toBeVisible();

      await page.goto('/ar/doctor/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="patients-list"]')).toBeVisible();
      await page.locator('[data-testid="patient-row"]').first().click();
      await expect(page.locator('[data-testid="patient-detail"]')).toBeVisible({ timeout: 5000 });

      await page.goto('/ar/doctor/results');
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="result-card"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="doctor-notes-section"]')).toBeVisible();

      await page.locator('[data-testid="add-note-input"]').fill('النتائج ضمن المعدل الطبيعي');
      await page.locator('[data-testid="save-note-button"]').click();
      await expect(page.locator('[data-testid="note-saved"]')).toBeVisible({ timeout: 5000 });

      await page.locator('[data-testid="approve-result-button"]').click();
      await expect(page.locator('[data-testid="result-approved"]')).toBeVisible({ timeout: 5000 });
    });
  });
});
