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

const COUNTRY_CODES = [
  { code: '+20', flag: '🇪🇬', name: 'مصر' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', flag: '🇴🇲', name: 'عُمان' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا' },
];

const DEMO_CREDENTIALS = [
  { role: 'مدير النظام', phone: '+201012345678', password: 'Admin@123', icon: '👤' },
  { role: 'طبيب', phone: '+201055512345', password: 'Doctor@123', icon: '🩺' },
  { role: 'استقبال', phone: '+201055567890', password: 'Reception@123', icon: '🧑‍💼' },
];

export default function StaffLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+20');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!phone) newErrors.phone = 'رقم الهاتف مطلوب';
    else if (!/^\d{8,15}$/.test(phone)) newErrors.phone = 'رقم الهاتف غير صالح';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const result = await login(fullPhone, password);
      addToast('تم تسجيل الدخول بنجاح', 'success');

      const role = result.user?.role;
      const redirectMap: Record<string, string> = {
        PATIENT: `/${locale}/patient`,
        DOCTOR: `/${locale}/doctor`,
        ADMIN: `/${locale}/admin`,
        SUPER_ADMIN: `/${locale}/admin`,
        RECEPTIONIST: `/${locale}/reception`,
      };
      router.push(redirectMap[role] || `/${locale}/admin`);
    } catch (err: any) {
      addToast(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (phone: string, password: string) => {
    const fullNumber = phone.replace(/^\+\d+/, '');
    setPhone(fullNumber);
    setPassword(password);
    setErrors({});
  };

  return (
    <div className="animate-[fade-in-up_0.5s_ease-out]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">دخول الموظفين</h1>
        <p className="text-surface-500 dark:text-surface-400">سجّل دخولك للوصول إلى لوحة التحكم</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            رقم الهاتف <span className="text-danger-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-32 px-3 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            >
              {COUNTRY_CODES.map((cc) => (
                <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
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
          {errors.phone && (
            <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            كلمة المرور <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className={`w-full ps-11 pe-12 py-3 rounded-xl border-2 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm outline-none transition-all duration-300
                ${errors.password
                  ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 z-10"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center">
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
            <span className="text-sm text-surface-600 dark:text-surface-400 group-hover:text-surface-800 dark:group-hover:text-surface-200 transition-colors">
              تذكرني
            </span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full py-3.5 px-4 bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-l from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                تسجيل الدخول
                <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-6 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">بيانات الدخول التجريبية:</span>
        </div>
        <div className="space-y-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.role}
              onClick={() => fillDemoCredentials(cred.phone, cred.password)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 text-start group"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{cred.icon}</span>
                <div>
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cred.role}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500" dir="ltr">
                    {cred.phone}
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-surface-300 dark:text-surface-600 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200 dark:border-surface-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-slate-900 text-surface-400">أو</span>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <Link
          href={`/${locale}/login`}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-300 text-surface-600 dark:text-surface-300 font-medium text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          ليس موظف؟ سجّل دخول المريض
        </Link>
        <Link
          href={`/${locale}`}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>

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
              <svg className="w-5 h-5 text-success-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : toast.type === 'warning' ? (
              <svg className="w-5 h-5 text-warning-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-danger-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="me-auto opacity-60 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
