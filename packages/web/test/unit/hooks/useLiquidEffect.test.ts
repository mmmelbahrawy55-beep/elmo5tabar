import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLiquidEffect } from '@/hooks/animations/useLiquidEffect';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useLiquidEffect', () => {
  it('returns x, y, scale, rotation spring values and ref', () => {
    const { result } = renderHook(() => useLiquidEffect());
    expect(result.current.x).toBeDefined();
    expect(result.current.y).toBeDefined();
    expect(result.current.scale).toBeDefined();
    expect(result.current.rotation).toBeDefined();
    expect(result.current.ref).toBeDefined();
  });

  it('accepts custom intensity, smoothness, and radius', () => {
    const { result } = renderHook(() =>
      useLiquidEffect({ intensity: 30, smoothness: 0.3, radius: 100 })
    );
    expect(result.current.ref).toBeDefined();
  });

  it('uses default options when none provided', () => {
    const { result } = renderHook(() => useLiquidEffect());
    expect(result.current.x.get()).toBe(0);
    expect(result.current.y.get()).toBe(0);
    expect(result.current.scale.get()).toBe(1);
    expect(result.current.rotation.get()).toBe(0);
  });

  it('attaches event listeners when ref element exists', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const el = { addEventListener, removeEventListener };

    const { result, rerender, unmount } = renderHook(() => useLiquidEffect());
    Object.defineProperty(result.current.ref, 'current', { value: el, writable: true });
    rerender();

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => useLiquidEffect());
    expect(result.current.ref.current).toBeNull();
  });

  it('handles edge case with zero intensity', () => {
    const { result } = renderHook(() => useLiquidEffect({ intensity: 0 }));
    expect(result.current.ref).toBeDefined();
  });
});
