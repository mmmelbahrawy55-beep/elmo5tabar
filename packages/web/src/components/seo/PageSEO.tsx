'use client';

import Head from 'next/head';
import { siteConfig, type Locale } from '@/lib/seo/config';
import { HreflangTags } from '@/lib/seo/hreflang';

interface PageSEOProps {
  locale: Locale;
  path: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogType?: 'website' | 'article';
  schema?: Record<string, unknown>;
}

export function PageSEO({ locale, path, title, titleAr, description, descriptionAr, image, publishedTime, modifiedTime, noindex, nofollow, ogType, schema }: PageSEOProps) {
  const lang = locale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const siteTitle = locale === 'ar' ? `${titleAr || title} | ${siteConfig.nameAr}` : `${title} | ${siteConfig.name}`;
  const siteDesc = locale === 'ar' ? (descriptionAr || description) : description;
  const url = `${siteConfig.url}${locale === 'ar' ? '' : '/en'}${path}`;

  return (
    <>
      <html lang={lang} dir={dir} />
      <title>{siteTitle}</title>
      <meta name="description" content={siteDesc} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content={siteConfig.themeColor} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteConfig.nameAr} />
      <meta name="format-detection" content="telephone=yes, email=yes, address=yes" />
      <meta name="application-name" content={siteConfig.name} />
      <meta name="category" content="medical" />
      <meta name="classification" content="Medical Laboratory" />

      <meta property="og:type" content={ogType || 'website'} />
      <meta property="og:locale" content={locale === 'ar' ? 'ar_SA' : 'en_US'} />
      <meta property="og:site_name" content={locale === 'ar' ? siteConfig.nameAr : siteConfig.name} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDesc} />
      <meta property="og:image" content={image || `${siteConfig.url}${siteConfig.seo.defaultImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={siteConfig.seo.defaultImageAlt} />
      <meta property="og:phone_number" content={siteConfig.contact.phone} />
      <meta property="og:email" content={siteConfig.contact.email} />
      <meta property="og:country_name" content="Saudi Arabia" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.social.twitter?.split('twitter.com/')[1] || ''} />
      <meta name="twitter:creator" content={siteConfig.social.twitter?.split('twitter.com/')[1] || ''} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDesc} />
      <meta name="twitter:image" content={image || `${siteConfig.url}${siteConfig.seo.defaultImage}`} />
      <meta name="twitter:image:alt" content={siteConfig.seo.defaultImageAlt} />

      <link rel="canonical" href={url} />
      <HreflangTags path={path} locale={locale} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && (
        <meta name="robots" content={`index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`} />
      )}
      <meta name="googlebot" content={`${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}, max-image-preview:large, max-snippet:-1`} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </>
  );
}
