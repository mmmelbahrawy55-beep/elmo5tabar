'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassLoadingScreenProps {
  message?: string;
  submessage?: string;
  progress?: number;
  variant?: 'determinate' | 'indeterminate';
  isLoading?: boolean;
}

export function GlassLoadingScreen({
  message = 'جاري التحميل...',
  submessage = 'Al Mokhtabar Laboratory',
  progress = 0,
  variant = 'indeterminate',
  isLoading = true,
}: GlassLoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="relative"
            >
              <div className="flex h-20 w-20 items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 80 80" className="absolute">
                  <defs>
                    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0077B6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  {variant === 'determinate' ? (
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="4"
                    />
                  ) : (
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="url(#brandGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${circumference}`}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ originX: '40px', originY: '40px' }}
                    />
                  )}
                  {variant === 'determinate' && (
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="url(#brandGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 40 40)"
                      style={{
                        transition: 'stroke-dashoffset 0.3s ease',
                      }}
                    />
                  )}
                </svg>

                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex h-12 w-12 items-center justify-center"
                >
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <path
                      d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4z"
                      fill="#0077B6"
                      opacity="0.15"
                    />
                    <path
                      d="M20 8v24M8 20h24"
                      stroke="#0077B6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="20" r="6" fill="#10B981" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <motion.p
                className="text-lg font-medium text-surface-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {message}
              </motion.p>
              <motion.p
                className="text-sm text-surface-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {submessage}
              </motion.p>
            </div>

            {variant === 'determinate' && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-200">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #0077B6, #10B981)',
                        width: `${progress}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs font-medium text-surface-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </motion.div>
            )}

            {variant === 'indeterminate' && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-[#0077B6]"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
