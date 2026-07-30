import { cn } from '@/lib/utils';

type SkeletonVariant = 'text' | 'avatar' | 'card' | 'chart' | 'table' | 'image';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-48 rounded-xl',
  chart: 'h-64 rounded-xl',
  table: 'h-8 rounded',
  image: 'aspect-video w-full rounded-xl',
};

export function Skeleton({ variant = 'text', width, height, className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-surface-200',
            variantClasses[variant],
            (i < count - 1) && 'mb-3',
            className,
          )}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" count={3} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="80" height={32} />
        <Skeleton variant="text" width="100" height={32} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" className="flex-1" height={32} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="160" height={24} />
        <Skeleton variant="text" width="100" height={32} />
      </div>
      <Skeleton variant="chart" />
    </div>
  );
}
