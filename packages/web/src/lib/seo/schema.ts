import { siteConfig } from './config';

type Thing = Record<string, unknown>;
type WithContext<T> = T & { '@context': 'https://schema.org' };

export function withContext<T extends Thing>(thing: T): WithContext<T> {
  return { '@context': 'https://schema.org', ...thing };
}

/* ─── Organization ─── */
export function organizationSchema(): WithContext<Thing> {
  return withContext({
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
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '06:00', closes: '22:00' },
    ],
    knowsLanguage: ['ar-SA', 'en-US'],
    numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 500, maxValue: 2000 },
    legalName: 'Al Mokhtabar Laboratory for Medical Analysis LLC',
    foundingDate: '2010',
    duns: '000000000',
    taxID: '0000000000',
  });
}

/* ─── WebSite ─── */
export function websiteSchema(): WithContext<Thing> {
  return withContext({
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
          urlTemplate: `${siteConfig.url}/{locale}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  });
}

/* ─── WebPage ─── */
export function webpageSchema(opts: { url: string; name: string; description: string; image?: string; dateModified?: string; breadcrumbId?: string }): WithContext<Thing> {
  return withContext({
    '@type': 'WebPage',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.seo.defaultImage}`,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    about: { '@id': `${siteConfig.url}/#organization` },
    dateModified: opts.dateModified || new Date().toISOString().split('T')[0],
    breadcrumb: opts.breadcrumbId ? { '@id': opts.breadcrumbId } : undefined,
    inLanguage: ['ar-SA', 'en-US'],
    significantLink: [siteConfig.url],
    specialty: ['Medical Laboratory', 'Diagnostic Services', 'Clinical Pathology', 'Medical Analysis'],
  });
}

/* ─── BreadcrumbList ─── */
interface BreadcrumbItem { name: string; url: string; }
export function breadcrumbSchema(items: BreadcrumbItem[]): WithContext<Thing> & { itemListElement: Thing[] } {
  return withContext({
    '@type': 'BreadcrumbList',
    '@id': `${siteConfig.url}/#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/* ─── Article / BlogPosting ─── */
export function articleSchema(opts: {
  url: string; headline: string; description: string; image?: string;
  datePublished: string; dateModified?: string; authorName: string; authorUrl?: string;
  publisherName?: string; publisherLogo?: string; category?: string; keywords?: string[];
  locale?: string;
}): WithContext<Thing> {
  return withContext({
    '@type': 'Article',
    '@id': opts.url,
    url: opts.url,
    headline: opts.headline,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.seo.defaultImage}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: { '@type': 'Person', '@id': opts.authorUrl || `${siteConfig.url}/#organization`, name: opts.authorName },
    publisher: { '@type': 'Organization', '@id': `${siteConfig.url}/#organization`, name: opts.publisherName || siteConfig.name, logo: opts.publisherLogo || `${siteConfig.url}${siteConfig.seo.logo}` },
    articleSection: opts.category || 'Medical Laboratory',
    keywords: (opts.keywords || []).join(', '),
    inLanguage: opts.locale === 'en' ? 'en-US' : 'ar-SA',
    isAccessibleForFree: true,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    wordCount: undefined,
    timeRequired: undefined,
  });
}

/* ─── FAQPage ─── */
interface FaqItem { question: string; answer: string; }
export function faqSchema(items: FaqItem[]): WithContext<Thing> & { mainEntity: Thing[] } {
  return withContext({
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
}

/* ─── MedicalTest ─── */
export function medicalTestSchema(opts: {
  url: string; name: string; description: string; image?: string;
  category?: string; affectedBy?: string[]; normalRange?: string;
  usesDevice?: string; signDetected?: string[];
  code?: string; codingSystem?: string;
}): WithContext<Thing> {
  return withContext({
    '@type': 'MedicalTest',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.seo.defaultImage}`,
    affectedBy: opts.affectedBy,
    normalRange: opts.normalRange,
    usesDevice: opts.usesDevice,
    signDetected: opts.signDetected,
    code: opts.code ? { '@type': 'MedicalCode', code: opts.code, codingSystem: opts.codingSystem || 'LOINC' } : undefined,
    isPartOf: { '@type': 'MedicalTestPanel', name: opts.category || 'Blood Test' },
    manufacturer: { '@id': `${siteConfig.url}/#organization` },
    study: undefined,
  });
}

/* ─── MedicalCondition ─── */
export function medicalConditionSchema(opts: {
  url: string; name: string; description: string;
  possibleTreatment?: string[]; symptom?: string[];
  riskFactor?: string[];
}): WithContext<Thing> {
  return withContext({
    '@type': 'MedicalCondition',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    possibleTreatment: opts.possibleTreatment?.map((t) => ({ '@type': 'MedicalTherapy', name: t })),
    symptom: opts.symptom?.map((s) => ({ '@type': 'MedicalSymptom', name: s })),
    riskFactor: opts.riskFactor?.map((r) => ({ '@type': 'MedicalRiskFactor', name: r })),
    epidemiology: undefined,
    pathophysiology: undefined,
  });
}

/* ─── Review ─── */
export function reviewSchema(opts: {
  itemName: string; itemUrl: string; reviewBody: string;
  authorName: string; reviewRating: number; bestRating?: number;
  datePublished?: string;
}): WithContext<Thing> {
  return withContext({
    '@type': 'Review',
    '@id': `${siteConfig.url}/#review-${Date.now()}`,
    itemReviewed: { '@type': 'MedicalOrganization', '@id': opts.itemUrl, name: opts.itemName },
    reviewBody: opts.reviewBody,
    author: { '@type': 'Person', name: opts.authorName },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: opts.reviewRating,
      bestRating: opts.bestRating || 5,
      worstRating: 1,
    },
    datePublished: opts.datePublished || new Date().toISOString().split('T')[0],
    publisher: { '@id': `${siteConfig.url}/#organization` },
  });
}

/* ─── AggregateRating ─── */
export function aggregateRatingSchema(opts: {
  ratingValue: number; bestRating?: number; worstRating?: number;
  ratingCount: number; reviewCount?: number;
}): WithContext<Thing> {
  return withContext({
    '@type': 'AggregateRating',
    '@id': `${siteConfig.url}/#rating`,
    itemReviewed: { '@id': `${siteConfig.url}/#organization` },
    ratingValue: opts.ratingValue,
    bestRating: opts.bestRating || 5,
    worstRating: opts.worstRating || 1,
    ratingCount: opts.ratingCount,
    reviewCount: opts.reviewCount || opts.ratingCount,
  });
}

/* ─── LocalBusiness ─── */
export function localBusinessSchema(opts: {
  url: string; name: string; description: string; image?: string;
  telephone: string; streetAddress: string; addressLocality: string;
  addressRegion: string; postalCode: string; addressCountry: string;
  latitude: number; longitude: number;
  openingHours?: string[]; dayOfWeek?: string[];
  priceRange?: string; branchOf?: string;
}): WithContext<Thing> {
  return withContext({
    '@type': 'MedicalBusiness',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.seo.defaultImage}`,
    telephone: opts.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: opts.streetAddress,
      addressLocality: opts.addressLocality,
      addressRegion: opts.addressRegion || opts.addressLocality,
      postalCode: opts.postalCode,
      addressCountry: opts.addressCountry,
    },
    geo: { '@type': 'GeoCoordinates', latitude: opts.latitude, longitude: opts.longitude },
    openingHoursSpecification: (opts.dayOfWeek || ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']).map((day) => ({
      '@type': 'OpeningHoursSpecification', dayOfWeek: day, opens: '06:00', closes: '22:00',
    })),
    priceRange: opts.priceRange || '$$',
    branchOf: opts.branchOf ? { '@id': `${siteConfig.url}/#organization` } : undefined,
    parentOrganization: { '@id': `${siteConfig.url}/#organization` },
    knowsLanguage: ['ar-SA', 'en-US'],
  });
}

/* ─── VideoObject ─── */
export function videoSchema(opts: {
  url: string; name: string; description: string; thumbnailUrl: string;
  contentUrl: string; embedUrl?: string; uploadDate: string;
  duration?: string; interactionStatistic?: { watchCount?: number };
}): WithContext<Thing> {
  return withContext({
    '@type': 'VideoObject',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    contentUrl: opts.contentUrl,
    embedUrl: opts.embedUrl,
    uploadDate: opts.uploadDate,
    duration: opts.duration || 'PT5M',
    publisher: { '@id': `${siteConfig.url}/#organization` },
    interactionStatistic: opts.interactionStatistic?.watchCount ? [{
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: opts.interactionStatistic.watchCount,
    }] : undefined,
  });
}

/* ─── SiteLinksSearchBox ─── */
export function sitelinksSearchBoxSchema(): WithContext<Thing> {
  return withContext({
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteConfig.url}/{locale}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    ],
  });
}

/* ─── Product (for health packages) ─── */
export function productSchema(opts: {
  url: string; name: string; description: string; image?: string;
  price: number; currency?: string; category?: string;
}): WithContext<Thing> {
  return withContext({
    '@type': 'Product',
    '@id': opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.seo.defaultImage}`,
    offers: {
      '@type': 'Offer',
      price: opts.price,
      priceCurrency: opts.currency || 'SAR',
      availability: 'https://schema.org/InStock',
      url: opts.url,
      priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      seller: { '@id': `${siteConfig.url}/#organization` },
    },
    category: opts.category || 'Medical Test Package',
  });
}
