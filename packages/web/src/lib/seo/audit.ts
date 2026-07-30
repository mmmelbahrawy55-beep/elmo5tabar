/* ─── SEO Audit Checklist ─── */

export interface AuditItem {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning' | 'manual';
  details?: string;
}

export function generateSeoAudit(): AuditItem[] {
  return [
    // ─── Technical SEO ───
    { category: 'Technical SEO', check: 'HTTPS enabled', status: 'pass', details: 'SSL certificate configured on almokhtabar.com' },
    { category: 'Technical SEO', check: 'WWW redirects to non-WWW', status: 'pass', details: 'Middleware 301 redirect' },
    { category: 'Technical SEO', check: 'Trailing slash normalization', status: 'pass', details: 'Middleware handles redirect' },
    { category: 'Technical SEO', check: 'robots.txt exists', status: 'pass', details: '/robots.txt - dynamic' },
    { category: 'Technical SEO', check: 'XML sitemap exists', status: 'pass', details: '/sitemap.xml - dynamic' },
    { category: 'Technical SEO', check: 'Canonical URLs', status: 'pass', details: 'All pages have self-referencing canonical' },
    { category: 'Technical SEO', check: 'hreflang tags', status: 'pass', details: 'ar, en, x-default on all pages' },
    { category: 'Technical SEO', check: 'Crawl budget optimization', status: 'pass', details: 'Disallow /dashboard/, /api/, /admin/, /auth/' },
    { category: 'Technical SEO', check: '404 page', status: 'manual', details: 'Verify custom 404 page exists' },
    { category: 'Technical SEO', check: '301 redirect map', status: 'pass', details: '30+ legacy URL redirects in middleware' },
    { category: 'Technical SEO', check: 'Lowercase URL enforcement', status: 'pass', details: 'Middleware lowercase redirect' },
    { category: 'Technical SEO', check: 'HTTP/2 enabled', status: 'manual', details: 'Verify with hosting provider' },
    { category: 'Technical SEO', check: 'IPv6 support', status: 'manual', details: 'Verify DNS AAAA records' },
    { category: 'Technical SEO', check: 'Structured data valid', status: 'pass', details: 'MedicalOrganization, WebSite, WebPage, LocalBusiness' },
    { category: 'Technical SEO', check: 'Breadcrumb structured data', status: 'pass', details: 'BreadcrumbList on all inner pages' },

    // ─── Core Web Vitals ───
    { category: 'Core Web Vitals', check: 'LCP < 2.5s', status: 'manual', details: 'Optimize images, preload hero, use CDN' },
    { category: 'Core Web Vitals', check: 'FID < 100ms', status: 'manual', details: 'Code splitting, lazy loading non-critical JS' },
    { category: 'Core Web Vitals', check: 'CLS < 0.1', status: 'manual', details: 'Set explicit image dimensions, font-display: swap' },
    { category: 'Core Web Vitals', check: 'Image optimization', status: 'pass', details: 'AVIF/WebP, next/image, lazy loading' },
    { category: 'Core Web Vitals', check: 'Font optimization', status: 'pass', details: 'preconnect Google Fonts, font-display: swap' },
    { category: 'Core Web Vitals', check: 'CSS optimization', status: 'pass', details: 'Tailwind purge, optimizeCss experiment' },
    { category: 'Core Web Vitals', check: 'JS bundle optimization', status: 'pass', details: 'optimizePackageImports, code splitting' },
    { category: 'Core Web Vitals', check: 'Server response time < 200ms', status: 'manual', details: 'CDN + ISR + edge caching' },

    // ─── Medical SEO (E-E-A-T / YMYL) ───
    { category: 'Medical SEO', check: 'Author credentials displayed', status: 'pass', details: 'Author schema with name, specialization' },
    { category: 'Medical SEO', check: 'Medical disclaimer', status: 'manual', details: 'Add medical disclaimer on test/result pages' },
    { category: 'Medical SEO', check: 'Content reviewed by medical professionals', status: 'manual', details: 'Implement review workflow in CMS' },
    { category: 'Medical SEO', check: 'Accreditations displayed', status: 'manual', details: 'CAP, CLIA, ISO 15189 badges' },
    { category: 'Medical SEO', check: 'Regulatory compliance (ZATCA, CCHI)', status: 'manual', details: 'Display licenses and certifications' },
    { category: 'Medical SEO', check: 'Patient privacy policy', status: 'pass', details: '/privacy page exists' },
    { category: 'Medical SEO', check: 'HIPAA compliance statement', status: 'manual', details: 'Include on privacy/terms pages' },
    { category: 'Medical SEO', check: 'Clinical accuracy claims cited', status: 'manual', details: 'Ensure diagnostic claims have supporting evidence' },
    { category: 'Medical SEO', check: 'Medical content updated', status: 'pass', details: 'dateModified on all articles' },

    // ─── Local SEO ───
    { category: 'Local SEO', check: 'Google Business Profile claimed', status: 'manual', details: 'Claim and verify GBP listing' },
    { category: 'Local SEO', check: 'NAP consistency', status: 'pass', details: 'Name, Address, Phone consistent across all pages' },
    { category: 'Local SEO', check: 'LocalBusiness schema', status: 'pass', details: 'GeoCoordinates, OpeningHours, address' },
    { category: 'Local SEO', check: 'Google Maps embed', status: 'manual', details: 'Embed map on contact/branch pages' },
    { category: 'Local SEO', check: 'City-specific landing pages', status: 'pass', details: 'Branches with location-specific pages' },
    { category: 'Local SEO', check: 'Local citations', status: 'manual', details: 'Submit to Dalil, Saudi Yellow Pages, etc.' },
    { category: 'Local SEO', check: 'Google Customer Reviews', status: 'manual', details: 'Enable Google Customer Reviews badge' },

    // ─── International SEO (Arabic/English) ───
    { category: 'International SEO', check: 'hreflang tags implemented', status: 'pass', details: 'ar, en, x-default with self-referencing' },
    { category: 'International SEO', check: 'Language-specific sitemaps', status: 'pass', details: 'Alternate language URLs in sitemap entries' },
    { category: 'International SEO', check: 'Arabic URL structure', status: 'pass', details: '/lab-tests (default=ar), /en/lab-tests' },
    { category: 'International SEO', check: 'Content translation quality', status: 'manual', details: 'Professional medical translation review needed' },
    { category: 'International SEO', check: 'Currency/locale display', status: 'pass', details: 'SAR for both, proper number formatting' },
    { category: 'International SEO', check: 'Phone number format', status: 'pass', details: '+966 international format used' },

    // ─── Content SEO ───
    { category: 'Content SEO', check: 'Keyword research documented', status: 'manual', details: 'Document primary/secondary keywords per page' },
    { category: 'Content SEO', check: 'Content silos structured', status: 'pass', details: 'Tests → Categories, Blog → Tags/Categories' },
    { category: 'Content SEO', check: 'Internal linking strategy', status: 'manual', details: 'Related tests, blog posts, packages linking' },
    { category: 'Content SEO', check: 'Schema.org Article/FAQ', status: 'pass', details: 'Article on blog posts, FAQ on FAQ page' },
    { category: 'Content SEO', check: 'Image alt text', status: 'pass', details: 'featuredImageAlt, alt fields in schema' },
    { category: 'Content SEO', check: 'SEO meta fields in CMS', status: 'pass', details: 'metaTitle, metaDescription, ogTitle, focusKeyphrase' },
    { category: 'Content SEO', check: 'Blog content calendar', status: 'manual', details: 'Regular medical blog posting schedule' },
    { category: 'Content SEO', check: 'Duplicate content check', status: 'manual', details: 'Run Siteliner or Screaming Frog scan' },
    { category: 'Content SEO', check: 'Freshness signals', status: 'pass', details: 'published_at, updated_at on all content' },

    // ─── Performance & Security ───
    { category: 'Performance', check: 'CDN configured', status: 'manual', details: 'Use Cloudflare or AWS CloudFront' },
    { category: 'Performance', check: 'Browser caching', status: 'pass', details: 'Cache-Control headers for images, fonts' },
    { category: 'Performance', check: 'Gzip/Brotli compression', status: 'pass', details: 'Enabled in Next.js (compress: true)' },
    { category: 'Performance', check: 'Preconnect to 3rd party', status: 'pass', details: 'Google Fonts, CDN, GTM, GA' },
    { category: 'Performance', check: 'Lazy loading images', status: 'pass', details: 'Next.js Image component with lazy loading' },
    { category: 'Security', check: 'HSTS enabled', status: 'pass', details: 'max-age=63072000; includeSubDomains; preload' },
    { category: 'Security', check: 'X-Frame-Options DENY', status: 'pass', details: 'Prevents clickjacking' },
    { category: 'Security', check: 'Content Security Policy', status: 'manual', details: 'Add CSP headers for XSS protection' },
    { category: 'Security', check: 'Permission Policy', status: 'pass', details: 'Restricts camera, microphone, geolocation' },

    // ─── Search Console & Analytics ───
    { category: 'Search Console', check: 'Google Search Console verified', status: 'pass', details: 'Verification meta tags in layout' },
    { category: 'Search Console', check: 'Bing Webmaster Tools', status: 'pass', details: 'msvalidate.01 meta tag in layout' },
    { category: 'Search Console', check: 'Google Analytics 4 installed', status: 'pass', details: 'GA4 via next/script' },
    { category: 'Search Console', check: 'Sitemap submitted', status: 'manual', details: 'Submit sitemap.xml in Google Search Console' },
    { category: 'Search Console', check: 'Core Web Vitals monitored', status: 'manual', details: 'Set up CrUX dashboard + Search Console reports' },
    { category: 'Search Console', check: 'Index coverage monitoring', status: 'manual', details: 'Review Search Console index report weekly' },
    { category: 'Search Console', check: '404 crawl errors resolved', status: 'manual', details: 'Monitor and 301 redirect broken links' },
  ];
}

export function auditSummary(items: AuditItem[]): Record<string, { total: number; pass: number; fail: number; warning: number; manual: number }> {
  const summary: Record<string, any> = {};
  for (const item of items) {
    if (!summary[item.category]) {
      summary[item.category] = { total: 0, pass: 0, fail: 0, warning: 0, manual: 0 };
    }
    summary[item.category].total++;
    summary[item.category][item.status]++;
  }
  return summary;
}
