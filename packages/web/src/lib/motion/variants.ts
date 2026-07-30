import { Variants, type MotionValue, type SpringOptions } from 'framer-motion';

export const brandCurve = [0.16, 1, 0.3, 1] as const;
export const bounceCurve = [0.34, 1.56, 0.64, 1] as const;

export const springStiff = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 };
export const springGentle = { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1 };
export const springBouncy = { type: 'spring' as const, stiffness: 200, damping: 10, mass: 0.5 };
export const springSnappy = { type: 'spring' as const, stiffness: 400, damping: 40, mass: 0.6 };

export const fadeIn = (direction: 'up' | 'down' | 'left' | 'right' | 'none' = 'up', delay = 0): Variants => {
  const dist = 40;
  const x = direction === 'left' ? -dist : direction === 'right' ? dist : 0;
  const y = direction === 'up' ? dist : direction === 'down' ? -dist : 0;

  return {
    hidden: { opacity: 0, x, y, transition: { duration: 0.4, ease: brandCurve } },
    visible: {
      opacity: 1, x: 0, y: 0,
      transition: { duration: 0.6, ease: brandCurve, delay },
    },
    exit: {
      opacity: 0, x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
      y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0,
      transition: { duration: 0.25, ease: brandCurve },
    },
  };
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(4px)' },
  visible: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: brandCurve },
  },
  exit: {
    opacity: 0, scale: 0.95, filter: 'blur(2px)',
    transition: { duration: 0.25, ease: brandCurve },
  },
};

export const slideIn = (
  direction: 'up' | 'down' | 'left' | 'right',
  type: 'spring' | 'tween' = 'spring',
  delay = 0,
  duration = 0.5
): Variants => {
  const x = direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0;
  const y = direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0;

  const base = type === 'spring'
    ? { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1, delay }
    : { duration, ease: brandCurve, delay };

  return {
    hidden: { x, y, opacity: 0 },
    visible: { x: 0, y: 0, opacity: 1, transition: base },
    exit: { x, y, opacity: 0, transition: { duration: 0.25, ease: brandCurve } },
  };
};

export const textVariant = (delay = 0): Variants => ({
  hidden: { y: 40, opacity: 0, rotateX: -15 },
  visible: {
    y: 0, opacity: 1, rotateX: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15, mass: 0.8, delay },
  },
  exit: {
    y: -20, opacity: 0,
    transition: { duration: 0.2, ease: brandCurve },
  },
});

export const textContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

export const cardHover: Variants = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03)' },
  hover: {
    y: -6,
    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.08), 0 24px 48px -8px rgba(0,0,0,0.04)',
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 },
  },
};

export const cardTap: Variants = {
  tap: { scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

export const glassReveal: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: 'rgba(255,255,255,0)' },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transition: { duration: 0.6, ease: brandCurve },
  },
};

export const floatingAnimation = (y = -10, duration = 3) => ({
  y: [0, y, 0],
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
    repeatType: 'mirror' as const,
  },
});

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(0,119,182,0.6)',
      '0 0 0 12px rgba(0,119,182,0)',
      '0 0 0 0 rgba(0,119,182,0)',
    ],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeOut' },
  },
};

export const magnetHover = (strength = 0.3) => ({
  x: 0,
  y: 0,
  transition: { type: 'spring' as const, stiffness: 150, damping: 15, mass: 0.5 },
});

export const listItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24, delay: i * 0.06 },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0, scale: 0.98, y: -10,
    transition: { duration: 0.2, ease: brandCurve },
  },
};

export const fadeSlide: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: brandCurve },
  },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
};

export const zoomIn = (delay = 0, duration = 0.5): Variants => ({
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration, ease: brandCurve, delay },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
});

export const rotateIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, rotate: -15, scale: 0.8 },
  visible: {
    opacity: 1, rotate: 0, scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14, mass: 0.7, delay },
  },
  exit: { opacity: 0, rotate: 15, scale: 0.8, transition: { duration: 0.2 } },
});

export const shimmerVariants: Variants = {
  hidden: { backgroundPosition: '-200% 0' },
  visible: { backgroundPosition: '200% 0', transition: { duration: 1.5, repeat: Infinity, ease: 'linear' } },
};

export interface CountUpConfig {
  from: number;
  to: number;
  config: SpringOptions;
  duration: number;
}

export const countUp = (from = 0, to: number, duration = 2): CountUpConfig => ({
  from,
  to,
  config: { stiffness: 60, damping: 20, mass: 1 },
  duration,
});

