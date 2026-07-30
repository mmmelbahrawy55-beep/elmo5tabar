'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BookingFlowAnimationProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; icon: React.ReactNode }>;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function BookingFlowAnimation({
  currentStep,
  totalSteps,
  steps,
  className,
  dir = 'ltr',
}: BookingFlowAnimationProps) {
  const isRtl = dir === 'rtl';
  const progressPercent = ((currentStep) / (totalSteps - 1)) * 100;

  return (
    <div dir={dir} className={cn('w-full', className)}>
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-surface-200 rounded-full">
          <motion.div
            className="h-full bg-brand-500 rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progressPercent / 100 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15, mass: 0.8 }}
            style={{ transformOrigin: isRtl ? 'right center' : 'left center' }}
          />
        </div>

        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;

          return (
            <div key={step.label} className="relative flex flex-col items-center z-10">
              <motion.div
                layout
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  backgroundColor: isCompleted ? '#0077B6' : isCurrent ? '#0077B6' : '#E2E8F0',
                  borderColor: isCurrent ? '#0077B6' : isCompleted ? '#0077B6' : '#CBD5E1',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2',
                  isCurrent && 'shadow-lg shadow-brand-500/25'
                )}
              >
                {isCompleted ? (
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-4 h-4 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M2 6l3 3 5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </motion.svg>
                ) : (
                  <span className={cn(
                    'text-sm font-semibold',
                    isCurrent ? 'text-white' : 'text-surface-500'
                  )}>
                    {i + 1}
                  </span>
                )}

                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-brand-500"
                    animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </motion.div>

              <AnimatePresence>
                {(isCompleted || isCurrent) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 flex flex-col items-center"
                  >
                    <div className="flex items-center gap-1.5 mt-1">
                      {step.icon && (
                        <span className={cn(
                          'w-4 h-4',
                          isCompleted ? 'text-brand-500' : 'text-brand-500'
                        )}>
                          {step.icon}
                        </span>
                      )}
                      <span className={cn(
                        'text-xs font-medium whitespace-nowrap',
                        isCompleted ? 'text-brand-500' : isCurrent ? 'text-brand-600' : 'text-surface-400'
                      )}>
                        {step.label}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
