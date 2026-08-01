import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// ALERT
// ============================================================
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'brand';
  title?: string;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
}

const alertConfig = {
  info: {
    bg: 'bg-info-50',
    border: 'border-info-200',
    icon: 'text-info-600',
    title: 'text-info-900',
    text: 'text-info-700',
    close: 'text-info-400 hover:text-info-600',
    defaultIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    icon: 'text-success-600',
    title: 'text-success-900',
    text: 'text-success-700',
    close: 'text-success-400 hover:text-success-600',
    defaultIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
        <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    icon: 'text-warning-600',
    title: 'text-warning-900',
    text: 'text-warning-700',
    close: 'text-warning-400 hover:text-warning-600',
    defaultIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  danger: {
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    icon: 'text-danger-600',
    title: 'text-danger-900',
    text: 'text-danger-700',
    close: 'text-danger-400 hover:text-danger-600',
    defaultIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  brand: {
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    icon: 'text-brand-600',
    title: 'text-brand-900',
    text: 'text-brand-700',
    close: 'text-brand-400 hover:text-brand-600',
    defaultIcon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
};

function Alert({ variant = 'info', title, icon, closable, onClose, action, children, className, ...props }: AlertProps) {
  const config = alertConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-xl border p-4',
        config.bg,
        config.border,
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        <div className={cn('mt-0.5 shrink-0', config.icon)}>
          {icon || config.defaultIcon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-sm font-semibold', config.title)}>{title}</h4>
          )}
          <div className={cn('text-sm', config.text, title && 'mt-1')}>
            {children}
          </div>
          {action && <div className="mt-3">{action}</div>}
        </div>
        {closable && (
          <button
            onClick={onClose}
            className={cn('shrink-0 p-0.5 rounded-lg transition-colors', config.close)}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DIALOG / MODAL
// ============================================================
interface DialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

function Dialog({ open, onClose, onOpenChange, children, size = 'md' }: DialogProps) {
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] h-[85vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl',
          'animate-in fade-in-0 zoom-in-95',
          sizeClasses[size]
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ children, className, onClose }: { children: React.ReactNode; className?: string; onClose?: () => void }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-surface-100 px-6 py-4', className)}>
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold text-surface-900', className)}>{children}</h2>;
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 border-t border-surface-100 px-6 py-4', className)}>
      {children}
    </div>
  );
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
interface ConfirmDialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

function ConfirmDialog({
  open,
  onClose,
  onOpenChange,
  onConfirm,
  title = 'تأكيد',
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  loading,
}: ConfirmDialogProps) {
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  const btnVariant = {
    danger: 'danger' as const,
    warning: 'warning' as const,
    info: 'primary' as const,
  };

  return (
    <Dialog open={open} onClose={handleClose} size="sm">
      <DialogHeader onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        {description && <p className="text-sm text-surface-500">{description}</p>}
      </DialogContent>
      <DialogFooter>
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-surface-700 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50',
            variant === 'danger' && 'bg-danger-600 hover:bg-danger-700',
            variant === 'warning' && 'bg-warning-600 hover:bg-warning-700',
            variant === 'info' && 'bg-brand-600 hover:bg-brand-700'
          )}
        >
          {loading ? 'جاري التأكيد...' : confirmLabel}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  const variantStyles = {
    info: 'bg-info-50 border-info-200 text-info-800',
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:w-96">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-xl border p-4 shadow-lg',
            'animate-in slide-in-from-bottom-5 fade-in-0',
            variantStyles[toast.variant || 'info']
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              <p className="text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.onClick}
                className="text-xs font-semibold underline hover:no-underline"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// LOADING SPINNER
// ============================================================
function LoadingSpinner({ size = 'md', className }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClasses = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-[3px]',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-brand-200 border-t-brand-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

// ============================================================
// FULL PAGE LOADER
// ============================================================
function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" />
      {message && <p className="mt-4 text-sm text-surface-500 font-medium">{message}</p>}
    </div>
  );
}

export type { Toast };
export {
  Alert,
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter,
  ConfirmDialog,
  ToastProvider, useToast,
  LoadingSpinner, FullPageLoader,
};
