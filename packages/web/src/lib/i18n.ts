'use client';

const translations: Record<string, Record<string, string>> = {};

export function useTranslations() {
  return (key: string, fallback?: string): string => {
    return fallback || key;
  };
}

export function getTranslations(locale: string) {
  return (key: string, fallback?: string): string => {
    return fallback || key;
  };
}
