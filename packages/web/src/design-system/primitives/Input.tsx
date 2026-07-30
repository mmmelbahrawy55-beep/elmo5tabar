import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// INPUT
// ============================================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      description,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      fullWidth,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-surface-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-danger-500">*</span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative flex items-center">
          {/* Left Icon */}
          {leftIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}

          {/* Left Addon */}
          {leftAddon && (
            <div className="flex h-10 items-center rounded-r-xl border border-l-0 border-surface-200 bg-surface-50 px-3 text-sm text-surface-500">
              {leftAddon}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={cn(
              // Base
              'flex h-10 w-full rounded-xl border bg-white px-3 py-2',
              'text-sm text-surface-900 placeholder:text-surface-400',
              'transition-all duration-200',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50',
              // Icons
              leftIcon && 'pr-10',
              rightIcon && 'pl-10',
              // Addons
              leftAddon && 'rounded-r-none border-r-0',
              rightAddon && 'rounded-l-none border-l-0',
              // Error state
              hasError
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20',
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : description ? `${inputId}-desc` : undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </div>
          )}

          {/* Right Addon */}
          {rightAddon && (
            <div className="flex h-10 items-center rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 px-3 text-sm text-surface-500">
              {rightAddon}
            </div>
          )}
        </div>

        {/* Description */}
        {description && !hasError && (
          <p id={`${inputId}-desc`} className="text-xs text-surface-500">
            {description}
          </p>
        )}

        {/* Error */}
        {hasError && (
          <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-danger-600">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {/* Hint (when no error) */}
        {hint && !hasError && (
          <p className="text-xs text-surface-400">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ============================================================
// TEXTAREA
// ============================================================
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, description, error, hint, fullWidth, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-surface-700">
            {label}
            {props.required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border bg-white px-3 py-2.5',
            'text-sm text-surface-900 placeholder:text-surface-400',
            'transition-all duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50',
            hasError
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
              : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20',
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          {...props}
        />
        {description && !hasError && (
          <p className="text-xs text-surface-500">{description}</p>
        )}
        {hasError && (
          <p className="flex items-center gap-1 text-xs text-danger-600">
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !hasError && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ============================================================
// SELECT
// ============================================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, description, error, options, placeholder, fullWidth, id, ...props }, ref) => {
    const selectId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-surface-700">
            {label}
            {props.required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'flex h-10 w-full appearance-none rounded-xl border bg-white px-3 py-2 pr-8',
              'text-sm text-surface-900',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50',
              hasError
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
                : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20',
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 text-surface-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {description && !hasError && <p className="text-xs text-surface-500">{description}</p>}
        {hasError && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ============================================================
// CHECKBOX
// ============================================================
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || React.useId();

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center pt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            className={cn(
              'peer h-4 w-4 rounded border-surface-300',
              'text-brand-500 focus:ring-brand-500/20 focus:ring-2 focus:ring-offset-0',
              'transition-all duration-150',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-danger-500',
              className
            )}
            ref={ref}
            {...props}
          />
          <svg
            className="pointer-events-none absolute h-4 w-4 opacity-0 peer-checked:opacity-100 text-white"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={checkboxId} className="text-sm font-medium text-surface-700">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-surface-500">{description}</p>}
            {error && <p className="text-xs text-danger-600 mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// ============================================================
// RADIO
// ============================================================
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const radioId = id || React.useId();

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center pt-0.5">
          <input
            type="radio"
            id={radioId}
            className={cn(
              'peer h-4 w-4 border-surface-300',
              'text-brand-500 focus:ring-brand-500/20 focus:ring-2 focus:ring-offset-0',
              'transition-all duration-150',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-sm ring-0 ring-brand-500 peer-checked:bg-brand-500 peer-checked:ring-0 hidden peer-checked:block" 
               style={{ background: 'transparent' }} />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={radioId} className="text-sm font-medium text-surface-700">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-surface-500">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);
Radio.displayName = 'Radio';

// ============================================================
// SWITCH
// ============================================================
export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
  id,
}: SwitchProps) {
  const switchId = id || React.useId();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        role="switch"
        aria-checked={checked}
        id={switchId}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'transition-all duration-200 ease-brand',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-brand-500' : 'bg-surface-300'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0',
            'transition-transform duration-200 ease-brand',
            checked ? 'translate-x-5 -translate-x-px' : 'translate-x-1'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-surface-700 cursor-pointer">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-surface-500">{description}</p>}
        </div>
      )}
    </div>
  );
}

export { Input, Textarea, Select, Checkbox, Radio, Switch };
