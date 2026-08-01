import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// CARD
// ============================================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

function Card({
  className,
  hover = false,
  elevated = false,
  bordered = true,
  padding = 'md',
  as: Component = 'div',
  ...props
}: CardProps) {
  return React.createElement(Component, {
    className: cn(
      'rounded-2xl bg-white',
      bordered && 'border border-surface-100',
      hover && [
        'cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:border-surface-200 hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-md',
      ],
      elevated && 'shadow-lg',
      !hover && 'shadow-sm',
      {
        'p-0': padding === 'none',
        'p-4': padding === 'sm',
        'p-5': padding === 'md',
        'p-6': padding === 'lg',
        'p-8': padding === 'xl',
      },
      className
    ),
    ...props,
  });
}

// Card Sub-components
function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pb-4', className)} {...props} />;
}

function CardTitle({ className, as: Component = 'h3', ...props }: React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }) {
  return React.createElement(Component, { className: cn('text-lg font-semibold text-surface-900', className), ...props });
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-surface-500', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-4 border-t border-surface-100', className)} {...props} />;
}

// ============================================================
// STAT CARD
// ============================================================
type StatCardChange = number | string | { value: number; isPositive: boolean };
type StatCardTrend = 'up' | 'down' | 'neutral' | string | number;

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: StatCardChange;
  changeLabel?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: StatCardTrend;
  trendUp?: boolean;
  loading?: boolean;
}

function StatCard({
  className,
  title,
  value,
  change,
  changeLabel,
  changeType,
  trend,
  trendUp,
  icon,
  iconBg = 'bg-brand-50',
  loading,
  ...props
}: StatCardProps) {
  return (
    <Card padding="lg" className={cn('', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-surface-100" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold text-surface-900 tracking-tight">{value}</p>
          )}
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {typeof change === 'number' ? (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    changeType
                      ? changeType === 'negative' ? 'text-danger-600' : changeType === 'positive' ? 'text-success-600' : 'text-surface-500'
                      : change > 0 ? 'text-success-600' : change < 0 ? 'text-danger-600' : 'text-surface-500'
                  )}
                >
                  {changeType
                    ? `${changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '—'} ${Math.abs(change)}%`
                    : `${change > 0 ? '↑' : change < 0 ? '↓' : '—'} ${Math.abs(change)}%`}
                </span>
              ) : typeof change === 'string' ? (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    changeType
                      ? changeType === 'negative' ? 'text-danger-600' : changeType === 'positive' ? 'text-success-600' : 'text-surface-500'
                      : change.startsWith('-') ? 'text-danger-600' : change.startsWith('+') || change.startsWith('0') ? 'text-success-600' : 'text-surface-500'
                  )}
                >
                  {change}
                </span>
              ) : (
                <span className={cn('text-xs font-semibold', change.isPositive ? 'text-success-600' : 'text-danger-600')}>
                  {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
                </span>
              )}
              {changeLabel && (
                <span className="text-xs text-surface-400">{changeLabel}</span>
              )}
            </div>
          )}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {typeof trend === 'number' ? (
                <span className={cn('text-xs font-semibold', trend > 0 ? 'text-success-600' : trend < 0 ? 'text-danger-600' : 'text-surface-500')}>
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
                </span>
              ) : (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trendUp === undefined
                      ? trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-surface-500'
                      : trendUp ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {trendUp === undefined
                    ? trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'
                    : trendUp ? '↑' : '↓'} {trend}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// GLASS CARD
// ============================================================
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  opacity?: 'light' | 'medium' | 'heavy';
}

function GlassCard({ className, opacity = 'medium', ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl backdrop-blur-xl border border-white/20 shadow-glass',
        {
          'bg-white/5': opacity === 'light',
          'bg-white/10': opacity === 'medium',
          'bg-white/20': opacity === 'heavy',
        },
        className
      )}
      {...props}
    />
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-surface-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ============================================================
// ERROR STATE
// ============================================================
interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function ErrorState({
  title = 'حدث خطأ',
  description = 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 text-danger-500 mb-4">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-surface-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ============================================================
// SUCCESS STATE
// ============================================================
interface SuccessStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function SuccessState({
  title = 'تم بنجاح',
  description,
  action,
  className,
}: SuccessStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-500">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success-500 flex items-center justify-center animate-scale-in">
          <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.78 5.22a.75.75 0 00-1.06 0L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 000-1.06z" />
          </svg>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-surface-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-surface-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines,
  ...props
}: SkeletonProps) {
  if (lines) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-surface-100"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-100',
        {
          'h-4 w-full rounded': variant === 'text',
          'rounded-full': variant === 'circular',
          'rounded-lg': variant === 'rounded',
          'rounded-xl': variant === 'rectangular',
        },
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  StatCard, GlassCard,
  EmptyState, ErrorState, SuccessState,
  Skeleton,
};
