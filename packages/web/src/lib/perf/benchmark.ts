/* ─── Performance Benchmark Checklist ─── */

export interface BenchmarkItem {
  category: string;
  check: string;
  target: string;
  current?: string;
  status: 'pass' | 'fail' | 'needs-measurement';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function generateBenchmarkReport(): BenchmarkItem[] {
  return [
    // ─── Lighthouse Scores ───
    { category: 'Lighthouse', check: 'Performance score', target: '100', priority: 'critical', status: 'needs-measurement' },
    { category: 'Lighthouse', check: 'Accessibility score', target: '100', priority: 'critical', status: 'needs-measurement' },
    { category: 'Lighthouse', check: 'SEO score', target: '100', priority: 'critical', status: 'needs-measurement' },
    { category: 'Lighthouse', check: 'Best Practices score', target: '100', priority: 'critical', status: 'needs-measurement' },

    // ─── Core Web Vitals ───
    { category: 'Core Web Vitals', check: 'LCP (Largest Contentful Paint)', target: '< 1.5s (mobile), < 1.0s (desktop)', priority: 'critical', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'FID (First Input Delay)', target: '< 50ms', priority: 'critical', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'INP (Interaction to Next Paint)', target: '< 100ms', priority: 'critical', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'CLS (Cumulative Layout Shift)', target: '< 0.05', priority: 'critical', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'FCP (First Contentful Paint)', target: '< 1.0s', priority: 'high', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'TTFB (Time to First Byte)', target: '< 400ms (CDN)', priority: 'high', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'SI (Speed Index)', target: '< 2.0s', priority: 'high', status: 'needs-measurement' },
    { category: 'Core Web Vitals', check: 'TBT (Total Blocking Time)', target: '< 100ms', priority: 'high', status: 'needs-measurement' },

    // ─── Image Optimization ───
    { category: 'Images', check: 'Next.js Image component used', target: '100% of images', priority: 'critical', status: 'pass' },
    { category: 'Images', check: 'AVIF format served', target: '100% where supported', priority: 'high', status: 'pass' },
    { category: 'Images', check: 'WebP fallback', target: '100% of images', priority: 'high', status: 'pass' },
    { category: 'Images', check: 'Lazy loading (loading="lazy")', target: '100% of below-fold images', priority: 'critical', status: 'pass' },
    { category: 'Images', check: 'Explicit width/height (CLS prevention)', target: '100% of images', priority: 'critical', status: 'pass' },
    { category: 'Images', check: 'Responsive srcset/sizes', target: '100% of content images', priority: 'high', status: 'needs-measurement' },
    { category: 'Images', check: 'Blur placeholder / LQIP', target: 'Above-fold hero images', priority: 'medium', status: 'pass' },
    { category: 'Images', check: 'Image CDN configured', target: 'CDN with edge cache', priority: 'high', status: 'needs-measurement' },
    { category: 'Images', check: 'Average image size', target: '< 100KB per image', priority: 'medium', status: 'needs-measurement' },

    // ─── JavaScript ───
    { category: 'JavaScript', check: 'Code splitting (dynamic import)', target: 'Route-based + component-based', priority: 'critical', status: 'needs-measurement' },
    { category: 'JavaScript', check: 'Tree shaking (dead code elimination)', target: 'No unused exports', priority: 'high', status: 'pass' },
    { category: 'JavaScript', check: 'Vendor chunk splitting', target: 'Separate Radix, Charts, Framer chunks', priority: 'high', status: 'pass' },
    { category: 'JavaScript', check: 'Moment.js locale pruning', target: 'Only ar + en', priority: 'medium', status: 'pass' },
    { category: 'JavaScript', check: 'Polyfill optimization', target: 'No unnecessary polyfills', priority: 'medium', status: 'pass' },
    { category: 'JavaScript', check: 'SWC minification', target: 'Enabled', priority: 'high', status: 'pass' },
    { category: 'JavaScript', check: 'Remove console.log in production', target: 'Only error/warn remain', priority: 'medium', status: 'pass' },
    { category: 'JavaScript', check: 'Initial bundle size', target: '< 100KB (gzip)', priority: 'critical', status: 'needs-measurement' },
    { category: 'JavaScript', check: 'Total JS budget', target: '< 300KB (gzip) per route', priority: 'high', status: 'needs-measurement' },
    { category: 'JavaScript', check: 'Optimize package imports', target: 'lucide-react, date-fns, recharts, Radix, framer-motion', priority: 'high', status: 'pass' },

    // ─── CSS ───
    { category: 'CSS', check: 'Tailwind CSS purge (unused styles)', target: '< 10KB CSS per page', priority: 'critical', status: 'pass' },
    { category: 'CSS', check: 'CSS minification (cssnano)', target: 'Production plugin active', priority: 'high', status: 'pass' },
    { category: 'CSS', check: 'Critical CSS inlined', target: 'Above-fold styles < 14KB', priority: 'high', status: 'needs-measurement' },
    { category: 'CSS', check: 'Autoprefixer', target: 'All vendor prefixes', priority: 'medium', status: 'pass' },
    { category: 'CSS', check: 'No @import in production', target: 'postcss-import handles it', priority: 'medium', status: 'pass' },

    // ─── Fonts ───
    { category: 'Fonts', check: 'font-display: swap', target: 'All @font-face declarations', priority: 'critical', status: 'pass' },
    { category: 'Fonts', check: 'Preconnect to font hosts', target: 'fonts.googleapis.com, fonts.gstatic.com', priority: 'high', status: 'pass' },
    { category: 'Fonts', check: 'Font subsetting', target: 'Arabic + Latin only', priority: 'medium', status: 'needs-measurement' },
    { category: 'Fonts', check: 'Variable fonts used', target: 'Reduce HTTP requests', priority: 'low', status: 'needs-measurement' },
    { category: 'Fonts', check: 'FOUT/FOIT eliminated', target: 'No invisible text during load', priority: 'high', status: 'needs-measurement' },

    // ─── Caching ───
    { category: 'Caching', check: 'Static assets immutable cache', target: 'max-age=31536000', priority: 'critical', status: 'pass' },
    { category: 'Caching', check: 'Redis for API caching', target: '@nestjs/cache-manager with redis-store', priority: 'high', status: 'pass' },
    { category: 'Caching', check: 'CDN edge caching', target: 'Static + sitemap + manifest', priority: 'high', status: 'needs-measurement' },
    { category: 'Caching', check: 'ISR for blog/tests/pages', target: 'revalidate < 3600s', priority: 'medium', status: 'needs-measurement' },
    { category: 'Caching', check: 'SWR in React Query', target: 'staleTime > 30000ms', priority: 'medium', status: 'needs-measurement' },
    { category: 'Caching', check: 'ETag support', target: 'Enabled', priority: 'medium', status: 'pass' },
    { category: 'Caching', check: 'Service Worker cache strategies', target: 'Cache-first for static, network-first for API', priority: 'medium', status: 'pass' },

    // ─── Network ───
    { category: 'Network', check: 'HTTP/2 enabled', target: 'All requests', priority: 'high', status: 'needs-measurement' },
    { category: 'Network', check: 'Brotli compression (level 4+)', target: 'All text responses', priority: 'high', status: 'pass' },
    { category: 'Network', check: 'Gzip fallback', target: 'Browsers without Brotli', priority: 'medium', status: 'pass' },
    { category: 'Network', check: 'CDN with edge locations in MENA', target: '< 50ms TTFB in KSA', priority: 'critical', status: 'needs-measurement' },
    { category: 'Network', check: 'Preconnect to critical origins', target: 'Fonts, CDN, GTM, GA', priority: 'high', status: 'pass' },
    { category: 'Network', check: 'DNS-prefetch for 3rd party', target: 'CDN, GTM, GA, FB', priority: 'medium', status: 'pass' },
    { category: 'Network', check: 'Resource Hints (preload/prefetch)', target: 'Hero image + key routes', priority: 'medium', status: 'pass' },
    { category: 'Network', check: 'Keep-Alive enabled', target: 'Persistent connections', priority: 'medium', status: 'pass' },

    // ─── Rendering ───
    { category: 'Rendering', check: 'App Router (React Server Components)', target: 'Maximize server rendering', priority: 'critical', status: 'pass' },
    { category: 'Rendering', check: 'Streaming (Suspense boundaries)', target: 'Data-dependent sections streamed', priority: 'high', status: 'pass' },
    { category: 'Rendering', check: 'ISR for content pages', target: 'Blog, tests, packages, branches', priority: 'high', status: 'needs-measurement' },
    { category: 'Rendering', check: 'SSR for authenticated pages', target: 'Dashboard, results, appointments', priority: 'medium', status: 'needs-measurement' },
    { category: 'Rendering', check: 'Static generation where possible', target: 'Public pages, blog, tests list', priority: 'high', status: 'needs-measurement' },
    { category: 'Rendering', check: 'Client-side navigation prefetch', target: 'next/link auto-prefetch', priority: 'medium', status: 'pass' },
    { category: 'Rendering', check: 'Scroll restoration', target: 'Enabled', priority: 'low', status: 'pass' },

    // ─── Database ───
    { category: 'Database', check: 'Connection pooling (PgBouncer)', target: 'Transaction pooling mode', priority: 'critical', status: 'needs-measurement' },
    { category: 'Database', check: 'Connection pool size', target: '20-25 connections', priority: 'high', status: 'needs-measurement' },
    { category: 'Database', check: 'Query cache hit ratio', target: '> 99%', priority: 'critical', status: 'needs-measurement' },
    { category: 'Database', check: 'Slow queries monitored', target: '< 10 queries > 500ms', priority: 'high', status: 'needs-measurement' },
    { category: 'Database', check: 'Index usage analyzed', target: 'No unused indexes', priority: 'high', status: 'needs-measurement' },
    { category: 'Database', check: 'Table statistics up-to-date', target: 'auto-analyze running', priority: 'medium', status: 'needs-measurement' },
    { category: 'Database', check: 'N+1 query prevention', target: 'Prisma includes + batch queries', priority: 'critical', status: 'needs-measurement' },

    // ─── API ───
    { category: 'API', check: 'Response compression (Brotli)', target: 'API responses < 50KB compressed', priority: 'high', status: 'needs-measurement' },
    { category: 'API', check: 'Pagination on list endpoints', target: 'All list endpoints paginated', priority: 'critical', status: 'pass' },
    { category: 'API', check: 'Field selection (GraphQL-style)', target: 'Select only needed fields', priority: 'high', status: 'needs-measurement' },
    { category: 'API', check: 'Batch endpoints for dashboards', target: 'Single dashboard endpoint', priority: 'high', status: 'pass' },
    { category: 'API', check: 'Redis caching for hot data', target: 'Tests, branches, departments, settings', priority: 'high', status: 'pass' },
    { category: 'API', check: 'Rate limiting', target: '100 req/min per IP', priority: 'medium', status: 'pass' },
    { category: 'API', check: 'API response time P95', target: '< 200ms', priority: 'critical', status: 'needs-measurement' },
    { category: 'API', check: 'API response time P99', target: '< 500ms', priority: 'high', status: 'needs-measurement' },

    // ─── Service Worker ───
    { category: 'PWA', check: 'Service Worker registered', target: 'sw.js active', priority: 'medium', status: 'needs-measurement' },
    { category: 'PWA', check: 'Offline fallback page', target: 'Custom offline page', priority: 'low', status: 'needs-measurement' },
    { category: 'PWA', check: 'manifest.json valid', target: 'All fields present', priority: 'medium', status: 'pass' },
    { category: 'PWA', check: 'iOS meta tags (apple-mobile-web-app)', target: 'Present in layout', priority: 'low', status: 'pass' },
  ];
}

export function benchmarkSummary(items: BenchmarkItem[]) {
  return {
    total: items.length,
    pass: items.filter((i) => i.status === 'pass').length,
    fail: items.filter((i) => i.status === 'fail').length,
    needsMeasurement: items.filter((i) => i.status === 'needs-measurement').length,
    byPriority: {
      critical: items.filter((i) => i.priority === 'critical'),
      high: items.filter((i) => i.priority === 'high'),
      medium: items.filter((i) => i.priority === 'medium'),
      low: items.filter((i) => i.priority === 'low'),
    },
    score: Math.round((items.filter((i) => i.status === 'pass').length / items.length) * 100),
  };
}
