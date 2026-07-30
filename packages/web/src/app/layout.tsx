import type { Metadata, Viewport } from 'next';
import { siteConfig } from '@/lib/seo/config';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: siteConfig.themeColor,
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.nameAr} | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'medical laboratory',
    'diagnostics',
    'blood tests',
    'health screening',
    'clinical laboratory',
    'المختبر',
    'مختبر طبي',
    'تحاليل طبية',
    'فحوصات مخبرية',
    'الرياض',
    'السعودية',
    'medical analysis',
    'lab test Saudi Arabia',
    'Riyadh lab',
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  applicationName: siteConfig.name,
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: siteConfig.nameAr,
    url: siteConfig.url,
    title: `${siteConfig.nameAr} | ${siteConfig.name}`,
    description: siteConfig.descriptionAr,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.seo.defaultImage}`,
        width: 1200,
        height: 630,
        alt: siteConfig.seo.defaultImageAlt,
      },
    ],
    countryName: 'Saudi Arabia',
    phoneNumbers: [siteConfig.contact.phone],
    emails: [siteConfig.contact.email],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.nameAr} | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [`${siteConfig.url}${siteConfig.seo.defaultImage}`],
    site: siteConfig.social.twitter?.split('twitter.com/')[1] || '',
    creator: siteConfig.social.twitter?.split('twitter.com/')[1] || '',
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'x-default': siteConfig.url,
      ar: siteConfig.url,
      en: `${siteConfig.url}/en`,
    },
  },
  icons: {
    icon: [
      { url: siteConfig.seo.favicon, sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: siteConfig.seo.appleTouchIcon, sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: siteConfig.themeColor },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: siteConfig.verification.google,
    other: {
      'msvalidate.01': siteConfig.verification.bing,
      'facebook-domain-verification': siteConfig.verification.facebookPixel,
    },
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.nameAr,
    statusBarStyle: 'default',
  },
  category: 'medical',
  classification: 'Medical Laboratory',
  other: {
    'geo.region': 'SA-01',
    'geo.placename': 'Riyadh',
    'geo.position': `${siteConfig.contact.coordinates.latitude};${siteConfig.contact.coordinates.longitude}`,
    'ICBM': `${siteConfig.contact.coordinates.latitude}, ${siteConfig.contact.coordinates.longitude}`,
    'language': siteConfig.defaultLocale,
    'distribution': 'global',
    'rating': 'general',
    'target': 'all',
    'HandheldFriendly': 'True',
    'MobileOptimized': '320',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MedicalOrganization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      alternateName: [siteConfig.nameAr, 'Al Mokhtabar', 'المختبر'],
      url: siteConfig.url,
      logo: `${siteConfig.url}${siteConfig.seo.logo}`,
      image: `${siteConfig.url}${siteConfig.seo.defaultImage}`,
      description: siteConfig.description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'King Fahd Road',
        addressLocality: 'Riyadh',
        addressRegion: 'Riyadh',
        postalCode: '12214',
        addressCountry: 'SA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: siteConfig.contact.coordinates.latitude,
        longitude: siteConfig.contact.coordinates.longitude,
      },
      telephone: siteConfig.contact.phone,
      email: siteConfig.contact.email,
      areaServed: [
        { '@type': 'City', name: 'Riyadh' },
        { '@type': 'City', name: 'Jeddah' },
        { '@type': 'City', name: 'Dammam' },
        { '@type': 'City', name: 'Mecca' },
        { '@type': 'City', name: 'Medina' },
      ],
      sameAs: Object.values(siteConfig.social),
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          opens: '06:00',
          closes: '22:00',
        },
      ],
      knowsLanguage: ['ar-SA', 'en-US'],
      legalName: 'Al Mokhtabar Laboratory for Medical Analysis LLC',
    },
    {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: siteConfig.nameAr,
      description: siteConfig.description,
      publisher: { '@id': `${siteConfig.url}/#organization` },
      inLanguage: ['ar-SA', 'en-US'],
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/#webpage`,
      url: siteConfig.url,
      name: `${siteConfig.nameAr} | ${siteConfig.name}`,
      description: siteConfig.description,
      isPartOf: { '@id': `${siteConfig.url}/#website` },
      about: { '@id': `${siteConfig.url}/#organization` },
      inLanguage: ['ar-SA', 'en-US'],
      significantLink: [siteConfig.url],
      specialty: ['Medical Laboratory', 'Diagnostic Services', 'Clinical Pathology'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${siteConfig.url}/#localbusiness`,
      parentOrganization: { '@id': `${siteConfig.url}/#organization` },
      name: siteConfig.name,
      telephone: siteConfig.contact.phone,
      priceRange: '$$',
      image: `${siteConfig.url}${siteConfig.seo.defaultImage}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'King Fahd Road',
        addressLocality: 'Riyadh',
        addressRegion: 'Riyadh',
        postalCode: '12214',
        addressCountry: 'SA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: siteConfig.contact.coordinates.latitude,
        longitude: siteConfig.contact.coordinates.longitude,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          opens: '06:00',
          closes: '22:00',
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-surface-50 font-sans antialiased selection:bg-brand-200 selection:text-brand-900">
        {children}
      </body>
    </html>
  );
}
