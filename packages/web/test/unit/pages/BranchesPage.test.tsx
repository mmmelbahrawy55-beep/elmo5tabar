import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '@/components/motion/GlassCard';
import { ParallaxSection } from '@/components/motion/ParallaxSection';

describe('BranchesPage', () => {
  it('renders branch list with GlassCard', () => {
    render(
      <div>
        <GlassCard variant="light">
          <h3>Main Lab - Riyadh</h3>
          <p>123 King Fahd Road</p>
          <p>⭐ 4.5 (2,340 reviews)</p>
        </GlassCard>
        <GlassCard variant="light">
          <h3>Jeddah Branch</h3>
          <p>456 Corniche Road</p>
          <p>⭐ 4.3 (1,850 reviews)</p>
        </GlassCard>
      </div>
    );
    expect(screen.getByText('Main Lab - Riyadh')).toBeInTheDocument();
    expect(screen.getByText('Jeddah Branch')).toBeInTheDocument();
  });

  it('renders branch details with address', () => {
    render(
      <GlassCard variant="light">
        <h3>Main Lab</h3>
        <p>123 King Fahd Road, Riyadh</p>
        <p>Open: 8:00 AM - 10:00 PM</p>
      </GlassCard>
    );
    expect(screen.getByText('Main Lab')).toBeInTheDocument();
    expect(screen.getByText('123 King Fahd Road, Riyadh')).toBeInTheDocument();
  });

  it('renders ParallaxSection for branch map', () => {
    render(
      <ParallaxSection>
        <div data-testid="branch-map">Map Placeholder</div>
      </ParallaxSection>
    );
    expect(screen.getByTestId('branch-map')).toBeInTheDocument();
  });

  it('renders all branch variants', () => {
    const { rerender } = render(<GlassCard variant="light">Main Branch</GlassCard>);
    expect(screen.getByText('Main Branch')).toBeInTheDocument();

    rerender(<GlassCard variant="dark">Dark Branch Card</GlassCard>);
    expect(screen.getByText('Dark Branch Card')).toBeInTheDocument();
  });

  it('renders branch with queue status', () => {
    render(
      <GlassCard variant="light">
        <h3>Al-Olaya Branch</h3>
        <p>Wait time: 10-15 min</p>
        <p>Available slots: 12</p>
      </GlassCard>
    );
    expect(screen.getByText('Al-Olaya Branch')).toBeInTheDocument();
    expect(screen.getByText('Available slots: 12')).toBeInTheDocument();
  });
});
