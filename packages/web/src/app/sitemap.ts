import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/config';
import { getPriority, getChangeFreq } from '@/lib/seo/urls';

/* ─── Static Routes (both locales) ─── */
const staticRoutes: { ar: string; en: string }[] = [
  { ar: '/', en: '/en' },
  { ar: '/about', en: '/en/about' },
  { ar: '/contact', en: '/en/contact' },
  { ar: '/faq', en: '/en/faq' },
  { ar: '/results', en: '/en/results' },
  { ar: '/book-appointment', en: '/en/book-appointment' },
  { ar: '/offers', en: '/en/offers' },
  { ar: '/home-visit', en: '/en/home-visit' },
  { ar: '/privacy', en: '/en/privacy' },
  { ar: '/terms', en: '/en/terms' },
  { ar: '/blog', en: '/en/blog' },
  { ar: '/lab-tests', en: '/en/lab-tests' },
  { ar: '/packages', en: '/en/packages' },
  { ar: '/branches', en: '/en/branches' },
  { ar: '/departments', en: '/en/departments' },
];

/* ─── Dynamic data placeholders (replace with actual API calls) ─── */
// These functions should be implemented to fetch from the NestJS backend
async function getPublishedPosts() { return [] as { slug: string; updatedAt: Date }[]; }
async function getActiveTests() { return [] as { slug: string; updatedAt: Date }[]; }
async function getActivePackages() { return [] as { slug: string; updatedAt: Date }[]; }
async function getBranches() { return [] as { slug: string; updatedAt: Date }[]; }
async function getDepartments() { return [] as { slug: string; updatedAt: Date }[]; }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tests, packages, branches, departments] = await Promise.all([
    getPublishedPosts(),
    getActiveTests(),
    getActivePackages(),
    getBranches(),
    getDepartments(),
  ]);

  const allEntries: MetadataRoute.Sitemap = [];

  for (const route of staticRoutes) {
    for (const [locale, path] of Object.entries(route) as [string, string][]) {
      allEntries.push({
        url: `${siteConfig.url}${path}`,
        lastModified: new Date(),
        changeFrequency: getChangeFreq(path),
        priority: getPriority(path),
        alternates: {
          languages: {
            ar: `${siteConfig.url}${route.ar}`,
            en: `${siteConfig.url}${route.en}`,
            'x-default': `${siteConfig.url}${route.ar}`,
          },
        },
      });
    }
  }

  for (const post of posts) {
    const ar = `/blog/${post.slug}`;
    const en = `/en/blog/${post.slug}`;
    allEntries.push({
      url: `${siteConfig.url}${ar}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
    allEntries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
  }

  for (const test of tests) {
    const ar = `/lab-tests/${test.slug}`;
    const en = `/en/lab-tests/${test.slug}`;
    allEntries.push({
      url: `${siteConfig.url}${ar}`,
      lastModified: test.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
    allEntries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: test.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
  }

  for (const pkg of packages) {
    const ar = `/packages/${pkg.slug}`;
    const en = `/en/packages/${pkg.slug}`;
    allEntries.push({
      url: `${siteConfig.url}${ar}`,
      lastModified: pkg.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
    allEntries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: pkg.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
  }

  for (const branch of branches) {
    const ar = `/branches/${branch.slug}`;
    const en = `/en/branches/${branch.slug}`;
    allEntries.push({
      url: `${siteConfig.url}${ar}`,
      lastModified: branch.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
    allEntries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: branch.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
  }

  for (const dept of departments) {
    const ar = `/departments/${dept.slug}`;
    const en = `/en/departments/${dept.slug}`;
    allEntries.push({
      url: `${siteConfig.url}${ar}`,
      lastModified: dept.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
    allEntries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: dept.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: { languages: { ar: `${siteConfig.url}${ar}`, en: `${siteConfig.url}${en}`, 'x-default': `${siteConfig.url}${ar}` } },
    });
  }

  return allEntries;
}
