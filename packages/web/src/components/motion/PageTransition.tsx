'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '@/lib/motion/variants';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn('relative', className)}>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-brand-500 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: 'easeInOut', times: [0, 0.5, 1] }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          data-page-container
          variants={reducedMotion ? undefined : pageTransition}
          initial={reducedMotion ? undefined : 'initial'}
          animate={reducedMotion ? undefined : 'animate'}
          exit={reducedMotion ? undefined : 'exit'}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
