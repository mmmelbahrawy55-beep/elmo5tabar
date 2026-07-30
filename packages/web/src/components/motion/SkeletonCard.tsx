'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'card' | 'list' | 'profile' | 'chart' | 'appointment' | 'result';
  lines?: number;
  animated?: boolean;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-[length:200%_100%]',
        'bg-gradient-to-r from-surface-100 via-white to-surface-100',
        className,
      )}
    />
  );
}

function StaticBlock({ className }: { className?: string }) {
  return <div className={cn('bg-surface-200', className)} />;
}

function SkeletonLine({ className, animated = true }: { className?: string; animated?: boolean }) {
  const C = animated ? Shimmer : StaticBlock;
  return <C className={cn('h-3 w-full rounded', className)} />;
}

function SkeletonCircle({ size = 10, animated = true }: { size?: number; animated?: boolean }) {
  const C = animated ? Shimmer : StaticBlock;
  return <C className={cn('rounded-full', typeof size === 'number' ? `h-${size} w-${size}` : '')} style={{ width: `${size * 4}px`, height: `${size * 4}px` }} />;
}

export function SkeletonCard({
  variant = 'card',
  lines = 3,
  animated = true,
}: SkeletonCardProps) {
  const baseClass = 'rounded-xl border border-surface-200 bg-white p-5 space-y-4';
  const C = animated ? Shimmer : StaticBlock;
  const L = (props: { className?: string }) => <SkeletonLine animated={animated} {...props} />;
  const Cir = (props: { size?: number }) => <SkeletonCircle animated={animated} {...props} />;

  switch (variant) {
    case 'card':
      return (
        <div className={baseClass}>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <C className="h-full w-full" />
          </div>
          <div className="space-y-3">
            <L className="h-4 w-3/4" />
            <L className="w-full" />
            <L className="w-2/3" />
          </div>
        </div>
      );

    case 'list':
      return (
        <div className={baseClass}>
          <div className="flex items-center gap-4">
            <Cir size={10} />
            <div className="flex-1 space-y-2">
              <L className="h-4 w-1/2" />
              <L className="w-3/4" />
              <L className="w-1/3" />
            </div>
          </div>
        </div>
      );

    case 'profile':
      return (
        <div className={baseClass}>
          <div className="flex flex-col items-center gap-4">
            <Cir size={16} />
            <L className="h-5 w-1/3" />
            <L className="w-1/2" />
            <L className="w-2/3" />
            <L className="w-1/2" />
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className={baseClass}>
          <div className="flex items-center justify-between">
            <L className="h-5 w-1/4" />
            <L className="h-8 w-20 rounded-lg" />
          </div>
          <div className="flex h-48 items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <C
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${20 + Math.random() * 80}%` }}
              />
            ))}
          </div>
        </div>
      );

    case 'appointment':
      return (
        <div className={baseClass}>
          <div className="flex gap-4">
            <div className="flex w-16 flex-col items-center justify-center rounded-lg bg-surface-100 p-2">
              <L className="h-3 w-8" />
              <L className="mt-1 h-6 w-10" />
              <L className="mt-1 h-3 w-8" />
            </div>
            <div className="flex-1 space-y-2">
              <L className="h-4 w-2/3" />
              <L className="w-full" />
              <L className="w-1/3" />
            </div>
            <div className="flex items-center">
              <div className="h-6 w-16 rounded-full bg-surface-200">
                <C className="h-full w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      );

    case 'result':
      return (
        <div className="flex items-center justify-between border-b border-surface-100 py-4">
          <div className="flex-1 space-y-2">
            <L className="h-4 w-1/3" />
            <L className="h-5 w-1/4" />
            <L className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <C className="h-6 w-12 rounded-full" />
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClass}>
          <L className="w-full" />
          <L className="w-3/4" />
          <L className="w-1/2" />
        </div>
      );
  }
}
