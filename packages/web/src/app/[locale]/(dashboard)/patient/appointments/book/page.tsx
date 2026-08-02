'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  FlaskConical,
  CreditCard,
  CheckCircle2,
  Star,
  AlertTriangle,
  Phone,
  Beaker,
  Shield,
  Thermometer,
  Search,
  X,
  Copy,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  mapUrl: string;
}

interface LabTest {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  requiresFasting: boolean;
}

interface TimeSlotData {
  time: string;
  label: string;
  available: boolean;
}

interface BookingData {
  id: string;
  date: string;
  time: string;
  branch: Branch;
  tests: LabTest[];
  total: number;
  createdAt: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BRANCHES: Branch[] = [
  {
    id: 'dokki',
    name: 'فرع الدقي',
    address: '123 شارع مصطفى النحاس, الدقي, القاهرة',
    phone: '0227776655',
    mapUrl: 'https://maps.google.com/?q=30.0380,31.2118',
  },
  {
    id: 'nasr',
    name: 'فرع مدينة نصر',
    address: '456 شارع مصطفى النحاس, مدينة نصر',
    phone: '0222733445',
    mapUrl: 'https://maps.google.com/?q=30.0561,31.3389',
  },
  {
    id: 'zayed',
    name: 'فرع الشيخ زايد',
    address: '789 طريق المحور, الشيخ زايد',
    phone: '0238556677',
    mapUrl: 'https://maps.google.com/?q=29.9725,31.0070',
  },
];

const LAB_TESTS: LabTest[] = [
  { id: 'cbc', name: 'صورة دم كاملة (CBC)', price: 45, description: 'فحص شامل لمكونات الدم الأساسية', category: 'تحاليل الدم', requiresFasting: false },
  { id: 'fasting', name: 'صائم (Fasting Glucose)', price: 25, description: 'قياس مستوى السكر في الدم بعد الصيام', category: 'تحاليل الدم', requiresFasting: true },
  { id: 'hba1c', name: 'السكر التراكمي (HbA1c)', price: 75, description: 'متوسط مستوى السكر خلال 3 أشهر', category: 'تحاليل الدم', requiresFasting: false },
  { id: 'kft', name: 'وظائف كلى (KFT)', price: 60, description: 'فحص وظائف الكلى والبيلة والكرياتينين', category: 'تحاليل الدم', requiresFasting: false },
  { id: 'lft', name: 'وظائف كبد (LFT)', price: 65, description: 'فحص إنزيمات الكبد والبيليروبين', category: 'تحاليل الدم', requiresFasting: false },
  { id: 'urine', name: 'تحليل بول شامل', price: 30, description: 'فحص شامل لتركيبة البول', category: 'تحاليل البول', requiresFasting: false },
  { id: 'urine-culture', name: 'زراعة بول', price: 80, description: 'زراعة وكشف العدوى البولية', category: 'تحاليل البول', requiresFasting: false },
  { id: 'vitd', name: 'فيتامين د (Vitamin D)', price: 120, description: 'قياس مستوى فيتامين د في الدم', category: 'تحاليل مناعية', requiresFasting: false },
  { id: 'vitb12', name: 'فيتامين ب12', price: 95, description: 'قياس مستوى فيتامين ب12', category: 'تحاليل مناعية', requiresFasting: false },
  { id: 'iron', name: 'حديد وطحالب (Iron Studies)', price: 85, description: 'فحص مستوى الحديد وطاقة الدم', category: 'تحاليل مناعية', requiresFasting: true },
  { id: 'thyroid', name: 'هرمون الغدة الدرقية (TSH)', price: 90, description: 'فحص وظائف الغدة الدرقية', category: 'تحاليل مناعية', requiresFasting: false },
];

const TEST_CATEGORIES = ['تحاليل الدم', 'تحاليل البول', 'تحاليل مناعية'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateAr(d: Date): string {
  return d.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateId(): string {
  return `AMB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function BookAppointmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1);

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null);
  const [selectedTests, setSelectedTests] = React.useState<LabTest[]>([]);
  const [bookingComplete, setBookingComplete] = React.useState<BookingData | null>(null);
  const [copiedId, setCopiedId] = React.useState(false);

  const total = React.useMemo(
    () => selectedTests.reduce((sum, t) => sum + t.price, 0),
    [selectedTests]
  );

  const canProceed = React.useMemo(() => {
    switch (step) {
      case 1: return selectedDate !== null && selectedBranch !== null;
      case 2: return selectedTime !== null;
      case 3: return selectedTests.length > 0;
      case 4: return true;
      default: return false;
    }
  }, [step, selectedDate, selectedBranch, selectedTime, selectedTests]);

  const goNext = React.useCallback(() => {
    if (step === 4) {
      const booking: BookingData = {
        id: generateId(),
        date: selectedDate!,
        time: selectedTime!,
        branch: selectedBranch!,
        tests: selectedTests,
        total,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      };

      const existing = JSON.parse(localStorage.getItem('patient_bookings') || '[]');
      localStorage.setItem('patient_bookings', JSON.stringify([booking, ...existing]));

      setBookingComplete(booking);
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  }, [step, selectedDate, selectedBranch, selectedTime, selectedTests, total]);

  const goPrev = React.useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const toggleTest = React.useCallback((test: LabTest) => {
    setSelectedTests((prev) =>
      prev.some((t) => t.id === test.id)
        ? prev.filter((t) => t.id !== test.id)
        : [...prev, test]
    );
  }, []);

  const resetAll = React.useCallback(() => {
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedBranch(null);
    setSelectedTests([]);
    setBookingComplete(null);
    setCopiedId(false);
  }, []);

  const copyBookingId = React.useCallback(() => {
    if (bookingComplete) {
      navigator.clipboard.writeText(bookingComplete.id).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }, [bookingComplete]);

  if (bookingComplete) {
    return (
      <SuccessPage
        booking={bookingComplete}
        onCopyId={copyBookingId}
        copiedId={copiedId}
        onNewBooking={resetAll}
        onViewAppointments={() => router.push(`/${locale}/patient/appointments`)}
        locale={locale}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-28" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? goPrev() : router.back())}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {step > 1 ? 'السابق' : 'العودة'}
            </span>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">حجز موعد جديد</h1>
            <p className="text-xs text-gray-500">خطوة {step} من 4</p>
          </div>

          <div className="w-16" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={{
                    scale: s === step ? [1, 1.15, 1] : 1,
                  }}
                  transition={
                    s === step
                      ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                      : { duration: 0.3 }
                  }
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2',
                    s < step
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : s === step
                        ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                  )}
                >
                  {s < step ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    s
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    s <= step ? 'text-sky-600 font-bold' : 'text-gray-400'
                  )}
                >
                  {s === 1 && 'التاريخ والفرع'}
                  {s === 2 && 'الوقت'}
                  {s === 3 && 'التحاليل'}
                  {s === 4 && 'التأكيد'}
                </span>
              </div>
              {s < 4 && (
                <div
                  className="flex-1 h-0.5 mt-[-18px] transition-colors duration-500"
                  style={{
                    backgroundColor: s < step ? '#10B981' : s === step ? '#0EA5E9' : '#E5E7EB',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Step1DateBranch
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Step2Time
                selectedDate={selectedDate!}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Step3Tests
                selectedTests={selectedTests}
                onToggleTest={toggleTest}
                total={total}
              />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <Step4Confirm
                date={selectedDate!}
                time={selectedTime!}
                branch={selectedBranch!}
                tests={selectedTests}
                total={total}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {selectedBranch && (
              <span className="hidden sm:flex items-center gap-1">
                <MapPin className="w-4 h-4 text-sky-500" />
                {selectedBranch.name}
              </span>
            )}
            {selectedTests.length > 0 && (
              <span className="flex items-center gap-1">
                <FlaskConical className="w-4 h-4 text-sky-500" />
                {selectedTests.length} تحليل
              </span>
            )}
          </div>

          {total > 0 && (
            <span className="text-lg font-bold text-sky-600">
              {total.toFixed(0)} ج.م
            </span>
          )}

          <motion.button
            whileTap={canProceed ? { scale: 0.95 } : {}}
            onClick={goNext}
            disabled={!canProceed}
            className={cn(
              'px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300',
              canProceed
                ? 'bg-gradient-to-l from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {step === 4 ? 'تأكيد الحجز' : 'التالي'}
            {step < 4 && <ChevronLeft className="w-4 h-4 inline mr-1" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 1 — Date & Branch
// ===========================================================================

interface Step1Props {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}

function Step1DateBranch({ selectedDate, onSelectDate, selectedBranch, onSelectBranch }: Step1Props) {
  const today = new Date();
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [viewYear, setViewYear] = React.useState(today.getFullYear());

  const dayHeaders = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const availability = React.useMemo(() => {
    const map: Record<string, { available: boolean; count: number }> = {};
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = toISODate(d);
      const dayOfWeek = d.getDay();
      const isFriday = dayOfWeek === 5;
      const seed = d.getDate() + d.getMonth() * 31;
      const r = seededRandom(seed);
      const available = !isFriday && r > 0.15;
      map[iso] = {
        available,
        count: available ? Math.floor(r * 20) + 5 : 0,
      };
    }
    return map;
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 1) % 7;

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Calendar Card */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-l from-sky-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">اختر التاريخ والفرع</h2>
              <p className="text-sm text-gray-500">حدد موعدك وأقرب فرع</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
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
                canGoPrev ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">
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
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayHeaders.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = new Date(viewYear, viewMonth, day);
              const iso = toISODate(d);
              const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isToday = toISODate(d) === toISODate(today);
              const isSelected = selectedDate === iso;
              const dayData = availability[iso];
              const available = dayData?.available ?? false;

              let bgClass = 'bg-white hover:bg-sky-50 cursor-pointer';
              let textClass = 'text-gray-900';

              if (isPast || !available) {
                bgClass = 'bg-gray-50 cursor-not-allowed';
                textClass = 'text-gray-300';
              } else if (isSelected) {
                bgClass = 'bg-sky-500 cursor-pointer shadow-lg shadow-sky-500/20';
                textClass = 'text-white';
              }

              return (
                <motion.button
                  key={day}
                  type="button"
                  whileHover={available && !isPast ? { scale: 1.1 } : {}}
                  whileTap={available && !isPast ? { scale: 0.95 } : {}}
                  disabled={isPast || !available}
                  onClick={() => !isPast && available && onSelectDate(iso)}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all',
                    bgClass,
                    textClass,
                    isToday && !isSelected && 'ring-2 ring-sky-400'
                  )}
                >
                  <span>{day}</span>
                  {available && !isPast && !isSelected && (
                    <span className="text-[8px] text-emerald-500 leading-none">{dayData?.count}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white border border-gray-200" />
              <span>متاح</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
              <span>غير متاح</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-sky-500" />
              <span>مختار</span>
            </div>
          </div>

          {/* Selected Date Confirmation */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-5 p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sky-800">تم اختيار التاريخ</p>
                  <p className="text-sm text-sky-600">{formatDateAr(new Date(selectedDate))}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Branch Selection */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-500" />
          اختر الفرع
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BRANCHES.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <motion.button
                key={branch.id}
                type="button"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectBranch(branch)}
                className={cn(
                  'relative p-5 rounded-2xl border-2 text-right transition-all duration-300 bg-white',
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 left-3 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                )}

                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6" />
                </div>

                <h4 className="font-bold text-gray-900 text-base mb-1">{branch.name}</h4>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{branch.address}</p>

                <div className="flex items-center gap-1.5 text-sky-600 text-xs font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{branch.phone}</span>
                </div>

                <div
                  className="absolute top-0 right-0 w-1 h-full rounded-r-2xl"
                  style={{ backgroundColor: isSelected ? '#0EA5E9' : '#E5E7EB' }}
                />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================================================================
// STEP 2 — Time Slots
// ===========================================================================

interface Step2Props {
  selectedDate: string;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

function Step2Time({ selectedDate, selectedTime, onSelectTime }: Step2Props) {
  const dateSeed = new Date(selectedDate).getDate();

  const slots = React.useMemo((): TimeSlotData[] => {
    const result: TimeSlotData[] = [];
    const morningTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const eveningTimes = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

    const allTimes = [...morningTimes, ...eveningTimes];

    allTimes.forEach((time) => {
      const [h, m] = time.split(':').map(Number);
      const minuteOfDay = h * 60 + m;
      const seed = dateSeed * 1000 + minuteOfDay;
      const r = seededRandom(seed);
      const available = r > 0.2;

      const suffix = h >= 12 ? 'م' : 'ص';
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const label = `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;

      result.push({ time, label, available });
    });

    return result;
  }, [selectedDate]);

  const morning = slots.filter((s) => {
    const h = parseInt(s.time.split(':')[0]);
    return h < 12;
  });

  const evening = slots.filter((s) => {
    const h = parseInt(s.time.split(':')[0]);
    return h >= 12;
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Date Header */}
      <motion.div variants={fadeUp} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-500">التاريخ المختار</p>
        <p className="font-bold text-gray-900 text-lg">{formatDateAr(new Date(selectedDate))}</p>
      </motion.div>

      {/* Morning Slots */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-l from-amber-50/80 to-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-gray-900">الصباح</h3>
              <p className="text-xs text-gray-500">08:00 ص - 12:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
            {morning.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <motion.button
                  key={slot.time}
                  type="button"
                  whileHover={slot.available ? { scale: 1.08 } : {}}
                  whileTap={slot.available ? { scale: 0.95 } : {}}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-3 rounded-xl text-sm font-medium transition-all border',
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20'
                      : slot.available
                        ? 'bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:shadow-sm'
                        : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through'
                  )}
                >
                  <span className="text-xs">{slot.label}</span>
                  {slot.available && !isSelected && (
                    <span className="text-[9px] text-emerald-500">متاح</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Evening Slots */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-l from-indigo-50/80 to-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-gray-900">المساء</h3>
              <p className="text-xs text-gray-500">04:00 م - 08:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
            {evening.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <motion.button
                  key={slot.time}
                  type="button"
                  whileHover={slot.available ? { scale: 1.08 } : {}}
                  whileTap={slot.available ? { scale: 0.95 } : {}}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-3 rounded-xl text-sm font-medium transition-all border',
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20'
                      : slot.available
                        ? 'bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:shadow-sm'
                        : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through'
                  )}
                >
                  <span className="text-xs">{slot.label}</span>
                  {slot.available && !isSelected && (
                    <span className="text-[9px] text-emerald-500">متاح</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Selected Confirmation */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sky-800">الوقت المختار</p>
              <p className="text-sm text-sky-600">
                {slots.find((s) => s.time === selectedTime)?.label}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===========================================================================
// STEP 3 — Select Tests
// ===========================================================================

interface Step3Props {
  selectedTests: LabTest[];
  onToggleTest: (test: LabTest) => void;
  total: number;
}

function Step3Tests({ selectedTests, onToggleTest, total }: Step3Props) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const filteredTests = React.useMemo(() => {
    if (!searchQuery.trim()) return LAB_TESTS;
    const q = searchQuery.toLowerCase();
    return LAB_TESTS.filter(
      (t) => t.name.includes(q) || t.description.includes(q) || t.category.includes(q)
    );
  }, [searchQuery]);

  const groupedTests = React.useMemo(() => {
    const groups: Record<string, LabTest[]> = {};
    filteredTests.forEach((test) => {
      if (!groups[test.category]) groups[test.category] = [];
      groups[test.category].push(test);
    });
    return groups;
  }, [filteredTests]);

  React.useEffect(() => {
    if (searchQuery && Object.keys(groupedTests).length === 1) {
      setExpandedCategory(Object.keys(groupedTests)[0]);
    }
  }, [searchQuery, groupedTests]);

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'تحاليل الدم': return <FlaskConical className="w-5 h-5" />;
      case 'تحاليل البول': return <Beaker className="w-5 h-5" />;
      case 'تحاليل مناعية': return <Shield className="w-5 h-5" />;
      default: return <FlaskConical className="w-5 h-5" />;
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header Card */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-l from-emerald-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">اختر التحاليل المخبرية</h2>
              <p className="text-sm text-gray-500">
                {selectedTests.length > 0
                  ? `تم اختيار ${selectedTests.length} تحليل — الإجمالي: ${total} ج.م`
                  : 'اختر التحاليل المطلوبة'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن تحليل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-10 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-right"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tests by Category */}
          <div className="space-y-4">
            {Object.entries(groupedTests).map(([category, tests]) => {
              const isExpanded = expandedCategory === category || searchQuery.length > 0;
              const selectedCount = tests.filter((t) => selectedTests.some((s) => s.id === t.id)).length;

              return (
                <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded && !searchQuery ? null : category)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sky-600">{categoryIcon(category)}</div>
                      <span className="font-bold text-gray-900">{category}</span>
                      {selectedCount > 0 && (
                        <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          {tests.map((test) => {
                            const isSelected = selectedTests.some((t) => t.id === test.id);
                            return (
                              <motion.button
                                key={test.id}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onToggleTest(test)}
                                className={cn(
                                  'w-full p-4 rounded-xl border-2 text-right transition-all duration-200 flex items-center justify-between gap-3',
                                  isSelected
                                    ? 'border-sky-500 bg-sky-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{test.name}</h4>
                                    {test.requiresFasting && (
                                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                        صيام
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{test.description}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="font-bold text-sky-600 text-sm whitespace-nowrap">
                                    {test.price} ج.م
                                  </span>
                                  <div
                                    className={cn(
                                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                      isSelected
                                        ? 'bg-sky-500 border-sky-500'
                                        : 'border-gray-300'
                                    )}
                                  >
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                      >
                                        <Check className="w-3.5 h-3.5 text-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Running Total */}
      <AnimatePresence>
        {selectedTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 font-medium">التحاليل المختارة ({selectedTests.length})</span>
              <span className="text-xs text-gray-400">اضغط لإزالة</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTests.map((test) => (
                <motion.button
                  key={test.id}
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleTest(test)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200 hover:bg-sky-100 transition-colors"
                >
                  <span>{test.name}</span>
                  <X className="w-3 h-3" />
                </motion.button>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-gray-600 font-medium">الإجمالي</span>
              <span className="text-2xl font-bold text-sky-600">{total} ج.م</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===========================================================================
// STEP 4 — Confirmation
// ===========================================================================

interface Step4Props {
  date: string;
  time: string;
  branch: Branch;
  tests: LabTest[];
  total: number;
}

function Step4Confirm({ date, time, branch, tests, total }: Step4Props) {
  const formatTimeLabel = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'م' : 'ص';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Summary Card */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-l from-violet-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تأكيد الحجز</h2>
              <p className="text-sm text-gray-500">راجع تفاصيل الحجز قبل التأكيد</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {/* Date & Time */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">التاريخ والوقت</p>
              <p className="font-bold text-gray-900">{formatDateAr(new Date(date))}</p>
              <p className="text-sm text-sky-600 font-medium">{formatTimeLabel(time)}</p>
            </div>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">الفرع</p>
              <p className="font-bold text-gray-900">{branch.name}</p>
              <p className="text-sm text-gray-500">{branch.address}</p>
            </div>
          </div>

          {/* Tests */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-5 h-5 text-sky-600" />
              <p className="font-bold text-gray-900">التحاليل المختارة ({tests.length})</p>
            </div>
            <div className="space-y-2">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-700">{test.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{test.price} ج.م</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-5 rounded-xl bg-gradient-to-l from-sky-50 to-violet-50 border border-sky-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">المبلغ الإجمالي</p>
                <p className="text-xs text-gray-400">شامل جميع التحاليل المختارة</p>
              </div>
              <span className="text-3xl font-bold text-sky-600">{total} ج.م</span>
            </div>
          </div>

          {/* Fasting Note */}
          {tests.some((t) => t.requiresFasting) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-800 text-sm">ملاحظة: بعض التحاليل تتطلب صيام</p>
                <p className="text-xs text-amber-600 mt-1">
                  يرجى الصيام لمدة 8-12 ساعة قبل موعدك. يُسمح بشرب الماء فقط.
                </p>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
            <div className="flex items-center gap-2 text-sm text-sky-700">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>جميع التحاليل معتمدة من وزارة الصحة</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================================================================
// Success Page
// ===========================================================================

interface SuccessPageProps {
  booking: BookingData;
  onCopyId: () => void;
  copiedId: boolean;
  onNewBooking: () => void;
  onViewAppointments: () => void;
  locale: string;
}

function SuccessPage({ booking, onCopyId, copiedId, onNewBooking, onViewAppointments }: SuccessPageProps) {
  const formatDateAr = (d: Date) =>
    d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTimeLabel = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'م' : 'ص';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-28" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative mb-6"
          >
            {/* Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 4) * 80,
                  y: Math.sin((i * Math.PI) / 4) * 80,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: i % 3 === 0 ? '#0EA5E9' : i % 3 === 1 ? '#10B981' : '#F59E0B',
                }}
              />
            ))}

            <svg width="120" height="120" viewBox="0 0 120 120" className="relative z-10">
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
              <motion.path
                d="M36 60 L52 76 L84 44"
                fill="none"
                stroke="#10B981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              />
            </svg>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">تم تأكيد حجزك بنجاح!</h2>
            <p className="text-gray-500">سيتم إرسال تفاصيل الحجز إلى هاتفك</p>
          </motion.div>
        </motion.div>

        {/* Booking ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 text-center"
        >
          <p className="text-sm font-medium text-sky-600 mb-2">رقم الحجز</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-sky-700 font-mono tracking-wider">{booking.id}</span>
            <button
              onClick={onCopyId}
              className="p-2 rounded-lg bg-white/60 hover:bg-white transition-colors"
              title="نسخ رقم الحجز"
            >
              {copiedId ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5 text-sky-600" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mb-8 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-5">تفاصيل الموعد</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">التاريخ</p>
                <p className="font-semibold text-gray-800">{formatDateAr(new Date(booking.date))}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الوقت</p>
                <p className="font-semibold text-gray-800">{formatTimeLabel(booking.time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الفرع</p>
                <p className="font-semibold text-gray-800">{booking.branch.name}</p>
                <p className="text-sm text-gray-500">{booking.branch.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">المبلغ المدفوع</p>
                <p className="font-bold text-lg text-emerald-700">{booking.total} ج.م</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mb-8 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">التحاليل ({booking.tests.length})</h3>
          <div className="space-y-2">
            {booking.tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700">{test.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{test.price} ج.م</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="flex flex-col sm:flex-row gap-3 mb-10"
        >
          <button
            onClick={onNewBooking}
            className="flex-1 py-4 rounded-xl bg-gradient-to-l from-sky-600 to-sky-500 text-white font-bold text-lg shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            حجز موعد جديد
          </button>
          <button
            onClick={onViewAppointments}
            className="flex-1 py-4 rounded-xl border-2 border-sky-500 text-sky-600 font-bold text-lg hover:bg-sky-50 transition-all"
          >
            مواعيدي
          </button>
        </motion.div>
      </div>
    </div>
  );
}
