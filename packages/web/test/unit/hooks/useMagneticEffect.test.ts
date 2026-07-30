import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMagneticEffect } from '@/hooks/animations/useMagneticEffect';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMagneticEffect', () => {
  it('returns ref, x, and y spring values', () => {
    const { result } = renderHook(() => useMagneticEffect(0.3));
    expect(result.current.ref).toBeDefined();
    expect(result.current.x).toBeDefined();
    expect(result.current.y).toBeDefined();
  });

  it('uses default strength of 0.3 when not provided', () => {
    const { result } = renderHook(() => useMagneticEffect());
    expect(result.current.x).toBeDefined();
  });

  it('accepts custom strength value', () => {
    const { result } = renderHook(() => useMagneticEffect(0.8));
    expect(result.current.x).toBeDefined();
  });

  it('handles zero strength', () => {
    const { result } = renderHook(() => useMagneticEffect(0));
    expect(result.current.x).toBeDefined();
  });

  it('attaches event listeners when ref is set', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const el = { addEventListener, removeEventListener };

    const { result, rerender, unmount } = renderHook(() => useMagneticEffect());
    Object.defineProperty(result.current.ref, 'current', { value: el, writable: true });
    rerender();

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => useMagneticEffect(0.3));
    expect(result.current.ref.current).toBeNull();
  });
});
