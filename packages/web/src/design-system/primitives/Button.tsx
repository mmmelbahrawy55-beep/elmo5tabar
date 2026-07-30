import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles — the foundation for all buttons
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-semibold leading-none',
    'rounded-xl transition-all duration-200 ease-brand',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none relative overflow-hidden',
    // Touch feedback
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary — Brand Blue
        primary: [
          'bg-brand-500 text-white shadow-sm',
          'hover:bg-brand-600 hover:shadow-brand',
          'focus-visible:ring-brand-500',
          'active:bg-brand-700',
        ].join(' '),
        // Secondary — Outline
        secondary: [
          'bg-white text-surface-700 border border-surface-200 shadow-xs',
          'hover:bg-surface-50 hover:border-surface-300 hover:shadow-sm',
          'focus-visible:ring-brand-500',
          'active:bg-surface-100',
        ].join(' '),
        // Ghost — No border, no bg
        ghost: [
          'bg-transparent text-surface-600',
          'hover:bg-surface-100 hover:text-surface-900',
          'focus-visible:ring-brand-500',
          'active:bg-surface-200',
        ].join(' '),
        // Danger — Red
        danger: [
          'bg-danger-500 text-white shadow-sm',
          'hover:bg-danger-600 hover:shadow-danger',
          'focus-visible:ring-danger-500',
          'active:bg-danger-700',
        ].join(' '),
        // Success — Green
        success: [
          'bg-success-500 text-white shadow-sm',
          'hover:bg-success-600 hover:shadow-success',
          'focus-visible:ring-success-500',
          'active:bg-success-600',
        ].join(' '),
        // Brand Gradient
        gradient: [
          'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-brand',
          'hover:shadow-brand-lg hover:brightness-110',
          'focus-visible:ring-brand-500',
          'active:brightness-95',
        ].join(' '),
        // Gold / Premium
        gold: [
          'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm',
          'hover:from-saffron-600 hover:to-saffron-700',
          'focus-visible:ring-saffron-500',
          'active:from-saffron-700 active:to-saffron-800',
        ].join(' '),
        // Link
        link: [
          'bg-transparent text-brand-500 p-0 h-auto',
          'hover:text-brand-600 hover:underline',
          'focus-visible:ring-brand-500',
          'active:text-brand-700',
        ].join(' '),
        // Glass
        glass: [
          'bg-white/10 backdrop-blur-md text-white border border-white/20',
          'hover:bg-white/20 hover:border-white/30',
          'focus-visible:ring-white/50',
          'active:bg-white/5',
        ].join(' '),
        // Outline Blue
        'outline-brand': [
          'bg-transparent text-brand-500 border border-brand-300',
          'hover:bg-brand-50 hover:border-brand-400',
          'focus-visible:ring-brand-500',
          'active:bg-brand-100',
        ].join(' '),
      },
      size: {
        xs:   'h-7 px-2.5 text-xs rounded-lg gap-1',
        sm:   'h-8 px-3 text-xs rounded-lg gap-1.5',
        md:   'h-10 px-4 text-sm rounded-xl gap-2',
        lg:   'h-11 px-6 text-sm rounded-xl gap-2',
        xl:   'h-12 px-8 text-base rounded-2xl gap-2.5',
        '2xl': 'h-14 px-10 text-base rounded-2xl gap-3',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
        'icon-xs': 'h-7 w-7 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
