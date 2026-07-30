'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ─── Intersection Observer (lazy load trigger) ─── */
export function useIntersectionObserver(
  options?: IntersectionObserverInit,
): { ref: React.RefObject<HTMLDivElement | null>; isVisible: boolean } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px', threshold: 0, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold]);

  return { ref, isVisible };
}

/* ─── Dynamic Script Loader ─── */
export function useScript(src: string, options?: { async?: boolean; defer?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) { setLoaded(true); return; }

    const script = document.createElement('script');
    script.src = src;
    if (options?.async !== false) script.async = true;
    if (options?.defer) script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [src]);

  return { loaded, error };
}

/* ─── Idle Callback Utility ─── */
export function runWhenIdle(fn: () => void, timeout = 2000) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => fn(), { timeout });
  } else {
    setTimeout(fn, timeout);
  }
}

/* ─── Preconnect / Prefetch / Preload Helper ─── */
export function addResourceHint(href: string, rel: 'preconnect' | 'prefetch' | 'preload' | 'dns-prefetch', as?: string) {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  if (rel === 'preconnect') link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/* ─── Image Preloader ─── */
export function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

/* ─── Deferred rendering (split screen into chunks) ─── */
export function useDeferredRender(threshold = 0) {
  const [ready, setReady] = useState(threshold === 0);
  useEffect(() => {
    if (threshold === 0) return;
    const timer = setTimeout(() => setReady(true), threshold);
    return () => clearTimeout(timer);
  }, [threshold]);

  const onVisible = useCallback(() => setReady(true), []);
  return { ready, onVisible };
}

/* ─── Debounced resize / scroll ─── */
export function useDebounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useCallback((...args: unknown[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]) as unknown as T;
}
