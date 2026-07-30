'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'ar';
  const otherLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const otherLocaleLabel = currentLocale === 'ar' ? 'English' : 'العربية';

  return (
    <div className="min-h-screen flex flex-col" dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 left-4 z-10">
        <Link
          href={`/${otherLocale}${pathname.replace(`/${currentLocale}`, '')}`}
          className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          {otherLocaleLabel}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      <footer className="py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">المختبر</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} المختبر. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
