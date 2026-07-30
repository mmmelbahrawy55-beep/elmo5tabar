import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '@/components/motion/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Card Content</GlassCard>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with default variant (light)', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.querySelector('[class*="rounded-2xl"]');
    expect(card).toBeInTheDocument();
  });

  it('renders as div by default', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.querySelector('div[class*="rounded-2xl"]');
    expect(card).toBeInTheDocument();
  });

  it('renders as button when as="button"', () => {
    const { container } = render(<GlassCard as="button">Click</GlassCard>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('renders as link when as="a" with href', () => {
    const { container } = render(<GlassCard as="a" href="/test">Link</GlassCard>);
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders with dark variant', () => {
    render(<GlassCard variant="dark">Dark Card</GlassCard>);
    expect(screen.getByText('Dark Card')).toBeInTheDocument();
  });

  it('renders with brand variant', () => {
    render(<GlassCard variant="brand">Brand Card</GlassCard>);
    expect(screen.getByText('Brand Card')).toBeInTheDocument();
  });

  it('renders with accent variant', () => {
    render(<GlassCard variant="accent">Accent Card</GlassCard>);
    expect(screen.getByText('Accent Card')).toBeInTheDocument();
  });

  it('renders with all intensities', () => {
    const { rerender } = render(<GlassCard intensity="subtle">Subtle</GlassCard>);
    expect(screen.getByText('Subtle')).toBeInTheDocument();

    rerender(<GlassCard intensity="strong">Strong</GlassCard>);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('renders with all hover effects', () => {
    const { rerender } = render(<GlassCard hoverEffect="lift">Lift</GlassCard>);
    expect(screen.getByText('Lift')).toBeInTheDocument();

    rerender(<GlassCard hoverEffect="glow">Glow</GlassCard>);
    expect(screen.getByText('Glow')).toBeInTheDocument();

    rerender(<GlassCard hoverEffect="tilt">Tilt</GlassCard>);
    expect(screen.getByText('Tilt')).toBeInTheDocument();

    rerender(<GlassCard hoverEffect="none">None</GlassCard>);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<GlassCard className="custom-class">Content</GlassCard>);
    const card = container.querySelector('[class*="custom-class"]');
    expect(card).toBeInTheDocument();
  });
});
