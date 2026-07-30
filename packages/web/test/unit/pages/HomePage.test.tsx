import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroEntrance } from '@/components/motion/HeroEntrance';
import { ParallaxSection } from '@/components/motion/ParallaxSection';
import { AnimatedNumbers } from '@/components/motion/AnimatedNumbers';

describe('HomePage', () => {
  it('renders HeroEntrance with headline', () => {
    render(
      <HeroEntrance
        headline="Al Mokhtabar Laboratory"
        subheadline="Your health, our priority"
        cta={{ label: 'Book Appointment', href: '/booking' }}
      />
    );
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
    expect(screen.getByText('Your health, our priority')).toBeInTheDocument();
    expect(screen.getByText('Book Appointment')).toBeInTheDocument();
  });

  it('renders ParallaxSection with content', () => {
    render(
      <ParallaxSection>
        <h2>About Our Lab</h2>
        <p>State-of-the-art diagnostics</p>
      </ParallaxSection>
    );
    expect(screen.getByText('About Our Lab')).toBeInTheDocument();
    expect(screen.getByText('State-of-the-art diagnostics')).toBeInTheDocument();
  });

  it('renders statistics with AnimatedNumbers', () => {
    render(
      <div>
        <AnimatedNumbers value={500000} title="Tests Completed" suffix="+" />
        <AnimatedNumbers value={150000} title="Happy Patients" suffix="+" />
        <AnimatedNumbers value={25} title="Years Experience" suffix="+" />
      </div>
    );
    expect(screen.getByText('Tests Completed')).toBeInTheDocument();
    expect(screen.getByText('Happy Patients')).toBeInTheDocument();
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
  });

  it('renders HeroEntrance with badge', () => {
    render(
      <HeroEntrance
        headline="Welcome"
        badge="Trusted Since 1995"
      />
    );
    expect(screen.getByText('Trusted Since 1995')).toBeInTheDocument();
  });

  it('renders HeroEntrance in fullscreen variant', () => {
    render(
      <HeroEntrance
        headline="Fullscreen Hero"
        variant="fullscreen"
      />
    );
    expect(screen.getByText('Fullscreen Hero')).toBeInTheDocument();
  });

  it('renders AnimatedNumbers with icons', () => {
    render(
      <AnimatedNumbers
        value={100}
        title="Awards"
        icon={<span data-testid="award-icon">🏆</span>}
        variant="card"
      />
    );
    expect(screen.getByTestId('award-icon')).toBeInTheDocument();
    expect(screen.getByText('Awards')).toBeInTheDocument();
  });

  it('renders AnimatedNumbers with prefix and suffix', () => {
    render(<AnimatedNumbers value={99} prefix="%" suffix=" Satisfaction" />);
    expect(screen.getByText(/%99 Satisfaction/)).toBeInTheDocument();
  });
});
