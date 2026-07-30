import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueueAnimation } from '@/components/motion/QueueAnimation';

const baseProps = {
  queueNumber: 42,
  estimatedWait: 15,
  positionsAhead: 5,
  branchName: 'Main Lab - Riyadh',
};

describe('QueueAnimation', () => {
  it('renders waiting status with queue number', () => {
    render(<QueueAnimation {...baseProps} status="waiting" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/رقم 42/)).toBeInTheDocument();
  });

  it('renders estimated wait time in waiting state', () => {
    render(<QueueAnimation {...baseProps} status="waiting" />);
    expect(screen.getByText(/الوقت المقدر: 15 دقيقة/)).toBeInTheDocument();
  });

  it('renders positions ahead in waiting state', () => {
    render(<QueueAnimation {...baseProps} status="waiting" />);
    expect(screen.getByText(/5 أشخاص أمامك/)).toBeInTheDocument();
  });

  it('renders called status', () => {
    render(<QueueAnimation {...baseProps} status="called" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('رقمك جاهز')).toBeInTheDocument();
    expect(screen.getByText('يرجى التوجه إلى شباك الاستقبال')).toBeInTheDocument();
  });

  it('renders serving status', () => {
    render(<QueueAnimation {...baseProps} status="serving" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('قيد الخدمة')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<QueueAnimation {...baseProps} status="completed" />);
    expect(screen.getByText('تمت الخدمة')).toBeInTheDocument();
    expect(screen.getByText('نشكرك على زيارتك')).toBeInTheDocument();
  });

  it('sets dir="rtl" when dir prop is rtl', () => {
    const { container } = render(<QueueAnimation {...baseProps} status="waiting" dir="rtl" />);
    const wrapper = container.querySelector('[dir="rtl"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders progress ring in waiting state', () => {
    const { container } = render(<QueueAnimation {...baseProps} status="waiting" />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders pulse animation dots in waiting state', () => {
    const { container } = render(<QueueAnimation {...baseProps} status="waiting" />);
    const dots = container.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('handles zero wait time', () => {
    render(<QueueAnimation {...baseProps} estimatedWait={0} status="waiting" />);
    expect(screen.getByText(/الوقت المقدر: 0 دقيقة/)).toBeInTheDocument();
  });

  it('handles maximum wait time', () => {
    render(<QueueAnimation {...baseProps} estimatedWait={60} status="waiting" />);
    expect(screen.getByText(/الوقت المقدر: 60 دقيقة/)).toBeInTheDocument();
  });
});
