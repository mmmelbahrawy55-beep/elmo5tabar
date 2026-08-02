'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, SlidersHorizontal, Grid3X3, List, TestTube2, Clock,
  Heart, GitCompareArrows, ChevronDown, X, Check, Star,
  FlaskConical, Home, AlertTriangle, ArrowUpDown, RotateCcw, Eye,
} from 'lucide-react';
import { ALL_TESTS, CATEGORIES } from '@/data/tests';
import { useCartStore } from '@/stores';
import {
  useTestCatalogStore,
  useFavoritesStore,
  useCompareStore,
  type TestCatalogFilters,
} from '@/stores/test-catalog';
import { cn } from '@/lib/utils';
import type { LabTest, TestCategory, SampleType } from '@/types/test';

const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  blood: 'دم', serum: 'مصل', plasma: 'بلازما', urine: 'بول', stool: 'براز',
  saliva: 'لعاب', csf: 'سائل نخاعي', sputum: 'بلغم', tissue: 'نسيج', swab: 'مسحة',
  bone_marrow: 'نخاع عظمي', synovial_fluid: 'سائل مفصلي', pleural_fluid: 'سائل تورازي',
  peritoneal_fluid: 'سائل تبطني', seminal_fluid: 'سائل منوي', nail: 'ظفر',
  hair: 'شعر', other: 'أخرى',
};

const TURNAROUND_OPTIONS = [
  { value: 'any', label: 'الكل' },
  { value: 'fast', label: 'سريع (≤ 4 ساعات)' },
  { value: 'normal', label: 'عادي (4-24 ساعة)' },
  { value: 'slow', label: 'متأخر (> 24 ساعة)' },
] as const;

const SORT_OPTIONS = [
  { value: 'popularity', label: 'الأكثر طلباً' },
  { value: 'price', label: 'السعر' },
  { value: 'name', label: 'الاسم' },
  { value: 'turnaround', label: 'سرعة النتائج' },
  { value: 'category', label: 'الفئة' },
] as const;

const PRICE_RANGES = [
  { label: 'الكل', min: 0, max: 99999 },
  { label: 'أقل من 100 ر.س', min: 0, max: 100 },
  { label: '100 - 300 ر.س', min: 100, max: 300 },
  { label: '300 - 500 ر.س', min: 300, max: 500 },
  { label: 'أكثر من 500 ر.س', min: 500, max: 99999 },
] as const;

const UNIQUE_SAMPLE_TYPES: SampleType[] = [
  'blood', 'serum', 'plasma', 'urine', 'stool', 'saliva', 'csf',
  'sputum', 'tissue', 'swab', 'bone_marrow',
];

function filterTests(tests: LabTest[], store: TestCatalogFilters): LabTest[] {
  return tests.filter((t) => {
    if (store.categories.length > 0 && !store.categories.includes(t.category)) return false;
    if (t.price < store.priceRange[0] || t.price > store.priceRange[1]) return false;
    if (store.sampleTypes.length > 0 && !store.sampleTypes.includes(t.sampleType)) return false;
    if (store.fastingRequired !== null && t.fastingRequired !== store.fastingRequired) return false;
    if (store.homeVisitAvailable !== null && t.homeVisitAvailable !== store.homeVisitAvailable) return false;
    if (store.turnaroundTime !== 'any') {
      const h = t.turnaroundTime.standardHours;
      if (store.turnaroundTime === 'fast' && h > 4) return false;
      if (store.turnaroundTime === 'normal' && (h <= 4 || h > 24)) return false;
      if (store.turnaroundTime === 'slow' && h <= 24) return false;
    }
    if (store.searchQuery) {
      const q = store.searchQuery.toLowerCase();
      const match =
        t.nameAr.includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q));
      if (!match) return false;
    }
    return true;
  });
}

function sortTests(tests: LabTest[], sortBy: string, sortOrder: string): LabTest[] {
  const sorted = [...tests];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'price': cmp = a.price - b.price; break;
      case 'name': cmp = a.nameAr.localeCompare(b.nameAr, 'ar'); break;
      case 'turnaround': cmp = a.turnaroundTime.standardHours - b.turnaroundTime.standardHours; break;
      case 'category': cmp = a.category.localeCompare(b.category); break;
      case 'popularity': default: cmp = b.popularity - a.popularity; break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function TestCard({
  test, isInCart, onToggleCart, isFav, onToggleFav, isCompare, onToggleCompare,
}: {
  test: LabTest; isInCart: boolean; onToggleCart: () => void;
  isFav: boolean; onToggleFav: () => void;
  isCompare: boolean; onToggleCompare: () => void;
}) {
  const catMeta = CATEGORIES[test.category];
  return (
    <div className={cn(
      'group relative rounded-2xl border bg-white p-5 transition-all duration-200',
      'hover:shadow-lg hover:border-brand-200 hover:-translate-y-0.5',
      isInCart ? 'ring-2 ring-brand-500 border-brand-200 shadow-brand/10' : 'border-surface-200',
    )}>
      {test.isPopular && (
        <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-saffron-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Star className="h-2.5 w-2.5 fill-current" />
          الأكثر طلباً
        </div>
      )}

      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-semibold text-brand-600">
              {test.id}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: catMeta?.color || '#6B7280' }}
            >
              {catMeta?.nameAr || test.category}
            </span>
          </div>
          <h3 className="text-sm font-bold text-surface-900 mt-1.5 leading-snug">{test.nameAr}</h3>
          <p className="text-xs text-surface-400 mt-0.5">{test.nameEn}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); onToggleFav(); }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              isFav
                ? 'bg-red-50 text-red-500'
                : 'bg-surface-50 text-surface-400 hover:bg-red-50 hover:text-red-400',
            )}
            title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onToggleCompare(); }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              isCompare
                ? 'bg-brand-50 text-brand-600'
                : 'bg-surface-50 text-surface-400 hover:bg-brand-50 hover:text-brand-500',
            )}
            title="إضافة للمقارنة"
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-surface-500">{test.descriptionAr}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-50 px-2 py-1 text-[10px] font-medium text-surface-600">
          <FlaskConical className="h-3 w-3" />
          {SAMPLE_TYPE_LABELS[test.sampleType] || test.sampleType}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-50 px-2 py-1 text-[10px] font-medium text-surface-600">
          <Clock className="h-3 w-3" />
          {test.turnaroundTime.standard}
        </span>
        {test.fastingRequired && (
          <span className="inline-flex items-center gap-1 rounded-md bg-saffron-50 px-2 py-1 text-[10px] font-semibold text-saffron-700">
            <AlertTriangle className="h-3 w-3" />
            صيام {test.fastingDuration || '8-12 ساعة'}
          </span>
        )}
        {test.homeVisitAvailable && (
          <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-1 text-[10px] font-medium text-success-700">
            <Home className="h-3 w-3" />
            زيارة منزلية
          </span>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-surface-100 pt-3">
        <div>
          {test.discountedPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-brand-600">{test.discountedPrice}</span>
              <span className="text-xs text-surface-400 line-through">{test.price}</span>
              <span className="text-[10px] font-medium text-success-600">خصم {Math.round((1 - test.discountedPrice / test.price) * 100)}%</span>
            </div>
          ) : (
            <span className="text-lg font-extrabold text-surface-900">{test.price}</span>
          )}
          <span className="mr-1 text-xs text-surface-400">ر.س</span>
        </div>

        <button
          onClick={(e) => { e.preventDefault(); onToggleCart(); }}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all',
            isInCart
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-600',
          )}
        >
          {isInCart ? (
            <>
              <Check className="h-3.5 w-3.5" />
              في السلة
            </>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              أضف
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TestRow({
  test, isInCart, onToggleCart, isFav, onToggleFav, isCompare, onToggleCompare,
}: {
  test: LabTest; isInCart: boolean; onToggleCart: () => void;
  isFav: boolean; onToggleFav: () => void;
  isCompare: boolean; onToggleCompare: () => void;
}) {
  const catMeta = CATEGORIES[test.category];
  return (
    <div className={cn(
      'group flex items-center gap-4 rounded-xl border bg-white px-5 py-3.5 transition-all',
      'hover:shadow-md hover:border-brand-200',
      isInCart ? 'ring-2 ring-brand-500 border-brand-200' : 'border-surface-200',
    )}>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFav}
          className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-colors',
            isFav ? 'bg-red-50 text-red-500' : 'text-surface-300 hover:text-red-400',
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', isFav && 'fill-current')} />
        </button>
        <button
          onClick={onToggleCompare}
          className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-colors',
            isCompare ? 'bg-brand-50 text-brand-600' : 'text-surface-300 hover:text-brand-500',
          )}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{test.id}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: catMeta?.color }}>
            {catMeta?.nameAr}
          </span>
          {test.isPopular && (
            <span className="rounded-full bg-saffron-50 px-2 py-0.5 text-[10px] font-bold text-saffron-700">
              شائع
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-surface-900 mt-1">{test.nameAr}</p>
        <p className="text-xs text-surface-400">{test.nameEn}</p>
      </div>

      <div className="hidden md:flex items-center gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" />{SAMPLE_TYPE_LABELS[test.sampleType]}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{test.turnaroundTime.standard}</span>
        {test.fastingRequired && <span className="text-saffron-600 font-semibold">صائم</span>}
      </div>

      <div className="text-left">
        {test.discountedPrice ? (
          <div className="text-left">
            <span className="text-base font-extrabold text-brand-600">{test.discountedPrice}</span>
            <span className="text-[10px] text-surface-400 line-through mr-1">{test.price}</span>
          </div>
        ) : (
          <span className="text-base font-extrabold text-surface-900">{test.price}</span>
        )}
        <span className="text-[10px] text-surface-400">ر.س</span>
      </div>

      <button
        onClick={onToggleCart}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all',
          isInCart
            ? 'bg-brand-500 text-white'
            : 'bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-600',
        )}
      >
        {isInCart ? <><Check className="h-3.5 w-3.5" />في السلة</> : <><span className="text-base leading-none">+</span>أضف</>}
      </button>
    </div>
  );
}


export default function TestsCatalogPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const filters = useTestCatalogStore((s) => s.filters);
  const viewMode = useTestCatalogStore((s) => s.viewMode);
  const setFilter = useTestCatalogStore((s) => s.setFilter);
  const resetFilters = useTestCatalogStore((s) => s.resetFilters);
  const setViewMode = useTestCatalogStore((s) => s.setViewMode);

  const cartItems = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addItem);
  const removeFromCart = useCartStore((s) => s.removeItem);

  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const { compareIds, toggleCompare, clearCompare, removeFromCompare } = useCompareStore();

  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');

  const filteredAndSorted = useMemo(() => {
    let tests = filterTests(ALL_TESTS, filters);
    return sortTests(tests, filters.sortBy, filters.sortOrder);
  }, [filters]);

  const handleToggleCart = useCallback((test: LabTest) => {
    const inCart = cartItems.some((i) => i.testId === test.id);
    if (inCart) {
      removeFromCart(test.id);
    } else {
      addToCart({ testId: test.id, nameAr: test.nameAr, nameEn: test.nameEn, price: test.discountedPrice || test.price, code: test.id });
    }
  }, [cartItems, addToCart, removeFromCart]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange[1] < 5000) count++;
    if (filters.sampleTypes.length > 0) count++;
    if (filters.fastingRequired !== null) count++;
    if (filters.turnaroundTime !== 'any') count++;
    if (filters.homeVisitAvailable !== null) count++;
    return count;
  }, [filters]);

  const displayTests = useMemo(() => {
    if (activeTab === 'favorites') {
      return filteredAndSorted.filter((t) => favoriteIds.includes(t.id));
    }
    return filteredAndSorted;
  }, [filteredAndSorted, activeTab, favoriteIds]);

  return (
    <div className="min-h-screen bg-surface-50/50">
      <div className="page-container">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <TestTube2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-surface-900">التحاليل المخبرية</h1>
              <p className="text-sm text-surface-500">اختر من {ALL_TESTS.length}+ تحليل متاح — فلترة ذكية ومقارنة فورية</p>
            </div>
          </div>
        </div>

        {/* Tabs: All / Favorites / Packages */}
        <div className="mb-4 flex items-center gap-1 border-b border-surface-200">
          {[
            { key: 'all', label: 'الكل', icon: <TestTube2 className="h-4 w-4" />, count: ALL_TESTS.length },
            { key: 'favorites', label: 'المفضلة', icon: <Heart className="h-4 w-4" />, count: favoriteIds.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700',
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500',
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الكود، أو الوسوم..."
              value={filters.searchQuery}
              onChange={(e) => setFilter('searchQuery', e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-200 bg-white pr-10 pl-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilter('searchQuery', '')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-all',
                showFilters || activeFilterCount > 0
                  ? 'border-brand-300 bg-brand-50 text-brand-600'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              فلترة
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex rounded-xl border border-surface-200 bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('flex h-11 w-11 items-center justify-center rounded-r-xl transition-colors',
                  viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-surface-400 hover:text-surface-600',
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('flex h-11 w-11 items-center justify-center rounded-l-xl border-r border-surface-200 transition-colors',
                  viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-surface-400 hover:text-surface-600',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-5 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-surface-800">فلترة متقدمة</h3>
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-semibold">
                <RotateCcw className="h-3 w-3" />
                إعادة ضبط
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Categories */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">الفئة</label>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  {Object.entries(CATEGORIES).slice(0, 15).map(([key, meta]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(key as TestCategory)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...filters.categories, key as TestCategory]
                            : filters.categories.filter((c) => c !== key);
                          setFilter('categories', next);
                        }}
                        className="h-3.5 w-3.5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="mr-1">{meta.icon}</span>
                      <span className="text-surface-700">{meta.nameAr}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">نطاق السعر</label>
                <div className="space-y-1">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setFilter('priceRange', [range.min, range.max])}
                      className={cn(
                        'flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                          ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
                          : 'text-surface-600 hover:bg-surface-50',
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">نوع العينة</label>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  {UNIQUE_SAMPLE_TYPES.map((st) => (
                    <label key={st} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.sampleTypes.includes(st)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...filters.sampleTypes, st]
                            : filters.sampleTypes.filter((s) => s !== st);
                          setFilter('sampleTypes', next);
                        }}
                        className="h-3.5 w-3.5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-surface-700">{SAMPLE_TYPE_LABELS[st]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Turnaround Time */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">سرعة النتائج</label>
                <div className="space-y-1">
                  {TURNAROUND_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter('turnaroundTime', opt.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        filters.turnaroundTime === opt.value
                          ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
                          : 'text-surface-600 hover:bg-surface-50',
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fasting */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">الصيام</label>
                <div className="space-y-1">
                  {[
                    { value: null, label: 'الكل' },
                    { value: true, label: 'يتطلب صيام' },
                    { value: false, label: 'لا يتطلب صيام' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setFilter('fastingRequired', opt.value)}
                      className={cn(
                        'flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        filters.fastingRequired === opt.value
                          ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
                          : 'text-surface-600 hover:bg-surface-50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Visit */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-surface-600">الزيارة المنزلية</label>
                <div className="space-y-1">
                  {[
                    { value: null, label: 'الكل' },
                    { value: true, label: 'متوفر' },
                    { value: false, label: 'غير متوفر' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setFilter('homeVisitAvailable', opt.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        filters.homeVisitAvailable === opt.value
                          ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200'
                          : 'text-surface-600 hover:bg-surface-50',
                      )}
                    >
                      <Home className="h-3 w-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Bar */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-surface-600">
            {displayTests.length} تحليل
          </span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-surface-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilter('sortBy', e.target.value as typeof filters.sortBy)}
              className="rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-700 focus:border-brand-400 focus:ring-1 focus:ring-brand-500/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 transition-colors"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', filters.sortOrder === 'asc' && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Test Grid / List */}
        {displayTests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
              <TestTube2 className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-base font-bold text-surface-700">لا توجد نتائج</h3>
            <p className="mt-1 max-w-xs text-sm text-surface-500">جرّب تغيير معايير البحث أو الفلترة</p>
            <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-brand-500 hover:text-brand-600">
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayTests.map((test) => (
              <Link key={test.id} href={`/${locale}/patient/tests/${test.id}`}>
                <TestCard
                  test={test}
                  isInCart={cartItems.some((i) => i.testId === test.id)}
                  onToggleCart={() => handleToggleCart(test)}
                  isFav={favoriteIds.includes(test.id)}
                  onToggleFav={() => toggleFavorite(test.id)}
                  isCompare={compareIds.includes(test.id)}
                  onToggleCompare={() => toggleCompare(test.id)}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayTests.map((test) => (
              <Link key={test.id} href={`/${locale}/patient/tests/${test.id}`}>
                <TestRow
                  test={test}
                  isInCart={cartItems.some((i) => i.testId === test.id)}
                  onToggleCart={() => handleToggleCart(test)}
                  isFav={favoriteIds.includes(test.id)}
                  onToggleFav={() => toggleFavorite(test.id)}
                  isCompare={compareIds.includes(test.id)}
                  onToggleCompare={() => toggleCompare(test.id)}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Compare Bar */}
        {compareIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white/95 backdrop-blur-xl shadow-elevated">
            <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
              <div className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-brand-600" />
                <span className="text-sm font-bold text-surface-900">
                  مقارنة ({compareIds.length}/4)
                </span>
              </div>

              <div className="flex flex-1 items-center gap-2 overflow-x-auto">
                {compareIds.map((id) => {
                  const test = ALL_TESTS.find((t) => t.id === id);
                  if (!test) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      {test.nameAr}
                      <button onClick={() => removeFromCompare(id)} className="hover:text-brand-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/patient/tests/compare?ids=${compareIds.join(',')}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  مقارنة الآن
                </Link>
                <button
                  onClick={clearCompare}
                  className="flex h-9 items-center gap-1 rounded-xl border border-surface-200 px-3 text-xs font-semibold text-surface-500 hover:bg-surface-50 transition-colors"
                >
                  <X className="h-3 w-3" />
                  مسح
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
