'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MicroButton({
  children,
  onClick,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.97, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl bg-white border border-surface-200 text-surface-700 shadow-sm hover:bg-surface-50 transition-colors',
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}

interface MicroToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function MicroToggle({ checked, onChange, className }: MicroToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-brand-500' : 'bg-surface-200',
        className
      )}
      role="switch"
      aria-checked={checked}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

interface MicroHeartProps {
  liked: boolean;
  onClick: () => void;
  className?: string;
}

export function MicroHeart({ liked, onClick, className }: MicroHeartProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.8 }}
      className={cn('inline-flex items-center gap-1.5 text-sm', className)}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <motion.path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={liked ? '#EF4444' : 'none'}
          stroke={liked ? '#EF4444' : '#94A3B8'}
          strokeWidth="2"
          animate={liked ? { fill: '#EF4444', stroke: '#EF4444' } : { fill: 'none', stroke: '#94A3B8' }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    </motion.button>
  );
}

interface MicroStarProps {
  rated: boolean;
  onClick: () => void;
  className?: string;
}

export function MicroStar({ rated, onClick, className }: MicroStarProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.8 }}
      className={cn('inline-flex', className)}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        animate={rated ? { rotate: [0, 15, -15, 0] } : { rotate: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={rated ? '#F59E0B' : 'none'}
          stroke={rated ? '#F59E0B' : '#94A3B8'}
          strokeWidth="2"
          initial={false}
          animate={rated ? { fill: '#F59E0B', stroke: '#F59E0B' } : { fill: 'none', stroke: '#94A3B8' }}
          transition={{ duration: 0.25 }}
        />
      </motion.svg>
    </motion.button>
  );
}

interface MicroCheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function MicroCheckbox({ checked, onChange, className }: MicroCheckboxProps) {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors',
        checked ? 'bg-brand-500 border-brand-500' : 'border-surface-300',
        className
      )}
    >
      <motion.svg
        viewBox="0 0 12 12"
        className="w-3 h-3"
        animate={checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.path
          d="M2 6l3 3 5-5"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={checked ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.button>
  );
}

interface MicroChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export function MicroChip({ label, active, onClick, className }: MicroChipProps) {
  return (
    <motion.button
      onClick={onClick}
      layout
      animate={{
        scale: active ? 1.05 : 1,
        backgroundColor: active ? 'rgb(0, 119, 182)' : 'rgb(241, 245, 249)',
        color: active ? 'white' : 'rgb(71, 85, 105)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border',
        active ? 'border-brand-500' : 'border-surface-200',
        className
      )}
    >
      {label}
    </motion.button>
  );
}

interface MicroProgressProps {
  value: number;
  label?: string;
  className?: string;
}

export function MicroProgress({ value, label, className }: MicroProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-surface-500">{label}</span>
          <span className="text-xs font-medium text-surface-700">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-500 rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: clampedValue / 100 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15, mass: 0.8 }}
        />
      </div>
    </div>
  );
}

interface MicroBadgeProps {
  count: number;
  variant?: 'info' | 'warning' | 'danger';
  className?: string;
}

const badgeColors: Record<string, string> = {
  info: 'bg-brand-500 text-white',
  warning: 'bg-saffron-500 text-white',
  danger: 'bg-danger-500 text-white',
};

export function MicroBadge({ count, variant = 'info', className }: MicroBadgeProps) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full',
        badgeColors[variant],
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}
