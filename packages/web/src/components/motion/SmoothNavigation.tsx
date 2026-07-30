'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { cn } from '@/lib/utils';

interface SmoothNavigationProps {
  items: Array<{ label: string; href: string; icon?: React.ReactNode }>;
  variant?: 'top' | 'side' | 'bottom';
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function SmoothNavigation({
  items,
  variant = 'top',
  className,
  dir = 'ltr',
}: SmoothNavigationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
    if (latest > lastScrollY.current && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    lastScrollY.current = latest;
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (variant === 'side') {
    return (
      <nav
        dir={dir}
        className={cn(
          'fixed left-0 top-0 h-full w-20 bg-white/80 backdrop-blur-xl border-r border-surface-100 z-40 flex flex-col items-center py-8 gap-2',
          reducedMotion ? '' : 'transition-transform duration-300',
          className
        )}
      >
        {items.map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            onMouseEnter={() => setActiveIndex(i)}
            className={cn(
              'relative flex flex-col items-center gap-1 w-16 py-3 rounded-xl transition-colors',
              activeIndex === i ? 'text-brand-500 bg-brand-50' : 'text-surface-400 hover:text-surface-600 hover:bg-surface-50'
            )}
          >
            {activeIndex === i && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-xl bg-brand-50"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.icon}</span>
            <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
          </motion.a>
        ))}
      </nav>
    );
  }

  return (
    <>
      <motion.header
        dir={dir}
        animate={{
          y: isVisible ? 0 : -80,
          backgroundColor: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0)',
          borderBottom: scrolled ? '1px solid rgb(226,232,240)' : '1px solid transparent',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 backdrop-blur-xl',
          reducedMotion ? 'bg-white/85 border-b border-surface-100' : '',
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.a
            href="/"
            className="text-xl font-bold text-surface-900"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-brand-500">Al</span> Mokhtabar
          </motion.a>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  activeIndex === i ? 'text-brand-500' : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'
                )}
              >
                {activeIndex === i && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </motion.a>
            ))}
          </nav>

          <motion.button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100"
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileOpen ? (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <motion.nav
              dir={dir}
              initial={{ x: dir === 'rtl' ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir === 'rtl' ? 100 : -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className={cn(
                'absolute top-0 bottom-0 w-72 bg-white shadow-2xl p-6 pt-20',
                dir === 'rtl' ? 'right-0' : 'left-0'
              )}
            >
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 hover:bg-surface-50 hover:text-brand-500 transition-colors"
                  >
                    {item.icon && <span className="text-surface-400">{item.icon}</span>}
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.a>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
}
