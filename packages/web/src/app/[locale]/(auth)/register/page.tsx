'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

interface FormData {
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptHIPAA: boolean;
}

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

function AnimatedInput({ label, type = 'text', value, onChange, error, icon, dir = 'rtl', placeholder, required = false }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; icon?: React.ReactNode; dir?: string; placeholder?: string; required?: boolean;
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
          {label} {required && <span className="text-danger-500">*</span>}
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

function AnimatedSelect({ label, value, onChange, options, error, icon, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string; icon?: React.ReactNode; required?: boolean;
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
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 pt-5 pb-2 ${icon ? 'ps-11' : ''} rounded-xl border-2 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm outline-none transition-all duration-300 appearance-none
            ${error ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
              : focused ? 'border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'}`}
        >
          <option value="">{label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className={`absolute ${icon ? 'start-11' : 'start-4'} top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 text-sm transition-all duration-300 pointer-events-none
          ${isActive ? 'start-4 !-translate-y-[1.4rem] text-xs font-medium ' + (focused ? 'text-brand-500' : 'text-surface-400') : ''}`}>
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
        <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
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

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const { register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');
  const [animating, setAnimating] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstNameAr: '', lastNameAr: '', firstNameEn: '', lastNameEn: '',
    gender: '', dateOfBirth: '', email: '', phone: '', countryCode: '+20',
    password: '', confirmPassword: '', acceptTerms: false, acceptPrivacy: false, acceptHIPAA: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['ضعيف جداً', 'ضعيف', 'متوسط', 'قوي', 'قوي جداً'];
  const strengthColors = ['bg-danger-500', 'bg-orange-500', 'bg-warning-500', 'bg-lime-500', 'bg-success-500'];

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.firstNameAr) e.firstNameAr = t('firstNameArRequired');
    if (!formData.lastNameAr) e.lastNameAr = t('lastNameArRequired');
    if (!formData.gender) e.gender = t('genderRequired');
    if (!formData.dateOfBirth) e.dateOfBirth = t('dateOfBirthRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.email) e.email = t('emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = t('emailInvalid');
    if (!formData.phone) e.phone = t('phoneRequired');
    else if (!/^\d{8,15}$/.test(formData.phone)) e.phone = t('phoneInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.password) e.password = t('passwordRequired');
    else if (formData.password.length < 8) e.password = t('passwordMinLength');
    if (!formData.confirmPassword) e.confirmPassword = t('confirmPasswordRequired');
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = t('passwordsDoNotMatch');
    if (!formData.acceptTerms) e.acceptTerms = t('termsRequired');
    if (!formData.acceptPrivacy) e.acceptPrivacy = t('privacyRequired');
    if (!formData.acceptHIPAA) e.acceptHIPAA = t('hipaaRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) { setAnimating(true); setTimeout(() => { setStep(2); setAnimating(false); }, 200); }
    else if (step === 2 && validateStep2()) { setAnimating(true); setTimeout(() => { setStep(3); setAnimating(false); }, 200); }
  };
  const handleBack = () => { setAnimating(true); setTimeout(() => { setStep(step - 1); setAnimating(false); }, 200); };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await register({
        email: formData.email,
        phone: `${formData.countryCode}${formData.phone}`,
        password: formData.password,
        firstNameAr: formData.firstNameAr,
        lastNameAr: formData.lastNameAr,
        firstNameEn: formData.firstNameEn || undefined,
        lastNameEn: formData.lastNameEn || undefined,
      });
      setEmailForVerification(formData.email);
      setVerificationSent(true);
    } catch (err: any) {
      addToast(err.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    const { authClient } = require('@/lib/api/auth');
    window.location.href = authClient.getOAuthUrl(provider);
  };

  if (verificationSent) {
    return (
      <div className="animate-[fade-in-up_0.5s_ease-out]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-3xl mb-6 animate-[scale-in_0.5s_ease-out_0.2s_both]">
            <svg className="w-10 h-10 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">تم إرسال رمز التحقق</h1>
          <p className="text-surface-500 dark:text-surface-400 mb-8">
            تم إرسال رمز التحقق إلى <span className="font-semibold text-surface-700 dark:text-surface-200">{emailForVerification}</span>. تحقق من بريدك الإلكتروني وأكمل التسجيل.
          </p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 w-full py-3.5 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 justify-center"
          >
            الذهاب لتسجيل الدخول
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  const stepTitles = ['المعلومات الشخصية', 'بيانات التواصل', 'الأمان والقانونية'];
  const stepIcons = [
    <svg key="1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    <svg key="2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    <svg key="3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  ];

  return (
    <div className="animate-[fade-in-up_0.5s_ease-out]">
      {/* Brand header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl shadow-lg shadow-brand-500/25 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">إنشاء حساب جديد</h1>
        <p className="text-surface-500 dark:text-surface-400">انضم إلى منصة المختبر وابدأ رحلتك الصحية</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl text-sm font-semibold transition-all duration-500 ${
              s < step ? 'bg-success-500 text-white shadow-lg shadow-success-500/25' :
              s === step ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 scale-110' :
              'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500'
            }`}>
              {s < step ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                stepIcons[s - 1]
              )}
              {s === step && (
                <div className="absolute -inset-1 rounded-2xl bg-brand-500/20 animate-pulse" />
              )}
            </div>
            {s < 3 && (
              <div className={`w-12 sm:w-16 h-1 mx-1.5 rounded-full transition-all duration-700 ${
                s < step ? 'bg-success-400' : 'bg-surface-200 dark:bg-surface-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
          {stepTitles[step - 1]}
        </h2>
        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
          الخطوة {step} من 3
        </p>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className={`space-y-4 transition-all duration-300 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <div className="grid grid-cols-2 gap-4">
            <AnimatedInput label="الاسم الأول" value={formData.firstNameAr} onChange={(v) => updateFormData('firstNameAr', v)} error={errors.firstNameAr} required
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            <AnimatedInput label="اسم العائلة" value={formData.lastNameAr} onChange={(v) => updateFormData('lastNameAr', v)} error={errors.lastNameAr} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AnimatedInput label="First Name" value={formData.firstNameEn} onChange={(v) => updateFormData('firstNameEn', v)} dir="ltr" />
            <AnimatedInput label="Last Name" value={formData.lastNameEn} onChange={(v) => updateFormData('lastNameEn', v)} dir="ltr" />
          </div>
          <AnimatedSelect label="الجنس" value={formData.gender} onChange={(v) => updateFormData('gender', v)} error={errors.gender} required
            options={[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
          <AnimatedInput label="تاريخ الميلاد" type="date" value={formData.dateOfBirth} onChange={(v) => updateFormData('dateOfBirth', v)} error={errors.dateOfBirth} required />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className={`space-y-4 transition-all duration-300 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <AnimatedInput label="البريد الإلكتروني" type="email" value={formData.email} onChange={(v) => updateFormData('email', v)} error={errors.email} dir="ltr" required
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">رقم الهاتف <span className="text-danger-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => updateFormData('countryCode', e.target.value)}
                className="w-32 px-3 py-3.5 rounded-xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 text-surface-900 dark:text-white text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-300"
              >
                {countryCodes.map((cc) => (
                  <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
                ))}
              </select>
              <AnimatedInput label="رقم الهاتف" value={formData.phone} onChange={(v) => updateFormData('phone', v.replace(/\D/g, ''))} error={errors.phone} dir="ltr" required
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className={`space-y-4 transition-all duration-300 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <div className="relative">
            <AnimatedInput label="كلمة المرور" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(v) => updateFormData('password', v)} error={errors.password} dir="ltr" required
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute start-11 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 z-10">
              {showPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>

          {formData.password && (
            <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-surface-200 dark:bg-surface-700'}`} />
                ))}
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">
                قوة كلمة المرور: <span className="font-semibold">{strengthLabels[passwordStrength - 1] || strengthLabels[0]}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '8 أحرف على الأقل', check: formData.password.length >= 8 },
                  { label: 'حرف كبير', check: /[A-Z]/.test(formData.password) },
                  { label: 'حرف صغير', check: /[a-z]/.test(formData.password) },
                  { label: 'رقم', check: /[0-9]/.test(formData.password) },
                  { label: 'رمز خاص', check: /[^A-Za-z0-9]/.test(formData.password) },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-1.5 ${item.check ? 'text-success-600 dark:text-success-400' : 'text-surface-400 dark:text-surface-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.check ? 'bg-success-100 dark:bg-success-900/30' : 'bg-surface-100 dark:bg-surface-800'}`}>
                      {item.check ? <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : <div className="w-1.5 h-1.5 rounded-full bg-surface-300 dark:bg-surface-600" />}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <AnimatedInput label="تأكيد كلمة المرور" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(v) => updateFormData('confirmPassword', v)} error={errors.confirmPassword} dir="ltr" required
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {[
              { key: 'acceptTerms', label: 'أوافق على شروط الاستخدام', link: '/terms' },
              { key: 'acceptPrivacy', label: 'أوافق على سياسة الخصوصية', link: '/privacy' },
              { key: 'acceptHIPAA', label: 'أوافق على تفويض حماية البيانات الصحية (HIPAA)', link: '/hipaa' },
            ].map(({ key, label, link }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof FormData] as boolean}
                    onChange={(e) => updateFormData(key as keyof FormData, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-lg border-2 border-surface-300 dark:border-surface-600 peer-checked:border-brand-500 peer-checked:bg-brand-500 transition-all duration-200 flex items-center justify-center">
                    {(formData[key as keyof FormData] as boolean) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-surface-600 dark:text-surface-400 group-hover:text-surface-800 dark:group-hover:text-surface-200 transition-colors">
                  {label} <Link href={link} className="text-brand-500 hover:text-brand-600 underline" onClick={(e) => e.stopPropagation()}>اضغط هنا</Link>
                </span>
              </label>
            ))}
            {errors.acceptTerms && <p className="text-xs text-danger-500">{errors.acceptTerms}</p>}
            {errors.acceptPrivacy && <p className="text-xs text-danger-500">{errors.acceptPrivacy}</p>}
            {errors.acceptHIPAA && <p className="text-xs text-danger-500">{errors.acceptHIPAA}</p>}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button onClick={handleBack} className="flex-1 py-3.5 px-4 border-2 border-surface-200 dark:border-surface-700 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-300 font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            السابق
          </button>
        )}
        <button
          onClick={step === 3 ? handleSubmit : handleNext}
          disabled={loading}
          className={`${step === 1 ? 'w-full' : 'flex-1'} group relative py-3.5 px-4 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
        >
          <span className="absolute inset-0 bg-gradient-to-l from-brand-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                جاري التسجيل...
              </>
            ) : step === 3 ? (
              <>
                إنشاء الحساب
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </>
            ) : (
              <>
                التالي
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </>
            )}
          </span>
        </button>
      </div>

      {/* OAuth */}
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
          <button key={provider} onClick={() => handleOAuth(provider)} className="flex items-center justify-center py-3 px-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-300">
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

      {/* Toasts */}
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
