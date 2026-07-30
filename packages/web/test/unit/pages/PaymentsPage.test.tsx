import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '@/components/motion/GlassCard';
import { AnimatedChart } from '@/components/motion/AnimatedCharts';
import { EmptyStateAnimation } from '@/components/motion/EmptyStateAnimation';
import { CelebrationEffect } from '@/components/motion/CelebrationEffect';

describe('PaymentsPage', () => {
  it('renders payment methods', () => {
    render(
      <div>
        <GlassCard variant="light">
          <h3>Visa **** 4532</h3>
          <p>Expires: 12/28</p>
          <p>Default Method</p>
        </GlassCard>
        <GlassCard variant="light">
          <h3>Apple Pay</h3>
          <p>Enabled</p>
        </GlassCard>
      </div>
    );
    expect(screen.getByText(/Visa/)).toBeInTheDocument();
    expect(screen.getByText('Apple Pay')).toBeInTheDocument();
  });

  it('renders transaction history', () => {
    render(
      <div>
        <GlassCard variant="light">
          <div>
            <span>AMB-2026-001234</span>
            <span>230 SAR</span>
            <span>Completed</span>
          </div>
        </GlassCard>
        <GlassCard variant="light">
          <div>
            <span>AMB-2026-001235</span>
            <span>450 SAR</span>
            <span>Pending</span>
          </div>
        </GlassCard>
      </div>
    );
    expect(screen.getByText('AMB-2026-001234')).toBeInTheDocument();
    expect(screen.getByText('AMB-2026-001235')).toBeInTheDocument();
  });

  it('renders invoice list', () => {
    render(
      <div>
        <GlassCard variant="light">
          <h4>INV-2026-001234</h4>
          <p>Date: 2026-08-10</p>
          <p>Amount: 230 SAR</p>
        </GlassCard>
      </div>
    );
    expect(screen.getByText('INV-2026-001234')).toBeInTheDocument();
  });

  it('renders revenue chart', () => {
    const { container } = render(
      <AnimatedChart
        type="bar"
        data={[
          { month: 'Jan', revenue: 5000 },
          { month: 'Feb', revenue: 7000 },
        ]}
        xKey="month"
        yKey="revenue"
      />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('renders empty state for no transactions', () => {
    render(
      <EmptyStateAnimation
        title="No Transactions"
        description="Your payment history will appear here"
        variant="default"
      />
    );
    expect(screen.getByText('No Transactions')).toBeInTheDocument();
    expect(screen.getByText('Your payment history will appear here')).toBeInTheDocument();
  });

  it('renders subscription info', () => {
    render(
      <GlassCard variant="light">
        <h3>Premium Plan</h3>
        <p>49 SAR/month</p>
        <p>Next billing: Sep 15, 2026</p>
      </GlassCard>
    );
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('49 SAR/month')).toBeInTheDocument();
  });

  it('renders payment success celebration', () => {
    render(
      <CelebrationEffect show={true} variant="checkmark" onComplete={() => {}} />
    );
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
