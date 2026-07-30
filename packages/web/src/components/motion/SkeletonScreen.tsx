'use client';

import { SkeletonCard } from './SkeletonCard';
import { cn } from '@/lib/utils';

interface SkeletonScreenProps {
  page: 'home' | 'appointments' | 'results' | 'profile' | 'branches' | 'payment';
}

function SectionTitle({ className }: { className?: string }) {
  return (
    <div className={cn('h-6 w-1/4 rounded bg-surface-200 animate-pulse', className)} />
  );
}

export function SkeletonScreen({ page }: SkeletonScreenProps) {
  switch (page) {
    case 'home':
      return (
        <div className="space-y-6 p-6">
          <div className="h-48 w-full overflow-hidden rounded-2xl">
            <div className="h-full w-full animate-pulse bg-surface-200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} variant="card" />
            ))}
          </div>
          <SectionTitle />
          <SkeletonCard variant="appointment" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-surface-200 animate-pulse" />
            ))}
          </div>
        </div>
      );

    case 'appointments':
      return (
        <div className="space-y-6 p-6">
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 rounded-full bg-surface-200 animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} variant="appointment" />
            ))}
          </div>
        </div>
      );

    case 'results':
      return (
        <div className="space-y-6 p-6">
          <div className="h-12 w-full rounded-xl bg-surface-200 animate-pulse" />
          <div className="flex gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-surface-200 animate-pulse" />
            ))}
          </div>
          <div className="divide-y divide-surface-100 rounded-xl border border-surface-200 bg-white p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} variant="result" />
            ))}
          </div>
        </div>
      );

    case 'profile':
      return (
        <div className="space-y-6 p-6">
          <SkeletonCard variant="profile" />
          <div className="space-y-4 rounded-xl border border-surface-200 bg-white p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="h-4 w-1/4 rounded bg-surface-200 animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-surface-200 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-4">
                <div className="h-6 w-6 rounded bg-surface-200 animate-pulse" />
                <div className="h-4 flex-1 rounded bg-surface-200 animate-pulse" />
                <div className="h-4 w-4 rounded bg-surface-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'branches':
      return (
        <div className="space-y-6 p-6">
          <div className="h-64 w-full overflow-hidden rounded-2xl">
            <div className="h-full w-full animate-pulse bg-surface-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} variant="card" />
            ))}
          </div>
        </div>
      );

    case 'payment':
      return (
        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <div className="space-y-4">
              <div className="h-6 w-1/3 rounded bg-surface-200 animate-pulse" />
              <div className="h-12 w-1/2 rounded bg-surface-200 animate-pulse" />
              <div className="flex gap-4">
                <div className="h-4 w-1/4 rounded bg-surface-200 animate-pulse" />
                <div className="h-4 w-1/4 rounded bg-surface-200 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-surface-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-1/3 rounded bg-surface-200 animate-pulse" />
                  <div className="h-4 w-1/6 rounded bg-surface-200 animate-pulse" />
                </div>
                <div className="h-3 w-2/3 rounded bg-surface-200 animate-pulse" />
                <div className="h-3 w-1/4 rounded bg-surface-200 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-4">
            <SectionTitle />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-100 p-4">
                  <div className="h-6 w-6 rounded-full bg-surface-200 animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-surface-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
