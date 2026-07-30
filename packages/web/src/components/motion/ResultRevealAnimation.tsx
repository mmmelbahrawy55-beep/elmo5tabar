'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ResultRevealAnimationProps {
  children: React.ReactNode;
  isRevealed: boolean;
  delay?: number;
  status?: 'normal' | 'abnormal' | 'critical';
}

export function ResultRevealAnimation({
  children,
  isRevealed,
  delay = 0,
  status = 'normal',
}: ResultRevealAnimationProps) {
  const glowColor = {
    normal: 'rgba(16, 185, 129, 0.15)',
    abnormal: 'rgba(245, 158, 11, 0.15)',
    critical: 'rgba(239, 68, 68, 0.2)',
  }[status];

  const borderColor = {
    normal: 'border-success-500/30',
    abnormal: 'border-saffron-500/30',
    critical: 'border-danger-500/40',
  }[status];

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95,
        filter: 'blur(8px) grayscale(1)',
      }}
      animate={
        isRevealed
          ? {
              opacity: 1,
              scale: 1,
              filter: 'blur(0px) grayscale(0)',
            }
          : {}
      }
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
        scale: { type: 'spring', stiffness: 200, damping: 20, delay },
      }}
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all',
        isRevealed && borderColor,
      )}
      style={
        isRevealed ? { boxShadow: `0 0 30px ${glowColor}` } : undefined
      }
    >
      {isRevealed && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
