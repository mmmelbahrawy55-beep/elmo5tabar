'use client';

import { useRef, useMemo } from 'react';
import {
  useScroll,
  useTransform,
  useMotionValue,
  type MotionValue,
} from 'framer-motion';

interface ParallaxOptions {
  type?: 'scroll' | 'mouse';
  speed?: number;
  direction?: 'up' | 'down';
}

export function useParallax(options: ParallaxOptions = {}) {
  const { type = 'scroll', speed = 0.5, direction = 'up' } = options;
  const ref = useRef<HTMLDivElement>(null!);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const dirFactor = direction === 'up' ? -1 : 1;

  const y = useTransform(scrollYProgress, [0, 1], [0, dirFactor * speed * 200]);
  const x = useMotionValue('0px');

  const mouseYTransform = useTransform(mouseY, [0, 1], [dirFactor * speed * 40, dirFactor * speed * -40]);
  const mouseXTransform = useTransform(mouseX, [0, 1], [speed * -40, speed * 40]);

  useMemo(() => {
    if (type !== 'mouse') return;
    const handleMouse = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [type, mouseX, mouseY]);

  const outputX = type === 'mouse'
    ? mouseXTransform
    : x;
  const outputY = type === 'mouse'
    ? mouseYTransform
    : y;

  return { ref, x: outputX, y: outputY };
}
