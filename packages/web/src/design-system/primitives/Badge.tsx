import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================
// BADGE
// ============================================================
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-surface-600',
        primary: 'bg-brand-50 text-brand-600',
        secondary: 'bg-surface-100 text-surface-600',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger: 'bg-danger-50 text-danger-600',
        error: 'bg-danger-50 text-danger-600',
        destructive: 'bg-danger-50 text-danger-600',
        info: 'bg-info-50 text-info-600',
        outline: 'border border-surface-200 text-surface-600',
        'outline-primary': 'border border-brand-200 text-brand-600',
        brand: 'bg-brand-500 text-white',
        gold: 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white',
        glass: 'bg-white/10 text-white backdrop-blur-sm border border-white/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      dot: {
        true: 'gap-1.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({
  className,
  variant,
  size,
  dot,
  dotColor,
  removable,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, dot }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            dotColor || (variant === 'success' ? 'bg-success-500' :
              variant === 'warning' ? 'bg-warning-500' :
              variant === 'danger' ? 'bg-danger-500' :
              variant === 'primary' ? 'bg-brand-500' : 'bg-surface-500')
          )}
        />
      )}
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="ml-0.5 -mr-1 h-3.5 w-3.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ============================================================
// AVATAR
// ============================================================
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  ring?: boolean;
  ringColor?: string;
}

function Avatar({
  className,
  src,
  alt,
  fallback,
  size = 'md',
  shape = 'circle',
  status,
  ring,
  ringColor,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
  };

  const statusSizeClasses = {
    xs: 'h-1.5 w-1.5 border',
    sm: 'h-2 w-2 border',
    md: 'h-2.5 w-2.5 border-2',
    lg: 'h-3 w-3 border-2',
    xl: 'h-3.5 w-3.5 border-2',
    '2xl': 'h-4 w-4 border-2',
  };

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-surface-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  };

  const initials = fallback || alt?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden bg-surface-100 font-semibold text-surface-600',
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-xl',
          ring && `ring-2 ring-offset-2 ${ringColor || 'ring-brand-500'} ring-offset-white`
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || ''}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

// ============================================================
// AVATAR GROUP
// ============================================================
interface AvatarGroupProps {
  avatars: Array<{ src?: string; alt?: string; fallback?: string }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex flex-row-reverse items-center', className)}>
      {remaining > 0 && (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full bg-surface-100 font-semibold text-surface-600 ring-2 ring-white',
            size === 'sm' ? 'h-8 w-8 text-xs' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-12 w-12'
          )}
        >
          +{remaining}
        </div>
      )}
      {visible.reverse().map((avatar, i) => (
        <div key={i} className="-ml-2 ring-2 ring-white rounded-full">
          <Avatar {...avatar} size={size} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SEPARATOR
// ============================================================
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

function Separator({ className, orientation = 'horizontal', label, ...props }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('h-6 w-px bg-surface-200', className)}
        {...props}
      />
    );
  }

  return (
    <div role="separator" className={cn('relative flex items-center', className)} {...props}>
      <div className="h-px w-full bg-surface-200" />
      {label && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-surface-400">
          {label}
        </span>
      )}
    </div>
  );
}

export { Badge, badgeVariants, Avatar, AvatarGroup, Separator };
