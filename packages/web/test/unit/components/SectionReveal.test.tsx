import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionReveal } from '@/components/motion/SectionReveal';

describe('SectionReveal', () => {
  it('renders children', () => {
    render(<SectionReveal>Revealed Content</SectionReveal>);
    expect(screen.getByText('Revealed Content')).toBeInTheDocument();
  });

  it('renders with up direction by default', () => {
    render(<SectionReveal>Content</SectionReveal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with all directions', () => {
    const directions = ['up', 'down', 'left', 'right', 'scale', 'fade'] as const;
    for (const dir of directions) {
      const { unmount } = render(<SectionReveal direction={dir}>{dir}</SectionReveal>);
      expect(screen.getByText(dir)).toBeInTheDocument();
      unmount();
    }
  });

  it('accepts delay prop', () => {
    render(<SectionReveal delay={0.5}>Delayed</SectionReveal>);
    expect(screen.getByText('Delayed')).toBeInTheDocument();
  });

  it('accepts once=false for repeat animations', () => {
    render(<SectionReveal once={false}>Repeat</SectionReveal>);
    expect(screen.getByText('Repeat')).toBeInTheDocument();
  });

  it('renders as div by default', () => {
    const { container } = render(<SectionReveal>Content</SectionReveal>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders as section when as="section"', () => {
    const { container } = render(<SectionReveal as="section">Content</SectionReveal>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SectionReveal className="custom-class">Content</SectionReveal>
    );
    const el = container.querySelector('[class*="custom-class"]');
    expect(el).toBeInTheDocument();
  });
});
