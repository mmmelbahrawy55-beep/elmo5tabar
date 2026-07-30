import { describe, it, expect, beforeEach } from 'vitest';
import { useAppointmentBooking } from '@/stores/appointments';
import type {
  BookingService,
  BookingBranch,
  PatientInfo,
  PaymentInfo,
} from '@/types/appointment';

const mockService: BookingService = {
  type: 'analysis',
  id: 'svc-001',
  nameAr: 'تحليل شامل',
  nameEn: 'Comprehensive Analysis',
  price: 250,
  discountedPrice: 200,
  estimatedDuration: 30,
  description: 'تحليل مخبري شامل',
  category: 'blood',
  requiresFasting: true,
  homeVisitAvailable: false,
};

const mockBranch: BookingBranch = {
  id: 'br-001',
  nameAr: 'الفرع الرئيسي',
  nameEn: 'Main Branch',
  address: 'Riyadh',
  crowdLevel: 'medium',
  parkingAvailable: true,
  queueCount: 5,
  queueWaitTime: '10 min',
  coordinates: { lat: 24.7, lng: 46.7 },
  availableSlots: 10,
};

const mockPatient: PatientInfo = {
  firstNameAr: 'محمد',
  lastNameAr: 'العلي',
  firstNameEn: 'Mohammed',
  lastNameEn: 'Al-Ali',
  phone: '0555123456',
  email: 'm@example.com',
  nationalId: '1012345678',
  gender: 'male',
  age: 30,
  dateOfBirth: '1996-01-01',
  medicalNotes: '',
  preferredLanguage: 'ar',
  isExistingPatient: false,
};

const mockPayment: PaymentInfo = {
  method: 'visa',
  amount: 250,
  currency: 'SAR',
  discount: 50,
  tax: 30,
  total: 230,
  status: 'pending',
};

beforeEach(() => {
  useAppointmentBooking.setState({
    currentStep: 1,
    completedSteps: [],
    isAnimating: false,
    service: null,
    branch: null,
    date: null,
    time: null,
    patient: null,
    payment: null,
    confirmation: null,
    availableSlots: [],
    monthAvailability: [],
  });
});

describe('appointmentStore', () => {
  it('starts at step 1 with no selections', () => {
    const state = useAppointmentBooking.getState();
    expect(state.currentStep).toBe(1);
    expect(state.service).toBeNull();
    expect(state.branch).toBeNull();
  });

  it('setService updates service', () => {
    useAppointmentBooking.getState().setService(mockService);
    expect(useAppointmentBooking.getState().service?.id).toBe('svc-001');
    expect(useAppointmentBooking.getState().service?.nameEn).toBe('Comprehensive Analysis');
  });

  it('setBranch updates branch', () => {
    useAppointmentBooking.getState().setBranch(mockBranch);
    expect(useAppointmentBooking.getState().branch?.id).toBe('br-001');
  });

  it('setDate updates date and resets time', () => {
    useAppointmentBooking.getState().setDate('2026-08-15');
    useAppointmentBooking.getState().setTime('09:00');
    useAppointmentBooking.getState().setDate('2026-08-16');
    expect(useAppointmentBooking.getState().date).toBe('2026-08-16');
    expect(useAppointmentBooking.getState().time).toBeNull();
  });

  it('setTime updates time', () => {
    useAppointmentBooking.getState().setTime('10:30');
    expect(useAppointmentBooking.getState().time).toBe('10:30');
  });

  it('setPatient updates patient', () => {
    useAppointmentBooking.getState().setPatient(mockPatient);
    expect(useAppointmentBooking.getState().patient?.email).toBe('m@example.com');
  });

  it('setPayment updates payment', () => {
    useAppointmentBooking.getState().setPayment(mockPayment);
    expect(useAppointmentBooking.getState().payment?.method).toBe('visa');
  });

  it('nextStep advances to next step with valid data', () => {
    useAppointmentBooking.getState().setService(mockService);
    useAppointmentBooking.getState().nextStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(2);
    expect(useAppointmentBooking.getState().completedSteps).toContain(1);
  });

  it('nextStep does not advance without required data', () => {
    useAppointmentBooking.getState().nextStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(1);
  });

  it('prevStep goes back', () => {
    useAppointmentBooking.setState({ currentStep: 3, completedSteps: [1, 2] });
    useAppointmentBooking.getState().prevStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(2);
  });

  it('prevStep does not go below step 1', () => {
    useAppointmentBooking.getState().prevStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(1);
  });

  it('goToStep navigates to valid step', () => {
    useAppointmentBooking.setState({ currentStep: 2, completedSteps: [1] });
    useAppointmentBooking.getState().goToStep(2);
    expect(useAppointmentBooking.getState().currentStep).toBe(2);
  });

  it('goToStep blocks jumping ahead more than 1', () => {
    useAppointmentBooking.getState().goToStep(5);
    expect(useAppointmentBooking.getState().currentStep).toBe(1);
  });

  it('canGoNext returns true when current step data is set', () => {
    useAppointmentBooking.getState().setService(mockService);
    expect(useAppointmentBooking.getState().canGoNext()).toBe(true);
  });

  it('canGoNext returns false when current step data is missing', () => {
    expect(useAppointmentBooking.getState().canGoNext()).toBe(false);
  });

  it('isStepComplete checks completed steps', () => {
    useAppointmentBooking.setState({ completedSteps: [1, 2] });
    expect(useAppointmentBooking.getState().isStepComplete(1)).toBe(true);
    expect(useAppointmentBooking.getState().isStepComplete(3)).toBe(false);
  });

  it('getStepData returns formatted string for each step', () => {
    useAppointmentBooking.getState().setService(mockService);
    const data = useAppointmentBooking.getState().getStepData(1);
    expect(data).toContain('Comprehensive Analysis');
    expect(data).toContain('200 SAR');
  });

  it('getStepData returns empty string when data is missing', () => {
    expect(useAppointmentBooking.getState().getStepData(1)).toBe('');
  });

  it('completeStep marks step as completed', () => {
    useAppointmentBooking.getState().completeStep(3);
    expect(useAppointmentBooking.getState().completedSteps).toContain(3);
  });

  it('completeStep does not duplicate steps', () => {
    useAppointmentBooking.getState().completeStep(1);
    useAppointmentBooking.getState().completeStep(1);
    expect(useAppointmentBooking.getState().completedSteps.filter(s => s === 1).length).toBe(1);
  });

  it('calculateSummary returns zeroes without service', () => {
    const summary = useAppointmentBooking.getState().calculateSummary();
    expect(summary.subtotal).toBe(0);
    expect(summary.total).toBe(0);
  });

  it('calculateSummary returns correct values with service', () => {
    useAppointmentBooking.getState().setService(mockService);
    const summary = useAppointmentBooking.getState().calculateSummary();
    expect(summary.subtotal).toBe(200);
    expect(summary.discount).toBe(50);
  });

  it('resetBooking clears all state', () => {
    useAppointmentBooking.getState().setService(mockService);
    useAppointmentBooking.getState().setBranch(mockBranch);
    useAppointmentBooking.getState().nextStep();
    useAppointmentBooking.getState().resetBooking();
    const state = useAppointmentBooking.getState();
    expect(state.currentStep).toBe(1);
    expect(state.service).toBeNull();
    expect(state.branch).toBeNull();
  });

  it('setAvailableSlots stores time slots', () => {
    const slots = [
      { time: '09:00', available: true, isPeak: false, isRecommended: true, remainingSlots: 5, maxSlots: 10 },
      { time: '10:00', available: false, isPeak: true, isRecommended: false, remainingSlots: 0, maxSlots: 10 },
    ];
    useAppointmentBooking.getState().setAvailableSlots(slots);
    expect(useAppointmentBooking.getState().availableSlots).toHaveLength(2);
    expect(useAppointmentBooking.getState().availableSlots[0].time).toBe('09:00');
  });
});
