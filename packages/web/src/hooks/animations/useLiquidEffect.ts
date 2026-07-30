'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useSpring, type SpringValue } from 'framer-motion';

interface LiquidEffectOptions {
  intensity?: number;
  smoothness?: number;
  radius?: number;
}

interface LiquidEffectReturn {
  x: SpringValue<number>;
  y: SpringValue<number>;
  scale: SpringValue<number>;
  rotation: SpringValue<number>;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useLiquidEffect(options?: LiquidEffectOptions): LiquidEffectReturn {
  const { intensity = 20, smoothness = 0.15, radius = 0 } = options ?? {};

  const ref = useRef<HTMLDivElement | null>(null);

  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const rotation = useSpring(0, { stiffness: 200, damping: 25 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;

      const dist = Math.sqrt(distX * distX + distY * distY);
      const maxDist = radius || Math.max(rect.width, rect.height) * 0.5;
      const factor = Math.max(0, 1 - dist / maxDist);

      const moveX = (distX / (rect.width / 2)) * intensity * factor;
      const moveY = (distY / (rect.height / 2)) * intensity * factor;

      x.set(moveX);
      y.set(moveY);
      scale.set(1 + 0.05 * factor);
      rotation.set((distX / (rect.width / 2)) * 3 * factor);
    },
    [intensity, radius, x, y, scale, rotation],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
    rotation.set(0);
  }, [x, y, scale, rotation]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { x, y, scale, rotation, ref };
}
