'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagneticEffect } from '@/hooks/animations/useMagneticEffect';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  as?: 'button' | 'a';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
}

const variantStyles: Record<string, string> = {
  primary: 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-lg',
  secondary: 'bg-white text-surface-700 border border-surface-200 shadow-sm hover:bg-surface-50 hover:border-surface-300',
  outline: 'bg-transparent text-brand-500 border-2 border-brand-300 hover:bg-brand-50 hover:border-brand-400',
  ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-8 text-base rounded-2xl gap-2.5',
};

export function MagneticButton({
  children,
  strength = 0.3,
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className,
  disabled = false,
  loading = false,
  type = 'button',
}: MagneticButtonProps) {
  const { ref, x, y } = useMagneticEffect(strength);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleId = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || loading) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rx = e.clientX - rect.left;
      const ry = e.clientY - rect.top;
      const id = ++rippleId.current;
      setRipples((prev) => [...prev, { x: rx, y: ry, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      onClick?.();
    },
    [disabled, loading, onClick]
  );

  const Tag: any = Component === 'a' && href ? motion.a : motion.button;

  return (
    <Tag
      ref={ref}
      href={href as any}
      type={Component === 'button' ? type : undefined}
      disabled={disabled || loading}
      onClick={handleClick}
      style={{ x, y }}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-none transition-colors duration-200 ease-brand select-none overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant] ?? variantStyles.primary,
        sizeStyles[size] ?? sizeStyles.md,
        className
      )}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        children
      )}

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.5, x: r.x, y: r.y }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute pointer-events-none w-5 h-5 rounded-full bg-white/30 -translate-x-1/2 -translate-y-1/2"
          />
        ))}
      </AnimatePresence>
    </Tag>
  );
}
