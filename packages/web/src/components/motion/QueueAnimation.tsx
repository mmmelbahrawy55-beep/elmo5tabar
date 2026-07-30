'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QueueAnimationProps {
  queueNumber: number;
  estimatedWait: number;
  positionsAhead: number;
  status: 'waiting' | 'called' | 'serving' | 'completed';
  branchName: string;
  dir?: 'ltr' | 'rtl';
}

export function QueueAnimation({
  queueNumber,
  estimatedWait,
  positionsAhead,
  status,
  branchName,
  dir = 'ltr',
}: QueueAnimationProps) {
  const isRtl = dir === 'rtl';
  const maxWait = 60;
  const progress = Math.min(estimatedWait / maxWait, 1);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      dir={dir}
      className={cn(
        'relative flex flex-col items-center justify-center p-8 rounded-3xl',
        status === 'called' && 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
        status === 'serving' && 'bg-gradient-to-br from-accent-500 to-accent-700 text-white',
        status === 'completed' && 'bg-gradient-to-br from-success-500 to-emerald-700 text-white',
        status === 'waiting' && 'bg-white border border-surface-100 shadow-xl text-surface-900'
      )}
    >
      <AnimatePresence mode="wait">
        {status === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            <span className="text-sm font-medium text-surface-500">{branchName}</span>

            <div className="relative">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                <motion.circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#0077B6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeDasharray={circumference}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold tabular-nums text-surface-900">
                  {queueNumber}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-surface-900">رقم {queueNumber}</p>
              <p className="text-sm text-surface-500 mt-1">
                الوقت المقدر: {estimatedWait} دقيقة
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                {positionsAhead} أشخاص أمامك
              </p>
            </div>

            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {status === 'called' && (
          <motion.div
            key="called"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="text-7xl font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              {queueNumber}
            </motion.div>
            <p className="text-xl font-semibold">رقمك جاهز</p>
            <p className="text-sm opacity-80">يرجى التوجه إلى شباك الاستقبال</p>
            <motion.div
              className="w-16 h-1 bg-white/40 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )}

        {status === 'serving' && (
          <motion.div
            key="serving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="text-7xl font-bold"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {queueNumber}
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <p className="text-xl font-semibold">قيد الخدمة</p>
            </div>
            <p className="text-sm opacity-80">شباك {branchName}</p>
          </motion.div>
        )}

        {status === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
            >
              <motion.svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
                />
              </motion.svg>
            </motion.div>
            <p className="text-xl font-semibold">تمت الخدمة</p>
            <p className="text-sm opacity-80">نشكرك على زيارتك</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
