import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CelebrationEffect } from '@/components/motion/CelebrationEffect';

describe('CelebrationEffect', () => {
  it('renders confetti particles when show=true', () => {
    const { container } = render(<CelebrationEffect show={true} variant="confetti" />);
    const particles = container.querySelectorAll('[class*="absolute"]');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders checkmark when variant="checkmark"', () => {
    render(<CelebrationEffect show={true} variant="checkmark" />);
    const checkmark = document.querySelector('svg');
    expect(checkmark).toBeInTheDocument();
  });

  it('renders sparkle when variant="sparkle"', () => {
    const { container } = render(<CelebrationEffect show={true} variant="sparkle" />);
    const sparkles = container.querySelectorAll('svg');
    expect(sparkles.length).toBeGreaterThan(0);
  });

  it('renders nothing when show=false', () => {
    const { container } = render(<CelebrationEffect show={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onComplete after auto-dismiss timeout', () => {
    vi.useFakeTimers();
    const handleComplete = vi.fn();
    render(<CelebrationEffect show={true} onComplete={handleComplete} />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(handleComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('switches from confetti to checkmark when variant changes', () => {
    const { rerender, container } = render(<CelebrationEffect show={true} variant="confetti" />);
    expect(container.querySelectorAll('[class*="absolute"]').length).toBeGreaterThan(0);

    rerender(<CelebrationEffect show={true} variant="checkmark" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('auto-dismisses after timeout', () => {
    vi.useFakeTimers();
    const { container } = render(<CelebrationEffect show={true} />);
    expect(container.innerHTML).not.toBe('');

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(container.innerHTML).toBe('');
    vi.useRealTimers();
  });
});
