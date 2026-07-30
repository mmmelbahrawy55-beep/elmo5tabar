import type { Metadata, OpenGraph, Twitter, ResolvedMetadata } from 'next';
import { siteConfig, type Locale } from './config';

type SEOImage = string | { url: string; width?: number; height?: number; alt?: string };

export interface SeoOptions {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  locale: Locale;
  path: string;
  canonical?: string;
  image?: SEOImage;
  imageAlt?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

function buildUrl(path: string, locale: Locale): string {
  const base = siteConfig.url;
  if (locale === 'ar') return `${base}${path}`;
  return `${base}/en${path}`;
}

function buildImageUrl(image: SEOImage | undefined, path: string): string {
  if (!image) return `${siteConfig.url}${siteConfig.seo.defaultImage}`;
  if (typeof image === 'string') return image.startsWith('http') ? image : `${siteConfig.url}${image}`;
  const url = image.url.startsWith('http') ? image.url : `${siteConfig.url}${image.url}`;
  return url;
}

function buildAlternates(path: string, locale: Locale): Record<string, string | string[]> {
  const alternates: Record<string, string | string[]> = {};
  for (const loc of siteConfig.locales) {
    const href = `${siteConfig.url}${loc === 'ar' ? path : `/en${path}`}`;
    alternates[loc === 'ar' ? 'x-default' : loc] = href;
  }
  alternates[locale] = buildUrl(path, locale);
  return alternates;
}

export function generateMetadata(opts: SeoOptions): Metadata {
  const url = buildUrl(opts.path, opts.locale);
  const imageUrl = buildImageUrl(opts.image, opts.path);
  const titleAr = opts.titleAr || opts.title;
  const descriptionAr = opts.descriptionAr || opts.description;
  const siteTitle = opts.locale === 'ar' ? `${titleAr} | ${siteConfig.nameAr}` : `${opts.title} | ${siteConfig.name}`;
  const index = !(opts.noindex || opts.nofollow);

  const og: OpenGraph = {
    type: opts.ogType || 'website',
    locale: opts.locale === 'ar' ? 'ar_SA' : 'en_US',
    siteName: opts.locale === 'ar' ? siteConfig.nameAr : siteConfig.name,
    url,
    title: siteTitle,
    description: opts.locale === 'ar' ? descriptionAr : opts.description,
    images: [{ url: imageUrl, width: 1200, height: 630, alt: opts.imageAlt || siteConfig.seo.defaultImageAlt }],
    ...(opts.publishedTime && { article: { publishedTime: opts.publishedTime, modifiedTime: opts.modifiedTime, authors: opts.authors, section: opts.section, tags: opts.tags } as any }),
  };

  const twitter: Twitter = {
    card: 'summary_large_image',
    title: siteTitle,
    description: opts.locale === 'ar' ? descriptionAr : opts.description,
    images: [imageUrl],
    site: siteConfig.social.twitter?.split('twitter.com/')[1],
    creator: siteConfig.social.twitter?.split('twitter.com/')[1],
  };

  return {
    title: opts.locale === 'ar' ? `${titleAr} | ${siteConfig.nameAr}` : `${opts.title} | ${siteConfig.name}`,
    description: opts.locale === 'ar' ? descriptionAr : opts.description,
    robots: {
      index,
      follow: index,
      googleBot: { index, follow, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    canonical: opts.canonical || url,
    openGraph: og,
    twitter,
    ...(opts.noindex && { robots: { index: false, follow: false } as any }),
    alternates: { languages: buildAlternates(opts.path, opts.locale) },
    other: {
      'article:published_time': opts.publishedTime || '',
      'article:modified_time': opts.modifiedTime || '',
      'article:section': opts.section || '',
      ...(opts.tags?.reduce((acc, tag) => ({ ...acc, 'article:tag': tag }), {})),
    },
    metadataBase: new URL(siteConfig.url),
  };
}

export function generateHomeMetadata(locale: Locale): Metadata {
  return generateMetadata({
    title: locale === 'ar' ? siteConfig.nameAr : siteConfig.name,
    titleAr: siteConfig.nameAr,
    description: locale === 'ar' ? siteConfig.descriptionAr : siteConfig.description,
    descriptionAr: siteConfig.descriptionAr,
    locale,
    path: '/',
    image: siteConfig.seo.defaultImage,
    imageAlt: siteConfig.seo.defaultImageAlt,
    ogType: 'website',
  });
}

export function generateBlogMetadata(post: { id: string; slug: string; titleAr: string; titleEn?: string; excerptAr?: string; excerptEn?: string; featuredImage?: string; publishedAt?: Date | string; updatedAt?: Date | string; tags?: string[]; category?: { nameAr: string; nameEn?: string; slug: string } | null; author?: { nameAr: string; nameEn?: string } | null }, locale: Locale): Metadata {
  return generateMetadata({
    title: locale === 'ar' ? post.titleAr : (post.titleEn || post.titleAr),
    description: locale === 'ar' ? (post.excerptAr || '') : (post.excerptEn || post.excerptAr || ''),
    locale,
    path: `/${locale === 'ar' ? '' : 'en'}/blog/${post.slug}`,
    image: post.featuredImage ? `${siteConfig.url}${post.featuredImage}` : undefined,
    ogType: 'article',
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    authors: post.author ? [locale === 'ar' ? post.author.nameAr : (post.author.nameEn || post.author.nameAr)] : undefined,
    section: post.category ? (locale === 'ar' ? post.category.nameAr : (post.category.nameEn || post.category.nameAr)) : undefined,
    tags: post.tags,
    noindex: false,
  });
}

export function generateTestMetadata(test: { id: string; slug: string; nameAr: string; nameEn?: string; descriptionAr?: string; descriptionEn?: string; shortName?: string; category?: { nameAr: string; nameEn?: string } | null; price?: number; isActive: boolean }, locale: Locale): Metadata {
  return generateMetadata({
    title: locale === 'ar' ? `تحليل ${test.nameAr}` : `${test.nameEn || test.nameAr} Test`,
    description: locale === 'ar' ? (test.descriptionAr || `تعرف على تحليل ${test.nameAr} في مختبر المختبر`).substring(0, 160) : (test.descriptionEn || `Learn about ${test.nameEn || test.nameAr} test at Al Mokhtabar Laboratory`).substring(0, 160),
    locale,
    path: `/lab-tests/${test.slug}`,
    ogType: 'article',
    section: locale === 'ar' ? (test.category?.nameAr) : (test.category?.nameEn),
    noindex: !test.isActive,
  });
}

export function generateBranchMetadata(branch: { id: string; slug: string; nameAr: string; nameEn?: string; addressAr?: string; addressEn?: string; phone?: string; latitude?: number; longitude?: number; city?: { nameAr: string; nameEn?: string } | null; image?: string }, locale: Locale): Metadata {
  return generateMetadata({
    title: locale === 'ar' ? `فرع ${branch.nameAr}` : `${branch.nameEn || branch.nameAr} Branch`,
    description: locale === 'ar' ? `فرع ${branch.nameAr} - ${branch.addressAr || ''} - ${branch.city?.nameAr || ''}`.substring(0, 160) : `${branch.nameEn || branch.nameAr} Branch - ${branch.addressEn || branch.addressAr || ''} - ${branch.city?.nameEn || branch.city?.nameAr || ''}`.substring(0, 160),
    locale,
    path: `/branches/${branch.slug}`,
    image: branch.image,
    ogType: 'website',
  });
}

export function generatePackageMetadata(pkg: { id: string; slug: string; nameAr: string; nameEn?: string; descriptionAr?: string; descriptionEn?: string; price: number; originalPrice?: number }, locale: Locale): Metadata {
  return generateMetadata({
    title: locale === 'ar' ? `باقة ${pkg.nameAr}` : `${pkg.nameEn || pkg.nameAr} Package`,
    description: locale === 'ar' ? (pkg.descriptionAr || `اطلع على باقة ${pkg.nameAr} من مختبر المختبر`).substring(0, 160) : (pkg.descriptionEn || `Check out ${pkg.nameEn || pkg.nameAr} package from Al Mokhtabar Laboratory`).substring(0, 160),
    locale,
    path: `/packages/${pkg.slug}`,
    ogType: 'website',
  });
}
