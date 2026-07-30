'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  useMotionValue,
  useSpring,
  type MotionValue,
} from 'framer-motion';

export function useMagneticEffect(strength = 0.3): {
  ref: React.RefObject<HTMLDivElement>;
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null!);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 150, damping: 15, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 150, damping: 15, mass: 0.5 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      rawX.set(distX * strength);
      rawY.set(distY * strength);
    },
    [strength, rawX, rawY]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, x, y };
}
