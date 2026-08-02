import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { siteConfig } from '@/lib/seo/config';
import { redirectRules } from '@/lib/seo/urls';

const locales = siteConfig.locales as readonly string[];
const defaultLocale = siteConfig.defaultLocale;

function getLocaleFromPath(pathname: string): { locale: string; restPath: string } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return { locale: segments[0], restPath: '/' + segments.slice(1).join('/') };
  }
  return { locale: defaultLocale, restPath: pathname };
}

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;
  const preferences = acceptLanguage.split(',').map((lang) => {
    const [code] = lang.trim().split(';')[0].split('-');
    return code;
  });
  for (const pref of preferences) {
    if (locales.includes(pref)) return pref;
    if (pref === 'ar') return 'ar';
  }
  if (preferences.some((p) => p.startsWith('ar'))) return 'ar';
  return defaultLocale;
}

function getDomainLocale(hostname: string): string | null {
  for (const [locale, domain] of Object.entries(siteConfig.localeDomains)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return locale;
  }
  return null;
}

function matchRedirect(pathname: string): { destination: string; permanent: boolean } | null {
  for (const rule of redirectRules) {
    const pattern = rule.source
      .replace(/:\w+\*/g, '(.+)')
      .replace(/:\w+/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);
    const match = pathname.match(regex);
    if (match) {
      let dest = rule.destination;
      match.slice(1).forEach((group, i) => {
        dest = dest.replace(`:$${i + 1}`, group);
        dest = dest.replace(`:locale`, defaultLocale);
      });
      dest = dest.replace(/:locale/g, defaultLocale);
      const wildcardIndex = rule.source.indexOf(':path*');
      if (wildcardIndex !== -1) {
        const captured = match[1] || '';
        dest = dest.replace(':path*', captured);
      }
      return { destination: dest, permanent: rule.permanent };
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, search, hostname } = request.nextUrl;

  // ─── 1. Lowercase redirect (except Arabic) ───
  const hasArabic = /[\u0600-\u06FF]/.test(pathname);
  if (!hasArabic && pathname !== pathname.toLowerCase() && !pathname.includes('/api/')) {
    const url = new URL(pathname.toLowerCase() + search, request.url);
    return NextResponse.redirect(url, 301);
  }

  // ─── 2. WWW normalization ───
  if (hostname.startsWith('www.')) {
    const nonWww = hostname.replace('www.', '');
    const url = new URL(request.nextUrl.protocol + '//' + nonWww + pathname + search);
    return NextResponse.redirect(url, 301);
  }

  // ─── 3. Domain-based locale detection ───
  const domainLocale = getDomainLocale(hostname);
  if (domainLocale && domainLocale !== defaultLocale) {
    const url = new URL(`/${domainLocale}${pathname}` + search, request.url);
    url.hostname = hostname;
    return NextResponse.redirect(url, 301);
  }

  // ─── 4. API routes pass through ───
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.startsWith('/uploads/') || pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname.startsWith('/images/')) {
    return NextResponse.next();
  }

  // ─── 5. Redirect rules (301 legacy URLs) ───
  const redirect = matchRedirect(pathname);
  if (redirect) {
    const url = new URL(redirect.destination + search, request.url);
    return NextResponse.redirect(url, redirect.permanent ? 301 : 302);
  }

  // ─── 6. Locale detection and prefix ───
  const { locale, restPath } = getLocaleFromPath(pathname);

  if (locale === defaultLocale) {
    // Keep locale prefix for default locale — Next.js [locale] routes need it
  } else if (!locales.includes(locale)) {
    const detected = getLocaleFromAcceptLanguage(request.headers.get('accept-language'));
    const url = new URL(`/${detected}${pathname}` + search, request.url);
    return NextResponse.redirect(url, 302);
  }

  // ─── 7. Hreflang headers ───
  const response = NextResponse.next();

  const currentLocale = locales.includes(locale) ? locale : defaultLocale;
  for (const loc of locales) {
    const href = `${siteConfig.url}/${loc}${restPath}`;
    response.headers.append('Link', `<${href}>; rel="alternate"; hreflang="${loc}"`);
  }
  response.headers.append('Link', `<${siteConfig.url}/${currentLocale}${restPath}>; rel="alternate"; hreflang="x-default"`);

  // ─── 8. Canonical header ───
  const canonicalPath = `/${currentLocale}${restPath}`;
  response.headers.set('Link', `<${siteConfig.url}${canonicalPath}>; rel="canonical"`);
  response.headers.set('x-locale', currentLocale);

  // ─── 9. Security headers ───
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|uploads/).*)'],
};
