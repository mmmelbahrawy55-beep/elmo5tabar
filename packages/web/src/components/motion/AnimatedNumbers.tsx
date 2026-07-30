'use client';

import { motion } from 'framer-motion';
import { useAnimatedNumber } from '@/hooks/animations/useAnimatedNumber';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { fadeIn } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

interface AnimatedNumbersProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  format?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'card' | 'inline';
  className?: string;
}

export function AnimatedNumbers({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  decimals = 0,
  format = true,
  title,
  subtitle,
  icon,
  variant = 'default',
  className,
}: AnimatedNumbersProps) {
  const reducedMotion = useReducedMotion();
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  const { value: displayValue } = useAnimatedNumber(isVisible ? value : 0, {
    duration,
    decimals,
    format,
  });

  if (reducedMotion) {
    const display = format
      ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : value.toFixed(decimals);

    if (variant === 'inline') {
      return (
        <span className={cn('font-bold', className)}>
          {prefix}{display}{suffix}
        </span>
      );
    }

    return (
      <div ref={ref} className={cn('text-center', variant === 'card' && 'p-6 bg-white rounded-2xl border border-surface-100 shadow-sm', className)}>
        {icon && <div className="flex justify-center mb-3">{icon}</div>}
        <div className="text-4xl font-bold text-surface-900">{prefix}{display}{suffix}</div>
        {title && <div className="mt-1 text-sm font-semibold text-surface-700">{title}</div>}
        {subtitle && <div className="mt-0.5 text-xs text-surface-500">{subtitle}</div>}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.span
        ref={ref}
        variants={fadeIn('up', 0)}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className={cn('font-bold', className)}
      >
        {prefix}{displayValue}{suffix}
      </motion.span>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={fadeIn('up', 0.1)}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className={cn(
        variant === 'card' && 'p-6 bg-white rounded-2xl border border-surface-100 shadow-sm',
        className
      )}
    >
      {icon && <div className="flex justify-center mb-3">{icon}</div>}
      <motion.div className="text-4xl font-bold text-surface-900 tabular-nums">
        {prefix}{displayValue}{suffix}
      </motion.div>
      {title && <div className="mt-1 text-sm font-semibold text-surface-700">{title}</div>}
      {subtitle && <div className="mt-0.5 text-xs text-surface-500">{subtitle}</div>}
    </motion.div>
  );
}
