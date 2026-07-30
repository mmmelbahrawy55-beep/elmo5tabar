'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type WebVitalMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  attribution?: Record<string, unknown>;
};

const vitalsEndpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT || '/api/vitals';

const thresholds: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const t = thresholds[name];
  if (!t) return 'needs-improvement';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: Metric, attribution?: Record<string, unknown>) {
  const body: WebVitalMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    attribution,
  };

  // Send to backend analytics endpoint (beacon for reliability)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsEndpoint, JSON.stringify(body));
  } else {
    fetch(vitalsEndpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }

  // Console reporting in dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${body.rating})`);
  }

  // Custom event for RUM dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('web-vital', { detail: body }),
    );
  }
}

export function useWebVitals() {
  useEffect(() => {
    onCLS((m) => sendToAnalytics(m, m.attribution));
    onFCP((m) => sendToAnalytics(m));
    onFID((m) => sendToAnalytics(m, m.attribution));
    onINP((m) => sendToAnalytics(m, m.attribution));
    onLCP((m) => sendToAnalytics(m, m.attribution));
    onTTFB((m) => sendToAnalytics(m));
  }, []);
}

export function reportWebVitals(metric: Metric) {
  sendToAnalytics(metric);
}

/* ─── Custom Performance Marks ─── */
export const perfMarks = {
  start: (name: string) => performance.mark(`${name}:start`),
  end: (name: string) => {
    performance.mark(`${name}:end`);
    performance.measure(name, `${name}:start`, `${name}:end`);
    const entries = performance.getEntriesByName(name);
    const duration = entries[entries.length - 1]?.duration || 0;
    if (duration > 100) {
      console.warn(`[Perf] ${name} took ${duration.toFixed(0)}ms`);
    }
    return duration;
  },
  measure: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    perfMarks.start(name);
    const result = await fn();
    perfMarks.end(name);
    return result;
  },
};

/* ─── Navigation Timing ─── */
export function getNavigationTiming() {
  if (typeof window === 'undefined' || !performance) return null;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!nav) return null;
  return {
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    tcpConnect: nav.connectEnd - nav.connectStart,
    tlsHandshake: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
    requestTime: nav.responseStart - nav.requestStart,
    responseTime: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.domContentLoadedEventStart,
    domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
    domComplete: nav.domComplete - nav.domInteractive,
    ttfb: nav.responseStart - nav.startTime,
    loadTime: nav.loadEventEnd - nav.startTime,
  };
}

/* ─── Resource Timing Summary ─── */
export function getResourceTiming() {
  if (typeof window === 'undefined') return null;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const byType: Record<string, { count: number; totalSize: number; totalTime: number }> = {};
  resources.forEach((r) => {
    const type = r.initiatorType || 'other';
    if (!byType[type]) byType[type] = { count: 0, totalSize: 0, totalTime: 0 };
    byType[type].count++;
    byType[type].totalSize += r.transferSize || r.encodedBodySize || 0;
    byType[type].totalTime += r.duration;
  });
  return {
    total: resources.length,
    totalSize: resources.reduce((s, r) => s + (r.transferSize || 0), 0),
    totalTime: resources.reduce((s, r) => s + r.duration, 0),
    byType,
  };
}
