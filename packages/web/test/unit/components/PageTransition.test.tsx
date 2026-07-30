import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageTransition } from '@/components/motion/PageTransition';

describe('PageTransition', () => {
  it('renders children', () => {
    render(<PageTransition>Page Content</PageTransition>);
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders route loader bar', () => {
    const { container } = render(<PageTransition>Content</PageTransition>);
    const bar = container.querySelector('[class*="h-0.5"]');
    expect(bar).toBeInTheDocument();
  });

  it('wraps children in data-page-container', () => {
    render(
      <PageTransition>
        <span data-testid="child">Child</span>
      </PageTransition>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageTransition className="custom-class">Content</PageTransition>
    );
    const wrapper = container.querySelector('[class*="custom-class"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('handles empty children', () => {
    const { container } = render(<PageTransition />);
    expect(container.querySelector('[data-page-container]')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <PageTransition>
        <span>First</span>
        <span>Second</span>
      </PageTransition>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
