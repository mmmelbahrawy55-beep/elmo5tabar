import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookingFlowAnimation } from '@/components/motion/BookingFlowAnimation';
import { QueueAnimation } from '@/components/motion/QueueAnimation';
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

describe('AppointmentsPage', () => {
  it('renders booking flow stepper', () => {
    render(<BookingFlowAnimation currentStep={0} totalSteps={7} steps={steps} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders booking flow with progress at step 3', () => {
    render(<BookingFlowAnimation currentStep={2} totalSteps={7} steps={steps} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('renders queue display in waiting state', () => {
    render(
      <QueueAnimation
        queueNumber={42}
        estimatedWait={15}
        positionsAhead={5}
        status="waiting"
        branchName="المختبر الرئيسي"
      />
    );
    expect(screen.getByText(/رقم 42/)).toBeInTheDocument();
    expect(screen.getByText(/15 دقيقة/)).toBeInTheDocument();
    expect(screen.getByText(/5 أشخاص/)).toBeInTheDocument();
  });

  it('renders queue in called state', () => {
    render(
      <QueueAnimation
        queueNumber={7}
        estimatedWait={0}
        positionsAhead={0}
        status="called"
        branchName="Main Lab"
      />
    );
    expect(screen.getByText('رقمك جاهز')).toBeInTheDocument();
    expect(screen.getByText('يرجى التوجه إلى شباك الاستقبال')).toBeInTheDocument();
  });

  it('renders queue in serving state', () => {
    render(
      <QueueAnimation
        queueNumber={15}
        estimatedWait={0}
        positionsAhead={0}
        status="serving"
        branchName="Reception 3"
      />
    );
    expect(screen.getByText('قيد الخدمة')).toBeInTheDocument();
  });

  it('renders queue in completed state', () => {
    render(
      <QueueAnimation
        queueNumber={30}
        estimatedWait={0}
        positionsAhead={0}
        status="completed"
        branchName="Main Lab"
      />
    );
    expect(screen.getByText('تمت الخدمة')).toBeInTheDocument();
    expect(screen.getByText('نشكرك على زيارتك')).toBeInTheDocument();
  });

  it('renders booking flow with RTL direction', () => {
    render(<BookingFlowAnimation currentStep={0} totalSteps={7} steps={steps} dir="rtl" />);
    const container = document.querySelector('[dir="rtl"]');
    expect(container).toBeInTheDocument();
  });

  it('renders all 7 step numbers', () => {
    render(<BookingFlowAnimation currentStep={0} totalSteps={7} steps={steps} />);
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });
});
