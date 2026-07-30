import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedNumbers } from '@/components/motion/AnimatedNumbers';

describe('AnimatedNumbers', () => {
  it('renders formatted number value', () => {
    render(<AnimatedNumbers value={5000} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('renders with prefix', () => {
    render(<AnimatedNumbers value={100} prefix="+" />);
    expect(screen.getByText(/\+100/)).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<AnimatedNumbers value={99} suffix="%" />);
    expect(screen.getByText(/99%/)).toBeInTheDocument();
  });

  it('renders with both prefix and suffix', () => {
    render(<AnimatedNumbers value={250} prefix="$" suffix="K" />);
    expect(screen.getByText(/\$250K/)).toBeInTheDocument();
  });

  it('renders StatsCard variant with title and subtitle', () => {
    render(
      <AnimatedNumbers
        value={15000}
        variant="card"
        title="Total Patients"
        subtitle="Since 2020"
      />
    );
    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('Since 2020')).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<AnimatedNumbers value={42} variant="inline" />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders with icon in card variant', () => {
    render(
      <AnimatedNumbers
        value={100}
        variant="card"
        icon={<span data-testid="test-icon">🔬</span>}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('respects decimals option', () => {
    render(<AnimatedNumbers value={99.99} decimals={2} />);
    expect(screen.getByText(/99.99/)).toBeInTheDocument();
  });

  it('disables formatting when format=false', () => {
    render(<AnimatedNumbers value={5000} format={false} />);
    expect(screen.getByText('5000')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<AnimatedNumbers value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
