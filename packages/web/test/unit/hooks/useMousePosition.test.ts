import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMousePosition } from '@/hooks/animations/useMousePosition';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMousePosition', () => {
  it('returns x, y, normalizedX, normalizedY MotionValues', () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current.x).toBeDefined();
    expect(result.current.y).toBeDefined();
    expect(result.current.normalizedX).toBeDefined();
    expect(result.current.normalizedY).toBeDefined();
  });

  it('sets initial values to 0', () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current.x.get()).toBe(0);
    expect(result.current.y.get()).toBe(0);
  });

  it('registers mousemove listener on mount', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.addEventListener = addEventListener;
    window.removeEventListener = removeEventListener;

    const { unmount } = renderHook(() => useMousePosition());
    expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('registers touchmove listener for mobile support', () => {
    const addEventListener = vi.fn();
    window.addEventListener = addEventListener;

    renderHook(() => useMousePosition());
    expect(addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
  });

  it('returns spring values for smooth tracking', () => {
    const { result } = renderHook(() => useMousePosition());
    expect(typeof result.current.x.get).toBe('function');
    expect(typeof result.current.y.get).toBe('function');
  });
});
