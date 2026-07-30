'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  priority?: boolean;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
}

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  placeholderSrc,
  priority = false,
  className,
  wrapperClassName,
  sizes = '100vw',
  loading,
  onLoad,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  return (
    <div
      className={cn('relative overflow-hidden bg-surface-100', wrapperClassName)}
      style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined, aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Low-res placeholder */}
      {placeholderSrc && !loaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Actual image */}
      {!error ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading || 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={sizes}
          onLoad={handleLoad}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-surface-200 text-surface-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
