'use client';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { fadeIn, scaleIn, slideIn } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

interface SectionRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function SectionReveal({
  children,
  direction = 'up',
  delay = 0,
  once = true,
  className,
  as: Component = 'div',
}: SectionRevealProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollReveal({ threshold: 0.1, once });

  const getVariants = () => {
    if (reducedMotion) return {};
    if (direction === 'scale') return scaleIn;
    if (direction === 'fade') return fadeIn('none', delay);
    if (direction === 'left' || direction === 'right') return slideIn(direction, 'tween', delay, 0.5);
    return fadeIn(direction, delay);
  };

  const MotionComponent = motion[Component as keyof typeof motion] ?? motion.div;

  return (
    <MotionComponent
      ref={ref}
      variants={getVariants()}
      initial={reducedMotion ? undefined : 'hidden'}
      animate={reducedMotion ? undefined : controls}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
}
