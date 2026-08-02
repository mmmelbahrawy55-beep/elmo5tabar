'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authClient } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authClient.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          {locale === 'ar' ? 'تم الإرسال' : 'Email Sent'}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm mb-6">
          {locale === 'ar' ? 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' : 'A password reset link has been sent to your email'}
        </p>
        <Link
          href={`/${locale}/login`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          {locale === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين' : 'Enter your email and we will send you a reset link'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={locale === 'ar' ? 'example@email.com' : 'example@email.com'}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-3 pl-10 pr-4 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 transition-colors"
        >
          {loading ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (locale === 'ar' ? 'إرسال رمز إعادة التعيين' : 'Send Reset Link')}
        </button>

        <Link
          href={`/${locale}/login`}
          className="flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
        </Link>
      </form>
    </div>
  );
}
