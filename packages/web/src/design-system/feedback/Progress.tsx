import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// PROGRESS BAR
// ============================================================
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | string;
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

function ProgressBar({ value, max = 100, size = 'md', color = 'brand', label, showValue, animated = true, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
  };

  const isNamedColor = color in colorClasses;
  const bgColor = isNamedColor ? colorClasses[color as keyof typeof colorClasses] : undefined;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-surface-600">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-surface-900">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-surface-100', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all',
            bgColor,
            animated && 'duration-500 ease-out'
          )}
          style={{ width: `${percent}%`, ...(bgColor ? {} : { backgroundColor: color }) }}
        />
      </div>
    </div>
  );
}

// ============================================================
// CIRCULAR PROGRESS
// ============================================================
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  label?: string;
  className?: string;
}

function CircularProgress({ value, max = 100, size = 64, strokeWidth = 6, color = 'var(--brand-500, #0077B6)', trackColor = 'var(--surface-100, #F1F5F9)', showValue, label, className }: CircularProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-surface-900">{Math.round(percent)}%</span>
        </div>
      )}
      {label && !showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-surface-600">{label}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEPPER
// ============================================================
interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

function Stepper({ steps, current, orientation = 'horizontal', className }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-0', className)}>
        {steps.map((step, i) => {
          const state = i < current ? 'completed' : i === current ? 'current' : 'upcoming';
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                    state === 'completed' && 'bg-brand-600 text-white',
                    state === 'current' && 'bg-brand-50 text-brand-600 ring-2 ring-brand-600',
                    state === 'upcoming' && 'bg-surface-100 text-surface-400'
                  )}
                >
                  {state === 'completed' ? (
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  ) : (
                    step.icon || (i + 1)
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('w-0.5 flex-1 min-h-8 my-1', i < current ? 'bg-brand-600' : 'bg-surface-200')} />
                )}
              </div>
              <div className={cn('pb-8', i === steps.length - 1 && 'pb-0')}>
                <p className={cn('text-sm font-semibold', state === 'upcoming' ? 'text-surface-400' : 'text-surface-900')}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-surface-500">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, i) => {
        const state = i < current ? 'completed' : i === current ? 'current' : 'upcoming';
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all',
                  state === 'completed' && 'bg-brand-600 text-white',
                  state === 'current' && 'bg-brand-50 text-brand-600 ring-2 ring-brand-600',
                  state === 'upcoming' && 'bg-surface-100 text-surface-400'
                )}
              >
                {state === 'completed' ? (
                  <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                ) : (
                  step.icon || (i + 1)
                )}
              </div>
              <p className={cn('mt-2 text-xs font-medium text-center', state === 'upcoming' ? 'text-surface-400' : 'text-surface-700')}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 w-full mt-5 mx-1 rounded-full', i < current ? 'bg-brand-600' : 'bg-surface-200')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================
// CHIP / TAG
// ============================================================
interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'filled' | 'outlined';
  color?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

function Chip({ variant = 'filled', color = 'default', size = 'sm', removable, onRemove, children, className, ...props }: ChipProps) {
  const colorMap = {
    filled: {
      default: 'bg-surface-100 text-surface-700',
      brand: 'bg-brand-100 text-brand-700',
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      danger: 'bg-danger-100 text-danger-700',
      info: 'bg-info-100 text-info-700',
    },
    outlined: {
      default: 'border border-surface-200 text-surface-600',
      brand: 'border border-brand-200 text-brand-600',
      success: 'border border-success-200 text-success-600',
      warning: 'border border-warning-200 text-warning-600',
      danger: 'border border-danger-200 text-danger-600',
      info: 'border border-info-200 text-info-600',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variant === 'filled' ? colorMap.filled[color] : colorMap.outlined[color],
        className
      )}
      {...props}
    >
      {children}
      {removable && (
        <button onClick={onRemove} className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ============================================================
// AVATAR STATUS DOT (standalone)
// ============================================================
function StatusDot({ status, size = 'md', className }: { status: 'online' | 'offline' | 'away' | 'busy'; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3' };
  const colorClasses = { online: 'bg-success-500', offline: 'bg-surface-400', away: 'bg-warning-500', busy: 'bg-danger-500' };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        colorClasses[status],
        status === 'online' && 'ring-2 ring-white',
        className
      )}
    />
  );
}

// ============================================================
// DIVIDER WITH TEXT
// ============================================================
function Divider({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="h-px flex-1 bg-surface-200" />
      {text && <span className="px-3 text-xs text-surface-400 font-medium whitespace-nowrap">{text}</span>}
      <div className="h-px flex-1 bg-surface-200" />
    </div>
  );
}

// ============================================================
// KBD (keyboard shortcut)
// ============================================================
function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-surface-100 border border-surface-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-surface-600 shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  );
}

export {
  ProgressBar, CircularProgress,
  Stepper,
  Chip, StatusDot,
  Divider, Kbd,
};
