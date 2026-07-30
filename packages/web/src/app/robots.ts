import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en/',
          '/blog/',
          '/en/blog/',
          '/lab-tests/',
          '/en/lab-tests/',
          '/packages/',
          '/en/packages/',
          '/branches/',
          '/en/branches/',
          '/departments/',
          '/en/departments/',
          '/about',
          '/en/about',
          '/contact',
          '/en/contact',
          '/faq',
          '/en/faq',
          '/offers/',
          '/en/offers/',
          '/results',
          '/en/results',
          '/book-appointment',
          '/en/book-appointment',
        ],
        disallow: [
          '/dashboard/',
          '/en/dashboard/',
          '/auth/',
          '/en/auth/',
          '/api/',
          '/en/api/',
          '/_next/',
          '/admin/',
          '/en/admin/',
          '/search',
          '/en/search',
          '/checkout',
          '/en/checkout',
          '/payment/',
          '/en/payment/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/dashboard/', '/auth/', '/api/', '/admin/', '/payment/', '/checkout'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
