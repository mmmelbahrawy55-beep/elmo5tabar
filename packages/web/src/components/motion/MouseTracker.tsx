'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MouseTrackerProps {
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}

export function MouseTracker({
  color = '#0077B6',
  size = 600,
  opacity = 0.03,
  className,
}: MouseTrackerProps) {
  const [isMobile, setIsMobile] = useState(false);

  const rawX = useMotionValue(-9999);
  const rawY = useMotionValue(-9999);

  const x = useSpring(rawX, { stiffness: 80, damping: 30 });
  const y = useSpring(rawY, { stiffness: 80, damping: 30 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);

    const handleMouseMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [rawX, rawY]);

  if (isMobile) return null;

  return (
    <motion.div
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
      style={{
        background: `radial-gradient(${size}px at ${x}px ${y}px, ${color}, transparent ${opacity})`,
        opacity,
      }}
    />
  );
}
