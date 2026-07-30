'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingBarProps {
  className?: string;
  isLoading?: boolean;
  onComplete?: () => void;
}

export function LoadingBar({ className, isLoading = false, onComplete }: LoadingBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const rawWidth = useMotionValue(0);
  const width = useSpring(rawWidth, { stiffness: 100, damping: 20 });
  const opacity = useTransform(width, [0, 100], [1, 0]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const complete = useCallback(() => {
    rawWidth.set(100);
    setTimeout(() => {
      setIsVisible(false);
      rawWidth.set(0);
      onComplete?.();
    }, 300);
  }, [rawWidth, onComplete]);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      rawWidth.set(0);

      requestAnimationFrame(() => {
        rawWidth.set(75);
      });

      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      complete();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, rawWidth, complete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className={cn('fixed left-0 top-0 z-[9999] h-[3px]', className)}
      style={{ width: '100%', opacity }}
    >
      <motion.div
        className="h-full"
        style={{
          width: width.to((v) => `${v}%`),
          background: 'linear-gradient(90deg, #0077B6, #10B981, #F59E0B, #0077B6)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}
