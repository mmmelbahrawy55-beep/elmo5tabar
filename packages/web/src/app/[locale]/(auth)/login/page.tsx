'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

function AnimatedInput({ label, type = 'text', value, onChange, error, icon, dir = 'rtl', placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; icon?: React.ReactNode; dir?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 z-10">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          dir={dir}
          placeholder={placeholder}
          className={`peer w-full px-4 pt-5 pb-2 ${icon ? 'ps-11' : ''} rounded-xl border-2 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm outline-none transition-all duration-300
            ${error ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
              : focused ? 'border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'}`}
        />
        <label className={`absolute ${icon ? 'start-11' : 'start-4'} top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 text-sm transition-all duration-300 pointer-events-none
          ${isActive ? 'start-4 !-translate-y-[1.4rem] text-xs font-medium ' + (focused ? 'text-brand-500' : 'text-surface-400') : ''}`}>
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { login, loginWithOTP } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const t = (key: string): string => {
    const translations: Record<string, string> = {
      email: 'البريد الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب',
      emailInvalid: 'البريد الإلكتروني غير صالح',
      password: 'كلمة المرور',
      passwordRequired: 'كلمة المرور مطلوبة',
      passwordMinLength: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      emailOrPhoneRequired: 'البريد الإلكتروني أو رقم الهاتف مطلوب',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginFailed: 'فشل تسجيل الدخول',
      otpSent: 'تم إرسال رمز OTP',
      otpFailed: 'فشل إرسال رمز OTP',
      otpCodeRequired: 'رمز OTP مطلوب',
      otpVerifyFailed: 'فشل التحقق من رمز OTP',
      twoFactorCodeRequired: 'كود التحقق مطلوب',
      twoFactorVerifyFailed: 'فشل التحقق بخطوتين',
      biometricNotSupported: 'البصمة غير مدعومة في هذا الجهاز',
      biometricInitiating: 'جاري تهيئة تسجيل الدخول بالبصمة',
      biometricFailed: 'فشل تسجيل الدخول بالبصمة',
      sendingOtp: 'جاري الإرسال...',
      sendOtp: 'إرسال الرمز',
      enterOtp: 'أدخل رمز التحقق',
      verifyOtp: 'تحقق من الرمز',
      verifying: 'جاري التحقق...',
      verify: 'تحقق',
      changeEmailOrPhone: 'تغيير البريد الإلكتروني أو رقم الهاتف',
      twoFactorTitle: 'التحقق بخطوتين',
      twoFactorDescription: 'أدخل الرمز المكون من 6 أرقام المرسل إلى جهازك',
      cancel: 'إلغاء',
      attemptsRemaining: 'لديك {count} محاولات متبقية',
    };
    return translations[key] || key;
  };

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpEmailOrPhone, setOtpEmailOrPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (mode === 'password') {
      if (!email) newErrors.email = t('emailRequired');
      else if (!validateEmail(email)) newErrors.email = t('emailInvalid');
      if (!password) newErrors.password = t('passwordRequired');
      else if (password.length < 8) newErrors.password = t('passwordMinLength');
    } else {
      if (!otpEmailOrPhone) newErrors.otpEmailOrPhone = t('emailOrPhoneRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresTwoFactor) {
        setShow2FAModal(true);
      } else {
        addToast(t('loginSuccess'), 'success');
        const role = result.user?.role;
        const redirectMap: Record<string, string> = {
          PATIENT: `/${locale}/patient`,
          DOCTOR: `/${locale}/doctor`,
          ADMIN: `/${locale}/admin`,
          SUPER_ADMIN: `/${locale}/admin`,
          RECEPTIONIST: `/${locale}/reception`,
        };
        router.push(redirectMap[role] || `/${locale}/patient`);
      }
    } catch (err: any) {
      const msg = err.message || t('loginFailed');
      addToast(msg);
      if (msg.includes('attempts')) {
        const match = msg.match(/(\d+)/);
        if (match) setAttemptsRemaining(parseInt(match[1]));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSend = async () => {
    if (!otpEmailOrPhone) { setErrors({ otpEmailOrPhone: t('emailOrPhoneRequired') }); return; }
    setLoading(true);
    try {
      await loginWithOTP(otpEmailOrPhone);
      setOtpSent(true);
      addToast(t('otpSent'), 'success');
    } catch (err: any) {
      addToast(err.message || t('otpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otpCode || otpCode.length !== 6) { setErrors({ otpCode: t('otpCodeRequired') }); return; }
    setLoading(true);
    try {
      const { authClient } = await import('@/lib/api/auth');
      await authClient.verifyOTP(otpCode, otpEmailOrPhone);
      addToast(t('loginSuccess'), 'success');
      router.push(`/${locale}/patient`);
    } catch (err: any) {
      addToast(err.message || t('otpVerifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) { setErrors({ twoFactorCode: t('twoFactorCodeRequired') }); return; }
    setLoading(true);
    try {
      const { authClient } = await import('@/lib/api/auth');
      await authClient.verify2FA(twoFactorCode);
      setShow2FAModal(false);
      addToast(t('loginSuccess'), 'success');
      router.push(`/${locale}/patient`);
    } catch (err: any) {
      addToast(err.message || t('twoFactorVerifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    const { authClient } = await import('@/lib/api/auth');
    window.location.href = authClient.getOAuthUrl(provider);
  };

  return (
    <div className="animate-[fade-in-up_0.5s_ease-out]">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl shadow-lg shadow-brand-500/25 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">مرحباً بعودتك</h1>
        <p className="text-surface-500 dark:text-surface-400">سجّل دخولك للوصول إلى لوحة التحكم</p>
      </div>

      {/* Mode tabs */}
      <div className="flex mb-6 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {(['password', 'otp'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === m
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {m === 'password' ? 'كلمة المرور' : 'الرمز OTP'}
          </button>
        ))}
      </div>

      {/* Form */}
      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <AnimatedInput
            label={t('email')}
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />

          <div className="relative">
            <AnimatedInput
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              error={errors.password}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute start-11 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 z-10"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-lg border-2 border-surface-300 dark:border-surface-600 peer-checked:border-brand-500 peer-checked:bg-brand-500 transition-all duration-200 flex items-center justify-center">
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400 group-hover:text-surface-800 dark:group-hover:text-surface-200 transition-colors">تذكرني</span>
            </label>
            <Link href={`/${locale}/forgot-password`} className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">
              نسيت كلمة المرور؟
            </Link>
          </div>

          {attemptsRemaining !== null && (
            <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
              <p className="text-sm text-warning-700 dark:text-warning-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {`لديك ${attemptsRemaining} محاولات متبقية`}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3.5 px-4 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-l from-brand-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </>
              )}
            </span>
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {!otpSent ? (
            <>
              <AnimatedInput
                label={t('emailOrPhone')}
                value={otpEmailOrPhone}
                onChange={setOtpEmailOrPhone}
                error={errors.otpEmailOrPhone}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              />
              <button
                onClick={handleOTPSend}
                disabled={loading}
                className="group relative w-full py-3.5 px-4 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-l from-brand-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  )}
                  {loading ? 'جاري الإرسال...' : 'إرسال الرمز'}
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="text-center p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                <svg className="w-10 h-10 text-brand-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <p className="text-sm text-brand-700 dark:text-brand-300">تم إرسال الرمز إلى البريد الإلكتروني أو رقم الهاتف</p>
              </div>
              <AnimatedInput
                label="أدخل الرمز المكون من 6 أرقام"
                value={otpCode}
                onChange={(v) => setOtpCode(v.replace(/\D/g, '').slice(0, 6))}
                error={errors.otpCode}
                dir="ltr"
                placeholder="000000"
              />
              <button
                onClick={handleOTPVerify}
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3.5 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التحقق...' : 'تحقق من الرمز'}
              </button>
              <button onClick={() => { setOtpSent(false); setOtpCode(''); }} className="w-full py-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                تغيير البريد الإلكتروني أو رقم الهاتف
              </button>
            </>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-slate-900 text-surface-400">أو تابع بـ</span>
        </div>
      </div>

      {/* OAuth */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { provider: 'google', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> },
          { provider: 'apple', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg> },
          { provider: 'facebook', icon: <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg> },
        ].map(({ provider, icon }) => (
          <button
            key={provider}
            onClick={() => handleOAuth(provider)}
            className="flex items-center justify-center py-3 px-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-300"
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Biometric */}
      <button
        onClick={() => addToast(t('biometricNotSupported'), 'warning')}
        className="w-full mt-4 py-3 px-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-surface-600 dark:text-surface-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
        تسجيل الدخول بالبصمة
      </button>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        ليس لديك حساب؟{' '}
        <Link href={`/${locale}/register`} className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-semibold transition-colors">
          أنشئ حساباً جديداً
        </Link>
      </p>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]" dir="rtl">
          <div className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-8 w-full max-w-md animate-[scale-in_0.3s_ease-out] border border-surface-100 dark:border-surface-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">التحقق بخطوتين</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">أدخل الرمز المكون من 6 أرقام المرسل إلى جهازك</p>
            </div>
            <input
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`w-full px-4 py-4 rounded-xl border-2 text-center text-3xl tracking-[0.5em] font-mono bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 transition-all duration-300
                ${errors.twoFactorCode ? 'border-danger-400' : 'border-surface-200 dark:border-surface-700 focus:border-brand-400'}`}
              placeholder="000000"
              maxLength={6}
              dir="ltr"
            />
            {errors.twoFactorCode && <p className="mt-2 text-sm text-danger-500 text-center">{errors.twoFactorCode}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShow2FAModal(false); setTwoFactorCode(''); }}
                className="flex-1 py-3 px-4 border-2 border-surface-200 dark:border-surface-700 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-300 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handle2FAVerify}
                disabled={loading || twoFactorCode.length !== 6}
                className="flex-1 py-3 px-4 bg-gradient-to-l from-brand-600 to-brand-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التحقق...' : 'تحقق'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-5 end-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3.5 rounded-2xl shadow-xl max-w-sm flex items-center gap-3 backdrop-blur-sm animate-[slide-in-right_0.3s_ease-out] ${
              toast.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' :
              toast.type === 'warning' ? 'bg-warning-50 text-warning-700 border border-warning-200' :
              'bg-danger-50 text-danger-700 border border-danger-200'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-success-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ) : toast.type === 'warning' ? (
              <svg className="w-5 h-5 text-warning-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-5 h-5 text-danger-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="me-auto opacity-60 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
