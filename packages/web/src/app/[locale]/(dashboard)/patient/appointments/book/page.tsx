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
// Spring Config
// ---------------------------------------------------------------------------

const spring = { type: 'spring' as const, damping: 25, stiffness: 120 };
const springSnappy = { type: 'spring' as const, damping: 20, stiffness: 200 };

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
  visible: { opacity: 1, y: 0, transition: { ...spring, duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(6px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: spring,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(6px)',
    transition: { duration: 0.3, ease: [0.55, 0.06, 0.68, 0.19] },
  }),
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
        'relative rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden',
        glow && 'border-[#38bdf8]/20 shadow-[#38bdf8]/5',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
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
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#0a0a0f' }} dir="rtl">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(56,189,248,0.04)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(52,211,153,0.03)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px]" style={{ backgroundColor: 'rgba(56,189,248,0.02)' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(10,10,15,0.85)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (step > 1 ? goPrev() : router.back())}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {step > 1 ? 'السابق' : 'العودة'}
            </span>
          </motion.button>

          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>حجز موعد جديد</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>خطوة {step} من 4</p>
          </div>

          <div className="w-16" />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: s * 0.1, ...spring }}
              >
                <motion.div
                  initial={false}
                  animate={
                    s === step
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={s === step ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : spring}
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold relative',
                    s < step
                      ? 'text-white'
                      : s === step
                        ? 'text-white'
                        : 'text-gray-600'
                  )}
                  style={{
                    backgroundColor: s < step ? '#34d399' : s === step ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${s < step ? '#34d399' : s === step ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: s < step ? '0 4px 20px rgba(52,211,153,0.3)' : s === step ? '0 4px 20px rgba(56,189,248,0.35)' : 'none',
                  }}
                >
                  {s === step && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{ backgroundColor: '#38bdf8' }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <span className="relative z-10">
                    {s < step ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...springSnappy }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      s
                    )}
                  </span>
                </motion.div>
                <span
                  className="text-[10px] font-semibold transition-colors duration-300"
                  style={{ color: s <= step ? '#38bdf8' : '#475569' }}
                >
                  {s === 1 && 'التاريخ والفرع'}
                  {s === 2 && 'الوقت'}
                  {s === 3 && 'التحاليل'}
                  {s === 4 && 'التأكيد'}
                </span>
              </motion.div>
              {s < 4 && (
                <div className="flex-1 h-0.5 mt-[-20px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width: s < step ? '100%' : s === step ? '50%' : '0%',
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={{
                      background: s < step
                        ? 'linear-gradient(90deg, #34d399, #34d399)'
                        : 'linear-gradient(90deg, #38bdf8, #38bdf8)',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 mt-10 relative overflow-hidden">
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
      <div className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-2xl" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(10,10,15,0.92)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {selectedBranch && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={spring}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <MapPin className="w-4 h-4" style={{ color: '#38bdf8' }} />
                <span style={{ color: 'rgba(226,232,240,0.6)' }}>{selectedBranch.name}</span>
              </motion.span>
            )}
            {selectedTests.length > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={spring}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <FlaskConical className="w-4 h-4" style={{ color: '#34d399' }} />
                <span style={{ color: 'rgba(226,232,240,0.6)' }}>{selectedTests.length} تحليل</span>
              </motion.span>
            )}
          </div>

          {total > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
              className="text-xl font-bold"
              style={{ color: '#38bdf8' }}
            >
              {total.toFixed(0)} ج.م
            </motion.span>
          )}

          <motion.button
            whileHover={canProceed ? { scale: 1.03 } : {}}
            whileTap={canProceed ? { scale: 0.97 } : {}}
            onClick={goNext}
            disabled={!canProceed || isBooking}
            transition={spring}
            className="relative px-8 py-3 rounded-2xl font-bold text-sm overflow-hidden"
            style={{
              backgroundColor: canProceed && !isBooking ? '#38bdf8' : 'rgba(255,255,255,0.04)',
              color: canProceed && !isBooking ? '#0a0a0f' : '#475569',
              border: canProceed && !isBooking ? 'none' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: canProceed && !isBooking ? '0 4px 24px rgba(56,189,248,0.3)' : 'none',
              cursor: canProceed && !isBooking ? 'pointer' : 'not-allowed',
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isBooking ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 rounded-full"
                    style={{ borderColor: '#0a0a0f', borderTopColor: 'transparent' }}
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
  const [monthDirection, setMonthDirection] = React.useState(0);

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

  const navigateMonth = (dir: number) => {
    setMonthDirection(dir);
    if (dir === -1) {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Calendar Card */}
      <GlassCard>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={springSnappy}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 4px 16px rgba(56,189,248,0.3)' }}
            >
              <Calendar className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>اختر التاريخ والفرع</h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>حدد موعدك وأقرب فرع</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={() => navigateMonth(-1)}
              disabled={!canGoPrev}
              className="p-2.5 rounded-xl transition-all"
              style={{
                backgroundColor: canGoPrev ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                color: canGoPrev ? '#e2e8f0' : '#334155',
                cursor: canGoPrev ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            <AnimatePresence mode="wait">
              <motion.h3
                key={`${viewMonth}-${viewYear}`}
                initial={{ opacity: 0, y: monthDirection > 0 ? -12 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: monthDirection > 0 ? 12 : -12 }}
                transition={spring}
                className="text-lg font-bold"
                style={{ color: '#e2e8f0' }}
              >
                {monthNames[viewMonth]} {viewYear}
              </motion.h3>
            </AnimatePresence>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={() => navigateMonth(1)}
              className="p-2.5 rounded-xl transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {dayHeaders.map((d) => (
              <div key={d} className="text-center text-xs font-bold py-2" style={{ color: '#64748b' }}>
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
                  whileHover={available && !isPast ? { scale: 1.12, y: -2 } : {}}
                  whileTap={available && !isPast ? { scale: 0.92 } : {}}
                  transition={springSnappy}
                  disabled={isPast || !available}
                  onClick={() => !isPast && available && onSelectDate(iso)}
                  className="relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: isPast || !available
                      ? 'rgba(255,255,255,0.015)'
                      : isSelected
                        ? 'linear-gradient(135deg, #38bdf8, #34d399)'
                        : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 4px 20px rgba(56,189,248,0.25)' : 'none',
                    color: isPast || !available ? '#334155' : isSelected ? '#ffffff' : '#94a3b8',
                    cursor: isPast || !available ? 'not-allowed' : 'pointer',
                    opacity: isPast || !available ? 0.3 : 1,
                  }}
                >
                  <span className="relative z-10">{day}</span>
                  {isToday && !isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{ border: '2px solid rgba(56,189,248,0.4)' }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {isToday && !isSelected && (
                    <span className="text-[8px] font-bold mt-0.5" style={{ color: '#38bdf8' }}>اليوم</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-5 text-xs mt-6" style={{ color: '#64748b' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
              <span>متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }} />
              <span>غير متاح</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #38bdf8, #34d399)' }} />
              <span>مختار</span>
            </div>
          </div>

          {/* Selected Date Confirmation */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={spring}
                className="mt-6 p-4 rounded-2xl flex items-center gap-3"
                style={{ backgroundColor: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 4px 12px rgba(56,189,248,0.2)' }}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#38bdf8' }}>تم اختيار التاريخ</p>
                  <p className="text-sm" style={{ color: 'rgba(56,189,248,0.7)' }}>{formatDateAr(new Date(selectedDate))}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Branch Selection */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
          <MapPin className="w-5 h-5" style={{ color: '#38bdf8' }} />
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
                transition={{ delay: i * 0.1, ...spring }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectBranch(branch)}
                className="relative p-6 rounded-3xl text-right transition-all duration-500 group"
                style={{
                  backgroundColor: isSelected ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(12px)',
                  border: isSelected ? '2px solid rgba(56,189,248,0.35)' : '2px solid rgba(255,255,255,0.06)',
                  boxShadow: isSelected ? '0 8px 32px rgba(56,189,248,0.1)' : 'none',
                }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springSnappy }}
                    className="absolute top-4 left-4 w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                  animate={isSelected ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #38bdf8, #14b8a6)'
                      : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <MapPin className={cn('w-6 h-6 transition-colors')} style={{ color: isSelected ? '#ffffff' : '#64748b' }} />
                </motion.div>

                <h4 className="font-bold text-base mb-1.5" style={{ color: '#e2e8f0' }}>{branch.name}</h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#94a3b8' }}>{branch.address}</p>

                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(56,189,248,0.7)' }}>
                  <Phone className="w-3.5 h-3.5" />
                  <span>{branch.phone}</span>
                </div>

                <div
                  className="absolute top-0 right-0 w-1 h-full rounded-r-3xl transition-all duration-300"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, #38bdf8, #14b8a6)'
                      : 'rgba(255,255,255,0.06)',
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #38bdf8, #14b8a6)', boxShadow: '0 4px 16px rgba(56,189,248,0.2)' }}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm" style={{ color: '#94a3b8' }}>التاريخ المختار</p>
            <p className="font-bold text-lg" style={{ color: '#e2e8f0' }}>{formatDateAr(new Date(selectedDate))}</p>
          </div>
        </div>
      </GlassCard>

      {/* Section Title */}
      <motion.div variants={fadeUp} className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#e2e8f0' }}>اختر الموعد</h2>
        <p style={{ color: '#94a3b8' }}>حدد الوقت المناسب لزورتك</p>
      </motion.div>

      {/* Morning Slots */}
      <GlassCard>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 12px rgba(251,191,36,0.2)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold" style={{ color: '#e2e8f0' }}>الصباح</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>08:00 ص — 12:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2.5">
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
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #818cf8, #7c3aed)', boxShadow: '0 4px 12px rgba(129,140,248,0.2)' }}
            >
              <Star className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold" style={{ color: '#e2e8f0' }}>المساء</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>04:00 م — 08:00 م</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2.5">
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
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={spring}
            className="p-5 rounded-2xl flex items-center gap-4"
            style={{ backgroundColor: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 4px 12px rgba(56,189,248,0.2)' }}>
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: '#38bdf8' }}>الوقت المختار</p>
              <p className="text-lg font-semibold" style={{ color: '#e2e8f0' }}>
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
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springSnappy }}
      whileHover={slot.available ? { scale: 1.08, y: -2 } : {}}
      whileTap={slot.available ? { scale: 0.92 } : {}}
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className="flex flex-col items-center gap-1 p-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden"
      style={{
        backgroundColor: isSelected
          ? '#38bdf8'
          : slot.available
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.015)',
        border: isSelected
          ? '1px solid rgba(56,189,248,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isSelected ? '0 4px 20px rgba(56,189,248,0.3)' : 'none',
        color: isSelected ? '#0a0a0f' : slot.available ? '#e2e8f0' : '#334155',
        cursor: slot.available ? 'pointer' : 'not-allowed',
        opacity: slot.available ? 1 : 0.4,
      }}
    >
      <span className="relative z-10 text-xs">{slot.label}</span>
      {slot.available && !isSelected && (
        <span className="relative z-10 text-[8px] font-medium" style={{ color: '#34d399' }}>متاح</span>
      )}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springSnappy}
          className="relative z-10 w-1.5 h-1.5 rounded-full mt-0.5"
          style={{ backgroundColor: '#0a0a0f' }}
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
      case 'تحاليل الدم': return 'linear-gradient(135deg, #fb7185, #ec4899)';
      case 'تحاليل البول': return 'linear-gradient(135deg, #60a5fa, #6366f1)';
      case 'تحاليل مناعية': return 'linear-gradient(135deg, #34d399, #14b8a6)';
      default: return 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header Card */}
      <GlassCard>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #34d399, #14b8a6)', boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}
            >
              <FlaskConical className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>اختر التحاليل المخبرية</h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
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
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="ابحث عن تحليل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-10 py-3.5 rounded-2xl outline-none transition-all text-right text-white placeholder-gray-500"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springSnappy}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#64748b' }}
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
                <div
                  key={category}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <motion.button
                    type="button"
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    onClick={() => setExpandedCategory(isExpanded && !searchQuery ? null : category)}
                    className="w-full px-5 py-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ background: categoryColor(category), boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                      >
                        {categoryIcon(category)}
                      </div>
                      <span className="font-bold" style={{ color: '#e2e8f0' }}>{category}</span>
                      {selectedCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springSnappy}
                          className="text-white text-xs px-2.5 py-1 rounded-full font-bold"
                          style={{ background: 'linear-gradient(135deg, #38bdf8, #34d399)', boxShadow: '0 2px 8px rgba(56,189,248,0.2)' }}
                        >
                          {selectedCount}
                        </motion.span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={spring}
                    >
                      <ChevronLeft className="w-5 h-5" style={{ color: '#64748b' }} />
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
                                transition={{ delay: i * 0.05, ...spring }}
                                whileHover={{ scale: 1.01, x: -2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => onToggleTest(test)}
                                className="w-full p-4 rounded-2xl text-right transition-all duration-300 flex items-center justify-between gap-3 group"
                                style={{
                                  backgroundColor: isSelected ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.02)',
                                  border: isSelected ? '2px solid rgba(56,189,248,0.35)' : '2px solid rgba(255,255,255,0.06)',
                                  boxShadow: isSelected ? '0 4px 16px rgba(56,189,248,0.08)' : 'none',
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{test.name}</h4>
                                    {test.requiresFasting && (
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={springSnappy}
                                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                        style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
                                      >
                                        صيام
                                      </motion.span>
                                    )}
                                  </div>
                                  <p className="text-xs" style={{ color: '#94a3b8' }}>{test.description}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="font-bold text-sm whitespace-nowrap" style={{ color: '#34d399' }}>
                                    {test.price} ج.م
                                  </span>
                                  <motion.div
                                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300"
                                    style={{
                                      backgroundColor: isSelected
                                        ? '#38bdf8'
                                        : 'rgba(255,255,255,0.04)',
                                      border: isSelected
                                        ? 'none'
                                        : '2px solid rgba(255,255,255,0.1)',
                                      boxShadow: isSelected ? '0 2px 8px rgba(56,189,248,0.3)' : 'none',
                                    }}
                                  >
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ ...springSnappy, damping: 15 }}
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
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={spring}
            className="rounded-3xl p-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#38bdf8' }} />
                التحاليل المختارة ({selectedTests.length})
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>اضغط لإزالة</span>
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
                  transition={springSnappy}
                  onClick={() => onToggleTest(test)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ backgroundColor: 'rgba(56,189,248,0.08)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.15)' }}
                >
                  <span>{test.name}</span>
                  <X className="w-3 h-3" />
                </motion.button>
              ))}
            </div>
            <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-semibold" style={{ color: '#e2e8f0' }}>الإجمالي</span>
              <motion.span
                key={total}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                className="text-3xl font-bold"
                style={{ color: '#38bdf8' }}
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
          transition={{ ...springSnappy, stiffness: 300 }}
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#e2e8f0' }}>تأكيد الحجز</h2>
        <p style={{ color: '#94a3b8' }}>راجع تفاصيل الحجز قبل التأكيد</p>
      </motion.div>

      {/* Summary Card */}
      <GlassCard glow>
        <div className="p-6 md:p-8 space-y-5">
          {/* Date & Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, ...spring }}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 4px 12px rgba(56,189,248,0.2)' }}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>التاريخ والوقت</p>
              <p className="font-bold" style={{ color: '#e2e8f0' }}>{formatDateAr(new Date(date))}</p>
              <p className="text-sm font-semibold" style={{ color: '#38bdf8' }}>{formatTimeLabel(time)}</p>
            </div>
          </motion.div>

          {/* Branch */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, ...spring }}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34d399, #14b8a6)', boxShadow: '0 4px 12px rgba(52,211,153,0.2)' }}>
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>الفرع</p>
              <p className="font-bold" style={{ color: '#e2e8f0' }}>{branch.name}</p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{branch.address}</p>
            </div>
          </motion.div>

          {/* Tests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, ...spring }}
            className="p-5 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5" style={{ color: '#34d399' }} />
              <p className="font-bold" style={{ color: '#e2e8f0' }}>التحاليل المختارة ({tests.length})</p>
            </div>
            <div className="space-y-2.5">
              {tests.map((test, i) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05, ...spring }}
                  className="flex items-center justify-between py-2.5 last:border-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05, ...spring }}
                    >
                      <Check className="w-4 h-4" style={{ color: '#34d399' }} />
                    </motion.div>
                    <span className="text-sm" style={{ color: '#e2e8f0' }}>{test.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{test.price} ج.م</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, ...spring }}
            className="p-6 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(56,189,248,0.15)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#94a3b8' }}>المبلغ الإجمالي</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>شامل جميع التحاليل المختارة</p>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, ...spring, stiffness: 200 }}
                className="text-4xl font-bold"
                style={{ color: '#38bdf8' }}
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
              transition={{ delay: 0.7, ...spring }}
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
            >
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#fbbf24' }}>ملاحظة: بعض التحاليل تتطلب صيام</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(251,191,36,0.7)' }}>
                  يرجى الصيام لمدة 8-12 ساعة قبل موعدك. يُسمح بشرب الماء فقط.
                </p>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, ...spring }}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
              <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#38bdf8' }} />
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
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#0a0a0f' }} dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(52,211,153,0.04)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(56,189,248,0.03)' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-12 relative z-10">
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
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
                  backgroundColor: i % 4 === 0 ? '#38bdf8' : i % 4 === 1 ? '#34d399' : i % 4 === 2 ? '#14b8a6' : '#fbbf24',
                }}
              />
            ))}

            <svg width="140" height="140" viewBox="0 0 140 140" className="relative z-10">
              <defs>
                <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#14b8a6" />
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
            transition={{ delay: 1.2, ...spring }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#e2e8f0' }}>تم تأكيد حجزك بنجاح!</h2>
            <p style={{ color: '#94a3b8' }}>سيتم إرسال تفاصيل الحجز إلى هاتفك</p>
          </motion.div>
        </motion.div>

        {/* Booking ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, ...spring }}
          className="mb-8 p-6 rounded-3xl text-center"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(56,189,248,0.15)' }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: '#38bdf8' }}>رقم الحجز</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold font-mono tracking-wider" style={{ color: '#e2e8f0' }}>{booking.id}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={onCopyId}
              className="p-2.5 rounded-xl transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
              title="نسخ رقم الحجز"
            >
              {copiedId ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springSnappy}>
                  <Check className="w-5 h-5" style={{ color: '#34d399' }} />
                </motion.div>
              ) : (
                <Copy className="w-5 h-5" style={{ color: '#38bdf8' }} />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, ...spring }}
          className="mb-8 rounded-3xl p-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
        >
          <h3 className="text-lg font-bold mb-5" style={{ color: '#e2e8f0' }}>تفاصيل الموعد</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(56,189,248,0.08)' }}>
                <Calendar className="w-5 h-5" style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>التاريخ</p>
                <p className="font-semibold" style={{ color: '#e2e8f0' }}>{formatDateAr(new Date(booking.date))}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(56,189,248,0.08)' }}>
                <Clock className="w-5 h-5" style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>الوقت</p>
                <p className="font-semibold" style={{ color: '#e2e8f0' }}>{formatTimeLabel(booking.time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(56,189,248,0.08)' }}>
                <MapPin className="w-5 h-5" style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>الفرع</p>
                <p className="font-semibold" style={{ color: '#e2e8f0' }}>{booking.branch.name}</p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>{booking.branch.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(52,211,153,0.08)' }}>
                <CreditCard className="w-5 h-5" style={{ color: '#34d399' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>المبلغ المدفوع</p>
                <p className="font-bold text-lg" style={{ color: '#34d399' }}>{booking.total} ج.م</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, ...spring }}
          className="mb-8 rounded-3xl p-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>التحاليل ({booking.tests.length})</h3>
          <div className="space-y-2.5">
            {booking.tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between py-2.5 last:border-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399' }} />
                  <span className="text-sm" style={{ color: '#e2e8f0' }}>{test.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{test.price} ج.م</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, ...spring }}
          className="flex flex-col sm:flex-row gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            onClick={onNewBooking}
            className="flex-1 py-4 rounded-2xl font-bold text-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #38bdf8, #14b8a6)', color: '#0a0a0f', boxShadow: '0 8px 24px rgba(56,189,248,0.25)' }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              حجز موعد جديد
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            onClick={onViewAppointments}
            className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all"
            style={{ backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}
          >
            مواعيدي
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
