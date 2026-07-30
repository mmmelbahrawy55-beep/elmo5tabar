'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── useIsVisible (intersection observer) ─── */
export function useIsVisible<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
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
  }, []);

  return { ref, isVisible };
}

/* ─── useIsMobile (viewport check) ─── */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/* ─── useOnlineStatus ─── */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}

/* ─── useNetworkQuality ─── */
export type NetworkQuality = 'slow' | 'medium' | 'fast' | 'offline';

export function useNetworkQuality() {
  const [quality, setQuality] = useState<NetworkQuality>('fast');

  useEffect(() => {
    if (!('connection' in navigator)) return;
    const conn = (navigator as any).connection;
    const update = () => {
      if (!navigator.onLine) { setQuality('offline'); return; }
      const downlink = conn.downlink;
      if (downlink < 0.5) setQuality('slow');
      else if (downlink < 2) setQuality('medium');
      else setQuality('fast');
    };
    update();
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return quality;
}

/* ─── useNetworkQuality tells which assets to load ─── */
export function useAdaptiveQuality() {
  const network = useNetworkQuality();
  const isMobile = useIsMobile();

  return {
    quality: network,
    shouldReduceMotion: network === 'slow' || isMobile,
    shouldReduceImages: network === 'slow',
    shouldDeferScripts: network === 'slow',
    shouldDisableAnimations: network === 'slow',
  };
}

/* ─── usePerformanceObserver ─── */
export function usePerformanceObserver(entryTypes: string[], cb: (entries: PerformanceEntry[]) => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    const observer = new PerformanceObserver((list) => cb(list.getEntries()));
    observer.observe({ entryTypes } as any);
    return () => observer.disconnect();
  }, [entryTypes.join(',')]);
}

/* ─── useIdleCallback ─── */
export function useIdleCallback(fn: () => void, deps: unknown[] = []) {
  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(() => fn(), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(fn, 2000);
    return () => clearTimeout(timer);
  }, deps);
}
