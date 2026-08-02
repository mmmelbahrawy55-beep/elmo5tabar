'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  X, ArrowRight, Plus, TestTube2, Clock, FlaskConical, DollarSign,
  AlertTriangle, ShieldCheck, ShoppingCart, Check,
} from 'lucide-react';
import { ALL_TESTS, getTestById, CATEGORIES } from '@/data/tests';
import { useCartStore } from '@/stores';
import { useCompareStore } from '@/stores/test-catalog';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types/test';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean);

  const { compareIds, removeFromCompare, clearCompare } = useCompareStore();
  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addItem);
  const removeFromCart = useCartStore((s) => s.removeItem);

  const effectiveIds = ids.length > 0 ? ids : compareIds;
  const tests = useMemo(
    () => effectiveIds.map((id) => getTestById(id)).filter(Boolean) as LabTest[],
    [effectiveIds],
  );

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
          <TestTube2 className="h-8 w-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-bold text-surface-700">لا توجد تحاليل للمقارنة</h2>
        <p className="mt-1 text-sm text-surface-500">أضف تحاليل من الكتالوج ثم عد هنا للمقارنة</p>
        <Link
              href={`/${locale}/patient/tests`}
          className="mt-5 flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          تصفح الكتالوج
        </Link>
      </div>
    );
  }

  const allPrices = tests.map((t) => t.discountedPrice || t.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const cheapest = tests.find((t) => (t.discountedPrice || t.price) === minPrice);

  const toggleCart = (test: LabTest) => {
    const inCart = cartItems.some((i) => i.testId === test.id);
    if (inCart) removeFromCart(test.id);
    else addToCart({ testId: test.id, nameAr: test.nameAr, nameEn: test.nameEn, price: test.discountedPrice || test.price, code: test.id });
  };

  const comparisonRows: { label: string; icon: React.ReactNode; render: (t: LabTest) => React.ReactNode }[] = [
    {
      label: 'الفئة',
      icon: <TestTube2 className="h-3.5 w-3.5" />,
      render: (t) => {
        const cat = CATEGORIES[t.category];
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: cat?.color }}>
            {cat?.icon} {cat?.nameAr}
          </span>
        );
      },
    },
    {
      label: 'السعر',
      icon: <DollarSign className="h-3.5 w-3.5" />,
      render: (t) => {
        const price = t.discountedPrice || t.price;
        const isCheapest = t.id === cheapest?.id;
        return (
          <div>
            <span className={cn('text-lg font-extrabold', isCheapest ? 'text-success-600' : 'text-surface-900')}>{price}</span>
            <span className="text-xs text-surface-400 mr-1">ر.س</span>
            {isCheapest && tests.length > 1 && (
              <span className="mr-1 rounded-full bg-success-100 px-1.5 py-0.5 text-[10px] font-bold text-success-700">الأفضل سعراً</span>
            )}
            {t.discountedPrice && (
              <span className="block text-xs text-surface-400 line-through">{t.price} ر.س</span>
            )}
          </div>
        );
      },
    },
    {
      label: 'سرعة النتائج',
      icon: <Clock className="h-3.5 w-3.5" />,
      render: (t) => (
        <div>
          <span className="text-sm font-bold text-surface-800">{t.turnaroundTime.standard}</span>
          {t.turnaroundTime.rush && (
            <span className="mt-0.5 block text-xs text-success-600">عاجل: {t.turnaroundTime.rush}</span>
          )}
        </div>
      ),
    },
    {
      label: 'نوع العينة',
      icon: <FlaskConical className="h-3.5 w-3.5" />,
      render: (t) => (
        <div>
          <span className="text-sm font-semibold text-surface-800">{t.sampleType}</span>
          <span className="mt-0.5 block text-xs text-surface-500">{t.sampleVolume}</span>
        </div>
      ),
    },
    {
      label: 'الصيام',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      render: (t) => t.fastingRequired ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-2.5 py-1 text-xs font-bold text-saffron-700">
          صيام {t.fastingDuration || '8-12 ساعة'}
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-success-100 px-2.5 py-1 text-xs font-bold text-success-700">
          لا يتطلب صيام
        </span>
      ),
    },
    {
      label: 'طريقة السحب',
      icon: <FlaskConical className="h-3.5 w-3.5" />,
      render: (t) => <span className="text-sm text-surface-700">{t.collectionMethod}</span>,
    },
    {
      label: 'الزيارة المنزلية',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      render: (t) => t.homeVisitAvailable ? (
        <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">متوفرة</span>
      ) : (
        <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-1 text-xs font-semibold text-surface-500">غير متوفرة</span>
      ),
    },
    {
      label: 'التغطية التأمينية',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      render: (t) => (
        <div className="space-y-1">
          {t.insuranceCoverage.slice(0, 3).map((ic, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-surface-700">{ic.provider}</span>
              <span className="font-bold text-brand-600">{ic.coveragePercent}%</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'الوسوم',
      icon: null,
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600">{tag}</span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50/50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-surface-900">مقارنة التحاليل</h1>
            <p className="text-sm text-surface-500 mt-0.5">مقارنة {tests.length} تحاليل جنباً إلى جنب</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
          href={`/${locale}/patient/tests`}
              className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة تحليل
            </Link>
            <button
              onClick={clearCompare}
              className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-white px-3.5 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              مسح الكل
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white">
          {/* Test Headers */}
          <div className="flex border-b border-surface-200">
            <div className="w-44 shrink-0 border-l border-surface-200 bg-surface-50 p-4" />
            {tests.map((test) => {
              const cat = CATEGORIES[test.category];
              const inCart = cartItems.some((i) => i.testId === test.id);
              return (
                <div key={test.id} className="flex-1 min-w-[200px] border-l border-surface-200 p-4 text-center">
                  <button
                    onClick={() => {
                      removeFromCompare(test.id);
                      const newIds = effectiveIds.filter((id) => id !== test.id);
                      if (newIds.length > 0) router.replace(`/${locale}/patient/tests/compare?ids=${newIds.join(',')}`);
                      else router.push(`/${locale}/patient/tests`);
                    }}
                    className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-100 text-surface-400 hover:bg-danger-50 hover:text-danger-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: cat?.color }}>
                    {cat?.icon}
                  </div>
                  <h3 className="text-sm font-bold text-surface-900">{test.nameAr}</h3>
                  <p className="text-[10px] text-surface-400 mt-0.5">{test.nameEn}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-surface-500">{test.descriptionAr}</p>
                  <button
                    onClick={() => toggleCart(test)}
                    className={cn(
                      'mt-3 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all mx-auto',
                      inCart
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-50 text-brand-600 hover:bg-brand-100',
                    )}
                  >
                    {inCart ? <><Check className="h-3.5 w-3.5" />في السلة</> : <><ShoppingCart className="h-3.5 w-3.5" />أضف</>}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison Rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className={cn(
                'flex border-b border-surface-100 last:border-b-0',
                i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50',
              )}
            >
              <div className="flex w-44 shrink-0 items-center gap-2 border-l border-surface-200 px-4 py-3">
                {row.icon && <span className="text-surface-400">{row.icon}</span>}
                <span className="text-xs font-semibold text-surface-600">{row.label}</span>
              </div>
              {tests.map((test) => (
                <div key={test.id} className="flex-1 min-w-[200px] border-l border-surface-200 px-4 py-3">
                  {row.render(test)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
