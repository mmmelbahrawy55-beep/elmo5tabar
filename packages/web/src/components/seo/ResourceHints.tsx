import { siteConfig } from '@/lib/seo/config';

const cdn = 'https://cdn.almokhtabar.com';
const analytics = 'https://www.googletagmanager.com';
const fonts = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

interface ResourceHint {
  rel: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch';
  href: string;
  as?: string;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export function ResourceHints() {
  const hints: ResourceHint[] = [
    { rel: 'preconnect', href: fonts[0], crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: fonts[1], crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: cdn, crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: analytics, crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: siteConfig.url, crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: cdn },
    { rel: 'dns-prefetch', href: analytics },
    { rel: 'prefetch', href: `${siteConfig.url}/lab-tests`, as: 'document' },
    { rel: 'prefetch', href: `${siteConfig.url}/packages`, as: 'document' },
    { rel: 'prefetch', href: `${siteConfig.url}/branches`, as: 'document' },
    { rel: 'preload', href: `${siteConfig.url}${siteConfig.seo.defaultImage}`, as: 'image' },
  ];

  return (
    <>
      {hints.map((hint, i) => (
        <link
          key={i}
          rel={hint.rel}
          href={hint.href}
          {...(hint.as ? { as: hint.as } : {})}
          {...(hint.type ? { type: hint.type } : {})}
          {...(hint.crossOrigin ? { crossOrigin: hint.crossOrigin } : {})}
        />
      ))}
    </>
  );
}

export function PerformanceMetrics() {
  return (
    <>
      <meta name="Cache-Control" content="public, max-age=31536000, immutable" />
      <meta httpEquiv="ScreenOrientation" content="portrait" />
    </>
  );
}
