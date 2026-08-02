'use client';

import { usePathname } from 'next/navigation';

export default function OrdersPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const titles: Record<string, string> = {
    ar: 'الطلبات',
    en: 'Orders',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{titles[locale] || titles.ar}</h2>
      <p className="text-surface-500 dark:text-surface-400 max-w-md">
        {locale === 'ar' ? 'هذه الصفحة قيد الإنشاء. شكراً لصبركم.' : 'This page is under construction. Thank you for your patience.'}
      </p>
    </div>
  );
}
