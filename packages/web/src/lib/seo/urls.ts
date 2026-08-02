import { siteConfig, type Locale } from './config';

/* ─── Slug Rules ─── */

export function generateSlug(text: string, locale: Locale): string {
  if (locale === 'en') {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return text
    .trim()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncateSlug(text: string, maxLen = 80): string {
  const slug = text.replace(/^-|-$/g, '');
  if (slug.length <= maxLen) return slug;
  return slug.substring(0, maxLen).replace(/-[^-]*$/, '');
}

/* ─── URL Structure ─── */

const URL_PATTERNS = {
  home: (l: Locale) => (l === 'ar' ? '/' : '/en'),
  about: (l: Locale) => (l === 'ar' ? '/about' : '/en/about'),
  contact: (l: Locale) => (l === 'ar' ? '/contact' : '/en/contact'),
  blog: (l: Locale) => (l === 'ar' ? '/blog' : '/en/blog'),
  blogPost: (l: Locale, slug: string) => (l === 'ar' ? `/blog/${slug}` : `/en/blog/${slug}`),
  labTests: (l: Locale) => (l === 'ar' ? '/lab-tests' : '/en/lab-tests'),
  labTest: (l: Locale, slug: string) => (l === 'ar' ? `/lab-tests/${slug}` : `/en/lab-tests/${slug}`),
  packages: (l: Locale) => (l === 'ar' ? '/packages' : '/en/packages'),
  package: (l: Locale, slug: string) => (l === 'ar' ? `/packages/${slug}` : `/en/packages/${slug}`),
  branches: (l: Locale) => (l === 'ar' ? '/branches' : '/en/branches'),
  branch: (l: Locale, slug: string) => (l === 'ar' ? `/branches/${slug}` : `/en/branches/${slug}`),
  departments: (l: Locale) => (l === 'ar' ? '/departments' : '/en/departments'),
  department: (l: Locale, slug: string) => (l === 'ar' ? `/departments/${slug}` : `/en/departments/${slug}`),
  faq: (l: Locale) => (l === 'ar' ? '/faq' : '/en/faq'),
  search: (l: Locale) => (l === 'ar' ? '/search' : '/en/search'),
  offers: (l: Locale) => (l === 'ar' ? '/offers' : '/en/offers'),
  homeVisit: (l: Locale) => (l === 'ar' ? '/home-visit' : '/en/home-visit'),
  results: (l: Locale) => (l === 'ar' ? '/results' : '/en/results'),
  appointment: (l: Locale) => (l === 'ar' ? '/book-appointment' : '/en/book-appointment'),
};

export function buildUrl(pattern: keyof typeof URL_PATTERNS, locale: Locale, ...args: string[]): string {
  const fn = URL_PATTERNS[pattern] as (...a: any[]) => string;
  return fn(locale, ...args);
}

export function buildCanonical(path: string, locale: Locale): string {
  const langPath = locale === 'ar' ? '' : '/en';
  return `${siteConfig.url}${langPath}${path}`.replace(/\/+$/, '');
}

/* ─── Redirect Rules ─── */

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
  locales?: Locale[];
}

export const redirectRules: Redirect[] = [
  // Old site → new site (301)
  { source: '/index.php', destination: '/', permanent: true },
  { source: '/index.html', destination: '/', permanent: true },
  { source: '/home', destination: '/', permanent: true },
  { source: '/ar', destination: '/', permanent: true },
  { source: '/en/home', destination: '/en', permanent: true },

  // Legacy URL patterns → new URL patterns
  { source: '/tests/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/test/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/analysis/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/تحاليل/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/تحليل/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/services/:slug', destination: '/lab-tests/:slug', permanent: true },
  { source: '/packages/:slug', destination: '/:locale/packages/:slug', permanent: true },
  { source: '/offers/:slug', destination: '/:locale/offers/:slug', permanent: true },
  { source: '/branches/:slug', destination: '/:locale/branches/:slug', permanent: true },
  { source: '/branch/:slug', destination: '/:locale/branches/:slug', permanent: true },
  { source: '/about-us', destination: '/:locale/about', permanent: true },
  { source: '/contact-us', destination: '/:locale/contact', permanent: true },
  { source: '/privacy-policy', destination: '/:locale/privacy', permanent: true },
  { source: '/terms-of-service', destination: '/:locale/terms', permanent: true },
  { source: '/faq', destination: '/:locale/faq', permanent: true },
  { source: '/articles/:slug', destination: '/:locale/blog/:slug', permanent: true },
  { source: '/news/:slug', destination: '/:locale/blog/:slug', permanent: true },
  { source: '/health-tips/:slug', destination: '/:locale/blog/:slug', permanent: true },
  { source: '/category/:category', destination: '/:locale/blog?category=:category', permanent: true },

  // File extensions (301 → clean URLs)
  { source: '/:path.php', destination: '/:path', permanent: true },
  { source: '/:path.html', destination: '/:path', permanent: true },
  { source: '/:path.aspx', destination: '/:path', permanent: true },
  { source: '/:path.jsp', destination: '/:path', permanent: true },

  // Trailing slash normalization
  { source: '/:path*/', destination: '/:path*', permanent: true },

  // Old result check page
  { source: '/check-results', destination: '/:locale/results', permanent: true },
  { source: '/get-results', destination: '/:locale/results', permanent: true },
  { source: '/result-inquiry', destination: '/:locale/results', permanent: true },

  // Old appointment booking
  { source: '/book-appointment', destination: '/:locale/book-appointment', permanent: true },
  { source: '/schedule-visit', destination: '/:locale/book-appointment', permanent: true },

  // Old social login redirects
  { source: '/auth/:provider/callback', destination: '/api/auth/:provider/callback', permanent: true },

  // Old images
  { source: '/img/:path*', destination: '/images/:path*', permanent: true },
  { source: '/uploads/:path*', destination: '/uploads/:path*', permanent: false },
];

export function findRedirect(source: string): Redirect | undefined {
  return redirectRules.find((r) => {
    const pattern = r.source
      .replace(/:\w+\*/g, '(.+)')
      .replace(/:\w+/g, '([^/]+)');
    return new RegExp(`^${pattern}$`).test(source);
  });
}

/* ─── Sitemap Helpers ─── */

export function getPriority(path: string): number {
  if (path === '/' || path === '/en') return 1.0;
  if (path.startsWith('/lab-tests') || path.startsWith('/en/lab-tests')) return 0.9;
  if (path.startsWith('/branches') || path.startsWith('/en/branches')) return 0.8;
  if (path.startsWith('/packages') || path.startsWith('/en/packages')) return 0.8;
  if (path.startsWith('/blog') || path.startsWith('/en/blog')) return 0.7;
  if (path.startsWith('/about') || path.startsWith('/en/about')) return 0.6;
  if (path.startsWith('/contact') || path.startsWith('/en/contact')) return 0.6;
  if (path.startsWith('/offers') || path.startsWith('/en/offers')) return 0.7;
  if (path.startsWith('/faq') || path.startsWith('/en/faq')) return 0.6;
  if (path.startsWith('/search') || path.startsWith('/en/search')) return 0.3;
  return 0.5;
}

export function getChangeFreq(path: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (path === '/' || path === '/en') return 'hourly';
  if (path.startsWith('/lab-tests') || path.startsWith('/en/lab-tests')) return 'weekly';
  if (path.startsWith('/branches') || path.startsWith('/en/branches')) return 'monthly';
  if (path.startsWith('/packages') || path.startsWith('/en/packages')) return 'daily';
  if (path.startsWith('/blog') || path.startsWith('/en/blog')) return 'daily';
  if (path.startsWith('/offers') || path.startsWith('/en/offers')) return 'daily';
  return 'weekly';
}
