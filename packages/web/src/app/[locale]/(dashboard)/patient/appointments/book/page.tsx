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
  AlertTriangle,
  Phone,
  Beaker,
  Shield,
  Search,
  X,
  Copy,
  Sparkles,
  Star,
  Zap,
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
    address: '123 شارع مصطفى النحاس، الدقي، القاهرة',
    phone: '0227776655',
  },
  {
    id: 'nasr',
    name: 'فرع مدينة نصر',
    address: '456 شارع مصطفى النحاس، مدينة نصر',
    phone: '0222733445',
  },
  {
    id: 'zayed',
    name: 'فرع الشيخ زايد',
    address: '789 طريق المحور، الشيخ زايد',
    phone: '0238556677',
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

function formatTimeLabel(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'م' : 'ص';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(8px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -400 : 400,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(8px)',
    transition: { duration: 0.4, ease: [0.55, 0.06, 0.68, 0.19] },
  }),
};

const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(14,165,233,0.15)',
      '0 0 40px rgba(14,165,233,0.25)',
      '0 0 20px rgba(14,165,233,0.15)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ---------------------------------------------------------------------------
// Glass Card Component
// ---------------------------------------------------------------------------

function GlassCard({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden',
        glow && 'border-sky-500/30 shadow-sky-500/10',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function BookAppointmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1);
  const [isBooking, setIsBooking] = React.useState(false);

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
      setIsBooking(true);
      setTimeout(() => {
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
        setIsBooking(false);
      }, 2000);
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-32" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/80 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (step > 1 ? goPrev() : router.back())}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {step > 1 ? 'السابق' : 'العودة'}
            </span>
          </motion.button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-white">حجز موعد جديد</h1>
            <p className="text-xs text-gray-500">خطوة {step} من 4</p>
          </div>

          <div className="w-16" />
        </div>
      </div>

      {/* Premium Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: s * 0.1 }}
              >
                <motion.div
                  initial={false}
                  animate={
                    s === step
                      ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={
                    s === step
                      ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
                      : { duration: 0.3 }
                  }
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 border-2 relative',
                    s < step
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                      : s === step
                        ? 'bg-gradient-to-br from-sky-400 to-sky-600 border-sky-400 text-white shadow-lg shadow-sky-500/40'
                        : 'bg-white/5 border-white/10 text-gray-500'
                  )}
                >
                  {s === step && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <span className="relative z-10">
                    {s < step ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      s
                    )}
                  </span>
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-semibold transition-colors duration-300',
                    s <= step ? 'text-sky-400' : 'text-gray-600'
                  )}
                >
                  {s === 1 && 'التاريخ والفرع'}
                  {s === 2 && 'الوقت'}
                  {s === 3 && 'التحاليل'}
                  {s === 4 && 'التأكيد'}
                </span>
              </motion.div>
              {s < 4 && (
                <div className="flex-1 h-0.5 mt-[-20px] rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width: s < step ? '100%' : s === step ? '50%' : '0%',
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={{
                      background: s < step
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 mt-8 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
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

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-gray-950/90 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {selectedBranch && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="text-white/70">{selectedBranch.name}</span>
              </motion.span>
            )}
            {selectedTests.length > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
              >
                <FlaskConical className="w-4 h-4 text-teal-400" />
                <span className="text-white/70">{selectedTests.length} تحليل</span>
              </motion.span>
            )}
          </div>

          {total > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xl font-bold bg-gradient-to-l from-sky-400 to-teal-400 bg-clip-text text-transparent"
            >
              {total.toFixed(0)} ج.م
            </motion.span>
          )}

          <motion.button
            whileHover={canProceed ? { scale: 1.03 } : {}}
            whileTap={canProceed ? { scale: 0.97 } : {}}
            onClick={goNext}
            disabled={!canProceed || isBooking}
            className={cn(
              'relative px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-300 overflow-hidden',
              canProceed && !isBooking
                ? 'bg-gradient-to-l from-sky-500 to-teal-500 text-white shadow-xl shadow-sky-500/25'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
            )}
          >
            {canProceed && !isBooking && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-sky-400 to-teal-400 opacity-0 hover:opacity-100 transition-opacity"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isBooking ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  جاري التأكيد...
                </>
              ) : step === 4 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  تأكيد الحجز
                </>
              ) : (
                <>
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </span>
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
      <GlassCard>
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30"
            >
              <Calendar className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">اختر التاريخ والفرع</h2>
              <p className="text-sm text-gray-400">حدد موعدك وأقرب فرع</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
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
                'p-2.5 rounded-xl transition-all border',
                canGoPrev
                  ? 'hover:bg-white/10 text-gray-300 border-white/10'
                  : 'text-gray-600 cursor-not-allowed border-transparent'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            <AnimatePresence mode="wait">
              <motion.h3
                key={`${viewMonth}-${viewYear}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-lg font-bold text-white"
              >
                {monthNames[viewMonth]} {viewYear}
              </motion.h3>
            </AnimatePresence>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(viewYear + 1);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="p-2.5 rounded-xl hover:bg-white/10 text-gray-300 transition-all border border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {dayHeaders.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
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

              return (
                <motion.button
                  key={day}
                  type="button"
                  whileHover={available && !isPast ? { scale: 1.15, y: -2 } : {}}
                  whileTap={available && !isPast ? { scale: 0.9 } : {}}
                  disabled={isPast || !available}
                  onClick={() => !isPast && available && onSelectDate(iso)}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-300 border',
                    isPast || !available
                      ? 'bg-white/[0.02] cursor-not-allowed border-transparent text-gray-600'
                      : isSelected
                        ? 'bg-gradient-to-br from-sky-500 to-teal-500 text-white border-sky-400/50 shadow-lg shadow-sky-500/30'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                  )}
                >
                  <span className="relative z-10">{day}</span>
                  {isToday && !isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-sky-400/50"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {isToday && !isSelected && (
                    <span className="text-[8px] text-sky-400 font-bold mt-0.5">اليوم</span>
                  )}
                  {available && !isPast && !isSelected && dayData && (
                    <span className="text-[7px] text-emerald-400/70 leading-none mt-0.5">{dayData.count}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-5 text-xs text-gray-500 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-white/[0.04] border border-white/10" />
              <span>متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-white/[0.02] border border-transparent" />
              <span>غير متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500" />
              <span>مختار</span>
            </div>
          </div>

          {/* Selected Date Confirmation */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="mt-6 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sky-300">تم اختيار التاريخ</p>
                  <p className="text-sm text-sky-400/80">{formatDateAr(new Date(selectedDate))}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Branch Selection */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-400" />
          اختر الفرع
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BRANCHES.map((branch, i) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <motion.button
                key={branch.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectBranch(branch)}
                className={cn(
                  'relative p-6 rounded-3xl border-2 text-right transition-all duration-500 bg-white/[0.04] backdrop-blur-sm group',
                  isSelected
                    ? 'border-sky-500/50 shadow-xl shadow-sky-500/10 bg-sky-500/[0.08]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="absolute top-4 left-4 w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30"
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}

                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                  animate={isSelected ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #0EA5E9, #14B8A6)'
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <MapPin className={cn('w-6 h-6 transition-colors', isSelected ? 'text-white' : 'text-gray-400')} />
                </motion.div>

                <h4 className="font-bold text-white text-base mb-1.5">{branch.name}</h4>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{branch.address}</p>

                <div className="flex items-center gap-2 text-sky-400/80 text-xs font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{branch.phone}</span>
                </div>

                <div
                  className="absolute top-0 right-0 w-1 h-full rounded-r-3xl transition-all duration-300"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, #0EA5E9, #14B8A6)'
                      : 'rgba(255,255,255,0.1)',
                  }}
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

    [...morningTimes, ...eveningTimes].forEach((time) => {
      const [h, m] = time.split(':').map(Number);
      const seed = dateSeed * 1000 + h * 60 + m;
      const r = seededRandom(seed);
      result.push({ time, label: formatTimeLabel(time), available: r > 0.2 });
    });

    return result;
  }, [selectedDate]);

  const morning = slots.filter((s) => parseInt(s.time.split(':')[0]) < 12);
  const evening = slots.filter((s) => parseInt(s.time.split(':')[0]) >= 12);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Date Header */}
      <GlassCard>
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">التاريخ المختار</p>
            <p className="font-bold text-white text-lg">{formatDateAr(new Date(selectedDate))}</p>
          </div>
        </div>
      </GlassCard>

      {/* Section Title */}
      <motion.div variants={fadeUp} className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">اختر الموعد</h2>
        <p className="text-gray-400">حدد الوقت المناسب لزورتك</p>
      </motion.div>

      {/* Morning Slots */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white">الصباح</h3>
              <p className="text-xs text-gray-400">08:00 ص — 12:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {morning.map((slot, i) => (
              <TimeSlotButton
                key={slot.time}
                slot={slot}
                isSelected={selectedTime === slot.time}
                onSelect={onSelectTime}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Evening Slots */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <Star className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-white">المساء</h3>
              <p className="text-xs text-gray-400">04:00 م — 08:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {evening.map((slot, i) => (
              <TimeSlotButton
                key={slot.time}
                slot={slot}
                isSelected={selectedTime === slot.time}
                onSelect={onSelectTime}
                delay={i * 0.05 + 0.4}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Selected Confirmation */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sky-300">الوقت المختار</p>
              <p className="text-lg text-white font-semibold">
                {slots.find((s) => s.time === selectedTime)?.label}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimeSlotButton({
  slot,
  isSelected,
  onSelect,
  delay,
}: {
  slot: TimeSlotData;
  isSelected: boolean;
  onSelect: (time: string) => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300 }}
      whileHover={slot.available ? { scale: 1.1, y: -2 } : {}}
      whileTap={slot.available ? { scale: 0.9 } : {}}
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className={cn(
        'flex flex-col items-center gap-1 p-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 border relative overflow-hidden',
        isSelected
          ? 'bg-gradient-to-br from-sky-500 to-teal-500 text-white border-sky-400/50 shadow-xl shadow-sky-500/30'
          : slot.available
            ? 'bg-white/[0.04] text-gray-300 border-white/10 hover:border-sky-500/30 hover:bg-white/[0.08] hover:text-white'
            : 'bg-white/[0.02] text-gray-600 border-transparent cursor-not-allowed line-through'
      )}
    >
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-teal-400/20"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className="relative z-10 text-xs">{slot.label}</span>
      {slot.available && !isSelected && (
        <span className="relative z-10 text-[8px] text-emerald-400/70 font-medium">متاح</span>
      )}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative z-10 w-1.5 h-1.5 rounded-full bg-white mt-0.5"
        />
      )}
    </motion.button>
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

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'تحاليل الدم': return 'from-rose-400 to-pink-500';
      case 'تحاليل البول': return 'from-blue-400 to-indigo-500';
      case 'تحاليل مناعية': return 'from-emerald-400 to-teal-500';
      default: return 'from-sky-400 to-sky-600';
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header Card */}
      <GlassCard>
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <FlaskConical className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">اختر التحاليل المخبرية</h2>
              <p className="text-sm text-gray-400">
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
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="ابحث عن تحليل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-10 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] focus:border-sky-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-right text-white placeholder-gray-500"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Tests by Category */}
          <div className="space-y-3">
            {Object.entries(groupedTests).map(([category, tests]) => {
              const isExpanded = expandedCategory === category || searchQuery.length > 0;
              const selectedCount = tests.filter((t) => selectedTests.some((s) => s.id === t.id)).length;

              return (
                <div key={category} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <motion.button
                    type="button"
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => setExpandedCategory(isExpanded && !searchQuery ? null : category)}
                    className="w-full px-5 py-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', categoryColor(category))}>
                        {categoryIcon(category)}
                      </div>
                      <span className="font-bold text-white">{category}</span>
                      {selectedCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-br from-sky-400 to-teal-400 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg shadow-sky-500/20"
                        >
                          {selectedCount}
                        </motion.span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          {tests.map((test, i) => {
                            const isSelected = selectedTests.some((t) => t.id === test.id);
                            return (
                              <motion.button
                                key={test.id}
                                type="button"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.01, x: -2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => onToggleTest(test)}
                                className={cn(
                                  'w-full p-4 rounded-2xl border-2 text-right transition-all duration-300 flex items-center justify-between gap-3 group',
                                  isSelected
                                    ? 'border-sky-500/50 bg-sky-500/[0.08] shadow-lg shadow-sky-500/10'
                                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white text-sm">{test.name}</h4>
                                    {test.requiresFasting && (
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20"
                                      >
                                        صيام
                                      </motion.span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">{test.description}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="font-bold text-teal-400 text-sm whitespace-nowrap">
                                    {test.price} ج.م
                                  </span>
                                  <motion.div
                                    className={cn(
                                      'w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300',
                                      isSelected
                                        ? 'bg-gradient-to-br from-sky-400 to-teal-400 border-transparent shadow-lg shadow-sky-500/20'
                                        : 'border-white/20 group-hover:border-white/30'
                                    )}
                                  >
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                      >
                                        <Check className="w-4 h-4 text-white" />
                                      </motion.div>
                                    )}
                                  </motion.div>
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
      </GlassCard>

      {/* Running Total Bar */}
      <AnimatePresence>
        {selectedTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                التحاليل المختارة ({selectedTests.length})
              </span>
              <span className="text-xs text-gray-500">اضغط لإزالة</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] text-sky-300 text-xs font-medium border border-white/10 hover:bg-white/[0.1] hover:border-sky-500/30 transition-all"
                >
                  <span>{test.name}</span>
                  <X className="w-3 h-3" />
                </motion.button>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <span className="text-gray-300 font-semibold">الإجمالي</span>
              <motion.span
                key={total}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold bg-gradient-to-l from-sky-400 to-teal-400 bg-clip-text text-transparent"
              >
                {total} ج.م
              </motion.span>
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
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Summary Header */}
      <motion.div variants={fadeUp} className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/30"
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">تأكيد الحجز</h2>
        <p className="text-gray-400">راجع تفاصيل الحجز قبل التأكيد</p>
      </motion.div>

      {/* Summary Card */}
      <GlassCard glow>
        <div className="p-6 md:p-8 space-y-5">
          {/* Date & Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">التاريخ والوقت</p>
              <p className="font-bold text-white">{formatDateAr(new Date(date))}</p>
              <p className="text-sm text-sky-400 font-semibold">{formatTimeLabel(time)}</p>
            </div>
          </motion.div>

          {/* Branch */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">الفرع</p>
              <p className="font-bold text-white">{branch.name}</p>
              <p className="text-sm text-gray-400">{branch.address}</p>
            </div>
          </motion.div>

          {/* Tests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl bg-white/[0.04] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-teal-400" />
              <p className="font-bold text-white">التحاليل المختارة ({tests.length})</p>
            </div>
            <div className="space-y-2.5">
              {tests.map((test, i) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                    <span className="text-sm text-gray-300">{test.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{test.price} ج.م</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/10 to-teal-500/10 border border-sky-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">المبلغ الإجمالي</p>
                <p className="text-xs text-gray-500 mt-0.5">شامل جميع التحاليل المختارة</p>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                className="text-4xl font-bold bg-gradient-to-l from-sky-400 to-teal-400 bg-clip-text text-transparent"
              >
                {total} ج.م
              </motion.span>
            </div>
          </motion.div>

          {/* Fasting Note */}
          {tests.some((t) => t.requiresFasting) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-300 text-sm">ملاحظة: بعض التحاليل تتطلب صيام</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  يرجى الصيام لمدة 8-12 ساعة قبل موعدك. يُسمح بشرب الماء فقط.
                </p>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="p-4 rounded-2xl bg-white/[0.03] border border-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4 flex-shrink-0 text-sky-400" />
              <span>جميع التحاليل معتمدة من وزارة الصحة</span>
            </div>
          </motion.div>
        </div>
      </GlassCard>
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
}

function SuccessPage({ booking, onCopyId, copiedId, onNewBooking, onViewAppointments }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-32" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-12 relative z-10">
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative mb-8"
          >
            {/* Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.2, 0],
                  x: Math.cos((i * Math.PI) / 6) * 100,
                  y: Math.sin((i * Math.PI) / 6) * 100,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.2, delay: 0.5 + i * 0.06, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: i % 4 === 0 ? '#0EA5E9' : i % 4 === 1 ? '#10B981' : i % 4 === 2 ? '#14B8A6' : '#F59E0B',
                }}
              />
            ))}

            <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
              <defs>
                <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="70"
                cy="70"
                r="62"
                fill="none"
                stroke="url(#successGrad)"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
              />
              <motion.path
                d="M42 70 L60 88 L98 50"
                fill="none"
                stroke="url(#successGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-2">تم تأكيد حجزك بنجاح!</h2>
            <p className="text-gray-400">سيتم إرسال تفاصيل الحجز إلى هاتفك</p>
          </motion.div>
        </motion.div>

        {/* Booking ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 to-teal-500/10 border border-sky-500/20 text-center"
        >
          <p className="text-sm font-medium text-sky-400 mb-3">رقم الحجز</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-white font-mono tracking-wider">{booking.id}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCopyId}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              title="نسخ رقم الحجز"
            >
              {copiedId ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-5 h-5 text-emerald-400" />
                </motion.div>
              ) : (
                <Copy className="w-5 h-5 text-sky-400" />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-5">تفاصيل الموعد</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">التاريخ</p>
                <p className="font-semibold text-white">{formatDateAr(new Date(booking.date))}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الوقت</p>
                <p className="font-semibold text-white">{formatTimeLabel(booking.time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الفرع</p>
                <p className="font-semibold text-white">{booking.branch.name}</p>
                <p className="text-sm text-gray-400">{booking.branch.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">المبلغ المدفوع</p>
                <p className="font-bold text-lg text-emerald-400">{booking.total} ج.م</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">التحاليل ({booking.tests.length})</h3>
          <div className="space-y-2.5">
            {booking.tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-gray-300">{test.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{test.price} ج.م</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
          className="flex flex-col sm:flex-row gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewBooking}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-l from-sky-500 to-teal-500 text-white font-bold text-lg shadow-xl shadow-sky-500/25 hover:shadow-2xl transition-all relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-sky-400 to-teal-400 opacity-0 hover:opacity-100 transition-opacity"
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              حجز موعد جديد
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewAppointments}
            className="flex-1 py-4 rounded-2xl border-2 border-white/20 text-white font-bold text-lg hover:bg-white/5 transition-all"
          >
            مواعيدي
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
