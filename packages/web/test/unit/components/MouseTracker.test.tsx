import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MouseTracker } from '@/components/motion/MouseTracker';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MouseTracker', () => {
  it('renders nothing on mobile (window width < 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
    const { container } = render(<MouseTracker />);
    expect(container.innerHTML).toBe('');
  });

  it('renders radial gradient on desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    const { container } = render(<MouseTracker />);
    const gradient = container.querySelector('[class*="pointer-events-none"]');
    expect(gradient).toBeInTheDocument();
  });

  it('accepts custom color', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    const { container } = render(<MouseTracker color="#FF0000" />);
    const gradient = container.querySelector('[class*="pointer-events-none"]');
    expect(gradient).toBeInTheDocument();
  });

  it('accepts custom size', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    const { container } = render(<MouseTracker size={800} />);
    expect(container.querySelector('[class*="pointer-events-none"]')).toBeInTheDocument();
  });

  it('accepts custom opacity', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    const { container } = render(<MouseTracker opacity={0.1} />);
    expect(container.querySelector('[class*="pointer-events-none"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    const { container } = render(<MouseTracker className="tracker-class" />);
    const el = container.querySelector('[class*="tracker-class"]');
    expect(el).toBeInTheDocument();
  });

  it('registers resize listener to detect mobile changes', () => {
    const addEventListener = vi.fn();
    window.addEventListener = addEventListener;
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

    render(<MouseTracker />);
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
