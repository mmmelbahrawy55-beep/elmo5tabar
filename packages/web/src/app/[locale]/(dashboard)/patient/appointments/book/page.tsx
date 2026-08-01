'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Phone,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BookingStepper,
  StepWrapper,
  Step1Service,
  Step2Branch,
  Step3Date,
  Step4Time,
} from '@/components/appointments/BookingSteps';
import {
  Step5PatientDetails,
  Step6Payment,
  Step7Confirmation,
} from '@/components/appointments/BookingStepsExtra';
import { useAppointmentBooking, createAppointmentConfirmation } from '@/stores/appointments';
import type { AppointmentBookingState } from '@/stores/appointments';
import { useLocationStore } from '@/stores/branches';
import type {
  BookingStep,
  PatientInfo,
  PaymentInfo,
  AppointmentConfirmation,
} from '@/types/appointment';
import { cn } from '@/lib/utils';

const STEP_TIPS: Record<number, { icon: React.ReactNode; text: string }[]> = {
  1: [
    { icon: <ShieldCheck className="w-4 h-4 text-brand-500" />, text: 'جميع التحاليل معتمدة من وزارة الصحة' },
    { icon: <Clock className="w-4 h-4 text-brand-500" />, text: 'مدة الفحص تقريبية وقد تختلف حسب الحالة' },
  ],
  2: [
    { icon: <MapPin className="w-4 h-4 text-brand-500" />, text: 'يمكنك السماح بالوصول للموقع لمعرفة أقرب فرع' },
    { icon: <Clock className="w-4 h-4 text-brand-500" />, text: 'الأوقات التقريبية للانتظار حسب الازدحام الحالي' },
  ],
  3: [
    { icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, text: 'الأيام المميزة قد يكون فيها ازدحام أعلى' },
  ],
  4: [
    { icon: <Clock className="w-4 h-4 text-brand-500" />, text: 'النجمة تدل على الأوقات المثلى للحصول على أسرع خدمة' },
  ],
  5: [
    { icon: <ShieldCheck className="w-4 h-4 text-brand-500" />, text: 'بياناتك مشفرة ومحمية وفقاً لمعايير HIPAA' },
  ],
  6: [
    { icon: <CreditCard className="w-4 h-4 text-brand-500" />, text: 'جميع المعاملات مشفرة وآمنة 100%' },
  ],
};

export default function BookAppointmentPage() {
  const router = useRouter();
  const booking = useAppointmentBooking();
  const { userLocation, requestLocation } = useLocationStore();
  const [lang] = React.useState<'ar' | 'en'>('ar');

  React.useEffect(() => {
    if (!userLocation) {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  const handleNext = React.useCallback(() => {
    const { currentStep, setService, setBranch, setDate, setTime, setPatient, setPayment } = booking;
    booking.nextStep();

    if (currentStep === 7) {
      const confirmation = createAppointmentConfirmation({
        service: booking.service!,
        branch: booking.branch!,
        date: booking.date!,
        time: booking.time!,
        patient: booking.patient!,
        payment: booking.payment!,
      });
      booking.setConfirmation(confirmation);
    }
  }, [booking]);

  const handlePrev = React.useCallback(() => {
    booking.prevStep();
  }, [booking]);

  const handleStepClick = React.useCallback((step: BookingStep) => {
    booking.goToStep(step);
  }, [booking]);

  const handlePatientSubmit = React.useCallback((patient: PatientInfo) => {
    booking.setPatient(patient);
    booking.nextStep();
  }, [booking]);

  const handlePaymentSubmit = React.useCallback((payment: PaymentInfo) => {
    booking.setPayment(payment);
    const confirmation = createAppointmentConfirmation({
      service: booking.service!,
      branch: booking.branch!,
      date: booking.date!,
      time: booking.time!,
      patient: booking.patient!,
      payment,
    });
    booking.setConfirmation(confirmation);
    booking.nextStep();
  }, [booking]);

  const handleNewBooking = React.useCallback(() => {
    booking.resetBooking();
  }, [booking]);

  const handleViewAppointments = React.useCallback(() => {
    booking.resetBooking();
    router.push('/ar/patient/appointments');
  }, [booking, router]);

  const handleGoHome = React.useCallback(() => {
    booking.resetBooking();
    router.push('/ar/patient');
  }, [booking, router]);

  const summary = booking.calculateSummary();

  const canProceed = booking.canGoNext();
  const tips = STEP_TIPS[booking.currentStep] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white pb-20">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">العودة</span>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-surface-900">حجز موعد جديد</h1>
            <p className="text-xs text-surface-500">خطوة {booking.currentStep} من 7</p>
          </div>

          <button
            onClick={() => {}}
            className="p-2 text-surface-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-colors"
            title="المساعدة"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <BookingStepper
          currentStep={booking.currentStep}
          completedSteps={booking.completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        {booking.currentStep <= 6 ? (
          <StepWrapper
            step={booking.currentStep}
            onNext={handleNext}
            onPrev={handlePrev}
            canNext={canProceed}
            hideNext={booking.currentStep === 5 || booking.currentStep === 6}
          >
            <AnimatePresence mode="wait">
              {booking.currentStep === 1 && (
                <Step1Service
                  key="step1"
                  selectedService={booking.service}
                  onSelect={(svc) => booking.setService(svc)}
                />
              )}
              {booking.currentStep === 2 && (
                <Step2Branch
                  key="step2"
                  selectedBranch={booking.branch}
                  onSelect={(b) => booking.setBranch(b)}
                  userLocation={userLocation}
                />
              )}
              {booking.currentStep === 3 && (
                <Step3Date
                  key="step3"
                  selectedDate={booking.date}
                  onSelect={(d) => booking.setDate(d)}
                  service={booking.service}
                />
              )}
              {booking.currentStep === 4 && (
                <Step4Time
                  key="step4"
                  selectedTime={booking.time}
                  onSelect={(t) => booking.setTime(t)}
                  date={booking.date}
                />
              )}
              {booking.currentStep === 5 && (
                <Step5PatientDetails
                  key="step5"
                  patient={booking.patient}
                  onSubmit={handlePatientSubmit}
                  language={lang}
                />
              )}
              {booking.currentStep === 6 && (
                <Step6Payment
                  key="step6"
                  payment={booking.payment}
                  onSubmit={handlePaymentSubmit}
                  summary={summary}
                  service={booking.service}
                />
              )}
            </AnimatePresence>
          </StepWrapper>
        ) : (
          <Step7Confirmation
            confirmation={booking.confirmation!}
            onNewBooking={handleNewBooking}
            onViewAppointments={handleViewAppointments}
          />
        )}
      </div>

      {/* Tips */}
      {tips.length > 0 && booking.currentStep <= 6 && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
            <div className="flex flex-wrap gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-brand-700">
                  {tip.icon}
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar - Quick Summary */}
      {booking.currentStep <= 6 && (
        <MobileBottomBar booking={booking} summary={summary} onNext={handleNext} />
      )}

      {/* Help FAB */}
      <button
        className="fixed bottom-24 left-6 w-12 h-12 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-600 transition-colors z-50 lg:hidden"
        title="المساعدة"
      >
        <Phone className="w-5 h-5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile Bottom Bar
// ---------------------------------------------------------------------------
function MobileBottomBar({
  booking,
  summary,
  onNext,
}: {
  booking: AppointmentBookingState;
  summary: { subtotal: number; discount: number; tax: number; total: number };
  onNext: () => void;
}) {
  const stepLabels: Record<number, string> = {
    1: 'اختيار الخدمة',
    2: 'اختيار الفرع',
    3: 'اختيار التاريخ',
    4: 'اختيار الوقت',
    5: 'بيانات المريض',
    6: 'الدفع',
    7: 'التأكيد',
  };

  return (
    <div className="fixed bottom-0 inset-x-0 lg:hidden z-40 bg-white border-t border-surface-100 shadow-2xl">
      <div className="px-4 py-3">
        {/* Mini summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-sm text-surface-600">
            {booking.service && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-brand-500" />
                {booking.service.nameAr}
              </span>
            )}
            {booking.branch && (
              <span className="hidden sm:flex items-center gap-1">
                <MapPin className="w-4 h-4 text-brand-500" />
                {booking.branch.nameAr}
              </span>
            )}
          </div>
          {summary.total > 0 && (
            <span className="text-lg font-bold text-brand-600">
              {summary.total.toFixed(0)} ر.س
            </span>
          )}
        </div>

        {/* Action */}
        <button
          onClick={onNext}
          disabled={!booking.canGoNext()}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-base transition-all duration-300',
            booking.canGoNext()
              ? 'bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25'
              : 'bg-surface-200 text-surface-400 cursor-not-allowed',
          )}
        >
          {booking.currentStep === 6 ? `ادفع ${summary.total.toFixed(2)} ر.س` : 'التالي'}
        </button>
      </div>
    </div>
  );
}
