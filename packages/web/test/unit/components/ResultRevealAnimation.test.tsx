import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultRevealAnimation } from '@/components/motion/ResultRevealAnimation';

describe('ResultRevealAnimation', () => {
  it('renders children', () => {
    render(
      <ResultRevealAnimation isRevealed={true}>
        <span>Result Content</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Result Content')).toBeInTheDocument();
  });

  it('applies blur filter when not revealed', () => {
    const { container } = render(
      <ResultRevealAnimation isRevealed={false}>
        <span>Hidden</span>
      </ResultRevealAnimation>
    );
    const wrapper = container.querySelector('[class*="relative"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('removes blur when revealed', () => {
    const { container } = render(
      <ResultRevealAnimation isRevealed={true}>
        <span>Visible</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('applies glow effect when revealed with normal status', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="normal">
        <span>Normal</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('applies glow effect with abnormal status', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="abnormal">
        <span>Abnormal</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Abnormal')).toBeInTheDocument();
  });

  it('applies glow effect with critical status', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="critical">
        <span>Critical</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('applies custom delay', () => {
    render(
      <ResultRevealAnimation isRevealed={true} delay={0.5}>
        <span>Delayed</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Delayed')).toBeInTheDocument();
  });

  it('renders children when not revealed but still visible', () => {
    render(
      <ResultRevealAnimation isRevealed={false}>
        <span>Hidden Content</span>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Hidden Content')).toBeInTheDocument();
  });

  it('renders gradient overlay when revealed', () => {
    const { container } = render(
      <ResultRevealAnimation isRevealed={true}>
        <span>Content</span>
      </ResultRevealAnimation>
    );
    const overlay = container.querySelector('[class*="pointer-events-none"]');
    expect(overlay).toBeInTheDocument();
  });
});
