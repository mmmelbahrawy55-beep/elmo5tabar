/* ─── Bundle Analysis Configuration ───
   Usage: ANALYZE=true next build
   or:    npx next build --experimental-build-mode=compile
*/

export const ANALYZE = process.env.ANALYZE === 'true';

export const bundleAnalyzerConfig = {
  enabled: ANALYZE,
  openAnalyzer: process.env.ANALYZER_OPEN === 'true',
  analyzerMode: process.env.ANALYZER_MODE || 'static',
  reportFilename: 'bundle-report.html',
  defaultSizes: 'gzip',
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  logLevel: 'info',
};

/* ─── Manual bundle size budgets ─── */

export const bundleBudgets = {
  // Main entry bundles (gzip)
  'main.js': { maxSize: 30_000 },       // 30KB
  'framework.js': { maxSize: 50_000 },   // 50KB (React + Next.js)

  // Vendor chunks
  'vendor-radix.js': { maxSize: 20_000 },
  'vendor-charts.js': { maxSize: 25_000 },
  'vendor-framer.js': { maxSize: 15_000 },

  // Page bundles (gzip)
  'home': { maxSize: 40_000 },
  'dashboard': { maxSize: 80_000 },
  'lab-tests': { maxSize: 50_000 },
  'packages': { maxSize: 40_000 },
  'branches': { maxSize: 40_000 },
  'blog': { maxSize: 45_000 },
  'results': { maxSize: 60_000 },

  // CSS
  'global.css': { maxSize: 15_000 },
  'critical.css': { maxSize: 8_000 },
};

export function checkBundleSize(name: string, actualSize: number): { pass: boolean; budget: number; actual: number } | null {
  const budget = bundleBudgets[name as keyof typeof bundleBudgets];
  if (!budget) return null;
  return {
    pass: actualSize <= budget.maxSize,
    budget: budget.maxSize,
    actual: actualSize,
  };
}
