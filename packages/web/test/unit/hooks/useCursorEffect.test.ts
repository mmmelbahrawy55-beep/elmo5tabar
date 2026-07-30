import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCursorEffect } from '@/hooks/animations/useCursorEffect';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCursorEffect', () => {
  it('returns cursor state and spring values', () => {
    const { result } = renderHook(() => useCursorEffect());
    expect(result.current.x).toBeDefined();
    expect(result.current.y).toBeDefined();
    expect(result.current.isPointer).toBe(false);
    expect(result.current.isHovering).toBe(false);
    expect(result.current.variants).toBe('default');
    expect(typeof result.current.setVariants).toBe('function');
  });

  it('registers mousemove listener on mount', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.addEventListener = addEventListener;
    window.removeEventListener = removeEventListener;
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();

    const { unmount } = renderHook(() => useCursorEffect());
    expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('does not register listeners on touch devices', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 2, configurable: true });
    const addEventListener = vi.fn();
    window.addEventListener = addEventListener;

    renderHook(() => useCursorEffect());
    expect(addEventListener).not.toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
  });

  it('setVariants accepts variant strings', () => {
    const { result } = renderHook(() => useCursorEffect());
    result.current.setVariants('pointer');
    result.current.setVariants('text');
    result.current.setVariants('hidden');
    result.current.setVariants('magnetic');
    expect(result.current.variants).toBe('default');
  });

  it('returns spring-smoothed x and y values', () => {
    const { result } = renderHook(() => useCursorEffect());
    expect(typeof result.current.x.get).toBe('function');
    expect(typeof result.current.y.get).toBe('function');
  });
});
