import { Suspense, type ReactNode } from 'react';

/* ─── Streaming content wrapper with progressive loading ─── */
interface StreamingSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: number;
}

export function StreamSection({ children, fallback, priority = 1 }: StreamingSectionProps) {
  return (
    <Suspense fallback={fallback || <div className="h-32 animate-pulse bg-surface-100 rounded-xl" />}>
      {children}
    </Suspense>
  );
}

/* ─── Progressive content display - loads content in chunks ─── */
export function ProgressiveContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/* ─── Render-as-you-fetch pattern ─── */
export function DeferredContent({
  children,
  showAfter = 0,
}: {
  children: ReactNode;
  showAfter?: number;
}) {
  if (typeof window === 'undefined') {
    return <div className="h-32 animate-pulse bg-surface-100 rounded-xl" />;
  }
  return <>{children}</>;
}
