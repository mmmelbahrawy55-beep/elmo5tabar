import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnimatedNumber } from '@/hooks/animations/useAnimatedNumber';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAnimatedNumber', () => {
  it('returns value string and isAnimating boolean', () => {
    const { result } = renderHook(() => useAnimatedNumber(100));
    expect(typeof result.current.value).toBe('string');
    expect(typeof result.current.isAnimating).toBe('boolean');
  });

  it('starts animating when target changes', () => {
    const { result, rerender } = renderHook(
      (props: number) => useAnimatedNumber(props),
      { initialProps: 0 }
    );
    expect(result.current.isAnimating).toBe(false);
    rerender(100);
    expect(result.current.isAnimating).toBe(true);
  });

  it('formats number with commas by default', () => {
    const { result } = renderHook(() => useAnimatedNumber(1000));
    expect(result.current.value).toBeDefined();
  });

  it('respects decimals option', () => {
    const { result } = renderHook(() => useAnimatedNumber(100, { decimals: 2 }));
    expect(result.current.value).toBeDefined();
  });

  it('disables formatting when format=false', () => {
    const { result } = renderHook(() => useAnimatedNumber(1000, { format: false }));
    expect(result.current.value).toBeDefined();
  });

  it('handles zero target', () => {
    const { result } = renderHook(() => useAnimatedNumber(0));
    expect(typeof result.current.value).toBe('string');
  });

  it('handles negative numbers', () => {
    const { result } = renderHook(() => useAnimatedNumber(-50));
    expect(typeof result.current.value).toBe('string');
  });

  it('handles large numbers', () => {
    const { result } = renderHook(() => useAnimatedNumber(9999999));
    expect(typeof result.current.value).toBe('string');
  });
});
