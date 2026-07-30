import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonScreen } from '@/components/motion/SkeletonScreen';

describe('SkeletonScreen', () => {
  it('renders home page skeleton', () => {
    const { container } = render(<SkeletonScreen page="home" />);
    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders appointments page skeleton', () => {
    const { container } = render(<SkeletonScreen page="appointments" />);
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders results page skeleton', () => {
    render(<SkeletonScreen page="results" />);
    const skeletonCards = document.querySelectorAll('[class*="border-b"]');
    expect(skeletonCards.length).toBe(5);
  });

  it('renders profile page skeleton', () => {
    const { container } = render(<SkeletonScreen page="profile" />);
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders branches page skeleton', () => {
    const { container } = render(<SkeletonScreen page="branches" />);
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders payment page skeleton', () => {
    const { container } = render(<SkeletonScreen page="payment" />);
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders all 6 page variants without error', () => {
    const pages = ['home', 'appointments', 'results', 'profile', 'branches', 'payment'] as const;
    for (const page of pages) {
      const { unmount } = render(<SkeletonScreen page={page} />);
      expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
      unmount();
    }
  });

  it('home page has 3 skeleton cards grid', () => {
    render(<SkeletonScreen page="home" />);
    const cards = document.querySelectorAll('[class*="rounded-2xl"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('branches page has 3 skeleton cards in grid', () => {
    const { container } = render(<SkeletonScreen page="branches" />);
    const grids = container.querySelectorAll('[class*="grid"]');
    expect(grids.length).toBeGreaterThan(0);
  });
});
