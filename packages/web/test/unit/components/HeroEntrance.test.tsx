import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroEntrance } from '@/components/motion/HeroEntrance';

describe('HeroEntrance', () => {
  const defaultProps = {
    headline: 'Al Mokhtabar Laboratory',
    subheadline: 'Your health, our priority',
    cta: { label: 'Book Now', href: '/booking' },
    secondaryCta: { label: 'Learn More', href: '/about' },
  };

  it('renders headline, subheadline, and CTAs', () => {
    render(<HeroEntrance {...defaultProps} />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
    expect(screen.getByText('Your health, our priority')).toBeInTheDocument();
    expect(screen.getByText('Book Now')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<HeroEntrance {...defaultProps} />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('renders with centered variant', () => {
    render(<HeroEntrance {...defaultProps} variant="centered" />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders with split variant', () => {
    render(<HeroEntrance {...defaultProps} variant="split" />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders with fullscreen variant', () => {
    render(<HeroEntrance {...defaultProps} variant="fullscreen" />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders dir="rtl" when dir prop is rtl', () => {
    const { container } = render(<HeroEntrance {...defaultProps} dir="rtl" />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('dir', 'rtl');
  });

  it('renders dir="ltr" by default', () => {
    const { container } = render(<HeroEntrance {...defaultProps} />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('dir', 'ltr');
  });

  it('renders badge when provided', () => {
    render(<HeroEntrance {...defaultProps} badge="Special Offer" />);
    expect(screen.getByText('Special Offer')).toBeInTheDocument();
  });

  it('renders image when provided', () => {
    render(<HeroEntrance {...defaultProps} image="/hero.jpg" />);
    const img = screen.getByAlt('');
    expect(img).toBeInTheDocument();
  });

  it('renders with left alignment', () => {
    render(<HeroEntrance {...defaultProps} align="left" />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders with right alignment in rtl', () => {
    render(<HeroEntrance {...defaultProps} align="right" dir="rtl" />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders without optional CTAs', () => {
    render(<HeroEntrance headline="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Book Now')).not.toBeInTheDocument();
  });
});
