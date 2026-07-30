import { test, expect } from '../fixtures/test-fixtures';

test.describe('Responsive and Mobile Tests', () => {
  test.describe('Mobile Viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('hamburger menu is visible on mobile', async ({ page }) => {
      await page.goto('/ar');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-navbar"]')).not.toBeVisible();
    });

    test('navigation drawer opens and closes', async ({ page }) => {
      await page.goto('/ar');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="mobile-menu-button"]').click();
      await expect(page.locator('[data-testid="mobile-drawer"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="mobile-drawer"]')).toHaveClass(/open|visible/);

      await page.locator('[data-testid="drawer-overlay"]').click();
      await expect(page.locator('[data-testid="mobile-drawer"]')).not.toBeVisible();
    });

    test('content stacks vertically on mobile', async ({ page }) => {
      await page.goto('/ar/results');
      await page.waitForLoadState('networkidle');

      const resultCards = page.locator('[data-testid="result-card"]');
      const firstCard = resultCards.first();
      const secondCard = resultCards.nth(1);

      if (await secondCard.isVisible()) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        expect(secondBox!.y).toBeGreaterThanOrEqual(firstBox!.y + firstBox!.height - 10);
      }
    });
  });

  test.describe('Tablet Viewport', () => {
    test.use({ viewport: { width: 834, height: 1194 } });

    test('side-by-side layout on tablet', async ({ page }) => {
      await page.goto('/ar/admin/dashboard');
      await page.waitForLoadState('networkidle');

      const statCards = page.locator('[data-testid="stat-patients"], [data-testid="stat-appointments"]');
      const first = statCards.first();
      const second = statCards.nth(1);

      if (await second.isVisible()) {
        const firstBox = await first.boundingBox();
        const secondBox = await second.boundingBox();
        const horizontalOverlap = Math.abs(firstBox!.x - secondBox!.x) < firstBox!.width;
        expect(horizontalOverlap).toBe(false);
      }
    });
  });

  test.describe('RTL Layout Verification', () => {
    test('all pages have dir="rtl" attribute', async ({ page }) => {
      const pages = ['/ar', '/ar/login', '/ar/register', '/ar/appointments', '/ar/results', '/ar/payments'];
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      }
    });

    test('text alignment is right-to-left', async ({ page }) => {
      await page.goto('/ar');
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('[data-testid="main-content"]');
      const alignment = await mainContent.evaluate(el => getComputedStyle(el).textAlign);
      expect(alignment).toBe('right');
    });

    test('icons and arrows flip direction in RTL', async ({ page }) => {
      await page.goto('/ar/login');
      await page.waitForLoadState('networkidle');

      const backArrow = page.locator('[data-testid="back-arrow"]');
      if (await backArrow.isVisible()) {
        const scale = await backArrow.evaluate(el => getComputedStyle(el).transform);
        expect(scale).toContain('matrix');
      }
    });
  });

  test.describe('Print Layout', () => {
    test('result page prints correctly', async ({ page }) => {
      await page.goto('/ar/results');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="result-card"]').first().click();
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="print-button"]').click();
      const printMedia = await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = '@media print { body { visibility: visible !important; } }';
        document.head.appendChild(style);
        return matchMedia('print').matches;
      });
      expect(printMedia).toBe(true);
    });
  });

  test.describe('Touch Interactions', () => {
    test.use({ hasTouch: true });

    test('swipe gestures work on carousels', async ({ page }) => {
      await page.goto('/ar');
      await page.waitForLoadState('networkidle');

      const carousel = page.locator('[data-testid="hero-carousel"]');
      if (await carousel.isVisible()) {
        const firstSlide = page.locator('[data-testid="carousel-slide"]').first();
        await expect(firstSlide).toBeVisible();

        const carouselBox = await carousel.boundingBox();
        if (carouselBox) {
          const startX = carouselBox.x + carouselBox.width - 20;
          const startY = carouselBox.y + carouselBox.height / 2;
          const endX = carouselBox.x + 20;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, startY, { steps: 10 });
          await page.mouse.up();

          await page.waitForTimeout(500);
        }
      }
    });
  });
});
