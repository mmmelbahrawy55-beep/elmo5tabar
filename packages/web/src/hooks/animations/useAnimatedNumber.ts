'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, useTransform, type SpringOptions } from 'framer-motion';

interface AnimatedNumberOptions {
  duration?: number;
  decimals?: number;
  format?: boolean;
  easing?: SpringOptions;
}

export function useAnimatedNumber(
  target: number,
  options: AnimatedNumberOptions = {}
): { value: string; isAnimating: boolean } {
  const { duration = 2, decimals = 0, format: shouldFormat = true } = options;
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTarget = useRef(0);

  const spring = useSpring(0, {
    stiffness: 60,
    damping: 20,
    mass: 1,
    duration,
  });

  const displayValue = useTransform(spring, (val: number) => {
    const fixed = val.toFixed(decimals);
    if (shouldFormat) {
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return fixed;
  });

  useEffect(() => {
    setIsAnimating(true);
    spring.set(target);
    const timeout = setTimeout(() => setIsAnimating(false), duration * 1000 + 100);
    prevTarget.current = target;
    return () => clearTimeout(timeout);
  }, [target, spring, duration]);

  const [value, setValue] = useState('0');

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v: string) => setValue(v));
    return unsubscribe;
  }, [displayValue]);

  return { value, isAnimating };
}
