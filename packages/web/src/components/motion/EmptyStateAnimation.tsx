'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateAnimationProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  variant?: 'default' | 'search' | 'error' | 'success';
}

const variantIcons: Record<string, React.ReactNode> = {
  default: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" stroke="#0077B6" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
      <path d="M30 40h20M40 30v20" stroke="#0077B6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="34" cy="34" r="18" stroke="#0077B6" strokeWidth="2" opacity="0.3" />
      <path d="M47 47l12 12" stroke="#0077B6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" stroke="#EF4444" strokeWidth="2" opacity="0.3" />
      <path d="M30 30l20 20M50 30l-20 20" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" stroke="#10B981" strokeWidth="2" opacity="0.3" />
      <path d="M28 40l8 8 16-16" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function EmptyStateAnimation({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateAnimationProps) {
  const displayIcon = icon || variantIcons[variant];

  return (
    <motion.div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mb-6"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {displayIcon}
      </motion.div>

      <motion.h3
        className="mb-2 text-xl font-semibold text-surface-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="mb-6 max-w-sm text-sm text-surface-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.button
          className="rounded-xl bg-[#0077B6] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#0077B6]/20 transition-colors hover:bg-[#005F8F]"
          onClick={action.onClick}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
