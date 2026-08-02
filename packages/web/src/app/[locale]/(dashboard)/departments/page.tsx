'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Grid3X3,
  List,
  Building2,
  ArrowLeft,
  Star,
  TestTube2,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_DEPARTMENTS, DEPARTMENT_CATEGORIES, searchDepartments, type Department } from '@/data/departments';

type ViewMode = 'grid' | 'list';
type CategoryId = string;

const CATEGORY_DEPARTMENTS: Record<string, string[]> = {
  blood: ['hematology', 'clinical-chemistry'],
  chemistry: ['clinical-chemistry'],
  infection: ['microbiology', 'bacteriology', 'parasitology', 'virology'],
  immune: ['immunology', 'serology', 'allergy'],
  hormones: ['hormones', 'endocrinology'],
  cancer: ['tumor-markers', 'histopathology', 'cytology'],
  genetic: ['genetics', 'molecular-biology'],
  organ: ['liver-function', 'kidney-function', 'cardiac-markers'],
  emergency: ['toxicology'],
  preventive: ['diabetes', 'vitamins', 'fertility', 'urinalysis', 'stool-analysis'],
};

function filterByCategory(departments: Department[], categoryId: string): Department[] {
  if (categoryId === 'all') return departments;
  if (categoryId === 'popular') return departments.filter((d) => d.isPopular);
  const ids = CATEGORY_DEPARTMENTS[categoryId];
  if (!ids) return departments;
  return departments.filter((d) => ids.includes(d.id));
}

const STATS = [
  { value: '25+', label: 'قسم', icon: Building2 },
  { value: '500+', label: 'تحليل', icon: TestTube2 },
  { value: '99.7%', label: 'دقة', icon: Star },
  { value: '20+ سنة', label: 'خبرة', icon: Clock },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function DepartmentCard({ dept }: { dept: Department }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  return (
    <motion.div variants={itemVariants}>
      <Link href={`/${locale}/departments/${dept.id}`} className="block">
        <div
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-surface-200 bg-white transition-all duration-300',
            'hover:-translate-y-1 hover:shadow-lg hover:border-brand-200',
          )}
        >
          {/* Gradient Top Bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(to left, ${dept.gradientFrom}, ${dept.gradientTo})`,
            }}
          />

          <div className="p-5">
            {/* Icon + Popular Badge */}
            <div className="mb-3 flex items-start justify-between">
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl text-3xl',
                  'bg-surface-50 group-hover:scale-110 transition-transform duration-300',
                )}
              >
                {dept.icon}
              </div>
              {dept.isPopular && (
                <div className="flex items-center gap-1 rounded-full bg-saffron-50 px-2.5 py-1 text-[10px] font-bold text-saffron-700">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  الأكثر طلباً
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="text-lg font-bold text-surface-900 leading-tight">{dept.nameAr}</h3>
            <p className="mt-0.5 text-xs text-surface-400 font-medium">{dept.nameEn}</p>

            {/* Description */}
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-surface-500">
              {dept.descriptionAr}
            </p>

            {/* Stats Row */}
            <div className="mt-4 flex items-center gap-3 text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <TestTube2 className="h-3.5 w-3.5 text-brand-500" />
                {dept.totalTests} تحليل
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-saffron-500" />
                {dept.accuracy}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-success-500" />
                {dept.experience}
              </span>
            </div>

            {/* Arrow Link */}
            <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-600 group-hover:gap-2.5 transition-all duration-200">
              استكشف القسم
              <ArrowLeft className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DepartmentRow({ dept }: { dept: Department }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  return (
    <motion.div variants={itemVariants}>
      <Link href={`/${locale}/departments/${dept.id}`} className="block">
        <div
          className={cn(
            'group flex items-center gap-4 rounded-2xl border border-surface-200 bg-white px-5 py-4 transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200',
          )}
        >
          {/* Gradient Accent */}
          <div
            className="h-12 w-1.5 shrink-0 rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${dept.gradientFrom}, ${dept.gradientTo})`,
            }}
          />

          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-50 text-2xl group-hover:scale-110 transition-transform">
            {dept.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-surface-900 truncate">{dept.nameAr}</h3>
              {dept.isPopular && (
                <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-saffron-50 px-2 py-0.5 text-[10px] font-bold text-saffron-700">
                  <Star className="h-2 w-2 fill-current" />
                  شائع
                </span>
              )}
            </div>
            <p className="text-xs text-surface-400">{dept.nameEn}</p>
            <p className="mt-1 line-clamp-1 text-xs text-surface-500">{dept.descriptionAr}</p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <TestTube2 className="h-3 w-3 text-brand-500" />
              {dept.totalTests}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-saffron-500" />
              {dept.accuracy}
            </span>
          </div>

          {/* Arrow */}
          <ArrowLeft className="h-4 w-4 shrink-0 text-surface-300 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function DepartmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredDepartments = useMemo(() => {
    let results = ALL_DEPARTMENTS;

    if (searchQuery.trim()) {
      results = searchDepartments(searchQuery.trim());
    }

    results = filterByCategory(results, selectedCategory);

    return results.sort((a, b) => a.order - b.order);
  }, [searchQuery, selectedCategory]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    return count;
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ────────────────── Hero Section ────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700">
        {/* Floating Background Icons */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute -top-10 -right-10 h-64 w-64 text-white/5"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M60 20v60h80V20h-10v50H70V20H60zM40 100h120v10H40v-10zm20 30h80v10H60v-10zm10 30h60v10H70v-10z" />
          </svg>
          <svg
            className="absolute top-20 -left-16 h-48 w-48 text-white/5 animate-pulse"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M80 30c0-10 20-15 30-5s15 10 15 25c0 15-10 20-20 30s-25 15-25 30v30h-20V90c0-10 10-18 18-28s12-15 12-22c0-5-8-8-12-3s-3 12-3 20H70c0-15 8-25 18-30s12-10 12-18c0-5-10-10-15-5s-5 12-5 20h-10c0-18 8-30 20-35z" />
          </svg>
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-8 right-1/4"
          >
            <div className="text-5xl opacity-10">🧪</div>
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-8 left-1/3"
          >
            <div className="text-4xl opacity-10">🔬</div>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-16 left-1/6"
          >
            <div className="text-3xl opacity-10">⚗️</div>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              أقسامنا المخبرية
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              أكثر من 25 قسم متخصص بأحدث التقنيات
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ────────────────── Search & Filter Bar ────────────────── */}
      <section className="sticky top-16 z-30 border-b border-surface-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="ابحث عن قسم أو تحليل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-surface-200 bg-surface-50 pr-11 pl-10 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Pills + View Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DEPARTMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                    selectedCategory === cat.id
                      ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50',
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.nameAr}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <div className="flex rounded-xl border border-surface-200 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-r-xl transition-colors',
                    viewMode === 'grid'
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-surface-400 hover:text-surface-600',
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-l-xl border-r border-surface-200 transition-colors',
                    viewMode === 'list'
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-surface-400 hover:text-surface-600',
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── Departments Grid / List ────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Result Count */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-semibold text-surface-600">
            {filteredDepartments.length} قسم
          </span>
        </div>

        {filteredDepartments.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-100">
              <Building2 className="h-10 w-10 text-surface-300" />
            </div>
            <h3 className="text-lg font-bold text-surface-700">لا توجد نتائج</h3>
            <p className="mt-2 max-w-sm text-sm text-surface-500">
              لم نتمكن من العثور على أقسام تطابق بحثك. جرّب تغيير كلمة البحث أو فئة الفلتر.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-5 flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              <X className="h-4 w-4" />
              مسح الفلاتر
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${selectedCategory}-${searchQuery}`}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredDepartments.map((dept) => (
              <DepartmentCard key={dept.id} dept={dept} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${selectedCategory}-${searchQuery}-list`}
            className="space-y-3"
          >
            {filteredDepartments.map((dept) => (
              <DepartmentRow key={dept.id} dept={dept} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
