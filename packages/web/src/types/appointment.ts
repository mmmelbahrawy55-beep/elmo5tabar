export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ServiceType = 'analysis' | 'package' | 'home-visit' | 'consultation' | 'corporate';

export type PaymentMethod = 'visa' | 'mastercard' | 'apple-pay' | 'google-pay' | 'cash' | 'insurance' | 'wallet';

export type AppointmentStatus = 'pending' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

export interface BookingState {
  currentStep: BookingStep;
  service: BookingService | null;
  branch: BookingBranch | null;
  date: string | null; // ISO date string
  time: string | null; // "09:00"
  patient: PatientInfo | null;
  payment: PaymentInfo | null;
  appointment: AppointmentConfirmation | null;
}

export interface BookingService {
  type: ServiceType;
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  discountedPrice?: number;
  estimatedDuration: number; // minutes
  description: string;
  category: string;
  requiresFasting: boolean;
  homeVisitAvailable: boolean;
}

export interface BookingBranch {
  id: string;
  nameAr: string;
  nameEn: string;
  address: string;
  distance?: number; // km
  travelTime?: number; // minutes
  crowdLevel: 'low' | 'medium' | 'high';
  parkingAvailable: boolean;
  queueCount: number;
  queueWaitTime: string;
  coordinates: { lat: number; lng: number };
  availableSlots: number;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  isPeak: boolean;
  isRecommended: boolean;
  remainingSlots: number;
  maxSlots: number;
}

export interface DayAvailability {
  date: string; // "2026-08-01"
  available: boolean;
  slotsCount: number;
  isHoliday: boolean;
  isPeakDay: boolean;
  holidayName?: string;
}

export interface PatientInfo {
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  phone: string;
  email: string;
  nationalId: string;
  gender: 'male' | 'female';
  age: number;
  dateOfBirth: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  medicalNotes: string;
  preferredLanguage: 'ar' | 'en';
  isExistingPatient: boolean;
  patientId?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  currency: string;
  discount: number;
  tax: number;
  total: number;
  insuranceCoverage?: number;
  cardLast4?: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AppointmentConfirmation {
  id: string;
  bookingNumber: string; // e.g. "AMB-2026-001234"
  qrCode: string; // base64 or URL
  barcode: string;
  status: AppointmentStatus;
  service: BookingService;
  branch: BookingBranch;
  date: string;
  time: string;
  patient: PatientInfo;
  payment: PaymentInfo;
  estimatedEndTime: string;
  createdAt: string;
  calendarUrl: string; // .ics download URL
  notifications: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

export interface BookingSummary {
  subtotal: number;
  discount: number;
  tax: number;
  insuranceCoverage: number;
  total: number;
  itemCount: number;
}

export const STEP_CONFIG: { step: BookingStep; title: string; titleAr: string; icon: string; description: string }[] = [
  { step: 1, title: 'Choose Service', titleAr: 'اختيار الخدمة', icon: 'flask', description: 'اختر نوع التحليل أو الخدمة' },
  { step: 2, title: 'Choose Branch', titleAr: 'اختيار الفرع', icon: 'building', description: 'اختر أقرب فرع إليك' },
  { step: 3, title: 'Choose Date', titleAr: 'اختيار التاريخ', icon: 'calendar', description: 'اختر التاريخ المناسب' },
  { step: 4, title: 'Choose Time', titleAr: 'اختيار الوقت', icon: 'clock', description: 'اختر الوقت المتاح' },
  { step: 5, title: 'Patient Details', titleAr: 'بيانات المريض', icon: 'user', description: 'أدخل بياناتك الشخصية' },
  { step: 6, title: 'Payment', titleAr: 'الدفع', icon: 'credit-card', description: 'اختر طريقة الدفع' },
  { step: 7, title: 'Confirmation', titleAr: 'التأكيد', icon: 'check', description: 'تم تأكيد موعدك' },
];

export const SERVICE_TYPES: { type: ServiceType; nameAr: string; nameEn: string; icon: string; description: string; color: string }[] = [
  { type: 'analysis', nameAr: 'تحليل مخبري', nameEn: 'Lab Analysis', icon: 'flask', description: 'فحوصات مخبرية شاملة بأكثر من 500 تحليل', color: '#0077B6' },
  { type: 'package', nameAr: 'باقة فحص', nameEn: 'Health Package', icon: 'package', description: 'باقات متكاملة بتخفيضات حصرية', color: '#10B981' },
  { type: 'home-visit', nameAr: 'زيارة منزلية', nameEn: 'Home Visit', icon: 'home', description: 'خذ العينات من منزلك بكل راحة', color: '#8B5CF6' },
  { type: 'consultation', nameAr: 'استشارة طبية', nameEn: 'Consultation', icon: 'stethoscope', description: 'استشارة مع أطباء متخصصين', color: '#F59E0B' },
  { type: 'corporate', nameAr: 'خدمات الشركات', nameEn: 'Corporate', icon: 'building', description: 'برامج فحص صحي للشركات والمؤسسات', color: '#E11D48' },
];

export const PAYMENT_METHODS: { method: PaymentMethod; nameAr: string; nameEn: string; icon: string; color: string }[] = [
  { method: 'visa', nameAr: 'فيزا', nameEn: 'Visa', icon: 'credit-card', color: '#1A1F71' },
  { method: 'mastercard', nameAr: 'ماستركارد', nameEn: 'Mastercard', icon: 'credit-card', color: '#EB001B' },
  { method: 'apple-pay', nameAr: 'أبل باي', nameEn: 'Apple Pay', icon: 'smartphone', color: '#000000' },
  { method: 'google-pay', nameAr: 'جوجل باي', nameEn: 'Google Pay', icon: 'smartphone', color: '#4285F4' },
  { method: 'cash', nameAr: 'نقدي', nameEn: 'Cash', icon: 'banknote', color: '#10B981' },
  { method: 'insurance', nameAr: 'تأمين طبي', nameEn: 'Insurance', icon: 'shield', color: '#8B5CF6' },
  { method: 'wallet', nameAr: 'المحفظة الإلكترونية', nameEn: 'Digital Wallet', icon: 'wallet', color: '#F59E0B' },
];

export const INSURANCE_PROVIDERS = [
  'Bupa', 'Tawuniya', 'Medgulf', 'Al Rajhi Takaful', 'BUPA Arabia',
  'Saudi Insurance', 'Walaa Insurance', 'AXA Insurance', 'Gulf Insurance',
];
