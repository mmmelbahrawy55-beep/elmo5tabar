import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumCursor } from '@/components/motion/PremiumCursor';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PremiumCursor', () => {
  it('renders nothing on touch devices', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 2, configurable: true });
    const { container } = render(<PremiumCursor />);
    expect(container.innerHTML).toBe('');
  });

  it('renders dot and ring on non-touch devices', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    const { container } = render(<PremiumCursor />);
    const elements = container.querySelectorAll('[class*="pointer-events-none"]');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders with custom className', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    const { container } = render(<PremiumCursor className="custom-cursor" />);
    const el = container.querySelector('[class*="custom-cursor"]');
    expect(el).toBeInTheDocument();
  });

  it('renders blue dot element', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    const { container } = render(<PremiumCursor />);
    const blueDots = container.querySelectorAll('[class*="bg-\\[\\#0077B6\\]"]');
    expect(blueDots.length).toBeGreaterThan(0);
  });

  it('registers mousemove event handler on mount', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    const addEventListener = vi.fn();
    window.addEventListener = addEventListener;
    render(<PremiumCursor />);
    expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
  });
});
