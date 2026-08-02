'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Heart, GitCompareArrows, ShoppingCart, Check, Clock,
  FlaskConical, AlertTriangle, Home, FileText, ShieldCheck, Star,
  ChevronDown, ChevronUp, HelpCircle, BookOpen, Tag, Users, Phone,
  TestTube2, Beaker, Info,
} from 'lucide-react';
import { ALL_TESTS, getTestById, getRelatedTests, CATEGORIES } from '@/data/tests';
import { useCartStore } from '@/stores';
import { useFavoritesStore, useCompareStore, useRecentlyViewedStore } from '@/stores/test-catalog';
import { cn, formatCurrency } from '@/lib/utils';
import type { LabTest } from '@/types/test';

const SAMPLE_LABELS: Record<string, string> = {
  blood: 'دم', serum: 'مصل', plasma: 'بلازما', urine: 'بول', stool: 'براز',
  saliva: 'لعاب', csf: 'سائل نخاعي', sputum: 'بلغم', tissue: 'نسيج', swab: 'مسحة',
  bone_marrow: 'نخاع عظمي', synovial_fluid: 'سائل مفصلي', pleural_fluid: 'سائل تورازي',
  peritoneal_fluid: 'سائل تبطني', seminal_fluid: 'سائل منوي', nail: 'ظفر',
  hair: 'شعر', other: 'أخرى',
};

function FAQAccordion({ faqs }: { faqs: LabTest['faqs'] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-surface-200 bg-white overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right text-sm font-semibold text-surface-800 hover:bg-surface-50 transition-colors"
          >
            <span>{faq.questionAr}</span>
            {openIdx === i ? <ChevronUp className="h-4 w-4 shrink-0 text-surface-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-surface-400" />}
          </button>
          {openIdx === i && (
            <div className="border-t border-surface-100 bg-surface-50/50 px-4 py-3 text-sm leading-relaxed text-surface-600">
              {faq.answerAr}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const testId = params?.id as string;

  const test = getTestById(testId);
  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addItem);
  const removeFromCart = useCartStore((s) => s.removeItem);
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const { compareIds, toggleCompare } = useCompareStore();
  const { addRecent } = useRecentlyViewedStore();

  useEffect(() => {
    if (testId) addRecent(testId);
  }, [testId, addRecent]);

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <TestTube2 className="mb-4 h-12 w-12 text-surface-300" />
        <h2 className="text-lg font-bold text-surface-700">التحليل غير موجود</h2>
        <p className="mt-1 text-sm text-surface-500">لم نتمكن من العثور على هذا التحليل</p>
        <Link href={`/${locale}/patient/tests`} className="mt-4 text-sm font-semibold text-brand-500 hover:text-brand-600">
          العودة للكتالوج
        </Link>
      </div>
    );
  }

  const catMeta = CATEGORIES[test.category];
  const related = getRelatedTests(test.id, 4);
  const inCart = cartItems.some((i) => i.testId === test.id);
  const isFav = favoriteIds.includes(test.id);
  const isCompare = compareIds.includes(test.id);

  const handleCart = () => {
    if (inCart) removeFromCart(test.id);
    else addToCart({ testId: test.id, nameAr: test.nameAr, nameEn: test.nameEn, price: test.discountedPrice || test.price, code: test.id });
  };

  return (
    <div className="min-h-screen bg-surface-50/50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-2 text-xs text-surface-400">
          <Link href={`/${locale}/patient/tests`} className="hover:text-brand-500 transition-colors">الكتالوج</Link>
          <span>/</span>
          <span className="text-surface-600">{catMeta?.nameAr}</span>
          <span>/</span>
          <span className="font-medium text-surface-800">{test.nameAr}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main Content */}
          <div className="space-y-5">
            {/* Title Card */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold"
                  style={{ backgroundColor: catMeta?.color || '#6B7280' }}
                >
                  {catMeta?.icon || '🧪'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-600">{test.id}</span>
                    {test.isPopular && (
                      <span className="flex items-center gap-1 rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-bold text-saffron-700">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        الأكثر طلباً
                      </span>
                    )}
                    {test.isFeatured && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        مميز
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-extrabold text-surface-900">{test.nameAr}</h1>
                  <p className="text-sm text-surface-400 mt-0.5">{test.nameEn}</p>
                  <p className="mt-3 text-sm leading-relaxed text-surface-600">{test.descriptionAr}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoPill icon={<FlaskConical className="h-4 w-4" />} label="العينة" value={SAMPLE_LABELS[test.sampleType] || test.sampleType} />
                <InfoPill icon={<Clock className="h-4 w-4" />} label="النتائج" value={test.turnaroundTime.standard} />
                <InfoPill icon={<Beaker className="h-4 w-4" />} label="حجم العينة" value={test.sampleVolume} />
                {test.fastingRequired && (
                  <InfoPill icon={<AlertTriangle className="h-4 w-4 text-saffron-600" />} label="الصيام" value={test.fastingDuration || '8-12 ساعة'} highlight />
                )}
              </div>
            </div>

            {/* Purpose */}
            <SectionCard title="الغرض من الفحص" icon={<Info className="h-4 w-4" />}>
              <p className="text-sm leading-relaxed text-surface-600">{test.purposeAr}</p>
            </SectionCard>

            {/* Who Needs It */}
            <SectionCard title="من يحتاج لهذا الفحص؟" icon={<Users className="h-4 w-4" />}>
              <p className="text-sm leading-relaxed text-surface-600">{test.whoNeedsItAr}</p>
            </SectionCard>

            {/* Preparation */}
            <SectionCard title="التحضير قبل الفحص" icon={<AlertTriangle className="h-4 w-4" />}>
              <ul className="space-y-2">
                {test.preparationAr.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Reference Ranges */}
            {test.normalRange.length > 0 && (
              <SectionCard title="المجالات المرجعية" icon={<FileText className="h-4 w-4" />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 text-xs font-semibold text-surface-500">
                        <th className="px-3 py-2 text-right">الفئة</th>
                        <th className="px-3 py-2 text-right">الحد الأدنى</th>
                        <th className="px-3 py-2 text-right">الحد الأقصى</th>
                        <th className="px-3 py-2 text-right">الوحدة</th>
                        <th className="px-3 py-2 text-right">الجنس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {test.normalRange.map((range, i) => (
                        <tr key={i} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                          <td className="px-3 py-2 font-semibold text-surface-800">{range.group}</td>
                          <td className="px-3 py-2 text-surface-600">{range.min}</td>
                          <td className="px-3 py-2 text-surface-600">{range.max}</td>
                          <td className="px-3 py-2 text-surface-500">{range.unit}</td>
                          <td className="px-3 py-2 text-surface-500">
                            {range.gender === 'male' ? 'ذكر' : range.gender === 'female' ? 'أنثى' : 'الكل'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Critical Values */}
            {test.criticalValues.length > 0 && (
              <SectionCard title="القيم الحرجة" icon={<AlertTriangle className="h-4 w-4 text-danger-500" />}>
                <div className="space-y-2">
                  {test.criticalValues.map((cv, i) => (
                    <div key={i} className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3',
                      cv.urgency === 'critical'
                        ? 'border-danger-200 bg-danger-50'
                        : 'border-warning-200 bg-warning-50',
                    )}>
                      <span className="text-sm font-semibold text-surface-800">{cv.condition}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        cv.urgency === 'critical' ? 'text-danger-600' : 'text-warning-600',
                      )}>
                        {cv.threshold} {cv.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Insurance Coverage */}
            {test.insuranceCoverage.length > 0 && (
              <SectionCard title="التغطية التأمينية" icon={<ShieldCheck className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {test.insuranceCoverage.map((ic, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50 px-4 py-3">
                      <span className="text-sm font-semibold text-surface-700">{ic.provider}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-600">{ic.coveragePercent}%</span>
                        {ic.preAuthRequired && (
                          <span className="rounded bg-saffron-100 px-1.5 py-0.5 text-[10px] font-semibold text-saffron-700">
                            موافقة مسبقة
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Medical References */}
            {test.medicalReferences.length > 0 && (
              <SectionCard title="المراجع الطبية" icon={<BookOpen className="h-4 w-4" />}>
                <div className="space-y-2">
                  {test.medicalReferences.map((ref, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-surface-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                      <span className="font-medium">{ref.source}</span>
                      <span className="text-surface-400">({ref.year})</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* FAQs */}
            {test.faqs.length > 0 && (
              <SectionCard title="الأسئلة الشائعة" icon={<HelpCircle className="h-4 w-4" />}>
                <FAQAccordion faqs={test.faqs} />
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Price & CTA */}
            <div className="rounded-2xl border border-surface-200 bg-white p-5">
              <div className="mb-4 text-center">
                {test.discountedPrice ? (
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl font-extrabold text-brand-600">{test.discountedPrice}</span>
                    <span className="text-lg text-surface-400 line-through">{test.price}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold text-surface-900">{test.price}</span>
                )}
                <p className="text-xs text-surface-400 mt-1">ريال سعودي / فحص واحد</p>
                {test.discountedPrice && (
                  <span className="mt-2 inline-flex rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">
                    وفّر {Math.round((1 - test.discountedPrice / test.price) * 100)}%
                  </span>
                )}
              </div>

              <button
                onClick={handleCart}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all',
                  inCart
                    ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
                    : 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-brand hover:shadow-brand-lg hover:brightness-110',
                )}
              >
                {inCart ? (
                  <><Check className="h-4 w-4" />في السلة — تقدم للحجز</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" />أضف للسلة</>
                )}
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleFavorite(test.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all',
                    isFav
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-surface-200 bg-white text-surface-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500',
                  )}
                >
                  <Heart className={cn('h-3.5 w-3.5', isFav && 'fill-current')} />
                  {isFav ? 'في المفضلة' : 'إضافة للمفضلة'}
                </button>
                <button
                  onClick={() => toggleCompare(test.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all',
                    isCompare
                      ? 'border-brand-200 bg-brand-50 text-brand-600'
                      : 'border-surface-200 bg-white text-surface-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-500',
                  )}
                >
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  {isCompare ? 'في المقارنة' : 'إضافة للمقارنة'}
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="rounded-2xl border border-surface-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold text-surface-800">معلومات سريعة</h3>
              <div className="space-y-3">
                <QuickInfoRow label="طريقة السحب" value={test.collectionMethod} />
                <QuickInfoRow label="موعد مسبق" value={test.requiresAppointment ? 'مطلوب' : 'غير مطلوب'} />
                <QuickInfoRow label="زيارة منزلية" value={test.homeVisitAvailable ? 'متوفرة' : 'غير متوفرة'} />
                <QuickInfoRow label="آخر تحديث" value={test.lastUpdated} />
              </div>
            </div>

            {/* Tags */}
            {test.tags.length > 0 && (
              <div className="rounded-2xl border border-surface-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-surface-800">
                  <Tag className="h-3.5 w-3.5" />
                  الوسوم
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {test.tags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-medium text-surface-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phone */}
            <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-brand-500 to-accent-500 p-5 text-white">
              <h3 className="mb-1 text-sm font-bold">هل تحتاج مساعدة؟</h3>
              <p className="mb-3 text-xs text-white/80">فريقنا جاهز للإجابة على استفساراتك</p>
              <a
                href="tel:920001234"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Phone className="h-4 w-4" />
                920001234
              </a>
            </div>
          </div>
        </div>

        {/* Related Tests */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-extrabold text-surface-900">تحاليل ذات صلة</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rt) => {
                const rtCat = CATEGORIES[rt.category];
                return (
                  <Link
                    key={rt.id}
                    href={`/patient/tests/${rt.id}`}
                    className="group rounded-xl border border-surface-200 bg-white p-4 transition-all hover:shadow-md hover:border-brand-200"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-600">{rt.id}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: rtCat?.color }}>
                        {rtCat?.nameAr}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-surface-800 group-hover:text-brand-600 transition-colors">{rt.nameAr}</h4>
                    <p className="mt-1 text-xs text-surface-400">{rt.nameEn}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-extrabold text-surface-900">{rt.discountedPrice || rt.price} <span className="text-xs text-surface-400">ر.س</span></span>
                      <span className="flex items-center gap-1 text-[10px] text-surface-500">
                        <Clock className="h-3 w-3" />
                        {rt.turnaroundTime.standard}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-surface-800">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoPill({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-xl px-3 py-2.5',
      highlight ? 'bg-saffron-50 ring-1 ring-saffron-200' : 'bg-surface-50',
    )}>
      <div className={cn('shrink-0', highlight ? 'text-saffron-600' : 'text-surface-500')}>{icon}</div>
      <div>
        <p className="text-[10px] font-medium text-surface-400">{label}</p>
        <p className={cn('text-xs font-bold', highlight ? 'text-saffron-700' : 'text-surface-800')}>{value}</p>
      </div>
    </div>
  );
}

function QuickInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-surface-500">{label}</span>
      <span className="font-medium text-surface-800">{value}</span>
    </div>
  );
}
