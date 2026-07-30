const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://almokhtabar.com';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const REPORT_DIR = path.join(__dirname, '../reports/accessibility');

const PAGES = [
  { url: '/', name: 'Homepage', lang: 'en' },
  { url: '/ar/login', name: 'Login (Arabic)', lang: 'ar' },
  { url: '/ar/register', name: 'Register (Arabic)', lang: 'ar' },
  { url: '/ar/appointments', name: 'Appointments (Arabic)', lang: 'ar' },
  { url: '/ar/results', name: 'Results (Arabic)', lang: 'ar' },
  { url: '/ar/payments', name: 'Payments (Arabic)', lang: 'ar' },
  { url: '/ar/profile', name: 'Profile (Arabic)', lang: 'ar' },
  { url: '/ar/admin', name: 'Admin Dashboard (Arabic)', lang: 'ar' },
  { url: '/en/login', name: 'Login (English)', lang: 'en' },
  { url: '/en/appointments', name: 'Appointments (English)', lang: 'en' },
  { url: '/en/results', name: 'Results (English)', lang: 'en' },
];

const VIOLATION_THRESHOLDS = {
  critical: 0,
  serious: 0,
  moderate: 3,
  minor: 5,
};

const REQUIRED_RULES = [
  'color-contrast',
  'aria-allowed-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-valid-attr-value',
  'aria-valid-attr',
  'button-name',
  'definition-list',
  'dl-item',
  'document-title',
  'duplicate-id-active',
  'duplicate-id-aria',
  'html-has-lang',
  'html-lang-valid',
  'image-alt',
  'input-button-name',
  'label',
  'link-name',
  'list',
  'listitem',
  'meta-viewport',
  'object-alt',
  'tabindex',
  'td-headers-attr',
  'th-has-data-cells',
  'valid-lang',
  'video-caption',
  'landmark-one-main',
  'page-has-heading-one',
  'scrollable-region-focusable',
  'region',
  'form-field-multiple-labels',
];

async function testPage(page, pageConfig) {
  const fullUrl = `${BASE_URL}${pageConfig.url}`;
  console.log(`Testing: ${pageConfig.name} (${fullUrl})`);

  try {
    if (pageConfig.lang === 'ar') {
      await page.context().addCookies([
        { name: 'NEXT_LOCALE', value: 'ar', domain: new URL(BASE_URL).hostname, path: '/' },
      ]);
    }

    await page.goto(fullUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .disableRules(['color-contrast-enhanced'])
      .options({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
        resultTypes: ['violations', 'incomplete', 'passes'],
      })
      .analyze();

    return {
      page: pageConfig,
      url: fullUrl,
      timestamp: new Date().toISOString(),
      violations: results.violations,
      incomplete: results.incomplete,
      passesCount: results.passes.length,
      violationsByImpact: {
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious: results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor: results.violations.filter(v => v.impact === 'minor').length,
      },
      passed: results.violations.filter(v => v.impact === 'critical').length === 0 &&
              results.violations.filter(v => v.impact === 'serious').length === 0 &&
              results.violations.filter(v => v.impact === 'moderate').length <= VIOLATION_THRESHOLDS.moderate &&
              results.violations.filter(v => v.impact === 'minor').length <= VIOLATION_THRESHOLDS.minor,
    };
  } catch (error) {
    console.error(`  ERROR testing ${pageConfig.name}: ${error.message}`);
    return {
      page: pageConfig,
      url: fullUrl,
      timestamp: new Date().toISOString(),
      error: error.message,
      violations: [],
      incomplete: [],
      passesCount: 0,
      violationsByImpact: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      passed: false,
    };
  }
}

async function run() {
  console.log('========================================');
  console.log('  Accessibility Audit (axe-core)');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Standard: WCAG 2.1 AA`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    extraHTTPHeaders: {
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    },
  });

  const page = await context.newPage();
  const results = [];

  for (const pageConfig of PAGES) {
    const result = await testPage(page, pageConfig);
    results.push(result);

    const v = result.violationsByImpact;
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status} | Critical: ${v.critical}, Serious: ${v.serious}, Moderate: ${v.moderate}, Minor: ${v.minor} | ${result.passesCount} checks passed`);

    if (result.violations && result.violations.length > 0) {
      result.violations.slice(0, 5).forEach(violation => {
        console.log(`    - [${violation.impact}] ${violation.id}: ${violation.help}`);
        violation.nodes.slice(0, 3).forEach(node => {
          console.log(`      ${node.html}`);
        });
      });
    }
    console.log('');
  }

  await browser.close();

  const summary = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    standard: 'WCAG 2.1 AA',
    pagesTested: PAGES.length,
    results: results,
    overall: {
      totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
      totalCritical: results.reduce((sum, r) => sum + r.violationsByImpact.critical, 0),
      totalSerious: results.reduce((sum, r) => sum + r.violationsByImpact.serious, 0),
      totalModerate: results.reduce((sum, r) => sum + r.violationsByImpact.moderate, 0),
      totalMinor: results.reduce((sum, r) => sum + r.violationsByImpact.minor, 0),
      pagesPassed: results.filter(r => r.passed).length,
      pagesFailed: results.filter(r => !r.passed).length,
      passed: results.every(r => r.passed),
    },
  };

  const reportPath = path.join(REPORT_DIR, `axe-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`Full report: ${reportPath}`);

  const htmlReport = generateHtmlReport(summary);
  const htmlPath = path.join(REPORT_DIR, `axe-audit-${Date.now()}.html`);
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`HTML report: ${htmlPath}`);

  console.log('\n========================================');
  console.log('  Accessibility Summary');
  console.log('========================================');
  console.log(`  Pages tested: ${PAGES.length}`);
  console.log(`  Pages passed: ${summary.overall.pagesPassed}`);
  console.log(`  Pages failed: ${summary.overall.pagesFailed}`);
  console.log(`  Total violations: ${summary.overall.totalViolations}`);
  console.log(`  Critical: ${summary.overall.totalCritical}`);
  console.log(`  Serious: ${summary.overall.totalSerious}`);
  console.log(`  Moderate: ${summary.overall.totalModerate}`);
  console.log(`  Minor: ${summary.overall.totalMinor}`);
  console.log(`  Overall: ${summary.overall.passed ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');

  if (!summary.overall.passed) {
    process.exitCode = 1;
  }
}

function generateHtmlReport(summary) {
  const rows = summary.results.map(r => {
    const v = r.violationsByImpact;
    const statusClass = r.passed ? 'pass' : 'fail';
    return `
    <tr class="${statusClass}">
      <td>${r.page.name}</td>
      <td>${r.url}</td>
      <td class="${v.critical > 0 ? 'critical' : ''}">${v.critical}</td>
      <td class="${v.serious > 0 ? 'serious' : ''}">${v.serious}</td>
      <td class="${v.moderate > r.passed ? 'moderate' : ''}">${v.moderate}</td>
      <td>${v.minor}</td>
      <td>${r.passesCount}</td>
      <td class="${statusClass}">${r.passed ? 'PASS' : 'FAIL'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>Accessibility Audit Report - Al Mokhtabar</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; background: #0a0a0a; color: #e0e0e0; }
  h1, h2 { color: #f0f0f0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #333; padding: 0.5rem; text-align: left; }
  th { background: #1a1a1a; }
  .pass { color: #4ade80; }
  .fail { color: #f87171; }
  .critical { color: #f87171; font-weight: bold; }
  .serious { color: #fb923c; font-weight: bold; }
  .moderate { color: #fbbf24; }
  td.critical, td.serious, td.moderate { background: rgba(255,0,0,0.05); }
  .summary { display: flex; gap: 2rem; margin: 1rem 0; }
  .stat { background: #1a1a1a; padding: 1rem; border-radius: 8px; min-width: 120px; }
  .stat-value { font-size: 2rem; font-weight: bold; }
  .stat-label { font-size: 0.875rem; color: #999; }
</style>
</head>
<body>
<h1>Accessibility Audit Report</h1>
<p>Target: ${summary.target} | Standard: ${summary.standard} | Date: ${new Date(summary.timestamp).toLocaleString()}</p>
<div class="summary">
  <div class="stat"><div class="stat-value">${summary.overall.pagesPassed}/${summary.overall.pagesFailed}</div><div class="stat-label">Passed/Failed</div></div>
  <div class="stat"><div class="stat-value">${summary.overall.totalViolations}</div><div class="stat-label">Total Violations</div></div>
  <div class="stat"><div class="stat-value">${summary.overall.totalCritical}</div><div class="stat-label">Critical</div></div>
  <div class="stat"><div class="stat-value">${summary.overall.totalSerious}</div><div class="stat-label">Serious</div></div>
  <div class="stat"><div class="stat-value">${summary.overall.totalModerate}</div><div class="stat-label">Moderate</div></div>
  <div class="stat"><div class="stat-value">${summary.overall.totalMinor}</div><div class="stat-label">Minor</div></div>
</div>
<h2>Page Results</h2>
<table>
<thead><tr><th>Page</th><th>URL</th><th>Critical</th><th>Serious</th><th>Moderate</th><th>Minor</th><th>Checks Passed</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

run().catch(console.error);
