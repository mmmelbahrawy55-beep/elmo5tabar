'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  show: boolean;
  variant?: 'confetti' | 'checkmark' | 'sparkle';
  onComplete?: () => void;
}

const confettiColors = ['#0077B6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function ConfettiParticle({ index }: { index: number }) {
  const color = confettiColors[index % confettiColors.length];
  const xEnd = (Math.random() - 0.5) * 400;
  const yEnd = -(200 + Math.random() * 300);
  const rotateEnd = Math.random() * 720;

  return (
    <motion.div
      className="absolute h-2 w-2 rounded-sm"
      style={{ backgroundColor: color, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{
        x: xEnd,
        y: yEnd,
        opacity: [1, 1, 0],
        scale: [0, 1, 0.5],
        rotate: rotateEnd,
      }}
      transition={{
        duration: 1.5 + Math.random(),
        ease: 'easeOut',
        delay: Math.random() * 0.3,
      }}
    />
  );
}

function CheckmarkAnimation() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ background: 'linear-gradient(135deg, #0077B6, #10B981)' }}
      >
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.path
            d="M8 20l8 8 16-16"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}

function SparkleParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const distance = 60 + Math.random() * 40;
  const xEnd = Math.cos(angle) * distance;
  const yEnd = Math.sin(angle) * distance;

  return (
    <motion.div
      className="absolute h-3 w-3"
      style={{ left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: xEnd,
        y: yEnd,
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 1,
        ease: 'easeOut',
        delay: index * 0.03,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path
          d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z"
          fill={index % 2 === 0 ? '#F59E0B' : '#10B981'}
        />
      </svg>
    </motion.div>
  );
}

export function CelebrationEffect({
  show,
  variant = 'confetti',
  onComplete,
}: CelebrationEffectProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {variant === 'confetti' && (
            <div className="relative h-full w-full">
              {Array.from({ length: 30 }).map((_, i) => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </div>
          )}

          {variant === 'checkmark' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckmarkAnimation />
            </motion.div>
          )}

          {variant === 'sparkle' && (
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0077B6] to-[#10B981]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
                  </svg>
                </div>
              </div>
              {Array.from({ length: 12 }).map((_, i) => (
                <SparkleParticle key={i} index={i} total={12} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
