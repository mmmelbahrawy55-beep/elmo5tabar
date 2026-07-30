'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Search,
  Star,
  Clock,
  Phone,
  ChevronDown,
  X,
  Grid3X3,
  List,
  Map,
  Filter,
  Car,
  Accessibility,
  Wifi,
  Shield,
  Share2,
  Heart,
  ArrowLeft,
  ArrowRight,
  Users,
  Building2,
  Zap,
  ExternalLink,
  Locate,
} from 'lucide-react';
import {
  ALL_BRANCHES,
  getNearestBranch,
  calculateDistance,
  calculateTravelTime,
  BRANCH_CITIES,
  BRANCH_REGIONS,
} from '@/data/branches';
import {
  useBranchFavoritesStore,
  useLocationStore,
  useBranchFilterStore,
} from '@/stores/branches';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'map';
type BranchType = 'all' | 'main' | 'branch' | 'specialty' | 'express';
type SortMode = 'nearest' | 'rating' | 'name' | 'capacity';

const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  all: 'الكل',
  main: 'رئيسي',
  branch: 'فرع',
  specialty: 'متخصص',
  express: 'سريع',
};

const BRANCH_TYPE_COLORS: Record<string, string> = {
  main: '#0077B6',
  branch: '#10B981',
  specialty: '#8B5CF6',
  express: '#F59E0B',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'مفتوح', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  closed: { label: 'مغلق', color: 'text-red-700', bg: 'bg-red-100' },
  'coming-soon': { label: 'قريباً', color: 'text-amber-700', bg: 'bg-amber-100' },
  maintenance: { label: 'صيانة', color: 'text-orange-700', bg: 'bg-orange-100' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function BranchLocatorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    error: locationError,
    nearestBranch,
    detectedCity,
    locate,
  } = useLocationStore();

  const {
    selectedCity,
    selectedType,
    sortBy,
    setCity,
    setType,
    setSortBy,
  } = useBranchFilterStore();

  const { favorites, toggleFavorite } = useBranchFavoritesStore();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity) count++;
    if (selectedType !== 'all') count++;
    return count;
  }, [selectedCity, selectedType]);

  const filteredBranches = useMemo(() => {
    let branches = [...ALL_BRANCHES];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      branches = branches.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.addressAr.toLowerCase().includes(q)
      );
    }

    if (selectedCity) {
      branches = branches.filter((b) => b.city === selectedCity);
    }

    if (selectedType !== 'all') {
      branches = branches.filter((b) => b.type === selectedType);
    }

    if (sortBy === 'nearest' && latitude && longitude) {
      branches.sort((a, b) => {
        const dA = calculateDistance(latitude, longitude, a.lat, a.lng);
        const dB = calculateDistance(latitude, longitude, b.lat, b.lng);
        return dA - dB;
      });
    } else if (sortBy === 'rating') {
      branches.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'name') {
      branches.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
    } else if (sortBy === 'capacity') {
      branches.sort((a, b) => (b.capacityPercentage ?? 0) - (a.capacityPercentage ?? 0));
    }

    return branches;
  }, [searchQuery, selectedCity, selectedType, sortBy, latitude, longitude]);

  const stats = useMemo(
    () => [
      { value: '14', label: 'فرع', icon: Building2 },
      { value: '7', label: 'مدن', icon: MapPin },
      { value: '24/7', label: 'خدمة', icon: Clock },
      { value: '50,000+', label: 'مريض', icon: Users },
    ],
    []
  );

  const handleLocate = () => {
    locate();
  };

  const getDistanceLabel = (branch: (typeof ALL_BRANCHES)[0]) => {
    if (!latitude || !longitude) return null;
    const dist = calculateDistance(latitude, longitude, branch.lat, branch.lng);
    if (dist < 1) return `${Math.round(dist * 1000)} م`;
    return `${dist.toFixed(1)} كم`;
  };

  const getTravelTime = (branch: (typeof ALL_BRANCHES)[0]) => {
    if (!latitude || !longitude) return null;
    return calculateTravelTime(latitude, longitude, branch.lat, branch.lng);
  };

  const getQueueColor = (waitingCount?: number) => {
    if (!waitingCount || waitingCount <= 5) return 'bg-emerald-500';
    if (waitingCount <= 15) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getQueueLabel = (waitingCount?: number) => {
    if (!waitingCount || waitingCount <= 5) return 'قليل الانتظار';
    if (waitingCount <= 15) return 'انتظار متوسط';
    return 'انتظار طويل';
  };

  const getCapacityColor = (pct?: number) => {
    if (!pct) return 'bg-gray-300';
    if (pct < 50) return 'bg-emerald-500';
    if (pct < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getHoursDisplay = (branch: (typeof ALL_BRANCHES)[0]) => {
    if (branch.is24Hours) return 'مفتوح 24 ساعة';
    if (!branch.workingHours) return '—';
    const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
    const todayHours = branch.workingHours[today];
    if (todayHours) return todayHours;
    return branch.workingHours?.['السبت'] || '—';
  };

  const handleShare = (branch: (typeof ALL_BRANCHES)[0]) => {
    if (navigator.share) {
      navigator.share({
        title: branch.nameAr,
        text: `${branch.nameAr} - ${branch.addressAr}`,
        url: `/ar/branches/${branch.slug}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0077B6] via-[#00A8CC] to-[#6B4CE6] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {/* Floating map pins decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute left-[10%] top-[20%] opacity-10"
            animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MapPin size={64} className="text-white" />
          </motion.div>
          <motion.div
            className="absolute right-[15%] top-[30%] opacity-10"
            animate={{ y: [10, -10, 10], rotate: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <MapPin size={48} className="text-white" />
          </motion.div>
          <motion.div
            className="absolute bottom-[30%] left-[25%] opacity-10"
            animate={{ y: [-8, 8, -8], rotate: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <MapPin size={40} className="text-white" />
          </motion.div>
          <motion.div
            className="absolute bottom-[20%] right-[30%] opacity-[0.07]"
            animate={{ y: [5, -15, 5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <MapPin size={80} className="text-white" />
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              ابحث عن أقرب فرع
            </h1>
            <p className="mt-4 text-lg text-white/80 sm:text-xl">
              14 فرع في جميع أنحاء المملكة العربية السعودية
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="relative">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو العنوان..."
                className="w-full rounded-2xl border-0 bg-white py-4 pr-12 pl-12 text-lg text-gray-900 shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <button
              onClick={handleLocate}
              disabled={locationLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locationLoading ? (
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Locate size={20} className="animate-pulse" />
              )}
              {locationLoading ? 'جاري تحديد موقعك...' : 'تحديد موقعي'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* GPS Status Bar */}
      {locationLoading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-sm font-medium text-blue-700">جاري تحديد موقعك...</span>
          </div>
        </div>
      )}

      {!locationLoading && nearestBranch && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">
                أقرب فرع: {nearestBranch.nameAr}
              </span>
              {latitude && longitude && (
                <span className="text-xs text-emerald-600">
                  ({calculateDistance(latitude, longitude, nearestBranch.lat, nearestBranch.lng).toFixed(1)} كم)
                </span>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestBranch.lat},${nearestBranch.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Navigation size={14} />
              اتجاه الآن
            </a>
          </div>
        </div>
      )}

      {!locationLoading && locationError && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <span className="text-sm text-amber-700">
              تعذر تحديد الموقع — يمكنك اختيار المدينة يدوياً
            </span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <section className="relative -mt-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-lg shadow-gray-200/50 backdrop-blur-sm sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0077B6] to-[#6B4CE6] sm:h-12 sm:w-12">
                    <stat.icon size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 sm:text-2xl">{stat.value}</div>
                    <div className="text-xs text-gray-500 sm:text-sm">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 mt-6 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 py-3">
          {/* City Select */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setCity(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#0077B6] focus:border-[#0077B6] focus:outline-none"
            >
              <option value="">جميع المدن</option>
              {BRANCH_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Branch Type Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BRANCH_TYPE_LABELS) as BranchType[]).map((type) => (
              <button
                key={type}
                onClick={() => setType(type)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  selectedType === type
                    ? 'bg-[#0077B6] text-white shadow-md shadow-[#0077B6]/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {BRANCH_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#0077B6] focus:border-[#0077B6] focus:outline-none"
            >
              <option value="nearest">الأقرب</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="name">الاسم</option>
              <option value="capacity">السعة</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Filter toggle + count */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="relative rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0077B6] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
            {([
              { mode: 'grid' as ViewMode, icon: Grid3X3 },
              { mode: 'list' as ViewMode, icon: List },
              { mode: 'map' as ViewMode, icon: Map },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded-lg p-1.5 transition-all',
                  viewMode === mode
                    ? 'bg-[#0077B6] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Branch Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              عرض <span className="font-semibold text-gray-900">{filteredBranches.length}</span> فرع
            </p>
            {latitude && longitude && sortBy === 'nearest' && (
              <p className="text-xs text-gray-400">مرتبة حسب المسافة من موقعك</p>
            )}
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBranches.map((branch) => (
                <motion.div
                  key={branch.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-gray-200/50 transition-shadow hover:shadow-xl"
                >
                  {/* Cover Image Placeholder */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#0077B6]/20 to-[#6B4CE6]/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute right-3 top-3">
                      <span
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-bold',
                          STATUS_CONFIG[branch.status]?.bg,
                          STATUS_CONFIG[branch.status]?.color
                        )}
                      >
                        {STATUS_CONFIG[branch.status]?.label}
                      </span>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute left-3 top-3">
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: BRANCH_TYPE_COLORS[branch.type] || '#6B7280' }}
                      >
                        {BRANCH_TYPE_LABELS[branch.type as BranchType] || branch.type}
                      </span>
                    </div>

                    {/* Distance Badge */}
                    {getDistanceLabel(branch) && (
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#0077B6] backdrop-blur-sm">
                          <Navigation size={12} />
                          {getDistanceLabel(branch)}
                          {getTravelTime(branch) && (
                            <span className="text-gray-500">· {getTravelTime(branch)}</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(branch.id);
                      }}
                      className="absolute bottom-3 left-3 rounded-full bg-white/90 p-2 text-gray-400 backdrop-blur-sm transition-colors hover:text-red-500"
                    >
                      <Heart
                        size={16}
                        className={cn(
                          favorites.includes(branch.id) && 'fill-red-500 text-red-500'
                        )}
                      />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{branch.nameAr}</h3>
                    <p className="mt-0.5 text-xs text-gray-400">{branch.nameEn}</p>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {branch.addressAr}
                    </p>

                    {/* Rating */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={cn(
                              i < Math.floor(branch.rating ?? 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{branch.rating?.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({branch.reviewCount ?? 0} تقييم)</span>
                    </div>

                    {/* Hours */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} className="shrink-0" />
                      <span className={cn(branch.is24Hours && 'font-semibold text-emerald-600')}>
                        {getHoursDisplay(branch)}
                      </span>
                    </div>

                    {/* Queue Status */}
                    {branch.waitingCount !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', getQueueColor(branch.waitingCount))} />
                        <span className="text-xs text-gray-500">
                          {getQueueLabel(branch.waitingCount)}
                          {branch.waitingCount > 0 && ` — ${branch.waitingCount} في الانتظار`}
                        </span>
                      </div>
                    )}

                    {/* Capacity Bar */}
                    {branch.capacityPercentage !== undefined && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-gray-500">الاستيعاب</span>
                          <span className="font-medium text-gray-700">{branch.capacityPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn('h-full rounded-full transition-all', getCapacityColor(branch.capacityPercentage))}
                            style={{ width: `${branch.capacityPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-[#0077B6] hover:text-white"
                        title="اتصال"
                      >
                        <Phone size={14} />
                      </a>
                      {branch.whatsapp && (
                        <a
                          href={`https://wa.me/${branch.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-emerald-500 hover:text-white"
                          title="واتساب"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-[#0077B6] hover:text-white"
                        title="التنقل"
                      >
                        <Navigation size={14} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(branch);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-blue-500 hover:text-white"
                        title="مشاركة"
                      >
                        <Share2 size={14} />
                      </button>

                      <div className="flex-1" />

                      <Link
                        href={`/ar/branches/${branch.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0077B6]/10 px-3 py-1.5 text-xs font-semibold text-[#0077B6] transition-colors hover:bg-[#0077B6] hover:text-white"
                      >
                        التفاصيل
                        <ArrowLeft size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {filteredBranches.map((branch) => (
                <motion.div
                  key={branch.id}
                  variants={cardVariants}
                  whileHover={{ x: -4, transition: { duration: 0.15 } }}
                  className="group flex items-stretch overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  {/* Cover area */}
                  <div className="relative hidden w-48 shrink-0 bg-gradient-to-br from-[#0077B6]/20 to-[#6B4CE6]/20 sm:block">
                    <div className="absolute right-3 top-3">
                      <span
                        className={cn(
                          'rounded-lg px-2 py-0.5 text-[10px] font-bold',
                          STATUS_CONFIG[branch.status]?.bg,
                          STATUS_CONFIG[branch.status]?.color
                        )}
                      >
                        {STATUS_CONFIG[branch.status]?.label}
                      </span>
                    </div>
                    {getDistanceLabel(branch) && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#0077B6]">
                          <Navigation size={10} />
                          {getDistanceLabel(branch)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{branch.nameAr}</h3>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: BRANCH_TYPE_COLORS[branch.type] || '#6B7280' }}
                          >
                            {BRANCH_TYPE_LABELS[branch.type as BranchType]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{branch.nameEn}</p>
                      </div>
                      <button
                        onClick={() => toggleFavorite(branch.id)}
                        className="rounded-full p-1.5 text-gray-300 transition-colors hover:text-red-500"
                      >
                        <Heart size={16} className={cn(favorites.includes(branch.id) && 'fill-red-500 text-red-500')} />
                      </button>
                    </div>

                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">{branch.addressAr}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {branch.rating?.toFixed(1)} ({branch.reviewCount ?? 0})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {getHoursDisplay(branch)}
                      </span>
                      {branch.waitingCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <div className={cn('h-1.5 w-1.5 rounded-full', getQueueColor(branch.waitingCount))} />
                          {branch.waitingCount} في الانتظار
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-[#0077B6] hover:text-white"
                      >
                        <Phone size={12} />
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-[#0077B6] hover:text-white"
                      >
                        <Navigation size={12} />
                      </a>
                      <button
                        onClick={() => handleShare(branch)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors hover:bg-blue-500 hover:text-white"
                      >
                        <Share2 size={12} />
                      </button>
                      <div className="flex-1" />
                      <Link
                        href={`/ar/branches/${branch.slug}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0077B6]/10 px-3 py-1 text-xs font-semibold text-[#0077B6] transition-colors hover:bg-[#0077B6] hover:text-white"
                      >
                        التفاصيل
                        <ArrowLeft size={11} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="flex h-[600px] gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {/* Simulated Map */}
              <div className="relative flex-1 bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-100">
                <div className="absolute inset-0 opacity-30">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* User location */}
                {latitude && longitude && (
                  <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="h-4 w-4 rounded-full bg-blue-600 shadow-lg shadow-blue-600/50" />
                      <motion.div
                        className="absolute -inset-2 rounded-full border-2 border-blue-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}

                {/* Branch Pins */}
                {filteredBranches.map((branch, index) => {
                  const xOffset = ((index * 73 + 17) % 80) + 10;
                  const yOffset = ((index * 47 + 31) % 70) + 15;
                  return (
                    <MapPinOnMap key={branch.id} branch={branch} x={xOffset} y={yOffset} />
                  );
                })}
              </div>

              {/* Side Panel */}
              <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-gray-100 p-3 sm:block">
                <h3 className="mb-3 px-1 text-sm font-bold text-gray-900">
                  قائمة الفروع ({filteredBranches.length})
                </h3>
                <div className="space-y-2">
                  {filteredBranches.map((branch) => (
                    <Link
                      key={branch.id}
                      href={`/ar/branches/${branch.slug}`}
                      className="block rounded-xl border border-gray-100 p-3 transition-all hover:border-[#0077B6]/20 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{branch.nameAr}</h4>
                          <p className="mt-0.5 text-[11px] text-gray-400">{branch.nameEn}</p>
                        </div>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ backgroundColor: BRANCH_TYPE_COLORS[branch.type] || '#6B7280' }}
                        >
                          {BRANCH_TYPE_LABELS[branch.type as BranchType]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-gray-500">{branch.addressAr}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                        {getDistanceLabel(branch) && (
                          <span className="flex items-center gap-0.5">
                            <Navigation size={10} />
                            {getDistanceLabel(branch)}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {branch.rating?.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {branch.is24Hours ? '24 ساعة' : ''}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredBranches.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <MapPin size={32} className="text-gray-300" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">لا توجد فروع مطابقة</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
                جرّب تغيير معايير البحث أو تصفّح جميع الفروع المتاحة
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCity('');
                  setType('all');
                }}
                className="mt-6 rounded-xl bg-[#0077B6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00669E]"
              >
                عرض جميع الفروع
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

/* Map Pin sub-component */
function MapPinOnMap({
  branch,
  x,
  y,
}: {
  branch: (typeof ALL_BRANCHES)[0];
  x: number;
  y: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute z-20"
      style={{ left: `${x}%`, top: `${y}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative -translate-x-1/2 -translate-y-full">
        <MapPin
          size={28}
          className="drop-shadow-md"
          style={{ color: BRANCH_TYPE_COLORS[branch.type] || '#6B7280' }}
          fill={BRANCH_TYPE_COLORS[branch.type] || '#6B7280'}
        />
      </div>

      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute left-1/2 top-0 z-30 w-52 -translate-x-1/2 translate-y-[-100%] rounded-xl border border-gray-100 bg-white p-3 shadow-xl"
        >
          <h4 className="text-xs font-bold text-gray-900">{branch.nameAr}</h4>
          <p className="text-[10px] text-gray-400">{branch.nameEn}</p>
          <p className="mt-1 line-clamp-1 text-[10px] text-gray-500">{branch.addressAr}</p>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-0.5">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {branch.rating?.toFixed(1)}
            </span>
            {branch.waitingCount !== undefined && (
              <span>{branch.waitingCount} في الانتظار</span>
            )}
          </div>
          <Link
            href={`/ar/branches/${branch.slug}`}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#0077B6]"
          >
            عرض التفاصيل <ExternalLink size={10} />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
