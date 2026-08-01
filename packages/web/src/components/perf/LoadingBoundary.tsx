import { Suspense, Component, lazy, type ReactNode, type ComponentType } from 'react';
import { Skeleton } from './Skeleton';

/* ─── Suspense boundary with skeleton ─── */
interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

export function LoadingBoundary({ children, fallback, name }: LoadingBoundaryProps) {
  return (
    <Suspense
      fallback={fallback || <div className="space-y-4 p-4"><Skeleton variant="card" /><Skeleton variant="text" count={3} /></div>}
    >
      {children}
    </Suspense>
  );
}

/* ─── Error boundary ─── */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return (this.props.fallback as (error: Error, reset: () => void) => ReactNode)(this.state.error, this.handleReset);
      }
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{error.message}</p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

/* ─── HOC for lazy loading ─── */
export function withLazy<P extends Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
) {
  const LazyComponent = lazy(importFn) as unknown as ComponentType<P>;
  return (props: P) => (
    <Suspense fallback={fallback || <Skeleton variant="card" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
