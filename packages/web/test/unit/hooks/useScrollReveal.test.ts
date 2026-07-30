import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useScrollReveal', () => {
  it('returns ref, isVisible=false, and controls by default', () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
    expect(result.current.isVisible).toBe(false);
    expect(result.current.controls).toBeDefined();
  });

  it('uses default threshold=0.1, once=true, margin="0px"', () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });

  it('accepts custom options', () => {
    const { result } = renderHook(() =>
      useScrollReveal({ threshold: 0.5, once: false, margin: '100px' })
    );
    expect(result.current.isVisible).toBe(false);
  });

  it('starts observing when ref is attached to an element', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const MockObserver = vi.fn(() => ({ observe, disconnect }));
    vi.stubGlobal('IntersectionObserver', MockObserver);

    const { result, rerender } = renderHook(() => useScrollReveal());
    const div = document.createElement('div');
    (result.current.ref as React.MutableRefObject<HTMLDivElement>).current = div;
    rerender();
    expect(MockObserver).toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const disconnect = vi.fn();
    const MockObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect,
    }));
    vi.stubGlobal('IntersectionObserver', MockObserver);

    const { unmount } = renderHook(() => useScrollReveal());
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.ref.current).toBeNull();
  });
});
