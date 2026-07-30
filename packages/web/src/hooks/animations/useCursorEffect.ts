'use client';

import { useEffect, useCallback } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';

type CursorVariant = 'default' | 'pointer' | 'text' | 'hidden' | 'magnetic';

interface CursorEffectReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  isPointer: boolean;
  isHovering: boolean;
  variants: CursorVariant;
  setVariants: (v: CursorVariant) => void;
}

export function useCursorEffect(): CursorEffectReturn {
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  const x = useSpring(rawX, { stiffness: 150, damping: 15 });
  const y = useSpring(rawY, { stiffness: 150, damping: 15 });

  const isPointer = false;
  const isHovering = false;
  const variants: CursorVariant = 'default';
  const setVariants = useCallback((v: CursorVariant) => {}, []);

  useEffect(() => {
    let isTouchDevice = false;

    const checkTouch = () => {
      isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    checkTouch();

    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };

    const handleMouseLeave = () => {
      rawX.set(-9999);
      rawY.set(-9999);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [rawX, rawY]);

  return { x, y, isPointer, isHovering, variants, setVariants };
}
