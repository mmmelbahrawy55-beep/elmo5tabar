'use client';

import { useRef, useState, useEffect } from 'react';
import { useAnimation, type AnimationControls } from 'framer-motion';

interface ScrollRevealOptions {
  threshold?: number;
  once?: boolean;
  margin?: string;
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.1, once = true, margin = '0px' } = options;
  const ref = useRef<HTMLDivElement>(null!);
  const [isVisible, setIsVisible] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          controls.start('visible');
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
          controls.start('hidden');
        }
      },
      { threshold, rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, margin, controls]);

  return { ref, isVisible, controls };
}
