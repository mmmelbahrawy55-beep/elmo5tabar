'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function GoogleConsentContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'ar';
  const state = searchParams.get('state') || '';
  const redirectUri = sessionStorage.getItem('oauth_redirect_uri') || `${window.location.origin}/${locale}/callback/google`;

  const handleContinue = () => {
    const mockCode = crypto.randomUUID();
    sessionStorage.setItem('oauth_code', mockCode);
    const separator = redirectUri.includes('?') ? '&' : '?';
    router.push(`${redirectUri}${separator}code=${mockCode}&state=${state}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-8 border border-surface-100 dark:border-surface-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-surface-100">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            {locale === 'ar' ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google'}
          </h1>
          <p className="text-surface-500 dark:text-surface-400">
            {locale === 'ar'
              ? 'قم بالاتصال بحسابك للوصول إلى المختبر'
              : 'Connect your account to access Al Mokhtabar'}
          </p>
        </div>

        <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-4 mb-6 border border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              GU
            </div>
            <div>
              <p className="font-medium text-surface-900 dark:text-white text-sm">
                {locale === 'ar' ? 'مستخدم Google' : 'Google User'}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                user@gmail.com
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {locale === 'ar' ? 'سيتم السماح لـ المختبر بـ:' : 'Al Mokhtabar will be allowed to:'}
          </p>
          {[
            locale === 'ar' ? 'عرض معلومات ملفك الشخصي' : 'View your profile information',
            locale === 'ar' ? 'الوصول إلى بريدك الإلكتروني' : 'Access your email address',
            locale === 'ar' ? 'إنشاء حساب مرتبط' : 'Create a linked account',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {item}
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3.5 bg-gradient-to-l from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {locale === 'ar' ? 'المتابعة بحساب Google' : 'Continue as Google User'}
        </button>

        <button
          onClick={() => {
            const loginPath = `/${locale}/login`;
            router.push(loginPath);
          }}
          className="w-full mt-3 py-3 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors font-medium"
        >
          {locale === 'ar' ? 'إلغاء والعودة لتسجيل الدخول' : 'Cancel and go back'}
        </button>
      </div>
    </div>
  );
}

export default function GoogleConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GoogleConsentContent />
    </Suspense>
  );
}
