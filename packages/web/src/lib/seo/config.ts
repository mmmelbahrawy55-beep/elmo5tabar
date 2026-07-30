export const siteConfig = {
  name: 'Al Mokhtabar Laboratory',
  nameAr: 'المختبر',
  tagline: 'Al Mokhtabar Laboratory for Medical Analysis',
  taglineAr: 'مختبر المختبر للتحاليل الطبية',
  description: 'Al Mokhtabar Laboratory offers over 1,000 medical laboratory tests with accurate results, home visit services, and digital health solutions across Saudi Arabia.',
  descriptionAr: 'يقدم مختبر المختبر أكثر من ١٠٠٠ اختبار معملي طبي بنتائج دقيقة، وخدمات الزيارات المنزلية، والحلول الصحية الرقمية في جميع أنحاء المملكة العربية السعودية.',
  url: 'https://almokhtabar.com',
  defaultLocale: 'ar' as const,
  locales: ['ar', 'en'] as const,
  localeLabels: { ar: 'العربية', en: 'English' },
  localeDomains: { ar: 'almokhtabar.com', en: 'en.almokhtabar.com' } as Record<string, string>,
  localePrefix: 'as-needed' as const,
  themeColor: '#0077B6',
  backgroundColor: '#F8FAFC',

  contact: {
    phone: '+966920033444',
    phoneFormatted: '920033444',
    whatsapp: '+966920033444',
    email: 'info@almokhtabar.com',
    supportEmail: 'support@almokhtabar.com',
    address: {
      ar: 'طريق الملك فهد، حي العليا، الرياض 12214، المملكة العربية السعودية',
      en: 'King Fahd Road, Al Olaya District, Riyadh 12214, Saudi Arabia',
    },
    coordinates: { latitude: 24.6877, longitude: 46.7219 },
    workingHours: {
      ar: 'السبت - الخميس: ٦:٠٠ صباحاً - ١٠:٠٠ مساءً',
      en: 'Sat-Thu: 6:00 AM - 10:00 PM',
    },
  },

  social: {
    facebook: 'https://facebook.com/almokhtabarlab',
    twitter: 'https://twitter.com/almokhtabarlab',
    instagram: 'https://instagram.com/almokhtabarlab',
    linkedin: 'https://linkedin.com/company/almokhtabarlab',
    youtube: 'https://youtube.com/@almokhtabarlab',
    snapchat: 'https://snapchat.com/add/almokhtabarlab',
    tiktok: 'https://tiktok.com/@almokhtabarlab',
  },

  verification: {
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_CODE',
    bing: 'YOUR_BING_WEBMASTER_CODE',
    googleAnalytics: 'G-XXXXXXXXXX',
    facebookPixel: 'XXXXXXXXXXXXXXX',
  },

  seo: {
    defaultImage: '/images/og-default.jpg',
    defaultImageAlt: 'Al Mokhtabar Laboratory | المختبر',
    logo: '/images/logo.svg',
    logoWidth: 200,
    logoHeight: 60,
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
    robotsTxt: true,
    sitemapSize: 50000,
  },
} as const;

export type Locale = (typeof siteConfig.locales)[number];
export type LocalizedString = Record<Locale, string>;

export function localize(str: LocalizedString, locale: Locale): string {
  return str[locale] || str.ar || '';
}
