import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppointmentBooking } from '@/stores/appointments';
import { BookingFlowAnimation } from '@/components/motion/BookingFlowAnimation';
import { QueueAnimation } from '@/components/motion/QueueAnimation';
import { CelebrationEffect } from '@/components/motion/CelebrationEffect';
import type { ReactNode } from 'react';

const steps = [
  { label: 'Service', icon: '🔬' as unknown as ReactNode },
  { label: 'Branch', icon: '🏢' as unknown as ReactNode },
  { label: 'Date', icon: '📅' as unknown as ReactNode },
  { label: 'Time', icon: '⏰' as unknown as ReactNode },
  { label: 'Patient', icon: '👤' as unknown as ReactNode },
  { label: 'Payment', icon: '💳' as unknown as ReactNode },
  { label: 'Confirm', icon: '✅' as unknown as ReactNode },
];

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

describe('Booking Flow Integration', () => {
  it('renders booking stepper at initial step', () => {
    render(<BookingFlowAnimation currentStep={1} totalSteps={7} steps={steps} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
  });

  it('selects service and advances to next step', () => {
    useAppointmentBooking.getState().setService({
      type: 'analysis',
      id: 'svc-001',
      nameAr: 'تحليل شامل',
      nameEn: 'Comprehensive Analysis',
      price: 250,
      discountedPrice: 200,
      estimatedDuration: 30,
      description: '',
      category: 'blood',
      requiresFasting: true,
      homeVisitAvailable: false,
    });
    useAppointmentBooking.getState().nextStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(2);
  });

  it('selects branch and date and time', () => {
    const store = useAppointmentBooking.getState();
    store.setService({
      type: 'analysis', id: 'svc-1', nameAr: '', nameEn: 'Test', price: 100,
      discountedPrice: undefined, estimatedDuration: 20, description: '', category: '',
      requiresFasting: false, homeVisitAvailable: false,
    });
    store.nextStep();
    store.setBranch({
      id: 'br-1', nameAr: '', nameEn: 'Main', address: 'Riyadh',
      crowdLevel: 'low', parkingAvailable: true, queueCount: 0, queueWaitTime: '0',
      coordinates: { lat: 24, lng: 46 }, availableSlots: 20,
    });
    store.nextStep();
    store.setDate('2026-08-20');
    store.nextStep();
    store.setTime('09:00');
    expect(useAppointmentBooking.getState().currentStep).toBe(5);
  });

  it('completes full booking flow and shows confirmation', () => {
    const store = useAppointmentBooking.getState();
    store.setService({
      type: 'analysis', id: 'svc-1', nameAr: '', nameEn: 'Test', price: 100,
      discountedPrice: undefined, estimatedDuration: 20, description: '', category: '',
      requiresFasting: false, homeVisitAvailable: false,
    });
    store.nextStep();
    store.setBranch({
      id: 'br-1', nameAr: '', nameEn: 'Main', address: 'Riyadh',
      crowdLevel: 'low', parkingAvailable: true, queueCount: 0, queueWaitTime: '0',
      coordinates: { lat: 24, lng: 46 }, availableSlots: 20,
    });
    store.nextStep();
    store.setDate('2026-08-20');
    store.nextStep();
    store.setTime('10:00');
    store.nextStep();
    store.setPatient({
      firstNameAr: '', lastNameAr: '', firstNameEn: 'Ahmed', lastNameEn: 'Ali',
      phone: '0555', email: 'a@b.com', nationalId: '1010', gender: 'male',
      age: 30, dateOfBirth: '1996-01-01', medicalNotes: '', preferredLanguage: 'ar',
      isExistingPatient: false,
    });
    store.nextStep();
    store.setPayment({
      method: 'visa', amount: 100, currency: 'SAR', discount: 0, tax: 15, total: 115,
      status: 'completed',
    });

    expect(useAppointmentBooking.getState().currentStep).toBe(7);
    expect(useAppointmentBooking.getState().completedSteps).toContain(6);
  });

  it('shows queue position after booking', () => {
    render(
      <QueueAnimation
        queueNumber={42}
        estimatedWait={15}
        positionsAhead={5}
        status="waiting"
        branchName="Main Lab"
      />
    );
    expect(screen.getByText(/رقم 42/)).toBeInTheDocument();
    expect(screen.getByText(/5 أشخاص أمامك/)).toBeInTheDocument();
  });

  it('shows celebration on successful booking', () => {
    render(<CelebrationEffect show={true} variant="checkmark" />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('navigates back and forth between steps', () => {
    const store = useAppointmentBooking.getState();
    store.setService({
      type: 'analysis', id: 'svc-1', nameAr: '', nameEn: 'Test', price: 100,
      discountedPrice: undefined, estimatedDuration: 20, description: '', category: '',
      requiresFasting: false, homeVisitAvailable: false,
    });
    store.nextStep();
    expect(store.currentStep).toBe(2);

    useAppointmentBooking.getState().prevStep();
    expect(useAppointmentBooking.getState().currentStep).toBe(1);
  });

  it('resets booking flow completely', () => {
    const store = useAppointmentBooking.getState();
    store.setService({
      type: 'analysis', id: 'svc-1', nameAr: '', nameEn: 'Test', price: 100,
      discountedPrice: undefined, estimatedDuration: 20, description: '', category: '',
      requiresFasting: false, homeVisitAvailable: false,
    });
    store.nextStep();
    store.setBranch({
      id: 'br-1', nameAr: '', nameEn: 'Main', address: 'Riyadh',
      crowdLevel: 'low', parkingAvailable: true, queueCount: 0, queueWaitTime: '0',
      coordinates: { lat: 24, lng: 46 }, availableSlots: 20,
    });

    useAppointmentBooking.getState().resetBooking();
    const state = useAppointmentBooking.getState();
    expect(state.currentStep).toBe(1);
    expect(state.service).toBeNull();
    expect(state.branch).toBeNull();
  });
});
