import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations() {
  const t = useNextIntlTranslations();
  return (key: string, fallback?: string): string => {
    const value = t(key);
    return value === key && fallback ? fallback : value;
  };
}
