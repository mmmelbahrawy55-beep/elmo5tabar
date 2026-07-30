import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// BOTTOM SHEET
// ============================================================
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-surface-300" />
        </div>
        {title && (
          <div className="px-5 pb-3 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-900">{title}</h3>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SWIPE ACTION
// ============================================================
interface SwipeActionProps {
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function SwipeAction({ leftActions, rightActions, children, className }: SwipeActionProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4">
        {leftActions}
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
        {rightActions}
      </div>
      <div className="relative bg-white transition-transform duration-200">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// PULL TO REFRESH (indicator only, behavior needs JS)
// ============================================================
function PullToRefreshIndicator({ pulling, loading }: { pulling: boolean; loading: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden transition-all duration-300',
        pulling || loading ? 'h-12' : 'h-0'
      )}
    >
      <div
        className={cn(
          'h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600',
          (pulling || loading) && 'animate-spin'
        )}
      />
    </div>
  );
}

// ============================================================
// MOBILE SHEET LIST (for settings, options, etc.)
// ============================================================
function MobileSheetList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-surface-100 -mx-5', className)}>{children}</div>
  );
}

interface MobileSheetItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
}

function MobileSheetItem({ icon, label, description, trailing, danger, className, ...props }: MobileSheetItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 px-5 py-3.5 text-right transition-colors',
        'active:bg-surface-50',
        danger ? 'text-danger-600' : 'text-surface-900',
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn('shrink-0', danger ? 'text-danger-400' : 'text-surface-400')}>{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-surface-500 mt-0.5 truncate">{description}</p>}
      </div>
      {trailing}
      {!trailing && (
        <svg className="h-4 w-4 shrink-0 text-surface-300" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" />
        </svg>
      )}
    </button>
  );
}

// ============================================================
// SAFE AREA PADDING (for iOS)
// ============================================================
function SafeAreaBottom({ className }: { className?: string }) {
  return <div className={cn('pb-safe', className)} />;
}

function SafeAreaTop({ className }: { className?: string }) {
  return <div className={cn('pt-safe', className)} />;
}

export {
  BottomSheet,
  SwipeAction,
  PullToRefreshIndicator,
  MobileSheetList, MobileSheetItem,
  SafeAreaBottom, SafeAreaTop,
};
