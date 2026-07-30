'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumCursorProps {
  className?: string;
}

export function PremiumCursor({ className }: PremiumCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  const dotX = useSpring(rawX, { stiffness: 300, damping: 25 });
  const dotY = useSpring(rawY, { stiffness: 300, damping: 25 });
  const ringX = useSpring(rawX, { stiffness: 150, damping: 15 });
  const ringY = useSpring(rawY, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touch);
    if (touch) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleInteractiveEnter = () => setIsHovering(true);
    const handleInteractiveLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseEnter);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input, textarea, select, [data-cursor="pointer"]',
    );

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleInteractiveEnter);
      el.addEventListener('mouseleave', handleInteractiveLeave);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseEnter);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleInteractiveEnter);
        el.removeEventListener('mouseleave', handleInteractiveLeave);
      });
    };
  }, [rawX]);

  if (isTouchDevice) return null;

  return (
    <>
      <motion.div
        className={cn('pointer-events-none fixed z-[9999]', className)}
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{ duration: 0.15 }}
      >
        <div className="h-2 w-2 rounded-full bg-[#0077B6]" />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed z-[9998]"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? (isHovering ? 0.6 : 0.4) : 0,
          scale: isHovering ? 1.5 : isClicking ? 0.9 : 1,
          width: isHovering ? '60px' : '40px',
          height: isHovering ? '60px' : '40px',
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="h-full w-full rounded-full border border-[#0077B6]/40 bg-[#0077B6]/5" />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed z-[9997]"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? 0.15 : 0,
          width: isHovering ? '120px' : '80px',
          height: isHovering ? '120px' : '80px',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-full w-full rounded-full bg-[#0077B6] blur-xl" />
      </motion.div>
    </>
  );
}
