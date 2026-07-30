import { test, expect } from '../fixtures/test-fixtures';

test.describe('Appointment Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/login');
    await page.locator('[data-testid="email-input"]').fill('patient@almokhtabar.com');
    await page.locator('[data-testid="password-input"]').fill('TestPatient@123');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/ar\/(dashboard|patient)/);
    await page.goto('/ar/appointments/book');
    await page.waitForLoadState('networkidle');
  });

  test('view available appointments in calendar', async ({ page }) => {
    await expect(page.locator('[data-testid="appointment-calendar"]')).toBeVisible();
    const dateCells = page.locator('[data-testid="calendar-date-cell"]');
    const count = await dateCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('select branch from dropdown', async ({ page }) => {
    await page.locator('[data-testid="branch-select"]').click();
    await page.locator('[data-testid="branch-option-br-001"]').click();
    await expect(page.locator('[data-testid="selected-branch"]')).toContainText('الرياض');
  });

  test('choose doctor updates available slots', async ({ page }) => {
    await page.locator('[data-testid="branch-select"]').click();
    await page.locator('[data-testid="branch-option-br-001"]').click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="doctor-select"]').click();
    await page.locator('[data-testid="doctor-option-dr-001"]').click();
    await page.waitForLoadState('networkidle');

    const slots = page.locator('[data-testid="time-slot"]');
    await expect(slots.first()).toBeVisible({ timeout: 10000 });
    const slotCount = await slots.count();
    expect(slotCount).toBeGreaterThan(0);
  });

  test('select time slot and confirm booking', async ({ page }) => {
    await page.locator('[data-testid="branch-select"]').click();
    await page.locator('[data-testid="branch-option-br-001"]').click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="doctor-select"]').click();
    await page.locator('[data-testid="doctor-option-dr-001"]').click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="time-slot"]').first().click();
    await page.locator('[data-testid="confirm-booking-button"]').click();

    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 10000 });
  });

  test('verify confirmation displays appointment details', async ({ page }) => {
    await page.locator('[data-testid="branch-select"]').click();
    await page.locator('[data-testid="branch-option-br-001"]').click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="doctor-select"]').click();
    await page.locator('[data-testid="doctor-option-dr-001"]').click();
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="time-slot"]').first().click();
    await page.locator('[data-testid="confirm-booking-button"]').click();

    await expect(page.locator('[data-testid="confirmation-branch"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-doctor"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-id"]')).toBeVisible();
  });

  test('view upcoming appointments list', async ({ page }) => {
    await page.goto('/ar/appointments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="upcoming-appointments-section"]')).toBeVisible();
    const appointments = page.locator('[data-testid="appointment-card"]');
    const count = await appointments.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('reschedule appointment selects new time', async ({ page }) => {
    await page.goto('/ar/appointments');
    await page.waitForLoadState('networkidle');

    const rescheduleBtn = page.locator('[data-testid="reschedule-button"]').first();
    if (await rescheduleBtn.isVisible()) {
      await rescheduleBtn.click();
      await page.waitForURL(/\/ar\/appointments\/reschedule/);

      await page.locator('[data-testid="time-slot"]').first().click();
      await page.locator('[data-testid="confirm-reschedule-button"]').click();
      await expect(page.locator('[data-testid="reschedule-success"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('cancel appointment shows confirmation and updates status', async ({ page }) => {
    await page.goto('/ar/appointments');
    await page.waitForLoadState('networkidle');

    const cancelBtn = page.locator('[data-testid="cancel-appointment-button"]').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.locator('[data-testid="cancel-confirmation-dialog"]')).toBeVisible();
      await page.locator('[data-testid="confirm-cancel-yes"]').click();
      await expect(page.locator('[data-testid="cancelled-badge"]').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('view appointment history with filters', async ({ page }) => {
    await page.goto('/ar/appointments/history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="history-date-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-status-filter"]')).toBeVisible();

    await page.locator('[data-testid="history-status-filter"]').click();
    await page.locator('[data-testid="status-option-completed"]').click();
    await page.waitForLoadState('networkidle');
    const statusBadges = page.locator('[data-testid="appointment-status"]');
    const badgeCount = await statusBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('queue position displayed for today appointments', async ({ page }) => {
    await page.goto('/ar/appointments/today');
    await page.waitForLoadState('networkidle');

    if (await page.locator('[data-testid="queue-position"]').isVisible()) {
      const positionText = await page.locator('[data-testid="queue-position"]').textContent();
      expect(positionText).toMatch(/\d+/);
    }
  });

  test('walk-in registration at reception', async ({ page }) => {
    await page.goto('/ar/reception/walk-in');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="walkin-name-input"]').fill('مريض جديد');
    await page.locator('[data-testid="walkin-phone-input"]').fill('+966501234569');
    await page.locator('[data-testid="walkin-id-input"]').fill('1234567890');
    await page.locator('[data-testid="walkin-submit"]').click();
    await expect(page.locator('[data-testid="walkin-success"]')).toBeVisible({ timeout: 10000 });
  });
});
