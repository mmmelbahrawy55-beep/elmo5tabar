import { siteConfig } from './config';
import { withContext, organizationSchema, websiteSchema, webpageSchema, breadcrumbSchema, articleSchema, faqSchema, medicalTestSchema, localBusinessSchema, aggregateRatingSchema } from './schema';

/* ─── JSON-LD Component ─── */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLdGraph({ items }: { items: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': items }),
      }}
    />
  );
}

/* ─── Organization + Website + LocalBusiness (homepage) ─── */
export function HomepageJsonLd() {
  return (
    <JsonLdGraph
      items={[
        organizationSchema(),
        websiteSchema(),
        webpageSchema({
          url: siteConfig.url,
          name: `${siteConfig.nameAr} | ${siteConfig.name}`,
          description: siteConfig.description,
        }),
        localBusinessSchema({
          url: `${siteConfig.url}/#localbusiness`,
          name: siteConfig.name,
          description: siteConfig.description,
          telephone: siteConfig.contact.phone,
          streetAddress: 'King Fahd Road',
          addressLocality: 'Riyadh',
          addressRegion: 'Riyadh',
          postalCode: '12214',
          addressCountry: 'SA',
          latitude: siteConfig.contact.coordinates.latitude,
          longitude: siteConfig.contact.coordinates.longitude,
        }),
        aggregateRatingSchema({ ratingValue: 4.8, ratingCount: 15000, reviewCount: 12500 }),
      ]}
    />
  );
}

/* ─── Blog post JSON-LD ─── */
export function BlogPostJsonLd(post: {
  slug: string; titleAr: string; titleEn?: string; excerptAr?: string; excerptEn?: string;
  featuredImage?: string; publishedAt: Date | string; updatedAt?: Date | string;
  author?: { nameAr: string; nameEn?: string } | null;
  category?: { nameAr: string; nameEn?: string } | null;
  tags?: string[];
}) {
  const arUrl = `${siteConfig.url}/blog/${post.slug}`;
  const enUrl = `${siteConfig.url}/en/blog/${post.slug}`;
  return (
    <JsonLdGraph
      items={[
        organizationSchema(),
        websiteSchema(),
        articleSchema({
          url: arUrl,
          headline: post.titleAr,
          description: post.excerptAr || '',
          image: post.featuredImage ? `${siteConfig.url}${post.featuredImage}` : undefined,
          datePublished: new Date(post.publishedAt).toISOString(),
          dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
          authorName: post.author?.nameAr || siteConfig.nameAr,
          category: post.category?.nameAr,
          keywords: post.tags,
          locale: 'ar',
        }),
        articleSchema({
          url: enUrl,
          headline: post.titleEn || post.titleAr,
          description: post.excerptEn || post.excerptAr || '',
          image: post.featuredImage ? `${siteConfig.url}${post.featuredImage}` : undefined,
          datePublished: new Date(post.publishedAt).toISOString(),
          dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
          authorName: post.author?.nameEn || post.author?.nameAr || siteConfig.name,
          category: post.category?.nameEn || post.category?.nameAr,
          keywords: post.tags,
          locale: 'en',
        }),
        breadcrumbSchema([
          { name: siteConfig.nameAr, url: siteConfig.url },
          { name: post.category?.nameAr || 'المدونة', url: `${siteConfig.url}/blog` },
          { name: post.titleAr, url: arUrl },
        ]),
      ]}
    />
  );
}

/* ─── Medical test JSON-LD ─── */
export function MedicalTestJsonLd(test: {
  slug: string; nameAr: string; nameEn?: string; descriptionAr?: string; descriptionEn?: string;
  category?: { nameAr: string; nameEn?: string } | null;
  shortName?: string; price?: number;
}) {
  const url = `${siteConfig.url}/lab-tests/${test.slug}`;
  return (
    <JsonLdGraph
      items={[
        organizationSchema(),
        medicalTestSchema({
          url,
          name: test.nameAr,
          description: test.descriptionAr || '',
          category: test.category?.nameAr,
          code: test.shortName,
          codingSystem: 'LOCAL',
        }),
        medicalTestSchema({
          url: `${siteConfig.url}/en/lab-tests/${test.slug}`,
          name: test.nameEn || test.nameAr,
          description: test.descriptionEn || test.descriptionAr || '',
          category: test.category?.nameEn || test.category?.nameAr,
          code: test.shortName,
          codingSystem: 'LOCAL',
        }),
        breadcrumbSchema([
          { name: siteConfig.nameAr, url: siteConfig.url },
          { name: 'التحاليل المخبرية', url: `${siteConfig.url}/lab-tests` },
          { name: test.nameAr, url },
        ]),
      ]}
    />
  );
}

/* ─── FAQ JSON-LD ─── */
export function FaqJsonLd(items: { question: string; answer: string }[]) {
  return <JsonLd data={faqSchema(items)} />;
}

/* ─── Breadcrumb JSON-LD Component ─── */
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return <JsonLd data={breadcrumbSchema(items)} />;
}
