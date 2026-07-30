'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useParallax } from '@/hooks/animations/useParallax';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';
import { fadeIn } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ParallaxSection({
  children,
  speed = 0.5,
  direction = 'up',
  className,
  as: Component = 'section',
}: ParallaxSectionProps) {
  const reducedMotion = useReducedMotion();
  const { ref: revealRef, controls } = useScrollReveal({ threshold: 0.05 });
  const { ref: parallaxRef, y } = useParallax({ type: 'scroll', speed, direction });

  const combinedRef = useRef<HTMLDivElement>(null!);
  const setRef = (el: HTMLDivElement | null) => {
    if (el) {
      (revealRef as React.MutableRefObject<HTMLDivElement>).current = el;
      (parallaxRef as React.MutableRefObject<HTMLDivElement>).current = el;
      combinedRef.current = el;
    }
  };

  const MotionComponent = motion[Component as keyof typeof motion] ?? motion.div;

  return (
    <MotionComponent
      ref={setRef}
      style={reducedMotion ? undefined : { y }}
      variants={!reducedMotion ? fadeIn('up', 0) : undefined}
      initial={!reducedMotion ? 'hidden' : undefined}
      animate={!reducedMotion ? controls : undefined}
      className={cn('will-change-transform', className)}
    >
      {children}
    </MotionComponent>
  );
}
