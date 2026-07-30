'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react').then((m) => ({ default: m.default })), {
  ssr: false,
});

interface LottieLoadingScreenProps {
  src?: string;
  message?: string;
  submessage?: string;
  progress?: number;
  isLoading?: boolean;
}

export function LottieLoadingScreen({
  src = '/lottie/loading.json',
  message = 'جاري التحميل...',
  submessage = 'Al Mokhtabar Laboratory',
  progress = 0,
  isLoading = true,
}: LottieLoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [show, setShow] = useState(isLoading);
  const [hasError, setHasError] = useState(false);

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
            {!hasError ? (
              <div className="h-24 w-24">
                <Lottie
                  path={src}
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <defs>
                    <linearGradient id="lottieFallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0077B6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="url(#lottieFallbackGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="226"
                    strokeDashoffset="56"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
              </motion.div>
            )}

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
