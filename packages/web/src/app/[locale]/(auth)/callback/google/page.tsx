'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'ar';
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setError(locale === 'ar' ? 'رمز التحقق مطلوب' : 'Authorization code is required');
      setLoading(false);
      return;
    }

    const savedState = sessionStorage.getItem('oauth_state');
    if (state && savedState && state !== savedState) {
      setError(locale === 'ar' ? 'خطأ في التحقق من الحالة' : 'State verification failed');
      setLoading(false);
      return;
    }
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_redirect_uri');

    const exchangeCode = async () => {
      try {
        const response = await fetch('/api/v1/auth/oauth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        const data = await response.json();

        localStorage.setItem('access_token', data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        const redirectMap: Record<string, string> = {
          PATIENT: `/${locale}/patient`,
          DOCTOR: `/${locale}/doctor`,
          ADMIN: `/${locale}/admin`,
          SUPER_ADMIN: `/${locale}/admin`,
          RECEPTIONIST: `/${locale}/reception`,
        };

        router.push(redirectMap[data.user.role] || `/${locale}/patient`);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || (locale === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during login'));
        setLoading(false);
      }
    };

    exchangeCode();
  }, [code, state, locale, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-8 border border-surface-100 dark:border-surface-800 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
            {locale === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed'}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full py-3 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-8 border border-surface-100 dark:border-surface-800 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
          {locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing you in...'}
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          {locale === 'ar' ? 'يرجى الانتظار بينما نكمل تسجيل الدخول' : 'Please wait while we complete your sign in'}
        </p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
