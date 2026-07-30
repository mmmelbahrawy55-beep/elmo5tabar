'use client';

import { useEffect } from 'react';
import {
  useMotionValue,
  useSpring,
  type MotionValue,
} from 'framer-motion';

export function useMousePosition(): {
  x: MotionValue<number>;
  y: MotionValue<number>;
  normalizedX: MotionValue<number>;
  normalizedY: MotionValue<number>;
} {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 100, damping: 30 });
  const y = useSpring(rawY, { stiffness: 100, damping: 30 });
  const normalizedX = useMotionValue(0);
  const normalizedY = useMotionValue(0);

  useEffect(() => {
    let rafId: number | null = null;
    let lastCall = 0;

    const handleMouse = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCall < 16) return;
      lastCall = now;

      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rawX.set(e.clientX);
        rawY.set(e.clientY);
        normalizedX.set((e.clientX / window.innerWidth) * 2 - 1);
        normalizedY.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    };

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      rawX.set(touch.clientX);
      rawY.set(touch.clientY);
      normalizedX.set((touch.clientX / window.innerWidth) * 2 - 1);
      normalizedY.set((touch.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [rawX, rawY, normalizedX, normalizedY]);

  return { x, y, normalizedX, normalizedY };
}
