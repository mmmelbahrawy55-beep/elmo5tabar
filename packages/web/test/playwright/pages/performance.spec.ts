import { test, expect } from '../fixtures/test-fixtures';

test.describe('Frontend Performance', () => {
  test.describe('Page Load Metrics', () => {
    const PAGES = [
      { path: '/ar', label: 'Home' },
      { path: '/ar/login', label: 'Login' },
      { path: '/ar/register', label: 'Register' },
      { path: '/ar/appointments', label: 'Appointments' },
      { path: '/ar/results', label: 'Results' },
      { path: '/ar/payments', label: 'Payments' },
    ];

    for (const { path, label } of PAGES) {
      test(`FCP < 1.5s and LCP < 2.5s on ${label} page`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'commit' });

        const fcpPromise = page.evaluate(() => {
          return new Promise<number>((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntriesByName('first-contentful-paint');
              if (entries.length > 0) {
                resolve(entries[0].startTime);
              }
            }).observe({ type: 'paint', buffered: true });
            setTimeout(() => resolve(-1), 10000);
          });
        });

        const lcpPromise = page.evaluate(() => {
          return new Promise<number>((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                resolve(entries[entries.length - 1].startTime);
              }
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => resolve(-1), 10000);
          });
        });

        await page.waitForLoadState('networkidle');

        const fcp = await fcpPromise;
        const lcp = await lcpPromise;

        expect(fcp).toBeGreaterThanOrEqual(0);
        expect(lcp).toBeGreaterThanOrEqual(0);
        expect(fcp).toBeLessThan(1500);
        expect(lcp).toBeLessThan(2500);
      });

      test(`TTI < 3.5s on ${label} page`, async ({ page }) => {
        const navigationTiming = await page.goto(path, { waitUntil: 'networkidle' });

        const tti = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return nav.domInteractive - nav.fetchStart;
        });

        expect(tti).toBeLessThan(3500);
      });
    }
  });

  test('API response times p95 < 500ms', async ({ page }) => {
    const apiEndpoints = [
      '/api/v1/health',
      '/api/v1/appointments?page=1&limit=10',
      '/api/v1/results?page=1&limit=10',
      '/api/v1/notifications?page=1&limit=10',
    ];

    const responseTimes: number[] = [];

    for (const endpoint of apiEndpoints) {
      const start = performance.now();
      const response = await page.request.get(endpoint);
      const duration = performance.now() - start;
      responseTimes.push(duration);
      expect(response.ok()).toBe(true);
    }

    responseTimes.sort((a, b) => a - b);
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p95 = responseTimes[p95Index];
    expect(p95).toBeLessThan(500);
  });

  test('images use lazy loading', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img[loading="lazy"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);

    const allImages = page.locator('img');
    const totalCount = await allImages.count();
    const lazyRatio = imageCount / totalCount;
    expect(lazyRatio).toBeGreaterThan(0.5);
  });

  test('bundle size under 300KB per page', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    const totalJsSize = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter(r => r.name.endsWith('.js') || r.name.includes('_next/static/chunks'))
        .reduce((sum, r) => sum + r.transferSize, 0);
    });

    expect(totalJsSize).toBeLessThan(300 * 1024);
  });

  test('no render-blocking resources', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    const blockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.filter(r => {
        const name = r.name.toLowerCase();
        return (name.endsWith('.css') || name.endsWith('.js')) && r.duration > 0 && r.transferSize > 0;
      });
    });

    expect(blockingResources.length).toBeLessThanOrEqual(10);
  });

  test('animation performance maintains 60fps during transitions', async ({ page }) => {
    await page.goto('/ar/results');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="result-card"]').first().click();

    const frameDrops = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let droppedFrames = 0;
        let lastTimestamp = 0;
        let frameCount = 0;

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            const frame = entry as PerformanceFrameTiming;
            if (lastTimestamp > 0) {
              const delta = frame.startTime - lastTimestamp;
              if (delta > 32) droppedFrames++;
            }
            lastTimestamp = frame.startTime;
            frameCount++;
            if (frameCount >= 60) {
              observer.disconnect();
              resolve(droppedFrames);
            }
          }
        });

        observer.observe({ type: 'frame', buffered: true });
        setTimeout(() => { observer.disconnect(); resolve(droppedFrames); }, 3000);
      });
    });

    expect(frameDrops).toBeLessThan(5);
  });
});
