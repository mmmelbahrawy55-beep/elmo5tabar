'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * AuthGuard — protects dashboard routes from unauthenticated access.
 *
 * It reads the auth tokens from localStorage (same keys used by the
 * dashboard layout and the axios client). While checking it shows a
 * lightweight loader, and if the user is not authenticated it redirects
 * to the locale-aware login page.
 */
export function AuthGuard({ children, locale }: { children: ReactNode; locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'authenticated'>('checking');

  useEffect(() => {
    let isMounted = true;

    const verify = () => {
      let isAuthenticated = false;
      try {
        // The app stores tokens under both key styles; accept either.
        const accessToken =
          localStorage.getItem('access_token') || localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');
        isAuthenticated = !!accessToken || !!user;
      } catch {
        isAuthenticated = false;
      }

      if (!isAuthenticated) {
        const loginPath = `/${locale}/login`;
        const current = pathname || '';
        // Avoid redirect loops when already on a public/auth page.
        if (!current.includes('/login') && !current.includes('/register')) {
          const returnUrl = encodeURIComponent(current);
          router.replace(`${loginPath}?redirect=${returnUrl}`);
          return;
        }
      }

      if (isMounted) setStatus('authenticated');
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [router, pathname, locale]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-surface-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
