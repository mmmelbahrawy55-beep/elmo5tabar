import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ParallaxSection } from '@/components/motion/ParallaxSection';

describe('ParallaxSection', () => {
  it('renders children', () => {
    render(<ParallaxSection>Section Content</ParallaxSection>);
    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  it('renders as section by default', () => {
    const { container } = render(<ParallaxSection>Content</ParallaxSection>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('renders as div when as="div"', () => {
    const { container } = render(<ParallaxSection as="div">Content</ParallaxSection>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('accepts speed prop', () => {
    render(<ParallaxSection speed={0.8}>Fast Parallax</ParallaxSection>);
    expect(screen.getByText('Fast Parallax')).toBeInTheDocument();
  });

  it('accepts direction prop', () => {
    render(<ParallaxSection direction="down">Down</ParallaxSection>);
    expect(screen.getByText('Down')).toBeInTheDocument();
  });

  it('applies will-change-transform class', () => {
    const { container } = render(<ParallaxSection>Content</ParallaxSection>);
    const el = container.querySelector('[class*="will-change-transform"]');
    expect(el).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ParallaxSection className="my-section">Content</ParallaxSection>
    );
    const el = container.querySelector('[class*="my-section"]');
    expect(el).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    render(
      <ParallaxSection>
        <span>Child 1</span>
        <span>Child 2</span>
      </ParallaxSection>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
