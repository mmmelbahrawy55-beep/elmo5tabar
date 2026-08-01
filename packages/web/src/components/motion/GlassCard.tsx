'use client';

import { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'brand' | 'accent';
  intensity?: 'subtle' | 'medium' | 'strong';
  hoverEffect?: 'lift' | 'glow' | 'tilt' | 'none';
  className?: string;
  as?: 'div' | 'button' | 'a';
  href?: string;
}

const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
  light: { bg: 'bg-white/60', border: 'border-white/30', text: 'text-surface-900' },
  dark: { bg: 'bg-surface-900/60', border: 'border-surface-700/30', text: 'text-white' },
  brand: { bg: 'bg-brand-500/20', border: 'border-brand-400/30', text: 'text-brand-900' },
  accent: { bg: 'bg-accent-500/20', border: 'border-accent-400/30', text: 'text-accent-900' },
};

const intensityMap: Record<string, string> = {
  subtle: 'backdrop-blur-md',
  medium: 'backdrop-blur-xl',
  strong: 'backdrop-blur-2xl',
};

export function GlassCard({
  children,
  variant = 'light',
  intensity = 'medium',
  hoverEffect = 'lift',
  className,
  as: Component = 'div',
  href,
}: GlassCardProps) {
  const reducedMotion = useReducedMotion();
  const { ref, controls } = useScrollReveal({ threshold: 0.1 });
  const cardRef = useRef<HTMLDivElement>(null!);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (hoverEffect !== 'tilt' || reducedMotion) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [hoverEffect, reducedMotion, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const style = variantStyles[variant] ?? variantStyles.light;
  const isLink = Component === 'a' && href;

  const MotionComponent: any = isLink ? motion.a : motion[Component as keyof typeof motion] ?? motion.div;

  return (
    <MotionComponent
      ref={(el: any) => {
        cardRef.current = el;
        (ref as React.MutableRefObject<HTMLDivElement>).current = el;
      }}
      href={isLink ? href : undefined}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: 'spring', stiffness: 100, damping: 20, mass: 1 },
        },
      }}
      initial={reducedMotion ? undefined : 'hidden'}
      animate={reducedMotion ? undefined : controls}
      whileHover={reducedMotion ? undefined : hoverEffect === 'lift' ? { y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' } : undefined}
      style={hoverEffect === 'tilt' && !reducedMotion ? { rotateX, rotateY } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-2xl border shadow-glass overflow-hidden transition-colors duration-300',
        style.bg,
        style.border,
        style.text,
        intensityMap[intensity] ?? intensityMap.medium,
        'backdrop-saturate-150',
        hoverEffect === 'glow' && 'hover:shadow-brand-lg',
        Component === 'button' && 'cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-500 rounded-2xl',
          isHovered && hoverEffect === 'glow' && 'opacity-100',
          variant === 'light' && 'bg-gradient-to-br from-brand-500/5 via-accent-500/5 to-transparent',
          variant === 'dark' && 'bg-gradient-to-br from-brand-400/10 via-accent-400/10 to-transparent',
          variant === 'brand' && 'bg-gradient-to-br from-brand-400/20 via-brand-500/10 to-transparent',
          variant === 'accent' && 'bg-gradient-to-br from-accent-400/20 via-accent-500/10 to-transparent'
        )}
      />
      <div className="relative z-10">{children}</div>
    </MotionComponent>
  );
}
