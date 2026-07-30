import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookingFlowAnimation } from '@/components/motion/BookingFlowAnimation';
import type { ReactNode } from 'react';

const steps = [
  { label: 'Service', icon: '🔬' as unknown as ReactNode },
  { label: 'Branch', icon: '🏢' as unknown as ReactNode },
  { label: 'Date', icon: '📅' as unknown as ReactNode },
  { label: 'Time', icon: '⏰' as unknown as ReactNode },
  { label: 'Confirm', icon: '✅' as unknown as ReactNode },
];

describe('BookingFlowAnimation', () => {
  it('renders all steps', () => {
    render(<BookingFlowAnimation currentStep={0} totalSteps={5} steps={steps} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders step numbers for incomplete steps', () => {
    render(<BookingFlowAnimation currentStep={0} totalSteps={5} steps={steps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('sets correct dir="rtl" when dir prop is rtl', () => {
    const { container } = render(
      <BookingFlowAnimation currentStep={0} totalSteps={5} steps={steps} dir="rtl" />
    );
    const wrapper = container.querySelector('[dir="rtl"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with dir="ltr" by default', () => {
    const { container } = render(
      <BookingFlowAnimation currentStep={0} totalSteps={5} steps={steps} />
    );
    const wrapper = container.querySelector('[dir="ltr"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders progress based on currentStep', () => {
    render(<BookingFlowAnimation currentStep={2} totalSteps={5} steps={steps} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('renders checkmarks on completed steps', () => {
    const { container } = render(
      <BookingFlowAnimation currentStep={3} totalSteps={5} steps={steps} />
    );
    const checkmarks = container.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('handles single step', () => {
    render(
      <BookingFlowAnimation
        currentStep={0}
        totalSteps={1}
        steps={[{ label: 'Done', icon: '✅' as unknown as ReactNode }]}
      />
    );
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BookingFlowAnimation currentStep={0} totalSteps={5} steps={steps} className="custom-step" />
    );
    const el = container.querySelector('[class*="custom-step"]');
    expect(el).toBeInTheDocument();
  });
});
