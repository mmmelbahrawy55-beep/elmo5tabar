import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useParallax } from '@/hooks/animations/useParallax';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useParallax', () => {
  it('returns ref, x, and y MotionValues', () => {
    const { result } = renderHook(() => useParallax());
    expect(result.current.ref).toBeDefined();
    expect(result.current.x).toBeDefined();
    expect(result.current.y).toBeDefined();
  });

  it('accepts scroll type with speed option', () => {
    const { result } = renderHook(() => useParallax({ type: 'scroll', speed: 0.8 }));
    expect(result.current.ref).toBeDefined();
  });

  it('accepts up direction', () => {
    const { result } = renderHook(() => useParallax({ direction: 'up' }));
    expect(result.current.ref).toBeDefined();
  });

  it('accepts down direction', () => {
    const { result } = renderHook(() => useParallax({ direction: 'down' }));
    expect(result.current.ref).toBeDefined();
  });

  it('handles mouse type without errors', () => {
    const { result } = renderHook(() => useParallax({ type: 'mouse' }));
    expect(result.current.ref).toBeDefined();
  });

  it('returns readonly x and y values', () => {
    const { result } = renderHook(() => useParallax());
    expect(typeof result.current.x.get).toBe('function');
    expect(typeof result.current.y.get).toBe('function');
  });

  it('works with zero speed', () => {
    const { result } = renderHook(() => useParallax({ speed: 0 }));
    expect(result.current.ref).toBeDefined();
  });
});
