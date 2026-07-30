import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function registerGSAPPlugins(): void {
  gsap.registerPlugin(ScrollTrigger);
}

export const EASING = {
  brand: 'cubic-bezier(0.16, 1, 0.3, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'power2.out',
  smoothIn: 'power2.in',
  smoothInOut: 'power2.inOut',
  elastic: 'elastic.out(1, 0.5)',
  slow: 'power4.out',
} as const;

export type EasingKey = keyof typeof EASING;
