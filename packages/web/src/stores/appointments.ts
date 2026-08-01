'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BookingStep,
  BookingService,
  BookingBranch,
  PatientInfo,
  PaymentInfo,
  AppointmentConfirmation,
  TimeSlot,
  DayAvailability,
  BookingSummary,
} from '@/types/appointment';

interface BookingSummaryLocal {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface AppointmentBookingState {
  currentStep: BookingStep;
  completedSteps: BookingStep[];
  isAnimating: boolean;

  service: BookingService | null;
  branch: BookingBranch | null;
  date: string | null;
  time: string | null;
  patient: PatientInfo | null;
  payment: PaymentInfo | null;
  confirmation: AppointmentConfirmation | null;

  availableSlots: TimeSlot[];
  monthAvailability: DayAvailability[];

  goToStep: (step: BookingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: BookingStep) => void;

  setService: (service: BookingService) => void;
  setBranch: (branch: BookingBranch) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setPatient: (patient: PatientInfo) => void;
  setPayment: (payment: PaymentInfo) => void;
  setConfirmation: (confirmation: AppointmentConfirmation) => void;

  setAvailableSlots: (slots: TimeSlot[]) => void;
  setMonthAvailability: (days: DayAvailability[]) => void;

  canGoNext: () => boolean;
  isStepComplete: (step: BookingStep) => boolean;
  getStepData: (step: BookingStep) => string;

  resetBooking: () => void;
  calculateSummary: () => BookingSummaryLocal;
}

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(100000 + Math.random() * 900000);
  return `AMB-${year}-${sequence}`;
}

function generateBarcode(): string {
  const digits = Math.floor(100000000000 + Math.random() * 900000000000);
  return String(digits);
}

function generateCalendarIcs(confirmation: AppointmentConfirmation): string {
  const dtStart = new Date(`${confirmation.date}T${confirmation.time}:00`);
  const dtEnd = new Date(dtStart.getTime() + confirmation.service.estimatedDuration * 60000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Al Mokhtabar//Appointment//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(dtStart)}`,
    `DTEND:${formatDate(dtEnd)}`,
    `SUMMARY:${confirmation.service.nameEn} - Al Mokhtabar`,
    `DESCRIPTION:Booking: ${confirmation.bookingNumber}\\nBranch: ${confirmation.branch.nameEn}`,
    `LOCATION:${confirmation.branch.address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const encoded = encodeURIComponent(ics);
  return `data:text/calendar;charset=utf-8,${encoded}`;
}

function generateQrCodeUrl(text: string): string {
  const data = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
}

const initialState = {
  currentStep: 1 as BookingStep,
  completedSteps: [] as BookingStep[],
  isAnimating: false,
  service: null as BookingService | null,
  branch: null as BookingBranch | null,
  date: null as string | null,
  time: null as string | null,
  patient: null as PatientInfo | null,
  payment: null as PaymentInfo | null,
  confirmation: null as AppointmentConfirmation | null,
  availableSlots: [] as TimeSlot[],
  monthAvailability: [] as DayAvailability[],
};

export const useAppointmentBooking = create<AppointmentBookingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      goToStep: (step) => {
        const { completedSteps, currentStep } = get();
        if (step > currentStep + 1) return;
        if (step !== currentStep && !completedSteps.includes(step) && step !== currentStep + 1) return;
        set({ isAnimating: true, currentStep: step });
        setTimeout(() => set({ isAnimating: false }), 300);
      },

      nextStep: () => {
        const { currentStep } = get();
        if (!get().canGoNext()) return;
        set((s) => ({
          completedSteps: s.completedSteps.includes(currentStep)
            ? s.completedSteps
            : [...s.completedSteps, currentStep],
        }));
        if (currentStep < 7) {
          const next = (currentStep + 1) as BookingStep;
          set({ isAnimating: true, currentStep: next });
          setTimeout(() => set({ isAnimating: false }), 300);
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          const prev = (currentStep - 1) as BookingStep;
          set({ isAnimating: true, currentStep: prev });
          setTimeout(() => set({ isAnimating: false }), 300);
        }
      },

      completeStep: (step) => {
        set((s) => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step],
        }));
      },

      setService: (service) => set({ service }),
      setBranch: (branch) => set({ branch }),
      setDate: (date) => set({ date, time: null }),
      setTime: (time) => set({ time }),
      setPatient: (patient) => set({ patient }),
      setPayment: (payment) => set({ payment }),

      setConfirmation: (confirmation) => set({ confirmation }),

      setAvailableSlots: (slots) => set({ availableSlots: slots }),
      setMonthAvailability: (days) => set({ monthAvailability: days }),

      canGoNext: () => {
        const { currentStep, service, branch, date, time, patient, payment } = get();
        switch (currentStep) {
          case 1: return service !== null;
          case 2: return branch !== null;
          case 3: return date !== null;
          case 4: return time !== null;
          case 5: return patient !== null;
          case 6: return payment !== null;
          default: return false;
        }
      },

      isStepComplete: (step) => {
        const { completedSteps } = get();
        return completedSteps.includes(step);
      },

      getStepData: (step) => {
        const { service, branch, date, time, patient, payment } = get();
        switch (step) {
          case 1: return service ? `${service.nameEn} - ${service.price} SAR` : '';
          case 2: return branch ? `${branch.nameEn} - ${branch.address}` : '';
          case 3: return date ?? '';
          case 4: return time ?? '';
          case 5: return patient ? `${patient.firstNameEn} ${patient.lastNameEn}` : '';
          case 6: return payment ? `${payment.method.toUpperCase()} - ${payment.total} SAR` : '';
          default: return '';
        }
      },

      calculateSummary: () => {
        const { service, patient } = get();
        if (!service) return { subtotal: 0, discount: 0, tax: 0, total: 0 };

        const subtotal = service.discountedPrice ?? service.price;
        const discount = service.discountedPrice ? service.price - service.discountedPrice : 0;
        let insuranceDiscount = 0;
        if (patient?.insuranceProvider && service.requiresFasting) {
          insuranceDiscount = subtotal * 0.3;
        }
        const afterDiscountAndInsurance = subtotal - insuranceDiscount;
        const tax = afterDiscountAndInsurance * 0.15;
        const total = afterDiscountAndInsurance + tax;

        return {
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
        };
      },

      resetBooking: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'al-mokhtabar-booking',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        service: state.service,
        branch: state.branch,
        date: state.date,
        time: state.time,
        patient: state.patient,
        payment: state.payment,
        confirmation: state.confirmation,
      }),
    }
  )
);

export function createAppointmentConfirmation(
  state: {
    service: BookingService;
    branch: BookingBranch;
    date: string;
    time: string;
    patient: PatientInfo;
    payment: PaymentInfo;
  }
): AppointmentConfirmation {
  const bookingNumber = generateBookingNumber();
  const barcode = generateBarcode();
  const now = new Date().toISOString();

  const duration = state.service.estimatedDuration;
  const [hours, minutes] = state.time.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + duration;
  const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endM = String(endMinutes % 60).padStart(2, '0');
  const estimatedEndTime = `${endH}:${endM}`;

  const qrData = JSON.stringify({
    bookingNumber,
    service: state.service.nameEn,
    branch: state.branch.nameEn,
    date: state.date,
    time: state.time,
  });

  const calendarUrl = generateCalendarIcs({
    id: bookingNumber,
    bookingNumber,
    qrCode: '',
    barcode: '',
    status: 'confirmed',
    service: state.service,
    branch: state.branch,
    date: state.date,
    time: state.time,
    patient: state.patient,
    payment: state.payment,
    estimatedEndTime,
    createdAt: now,
    calendarUrl: '',
    notifications: { sms: true, email: true, whatsapp: true, push: true },
  });

  return {
    id: bookingNumber,
    bookingNumber,
    qrCode: generateQrCodeUrl(qrData),
    barcode,
    status: 'confirmed',
    service: state.service,
    branch: state.branch,
    date: state.date,
    time: state.time,
    patient: state.patient,
    payment: state.payment,
    estimatedEndTime,
    createdAt: now,
    calendarUrl,
    notifications: {
      sms: true,
      email: true,
      whatsapp: true,
      push: true,
    },
  };
}
