import { siteConfig } from '@/lib/seo/config';

/* ─── Priority asset preloading ─── */
const CDN = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.almokhtabar.com';
const fonts = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

interface PreloadHint {
  rel: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch' | 'modulepreload';
  href: string;
  as?: 'image' | 'font' | 'script' | 'style' | 'document' | 'fetch';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
}

export function PriorityPreloader() {
  const hints: PreloadHint[] = [
    // Critical connections
    { rel: 'preconnect', href: fonts[0], crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: fonts[1], crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: CDN, crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: siteConfig.url, crossOrigin: 'anonymous' },

    // DNS lookups
    { rel: 'dns-prefetch', href: CDN },
    { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
    { rel: 'dns-prefetch', href: 'https://connect.facebook.net' },

    // Hero image
    { rel: 'preload', href: `${siteConfig.url}${siteConfig.seo.defaultImage}`, as: 'image' },
  ];

  return (
    <>
      {hints.map((h, i) => (
        <link
          key={i}
          rel={h.rel}
          href={h.href}
          {...(h.as ? { as: h.as } : {})}
          {...(h.type ? { type: h.type } : {})}
          {...(h.crossOrigin ? { crossOrigin: h.crossOrigin } : {})}
          {...(h.media ? { media: h.media } : {})}
        />
      ))}
    </>
  );
}

/* ─── Route-based prefetching (read viewport) ─── */
export function PredictivePrefetcher() {
  const commonRoutes = [
    '/lab-tests',
    '/packages',
    '/branches',
    '/blog',
    '/about',
    '/contact',
  ];
  return (
    <>
      {commonRoutes.map((route) => (
        <link key={route} rel="prefetch" href={route} as="document" />
      ))}
    </>
  );
}
