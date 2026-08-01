'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Package,
  Home,
  Stethoscope,
  Building2,
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Users,
  Car,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';

import {
  STEP_CONFIG,
  SERVICE_TYPES,
} from '@/types/appointment';
import type {
  BookingStep,
  BookingService,
  BookingBranch,
  TimeSlot,
  DayAvailability,
  BookingState,
} from '@/types/appointment';
import { ALL_BRANCHES, calculateDistance, calculateTravelTime } from '@/data/branches';
import { cn } from '@/lib/utils';
import { useBranchFavoritesStore, useLocationStore } from '@/stores/branches';
import type { UserLocation } from '@/types/branch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatDateAr(d: Date): string {
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return calculateDistance(lat1, lng1, lat2, lng2);
}

function getMinutesFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Holiday data
// ---------------------------------------------------------------------------

const HOLIDAYS_2026: { date: string; nameAr: string }[] = [
  { date: '2026-01-01', nameAr: 'رأس السنة الميلادية' },
  { date: '2026-03-30', nameAr: 'عيد الفطر المبارك' },
  { date: '2026-03-31', nameAr: 'عيد الفطر المبارك' },
  { date: '2026-04-01', nameAr: 'oliday Eid Al Fitr' },
  { date: '2026-06-06', nameAr: 'عيد الأضحى المبارك' },
  { date: '2026-06-07', nameAr: 'عيد الأضحى المبارك' },
  { date: '2026-06-08', nameAr: 'عيد الأضحى المبارك' },
  { date: '2026-06-09', nameAr: 'عيد الأضحى المبارك' },
  { date: '2026-09-23', nameAr: 'اليوم الوطني السعودي' },
];

// ---------------------------------------------------------------------------
// Common tests for Step 1
// ---------------------------------------------------------------------------

const POPULAR_TESTS: { nameAr: string; nameEn: string; price: number }[] = [
  { nameAr: 'صورة دم كاملة (CBC)', nameEn: 'CBC', price: 45 },
  { nameAr: 'وظائف الكلى (KFT)', nameEn: 'Kidney Function', price: 60 },
  { nameAr: 'وظائف الكبد (LFT)', nameEn: 'Liver Function', price: 65 },
  { nameAr: 'الدهون والكوليسترول', nameEn: 'Lipid Profile', price: 80 },
  { nameAr: 'السكر التراكمي (HbA1c)', nameEn: 'HbA1c', price: 75 },
  { nameAr: 'السكر التراكمي', nameEn: 'Fasting Glucose', price: 25 },
  { nameAr: 'الغدة الدرقية (TSH)', nameEn: 'TSH', price: 90 },
  { nameAr: 'فيتامين د', nameEn: 'Vitamin D', price: 120 },
  { nameAr: 'فيتامين ب12', nameEn: 'Vitamin B12', price: 95 },
  { nameAr: 'الحديد والريتين', nameEn: 'Iron Studies', price: 85 },
  { nameAr: 'البروتين реаг C (CRP)', nameEn: 'CRP', price: 55 },
  { nameAr: 'سرعة ترسب الدم (ESR)', nameEn: 'ESR', price: 30 },
];

// ---------------------------------------------------------------------------
// Service type icon mapping
// ---------------------------------------------------------------------------

function ServiceTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'flask':
      return <FlaskConical className="w-8 h-8" />;
    case 'package':
      return <Package className="w-8 h-8" />;
    case 'home':
      return <Home className="w-8 h-8" />;
    case 'stethoscope':
      return <Stethoscope className="w-8 h-8" />;
    case 'building':
      return <Building2 className="w-8 h-8" />;
    default:
      return <FlaskConical className="w-8 h-8" />;
  }
}

// ===================================================================
// 1. BookingStepper
// ===================================================================

interface BookingStepperProps {
  currentStep: BookingStep;
  completedSteps: BookingStep[];
  onStepClick: (step: BookingStep) => void;
}

function BookingStepper({ currentStep, completedSteps, onStepClick }: BookingStepperProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex items-start justify-center min-w-max px-4 gap-0">
        {STEP_CONFIG.map((cfg, idx) => {
          const isCompleted = completedSteps.includes(cfg.step);
          const isCurrent = currentStep === cfg.step;
          const isFuture = cfg.step > currentStep && !isCompleted;
          const isClickable = isCompleted || isCurrent;

          return (
            <React.Fragment key={cfg.step}>
              {idx > 0 && (
                <div
                  className="flex-shrink-0 h-0.5 mt-5 mx-1 transition-colors duration-500"
                  style={{
                    width: '32px',
                    backgroundColor: isCompleted
                      ? '#10B981'
                      : isCurrent
                        ? '#0077B6'
                        : '#E5E7EB',
                  }}
                />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(cfg.step)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1.5 group',
                  isClickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <motion.div
                  initial={false}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    isCurrent
                      ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                      : { duration: 0.3 }
                  }
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-surface-100 border-surface-200 text-surface-400',
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="num"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {cfg.step}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] md:text-xs font-medium text-center leading-tight max-w-[64px] transition-colors duration-300',
                    isCompleted
                      ? 'text-emerald-600'
                      : isCurrent
                        ? 'text-brand-600 font-bold'
                        : 'text-surface-400',
                  )}
                >
                  {cfg.titleAr}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ===================================================================
// 2. StepWrapper
// ===================================================================

interface StepWrapperProps {
  step: BookingStep;
  onNext: () => void;
  onPrev: () => void;
  children: React.ReactNode;
  canNext?: boolean;
  hideNext?: boolean;
}

function StepWrapper({ step, onNext, onPrev, children, canNext = true, hideNext = false }: StepWrapperProps) {
  const cfg = STEP_CONFIG.find((c) => c.step === step)!;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-surface-100 bg-gradient-to-l from-brand-50/80 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
                {step}
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">{cfg.titleAr}</h2>
                <p className="text-sm text-surface-500">{cfg.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">{children}</div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={onPrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-surface-600 hover:bg-surface-100 transition-colors font-medium"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
            ) : (
              <div />
            )}
            {step < 7 && !hideNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className={cn(
                  'flex items-center gap-2 px-7 py-2.5 rounded-xl font-bold transition-all duration-300',
                  canNext
                    ? 'bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5'
                    : 'bg-surface-200 text-surface-400 cursor-not-allowed',
                )}
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===================================================================
// 3. Step1Service
// ===================================================================

interface Step1ServiceProps {
  selectedService: BookingService | null;
  onSelect: (service: BookingService) => void;
}

function Step1Service({ selectedService, onSelect }: Step1ServiceProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return POPULAR_TESTS.filter(
      (t) => t.nameAr.includes(q) || t.nameEn.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      {/* Service Type Cards */}
      <div>
        <h3 className="text-lg font-bold text-surface-900 mb-4">اختر نوع الخدمة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_TYPES.map((svc) => {
            const isSelected =
              selectedService?.type === svc.type;
            return (
              <motion.button
                key={svc.type}
                type="button"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const mockService: BookingService = {
                    type: svc.type,
                    id: `svc-${svc.type}`,
                    nameAr: svc.nameAr,
                    nameEn: svc.nameEn,
                    price: svc.type === 'analysis' ? 45 : svc.type === 'package' ? 299 : svc.type === 'home-visit' ? 150 : svc.type === 'consultation' ? 200 : 500,
                    estimatedDuration: svc.type === 'analysis' ? 30 : svc.type === 'package' ? 60 : 45,
                    description: svc.description,
                    category: svc.type,
                    requiresFasting: svc.type === 'analysis',
                    homeVisitAvailable: svc.type === 'home-visit' || svc.type === 'analysis',
                  };
                  onSelect(mockService);
                }}
                className={cn(
                  'relative p-5 rounded-2xl border-2 text-right transition-all duration-300 bg-white',
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10'
                    : 'border-surface-200 hover:border-surface-300 hover:shadow-md',
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 left-3 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                )}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${svc.color}15`, color: svc.color }}
                >
                  <ServiceTypeIcon type={svc.icon} />
                </div>
                <h4 className="font-bold text-surface-900 text-base">{svc.nameAr}</h4>
                <p className="text-xs text-surface-400 mb-1">{svc.nameEn}</p>
                <p className="text-sm text-surface-600 leading-relaxed">{svc.description}</p>
                <div
                  className="absolute top-0 right-0 w-1 h-full rounded-r-2xl"
                  style={{ backgroundColor: svc.color }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Search Specific Analysis */}
      <div>
        <h3 className="text-lg font-bold text-surface-900 mb-2">أو اختر تحليل محدد</h3>
        <p className="text-sm text-surface-500 mb-4">ابحث عن التحليل المخبري المطلوب</p>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="اكتب اسم التحليل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-10 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-right"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {filteredTests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {filteredTests.map((test) => {
                const isActive = selectedService?.nameEn === test.nameEn;
                return (
                  <motion.button
                    key={test.nameEn}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const mockService: BookingService = {
                        type: 'analysis',
                        id: `test-${test.nameEn}`,
                        nameAr: test.nameAr,
                        nameEn: test.nameEn,
                        price: test.price,
                        estimatedDuration: 30,
                        description: test.nameAr,
                        category: 'analysis',
                        requiresFasting: true,
                        homeVisitAvailable: true,
                      };
                      onSelect(mockService);
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full border text-sm font-medium transition-all',
                      isActive
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300 hover:text-brand-600',
                    )}
                  >
                    {test.nameAr}
                    <span className="mr-1 text-xs opacity-70">{test.price} ر.س</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected confirmation */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-brand-800">{selectedService.nameAr}</p>
              <p className="text-sm text-brand-600">
                {selectedService.price} ر.س • {selectedService.estimatedDuration} دقيقة
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================================================================
// 4. Step2Branch
// ===================================================================

interface Step2BranchProps {
  selectedBranch: BookingBranch | null;
  onSelect: (branch: BookingBranch) => void;
  userLocation: UserLocation | null;
}

function Step2Branch({ selectedBranch, onSelect, userLocation }: Step2BranchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'queue'>('distance');

  const branchesWithDistance = useMemo(() => {
    return ALL_BRANCHES.filter((b) => b.status === 'active').map((b) => {
      const dist = userLocation
        ? haversineDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng)
        : null;
      const travel = dist !== null ? calculateTravelTime(dist) : null;
      const crowdLevel: 'low' | 'medium' | 'high' =
        b.capacity.percentage < 50 ? 'low' : b.capacity.percentage < 75 ? 'medium' : 'high';
      const availableSlots = Math.max(0, b.queueStatus.appointmentSlots - b.queueStatus.waiting);

      return {
        id: b.id,
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        address: b.addressAr,
        addressAr: b.addressAr,
        distance: dist,
        travelTime: travel,
        crowdLevel,
        parkingAvailable: b.parking.available,
        queueCount: b.queueStatus.waiting,
        queueWaitTime: b.queueStatus.averageWait,
        rating: b.rating,
        queueStatus: b.queueStatus,
        coordinates: b.coordinates,
        availableSlots,
        computedCrowd: crowdLevel,
      } as BookingBranch & {
        distance: number | null;
        travelTime: number | null;
        computedCrowd: 'low' | 'medium' | 'high';
        availableSlots: number;
      };
    });
  }, [userLocation]);

  const sorted = useMemo(() => {
    const list = [...branchesWithDistance];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.addressAr?.includes(q) ||
          b.address.includes(q),
      );
    }
    if (sortBy === 'distance') {
      list.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'queue') {
      list.sort((a, b) => (a.queueStatus?.waiting ?? 0) - (b.queueStatus?.waiting ?? 0));
    }
    return list;
  }, [branchesWithDistance, searchQuery, sortBy]);

  const nearest = userLocation
    ? branchesWithDistance
        .filter((b) => b.distance !== null)
        .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          placeholder="ابحث عن فرع بالاسم أو المدينة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-10 py-3 rounded-xl border border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-right"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2">
        {[
          { key: 'distance' as const, label: 'الأقرب', icon: Navigation },
          { key: 'rating' as const, label: 'الأعلى تقييماً', icon: Star },
          { key: 'queue' as const, label: 'أقل ازدحاماً', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              sortBy === key
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Nearest branches */}
      {nearest.length > 0 && !searchQuery && (
        <div>
          <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-brand-500" />
            الفروع الأقرب إليك
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {nearest.map((b) => (
              <BranchCard
                key={b.id}
                branch={b}
                isSelected={selectedBranch?.id === b.id}
                onSelect={() => onSelect(b)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* All branches */}
      <div>
        <h3 className="text-lg font-bold text-surface-900 mb-3">جميع الفروع</h3>
        <div className="space-y-3">
          {sorted.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              isSelected={selectedBranch?.id === b.id}
              onSelect={() => onSelect(b)}
            />
          ))}
          {sorted.length === 0 && (
            <p className="text-center text-surface-400 py-8">لا توجد فروع تطابق البحث</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Branch Card
interface BranchCardProps {
  branch: BookingBranch & {
    distance?: number | null;
    travelTime?: number | null;
    computedCrowd?: 'low' | 'medium' | 'high';
    availableSlots?: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

function BranchCard({ branch, isSelected, onSelect, compact }: BranchCardProps) {
  const crowdColor =
    (branch.computedCrowd || branch.crowdLevel) === 'low'
      ? 'bg-emerald-400'
      : (branch.computedCrowd || branch.crowdLevel) === 'medium'
        ? 'bg-yellow-400'
        : 'bg-red-400';
  const crowdLabel =
    (branch.computedCrowd || branch.crowdLevel) === 'low'
      ? 'هادئ'
      : (branch.computedCrowd || branch.crowdLevel) === 'medium'
        ? 'متوسط'
        : 'مزدحم';

  if (compact) {
    return (
      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={cn(
          'flex-shrink-0 w-56 p-4 rounded-2xl border-2 text-right transition-all bg-white',
          isSelected
            ? 'border-brand-500 shadow-lg shadow-brand-500/10'
            : 'border-surface-200 hover:border-surface-300',
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', crowdColor)} />
          <span className="text-xs text-surface-500">{crowdLabel}</span>
        </div>
        <h4 className="font-bold text-surface-900 text-sm mb-1">{branch.nameAr}</h4>
        <p className="text-xs text-surface-500 mb-2 line-clamp-1">{branch.addressAr}</p>
        {branch.distance !== null && branch.distance !== undefined && (
          <p className="text-xs text-brand-600 font-medium">
            {branch.distance.toFixed(1)} كم • {branch.travelTime} دقيقة
          </p>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'p-4 rounded-2xl border-2 transition-all bg-white',
        isSelected
          ? 'border-brand-500 shadow-lg shadow-brand-500/10 ring-2 ring-brand-500/10'
          : 'border-surface-200 hover:border-surface-300 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
            <h4 className="font-bold text-surface-900">{branch.nameAr}</h4>
          </div>
          <p className="text-xs text-surface-400 mb-2">{branch.nameEn}</p>

          <div className="flex items-center gap-1.5 text-surface-500 text-sm mb-2 justify-end">
            <span>{branch.addressAr}</span>
            <MapPin className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          </div>

          {branch.distance !== null && branch.distance !== undefined && (
            <div className="flex items-center gap-1.5 text-brand-600 text-sm mb-2 justify-end">
              <span>
                {branch.distance.toFixed(1)} كم • {branch.travelTime} دقيقة بالسيارة
              </span>
              <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Crowd */}
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', crowdColor)} />
              <span className="text-xs text-surface-500">{crowdLabel}</span>
            </div>

            {/* Queue */}
            <div className="flex items-center gap-1 text-xs text-surface-500">
              <Users className="w-3 h-3" />
              <span>{branch.queueStatus?.waiting ?? 0} بانتظار • {branch.queueStatus?.averageWait}</span>
            </div>

            {/* Parking */}
            {branch.parkingAvailable && (
              <div className="flex items-center gap-1 text-xs text-surface-500">
                <Car className="w-3 h-3" />
                <span>موقف سيارات</span>
              </div>
            )}

            {/* Available slots */}
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Clock className="w-3 h-3" />
              <span>{branch.availableSlots} موعد متاح</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{branch.rating}</span>
            </div>
          </div>
        </div>

        {!compact && (
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0',
              isSelected
                ? 'bg-brand-500 text-white'
                : 'bg-brand-50 text-brand-600 hover:bg-brand-100',
            )}
          >
            {isSelected ? 'تم' : 'اختيار'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ===================================================================
// 5. Step3Date
// ===================================================================

interface Step3DateProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  service: BookingService | null;
}

function Step3Date({ selectedDate, onSelect }: Step3DateProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const dayHeaders = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const availability = useMemo(() => {
    const map: Record<string, DayAvailability> = {};
    const startDate = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = toISODate(d);
      const dayOfWeek = d.getDay();
      const seed = d.getDate() + d.getMonth() * 31;
      const holiday = HOLIDAYS_2026.find((h) => h.date === iso);

      const isFriday = dayOfWeek === 5;
      const isHoliday = !!holiday;
      const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const r = seededRandom(seed);

      let slotsCount = 0;
      let available = false;
      if (isPast || isHoliday) {
        slotsCount = 0;
        available = false;
      } else if (isFriday) {
        slotsCount = r > 0.4 ? Math.floor(r * 20) : 0;
        available = slotsCount > 0;
      } else {
        slotsCount = Math.floor(r * 40) + 5;
        available = true;
      }

      map[iso] = {
        date: iso,
        available,
        slotsCount,
        isHoliday,
        isPeakDay: r > 0.85 && !isPast && !isHoliday,
        holidayName: holiday?.nameAr,
      };
    }
    return map;
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 1) % 7; // Sat = 0

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 0) {
              setViewMonth(11);
              setViewYear(viewYear - 1);
            } else {
              setViewMonth(viewMonth - 1);
            }
          }}
          disabled={!canGoPrev}
          className={cn(
            'p-2 rounded-xl transition-all',
            canGoPrev ? 'hover:bg-surface-100 text-surface-600' : 'text-surface-300 cursor-not-allowed',
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-surface-900">
          {monthNames[viewMonth]} {viewYear}
        </h3>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 11) {
              setViewMonth(0);
              setViewYear(viewYear + 1);
            } else {
              setViewMonth(viewMonth + 1);
            }
          }}
          className="p-2 rounded-xl hover:bg-surface-100 text-surface-600 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayHeaders.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-surface-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(viewYear, viewMonth, day);
          const iso = toISODate(d);
          const dayData = availability[iso];
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday = toISODate(d) === toISODate(today);
          const isSelected = selectedDate === iso;

          const available = dayData?.available ?? false;
          const isHoliday = dayData?.isHoliday ?? false;
          const isPeakDay = dayData?.isPeakDay ?? false;
          const holidayName = dayData?.holidayName;

          let bgClass = 'bg-white hover:bg-brand-50 cursor-pointer';
          let textClass = 'text-surface-900';

          if (isPast || (!available && !isHoliday)) {
            bgClass = 'bg-surface-50 cursor-not-allowed';
            textClass = 'text-surface-300';
          } else if (isHoliday) {
            bgClass = 'bg-red-50 cursor-not-allowed';
            textClass = 'text-red-400';
          } else if (isSelected) {
            bgClass = 'bg-brand-500 cursor-pointer shadow-lg shadow-brand-500/20';
            textClass = 'text-white';
          } else if (isPeakDay) {
            bgClass = 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer border border-yellow-300';
          }

          return (
            <motion.button
              key={day}
              type="button"
              whileHover={available && !isPast ? { scale: 1.1 } : {}}
              whileTap={available && !isPast ? { scale: 0.95 } : {}}
              disabled={isPast || (!available && !isHoliday)}
              onClick={() => !isPast && available && onSelect(iso)}
              className={cn(
                'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all',
                bgClass,
                textClass,
                isToday && !isSelected && 'ring-2 ring-brand-400',
              )}
            >
              <span>{day}</span>
              {isHoliday && (
                <span className="text-[8px] text-red-400 leading-none mt-0.5">عطلة</span>
              )}
              {isPeakDay && available && !isSelected && (
                <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
              {available && !isPast && !isSelected && (
                <span className="text-[8px] text-emerald-500 leading-none">{dayData?.slotsCount}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-surface-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white border border-surface-200" />
          <span>متاح</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-300" />
          <span>يوم ذي وطأة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-surface-50 border border-surface-200" />
          <span>غير متاح</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>عطلة رسمية</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-brand-500" />
          <span>مختار</span>
        </div>
      </div>

      {/* Selected confirmation */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-brand-800">تم اختيار التاريخ</p>
              <p className="text-sm text-brand-600">{formatDateAr(new Date(selectedDate))}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================================================================
// 6. Step4Time
// ===================================================================

interface Step4TimeProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
  date: string | null;
}

function Step4Time({ selectedTime, onSelect, date }: Step4TimeProps) {
  const slots = useMemo(() => {
    const result: TimeSlot[] = [];
    const dateSeed = date ? new Date(date).getDate() : 7;

    for (let h = 7; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const minuteOfDay = h * 60 + m;
        const seed = dateSeed * 1000 + minuteOfDay;
        const r = seededRandom(seed);

        const isPeak = (h >= 8 && h < 10) || (h >= 16 && h < 18);
        const isRecommended = (h >= 10 && h < 12) || (h >= 13 && h < 15);
        const available = r > 0.2;
        const maxSlots = 8;
        const remainingSlots = available ? Math.max(1, Math.floor(r * maxSlots)) : 0;

        result.push({
          time,
          available,
          isPeak,
          isRecommended,
          remainingSlots,
          maxSlots,
        });
      }
    }
    return result;
  }, [date]);

  const morning = slots.filter((s) => getMinutesFromTime(s.time) < 12 * 60);
  const afternoon = slots.filter(
    (s) => getMinutesFromTime(s.time) >= 12 * 60 && getMinutesFromTime(s.time) < 17 * 60,
  );
  const evening = slots.filter((s) => getMinutesFromTime(s.time) >= 17 * 60);

  const selectedSlot = slots.find((s) => s.time === selectedTime);

  const formatTimeLabel = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'م' : 'ص';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* Date header */}
      {date && (
        <div className="text-center p-3 rounded-xl bg-surface-50 border border-surface-200">
          <p className="text-sm text-surface-500">التاريخ المختار</p>
          <p className="font-bold text-surface-900">{formatDateAr(new Date(date))}</p>
        </div>
      )}

      {/* Morning */}
      <TimeSlotSection title="الصباح" subtitle="07:00 - 12:00" slots={morning} selectedTime={selectedTime} onSelect={onSelect} />

      {/* Afternoon */}
      <TimeSlotSection title="بعد الظهر" subtitle="12:00 - 17:00" slots={afternoon} selectedTime={selectedTime} onSelect={onSelect} />

      {/* Evening */}
      <TimeSlotSection title="المساء" subtitle="17:00 - 23:00" slots={evening} selectedTime={selectedTime} onSelect={onSelect} />

      {/* Selected confirmation */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand-800">الوقت المختار: {formatTimeLabel(selectedSlot.time)}</p>
              <p className="text-sm text-brand-600">
                الوقت التقريبي للانتهاء: {formatTimeLabel(formatMinutesToTime(getMinutesFromTime(selectedSlot.time) + 30))}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Time Slot Section
interface TimeSlotSectionProps {
  title: string;
  subtitle: string;
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

function TimeSlotSection({ title, subtitle, slots, selectedTime, onSelect }: TimeSlotSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-bold text-surface-900">{title}</h4>
        <span className="text-xs text-surface-400">{subtitle}</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const formatTimeLabelShort = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            const suffix = h >= 12 ? 'م' : 'ص';
            const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${hour12}:${String(m).padStart(2, '0')}`;
          };

          return (
            <motion.button
              key={slot.time}
              type="button"
              whileHover={slot.available ? { scale: 1.08 } : {}}
              whileTap={slot.available ? { scale: 0.95 } : {}}
              disabled={!slot.available}
              onClick={() => onSelect(slot.time)}
              className={cn(
                'relative flex flex-col items-center gap-0.5 p-2 rounded-xl text-sm font-medium transition-all border',
                isSelected
                  ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                  : slot.available
                    ? slot.isPeak
                      ? 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400'
                      : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300 hover:shadow-sm'
                    : 'bg-surface-100 text-surface-300 border-surface-200 cursor-not-allowed line-through',
              )}
            >
              {slot.isRecommended && slot.available && !isSelected && (
                <Star className="absolute top-0.5 left-0.5 w-3 h-3 text-brand-400 fill-brand-400" />
              )}
              <span className="text-xs">{formatTimeLabelShort(slot.time)}</span>
              {slot.available && !isSelected && (
                <span className={cn(
                  'text-[8px] leading-none',
                  slot.isPeak ? 'text-orange-400' : 'text-emerald-400',
                )}>
                  {slot.remainingSlots} مقعد
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ===================================================================
// Exports
// ===================================================================

export {
  BookingStepper,
  StepWrapper,
  Step1Service,
  Step2Branch,
  Step3Date,
  Step4Time,
};
