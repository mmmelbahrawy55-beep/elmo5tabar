import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCard } from '@/components/motion/SkeletonCard';

describe('SkeletonCard', () => {
  it('renders card variant by default', () => {
    const { container } = render(<SkeletonCard />);
    const skeleton = container.querySelector('[class*="rounded-xl"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders all variants', () => {
    const variants = ['card', 'list', 'profile', 'chart', 'appointment', 'result'] as const;
    for (const variant of variants) {
      const { unmount } = render(<SkeletonCard variant={variant} />);
      const skeleton = document.querySelector('[class*="rounded-xl"], [class*="border-b"]');
      expect(skeleton).toBeInTheDocument();
      unmount();
    }
  });

  it('renders with custom number of lines', () => {
    const { container } = render(<SkeletonCard lines={5} />);
    const lines = container.querySelectorAll('[class*="h-3"]');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders without animation when animated=false', () => {
    const { container } = render(<SkeletonCard animated={false} />);
    expect(container.querySelector('[class*="animate-shimmer"]')).not.toBeInTheDocument();
  });

  it('renders shimmer animation by default', () => {
    const { container } = render(<SkeletonCard />);
    const shimmer = container.querySelector('[class*="animate-shimmer"]');
    expect(shimmer).toBeInTheDocument();
  });

  it('renders card variant with aspect-video placeholder', () => {
    const { container } = render(<SkeletonCard variant="card" />);
    const placeholder = container.querySelector('[class*="aspect-video"]');
    expect(placeholder).toBeInTheDocument();
  });

  it('renders chart variant with bar placeholders', () => {
    const { container } = render(<SkeletonCard variant="chart" />);
    const bars = container.querySelectorAll('[class*="flex-1"]');
    expect(bars.length).toBe(12);
  });

  it('renders appointment variant', () => {
    const { container } = render(<SkeletonCard variant="appointment" />);
    expect(container.querySelector('[class*="flex"]')).toBeInTheDocument();
  });

  it('renders result variant', () => {
    const { container } = render(<SkeletonCard variant="result" />);
    expect(container.querySelector('[class*="border-b"]')).toBeInTheDocument();
  });
});
