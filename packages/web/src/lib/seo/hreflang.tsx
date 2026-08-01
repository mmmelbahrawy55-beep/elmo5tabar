import { siteConfig, type Locale } from './config';

export function HreflangTags({ path, locale }: { path: string; locale: Locale }) {
  const langs = siteConfig.locales as readonly Locale[];

  return (
    <>
      {langs.map((lang) => {
        const href = lang === siteConfig.defaultLocale
          ? `${siteConfig.url}${path}`
          : `${siteConfig.url}/${lang}${path}`;
        return <link key={lang} rel="alternate" href={href} hrefLang={lang} />;
      })}
      <link rel="alternate" href={`${siteConfig.url}${path}`} hrefLang="x-default" />
      <link rel="canonical" href={`${siteConfig.url}${locale === siteConfig.defaultLocale ? '' : `/${locale}`}${path}`} />
    </>
  );
}
