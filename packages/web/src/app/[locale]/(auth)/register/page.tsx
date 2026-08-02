'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const countryCodes = [
  { code: '+20', country: 'مصر', flag: '🇪🇬' },
  { code: '+966', country: 'السعودية', flag: '🇸🇦' },
  { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
  { code: '+965', country: 'الكويت', flag: '🇰🇼' },
  { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  { code: '+968', country: 'عُمان', flag: '🇴🇲' },
  { code: '+974', country: 'قطر', flag: '🇶🇦' },
  { code: '+961', country: 'لبنان', flag: '🇱🇧' },
  { code: '+962', country: 'الأردن', flag: '🇯🇴' },
  { code: '+218', country: 'ليبيا', flag: '🇱🇾' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+20');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const getPasswordStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['ضعيف جداً', 'ضعيف', 'متوسط', 'قوي', 'قوي جداً'];
  const strengthColors = ['bg-danger-500', 'bg-orange-500', 'bg-warning-500', 'bg-lime-500', 'bg-success-500'];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    else if (!/^\d{8,15}$/.test(phone.replace(/\D/g, ''))) e.phone = 'رقم الهاتف غير صالح';
    if (!password) e.password = 'كلمة المرور مطلوبة';
    else if (password.length < 6) e.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (!confirmPassword) e.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    else if (password !== confirmPassword) e.confirmPassword = 'كلمتا المرور غير متطابقتين';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        phone: `${countryCode}${phone}`,
        password,
        firstNameAr: 'مستخدم',
        lastNameAr: 'جديد',
      });
      addToast('تم التسجيل بنجاح', 'success');
      router.push(`/${locale}/login`);
    } catch (err: any) {
      addToast(err.message || 'فشل التسجيل', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fade-in-up_0.5s_ease-out]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl shadow-lg shadow-brand-500/25 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">إنشاء حساب جديد</h1>
        <p className="text-surface-500 dark:text-surface-400">سجّل برقم هاتفك وكلمة المرور</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">رقم الهاتف <span className="text-danger-500">*</span></label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-32 px-3 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            >
              {countryCodes.map((cc) => (
                <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="1012345678"
                dir="ltr"
                className="w-full ps-10 pe-4 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-danger-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">كلمة المرور <span className="text-danger-500">*</span></label>
          <div className="relative">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              dir="ltr"
              className="w-full ps-10 pe-10 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              {showPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-danger-500">{errors.password}</p>}

          {password && (
            <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-surface-200 dark:bg-surface-700'}`} />
                ))}
              </div>
              <p className="text-xs text-surface-500">
                قوة كلمة المرور: <span className="font-semibold">{strengthLabels[passwordStrength - 1] || strengthLabels[0]}</span>
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">تأكيد كلمة المرور <span className="text-danger-500">*</span></label>
          <div className="relative">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              dir="ltr"
              className="w-full ps-10 pe-10 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              {showConfirmPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-danger-500">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              جاري التسجيل...
            </span>
          ) : (
            'إنشاء الحساب'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-slate-900 text-surface-400">أو سجّل بـ</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { provider: 'google', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> },
          { provider: 'apple', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg> },
          { provider: 'facebook', icon: <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg> },
        ].map(({ provider, icon }) => (
          <button key={provider} onClick={async () => { const { authClient } = await import('@/lib/api/auth'); window.location.href = authClient.getOAuthUrl(provider); }} className="flex items-center justify-center py-3 px-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-300">
            {icon}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        لديك حساب بالفعل؟{' '}
        <Link href={`/${locale}/login`} className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-semibold transition-colors">
          سجّل الدخول
        </Link>
      </p>

      <div className="fixed top-5 end-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={`px-5 py-3.5 rounded-2xl shadow-xl max-w-sm flex items-center gap-3 backdrop-blur-sm animate-[slide-in-right_0.3s_ease-out] ${
            toast.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' :
            toast.type === 'warning' ? 'bg-warning-50 text-warning-700 border border-warning-200' :
            'bg-danger-50 text-danger-700 border border-danger-200'
          }`}>
            {toast.type === 'success' ? <svg className="w-5 h-5 text-success-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> :
              toast.type === 'warning' ? <svg className="w-5 h-5 text-warning-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
              <svg className="w-5 h-5 text-danger-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            }
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
