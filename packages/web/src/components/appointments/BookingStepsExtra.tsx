'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  IdCard,
  Globe,
  FileText,
  Shield,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
  Check,
  Download,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Printer,
  MessageCircle,
  Send,
  QrCode,
  CheckCircle2,
  Star,
  ArrowLeft,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type {
  PatientInfo,
  PaymentInfo,
  AppointmentConfirmation,
  BookingService,
  BookingBranch,
  PaymentMethod,
} from '@/types/appointment';
import { PAYMENT_METHODS, INSURANCE_PROVIDERS } from '@/types/appointment';
import { cn } from '@/lib/utils';
import { ALL_TESTS } from '@/data/tests';

interface BookingSummaryLocal {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const INPUT =
  'w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder-surface-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-300';
const INPUT_ERROR = 'border-danger-400 focus:ring-danger-500 focus:border-danger-500';
const LABEL = 'block text-sm font-semibold text-surface-700 mb-1.5';
const ERROR_TEXT = 'mt-1 text-xs text-danger-600';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ============================================================
// STEP 5 — Patient Details
// ============================================================
interface Step5Props {
  patient: PatientInfo | null;
  onSubmit: (patient: PatientInfo) => void;
  language: 'ar' | 'en';
}

interface FormErrors {
  [key: string]: string;
}

export function Step5PatientDetails({ patient, onSubmit, language }: Step5Props) {
  const [form, setForm] = useState<PatientInfo>(
    patient ?? {
      firstNameAr: '',
      lastNameAr: '',
      firstNameEn: '',
      lastNameEn: '',
      phone: '',
      email: '',
      nationalId: '',
      gender: 'male',
      age: 0,
      dateOfBirth: '',
      insuranceProvider: '',
      insuranceNumber: '',
      insuranceExpiry: '',
      medicalNotes: '',
      preferredLanguage: 'ar',
      isExistingPatient: false,
      patientId: '',
    }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [saveData, setSaveData] = useState(false);

  const updateField = useCallback(
    (field: keyof PatientInfo, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const calculatedAge = useMemo(() => {
    if (!form.dateOfBirth) return 0;
    const dob = new Date(form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return Math.max(0, age);
  }, [form.dateOfBirth]);

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.firstNameAr.trim()) e.firstNameAr = 'الاسم الأول بالعربية مطلوب';
    if (!form.lastNameAr.trim()) e.lastNameAr = 'اسم العائلة بالعربية مطلوب';
    if (!form.firstNameEn.trim()) e.firstNameEn = 'First name in English is required';
    if (!form.lastNameEn.trim()) e.lastNameEn = 'Last name in English is required';

    const phoneClean = form.phone.replace(/\D/g, '');
    if (!phoneClean) e.phone = 'رقم الجوال مطلوب';
    else if (!/^(05\d{8}|5\d{8}|\+?9665\d{8})$/.test(phoneClean))
      e.phone = 'رقم الجوال غير صحيح (05XXXXXXXX)';

    if (!form.email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'البريد الإلكتروني غير صحيح';

    if (!form.nationalId.trim()) e.nationalId = 'رقم الهوية مطلوب';
    else if (!/^\d{10}$/.test(form.nationalId.replace(/\D/g, '')))
      e.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';

    if (!form.dateOfBirth) e.dateOfBirth = 'تاريخ الميلاد مطلوب';

    if (form.insuranceProvider && !form.insuranceNumber)
      e.insuranceNumber = 'رقم التأمين مطلوب';
    if (form.insuranceProvider && !form.insuranceExpiry)
      e.insuranceExpiry = 'انتهاء صلاحية التأمين مطلوب';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, age: calculatedAge });
  };

  const toggle = (field: keyof PatientInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateField(field, e.target.checked);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-surface-900 mb-2">بيانات المريض</h2>
        <p className="text-surface-500">أدخل بياناتك الشخصية لإتمام الحجز</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name Arabic */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-brand-500" />
              الاسم بالعربية
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="الاسم الأول"
              value={form.firstNameAr}
              onChange={(e) => updateField('firstNameAr', e.target.value)}
              className={cn(INPUT, errors.firstNameAr && INPUT_ERROR)}
              dir="rtl"
            />
            <input
              type="text"
              placeholder="اسم العائلة"
              value={form.lastNameAr}
              onChange={(e) => updateField('lastNameAr', e.target.value)}
              className={cn(INPUT, errors.lastNameAr && INPUT_ERROR)}
              dir="rtl"
            />
          </div>
          {(errors.firstNameAr || errors.lastNameAr) && (
            <p className={ERROR_TEXT}>{errors.firstNameAr || errors.lastNameAr}</p>
          )}
        </motion.div>

        {/* Name English */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-surface-400" />
              الاسم بالإنجليزية
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First Name"
              value={form.firstNameEn}
              onChange={(e) => updateField('firstNameEn', e.target.value)}
              className={cn(INPUT, errors.firstNameEn && INPUT_ERROR)}
              dir="ltr"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastNameEn}
              onChange={(e) => updateField('lastNameEn', e.target.value)}
              className={cn(INPUT, errors.lastNameEn && INPUT_ERROR)}
              dir="ltr"
            />
          </div>
          {(errors.firstNameEn || errors.lastNameEn) && (
            <p className={ERROR_TEXT}>{errors.firstNameEn || errors.lastNameEn}</p>
          )}
        </motion.div>

        {/* Phone */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-brand-500" />
              رقم الجوال
            </span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-surface-200 bg-surface-50 text-surface-500 text-sm font-medium">
              +966
            </span>
            <input
              type="tel"
              placeholder="5XXXXXXXX"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={cn(INPUT, 'rounded-r-none rounded-l-xl', errors.phone && INPUT_ERROR)}
              dir="ltr"
              maxLength={10}
            />
          </div>
          {errors.phone && <p className={ERROR_TEXT}>{errors.phone}</p>}
        </motion.div>

        {/* Email */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-brand-500" />
              البريد الإلكتروني
            </span>
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={cn(INPUT, errors.email && INPUT_ERROR)}
            dir="ltr"
          />
          {errors.email && <p className={ERROR_TEXT}>{errors.email}</p>}
        </motion.div>

        {/* National ID */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-brand-500" />
              رقم الهوية الوطنية
            </span>
          </label>
          <input
            type="text"
            placeholder="10 أرقام"
            value={form.nationalId}
            onChange={(e) => updateField('nationalId', e.target.value.replace(/\D/g, ''))}
            className={cn(INPUT, errors.nationalId && INPUT_ERROR)}
            dir="ltr"
            maxLength={10}
          />
          {errors.nationalId && <p className={ERROR_TEXT}>{errors.nationalId}</p>}
        </motion.div>

        {/* Gender */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>الجنس</label>
          <div className="flex gap-3 mt-1">
            {[
              { value: 'male' as const, label: 'ذكر', icon: '👨' },
              { value: 'female' as const, label: 'أنثى', icon: '👩' },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => updateField('gender', g.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium',
                  form.gender === g.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                )}
              >
                <span className="text-lg">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Date of Birth */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" />
              تاريخ الميلاد
            </span>
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className={cn(INPUT, errors.dateOfBirth && INPUT_ERROR)}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && <p className={ERROR_TEXT}>{errors.dateOfBirth}</p>}
        </motion.div>

        {/* Age (auto-calculated) */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>العمر</label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={calculatedAge ? `${calculatedAge} سنة` : '—'}
              className={cn(INPUT, 'bg-surface-50 cursor-not-allowed text-surface-700 font-semibold')}
            />
          </div>
        </motion.div>

        {/* Insurance Provider */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-500" />
              مزود التأمين
            </span>
          </label>
          <select
            value={form.insuranceProvider || ''}
            onChange={(e) => updateField('insuranceProvider', e.target.value)}
            className={cn(INPUT, 'appearance-none')}
          >
            <option value="">بدون تأمين</option>
            {INSURANCE_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Insurance Number (conditional) */}
        <AnimatePresence>
          {form.insuranceProvider && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, height: 0 }}
            >
              <label className={LABEL}>رقم التأمين</label>
              <input
                type="text"
                placeholder="أدخل رقم التأمين"
                value={form.insuranceNumber || ''}
                onChange={(e) => updateField('insuranceNumber', e.target.value)}
                className={cn(INPUT, errors.insuranceNumber && INPUT_ERROR)}
                dir="ltr"
              />
              {errors.insuranceNumber && <p className={ERROR_TEXT}>{errors.insuranceNumber}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insurance Expiry (conditional) */}
        <AnimatePresence>
          {form.insuranceProvider && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, height: 0 }}
            >
              <label className={LABEL}>انتهاء صلاحية التأمين</label>
              <input
                type="date"
                value={form.insuranceExpiry || ''}
                onChange={(e) => updateField('insuranceExpiry', e.target.value)}
                className={cn(INPUT, errors.insuranceExpiry && INPUT_ERROR)}
              />
              {errors.insuranceExpiry && <p className={ERROR_TEXT}>{errors.insuranceExpiry}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preferred Language */}
        <motion.div variants={fadeUp}>
          <label className={LABEL}>اللغة المفضلة</label>
          <div className="flex gap-3 mt-1">
            {[
              { value: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
              { value: 'en' as const, label: 'English', flag: '🇬🇧' },
            ].map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => updateField('preferredLanguage', l.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium',
                  form.preferredLanguage === l.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                )}
              >
                <span className="text-lg">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Medical Notes — Full width */}
      <motion.div variants={fadeUp} className="mt-5">
        <label className={LABEL}>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-500" />
            ملاحظات طبية
          </span>
        </label>
        <textarea
          placeholder="أي ملاحظات طبية أو حساسية أو أدوية تتناولها..."
          value={form.medicalNotes}
          onChange={(e) => updateField('medicalNotes', e.target.value)}
          className={cn(INPUT, 'min-h-[100px] resize-y')}
          dir="rtl"
          rows={3}
        />
      </motion.div>

      {/* Existing Patient Toggle */}
      <motion.div variants={fadeUp} className="mt-5 p-4 rounded-xl border border-surface-200 bg-surface-50">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.isExistingPatient}
              onChange={toggle('isExistingPatient')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-300 rounded-full peer-checked:bg-brand-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
          <div>
            <span className="font-semibold text-surface-800">هل أنت مريض سابق؟</span>
            <p className="text-xs text-surface-500">يمكنك استخدام رقم المريض السابق</p>
          </div>
        </label>
        <AnimatePresence>
          {form.isExistingPatient && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <input
                type="text"
                placeholder="رقم المريض السابق"
                value={form.patientId || ''}
                onChange={(e) => updateField('patientId', e.target.value)}
                className={cn(INPUT, 'bg-white')}
                dir="ltr"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Save Data Toggle */}
      <motion.div variants={fadeUp} className="mt-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={saveData}
              onChange={(e) => setSaveData(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-300 rounded-full peer-checked:bg-brand-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
          <div>
            <span className="font-semibold text-surface-800">حفظ البيانات</span>
            <p className="text-xs text-surface-500">احفظ بياناتك لاستخدامها في الحجوزات القادمة</p>
          </div>
        </label>
      </motion.div>

      {/* Submit */}
      <motion.div variants={fadeUp} className="mt-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-bold text-lg shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 active:scale-[0.98]"
        >
          متابعة إلى الدفع
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// STEP 6 — Payment
// ============================================================
interface Step6Props {
  payment: PaymentInfo | null;
  onSubmit: (payment: PaymentInfo) => void;
  summary: BookingSummaryLocal;
  service: BookingService | null;
}

export function Step6Payment({ payment, onSubmit, summary, service }: Step6Props) {
  const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'visa');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const [insuranceProv, setInsuranceProv] = useState('');
  const [insuranceCoverage, setInsuranceCoverage] = useState(70);

  const vat = summary.subtotal * 0.15;
  const totalAfterTax = summary.subtotal + vat - summary.discount;
  const finalTotal = totalAfterTax;

  const isCard = method === 'visa' || method === 'mastercard';
  const isWallet = method === 'apple-pay' || method === 'google-pay';
  const isInsurance = method === 'insurance';

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: '#1A1F71' };
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean))
      return { name: 'Mastercard', color: '#EB001B' };
    return null;
  }, [cardNumber]);

  const canPay = agreed && (!isCard || (cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length === 5 && cardCvv.length === 3 && cardName.trim()));

  const handlePay = () => {
    if (!canPay) return;
    setProcessing(true);

    setTimeout(() => {
      onSubmit({
        method,
        amount: summary.subtotal,
        currency: 'SAR',
        discount: summary.discount,
        tax: vat,
        total: finalTotal,
        insuranceCoverage: isInsurance ? (finalTotal * insuranceCoverage) / 100 : undefined,
        cardLast4: isCard ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: 'completed',
      });
    }, 2000);
  };

  const METHOD_ICONS: Record<string, React.ReactNode> = {
    visa: <CreditCard className="w-6 h-6" />,
    mastercard: <CreditCard className="w-6 h-6" />,
    'apple-pay': <Smartphone className="w-6 h-6" />,
    'google-pay': <Smartphone className="w-6 h-6" />,
    cash: <Banknote className="w-6 h-6" />,
    insurance: <Shield className="w-6 h-6" />,
    wallet: <Wallet className="w-6 h-6" />,
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Order Summary */}
      <motion.div
        variants={fadeUp}
        className="mb-8 p-6 rounded-2xl border border-surface-200 bg-white shadow-sm"
      >
        <h3 className="text-lg font-bold text-surface-900 mb-4">ملخص الطلب</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-surface-700">
            <span>الخدمة</span>
            <span className="font-semibold">{service?.nameAr || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-surface-700">
            <span>الفرع</span>
            <span className="font-semibold">فرع المختبر</span>
          </div>
          <div className="flex justify-between items-center text-surface-700">
            <span>التاريخ والوقت</span>
            <span className="font-semibold">—</span>
          </div>

          <div className="border-t border-surface-100 my-3" />

          <div className="flex justify-between text-surface-600">
            <span>المجموع الفرعي</span>
            <span>{summary.subtotal.toFixed(2)} ر.س</span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-success-600">
              <span>الخصم</span>
              <span>-{summary.discount.toFixed(2)} ر.س</span>
            </div>
          )}
          <div className="flex justify-between text-surface-600">
            <span>ضريبة القيمة المضافة (15%)</span>
            <span>{vat.toFixed(2)} ر.س</span>
          </div>
          {isInsurance && insuranceCoverage > 0 && (
            <div className="flex justify-between text-success-600">
              <span>تغطية التأمين ({insuranceCoverage}%)</span>
              <span>-{((finalTotal * insuranceCoverage) / 100).toFixed(2)} ر.س</span>
            </div>
          )}

          <div className="border-t-2 border-brand-200 my-3" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-surface-900">الإجمالي</span>
            <span className="text-2xl font-bold text-brand-600">
              {isInsurance
                ? (finalTotal - (finalTotal * insuranceCoverage) / 100).toFixed(2)
                : finalTotal.toFixed(2)}{' '}
              ر.س
            </span>
          </div>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-surface-900 mb-4">طريقة الدفع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.method}
              type="button"
              onClick={() => setMethod(pm.method)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                method === pm.method
                  ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                  : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm'
              )}
            >
              {method === pm.method && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${pm.color}15`, color: pm.color }}
              >
                {METHOD_ICONS[pm.method]}
              </div>
              <span className="text-sm font-semibold text-surface-800">{pm.nameAr}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Card Input Form */}
      <AnimatePresence>
        {isCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-6 rounded-2xl border border-surface-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-surface-900">بيانات البطاقة</h4>
              {cardBrand && (
                <span
                  className="text-sm font-bold px-3 py-1 rounded-lg"
                  style={{ backgroundColor: `${cardBrand.color}15`, color: cardBrand.color }}
                >
                  {cardBrand.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={LABEL}>رقم البطاقة</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className={cn(INPUT, 'font-mono tracking-wider')}
                    dir="ltr"
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                </div>
              </div>

              <div>
                <label className={LABEL}>تاريخ الانتهاء</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  className={cn(INPUT, 'font-mono')}
                  dir="ltr"
                  maxLength={5}
                />
              </div>

              <div>
                <label className={LABEL}>CVV</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="***"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className={cn(INPUT, 'font-mono')}
                    dir="ltr"
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={LABEL}>الاسم على البطاقة</label>
                <input
                  type="text"
                  placeholder="MOHAMMED ALI"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className={cn(INPUT)}
                  dir="ltr"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-surface-600">حفظ البطاقة للاستخدام المستقبلي</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Button */}
      <AnimatePresence>
        {isWallet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <button
              type="button"
              className={cn(
                'w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-200',
                method === 'apple-pay'
                  ? 'bg-black text-white hover:bg-surface-800'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              <Smartphone className="w-6 h-6" />
              {method === 'apple-pay' ? 'الدفع عبر Apple Pay' : 'الدفع عبر Google Pay'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Message */}
      <AnimatePresence>
        {method === 'cash' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-5 rounded-xl bg-success-50 border border-success-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="font-bold text-success-800">ادفع نقداً عند الوصول</p>
                <p className="text-sm text-success-600">
                  يُرجى إحضار المبلغ المطلوب عند حضورك للفرع
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insurance Selection */}
      <AnimatePresence>
        {isInsurance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-6 rounded-2xl border border-surface-200 bg-white shadow-sm"
          >
            <h4 className="font-bold text-surface-900 mb-4">بيانات التأمين</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>مزود التأمين</label>
                <select
                  value={insuranceProv}
                  onChange={(e) => setInsuranceProv(e.target.value)}
                  className={cn(INPUT, 'appearance-none')}
                >
                  <option value="">اختر مزود التأمين</option>
                  {INSURANCE_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>نسبة التغطية (%)</label>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={insuranceCoverage}
                    onChange={(e) => setInsuranceCoverage(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-500 bg-surface-200"
                  />
                  <div className="text-center mt-2 text-lg font-bold text-brand-600">
                    {insuranceCoverage}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Balance */}
      {method === 'wallet' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-5 rounded-xl bg-warning-50 border border-warning-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-warning-600" />
              <div>
                <p className="font-bold text-warning-800">المحفظة الإلكترونية</p>
                <p className="text-sm text-warning-600">الرصيد المتاح: 1,250.00 ر.س</p>
              </div>
            </div>
            <span className="text-sm font-bold text-success-600">يكفي</span>
          </div>
        </motion.div>
      )}

      {/* Terms */}
      <motion.div variants={fadeUp} className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-surface-600 leading-relaxed">
            أوافق على{' '}
            <span className="text-brand-600 font-semibold underline">شروط الخدمة</span>
            {' '}و{' '}
            <span className="text-brand-600 font-semibold underline">سياسة الخصوصية</span>
          </span>
        </label>
      </motion.div>

      {/* Pay Button */}
      <motion.div variants={fadeUp} className="mt-8">
        <button
          onClick={handlePay}
          disabled={!canPay || processing}
          className={cn(
            'w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3',
            canPay && !processing
              ? 'bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl active:scale-[0.98]'
              : 'bg-surface-200 text-surface-400 cursor-not-allowed'
          )}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جارٍ المعالجة...
            </>
          ) : (
            <>
              ادفع {finalTotal.toFixed(2)} ر.س
              <Send className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// STEP 7 — Confirmation
// ============================================================
interface Step7Props {
  confirmation: AppointmentConfirmation;
  onNewBooking: () => void;
  onViewAppointments: () => void;
}

export function Step7Confirmation({ confirmation, onNewBooking, onViewAppointments }: Step7Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(confirmation.bookingNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `ALMOKHTABAR-${confirmation.bookingNumber}-${confirmation.id}`
      )}`,
    [confirmation]
  );

  const formattedDate = useMemo(() => {
    const d = new Date(confirmation.date);
    return d.toLocaleDateString('ar-SA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [confirmation.date]);

  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
    `تأكيد حجزك في المختبرඔ්‍ර\nرقم الحجز: ${confirmation.bookingNumber}\nالخدمة: ${confirmation.service.nameAr}\nالتاريخ: ${formattedDate}\nالوقت: ${confirmation.time}`
  )}`;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      {/* Success Animation */}
      <motion.div variants={fadeUp} className="flex flex-col items-center mb-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative"
        >
          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * Math.PI) / 4) * 80,
                y: Math.sin((i * Math.PI) / 4) * 80,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  i % 3 === 0 ? '#0077B6' : i % 3 === 1 ? '#10B981' : '#F59E0B',
              }}
            />
          ))}

          {/* Circle + Check */}
          <svg width="120" height="120" viewBox="0 0 120 120" className="relative z-10">
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#10B981"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
            <motion.path
              d="M36 60 L52 76 L84 44"
              fill="none"
              stroke="#10B981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            />
          </svg>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center mt-6">
          <h2 className="text-3xl font-bold text-surface-900 mb-2">تم تأكيد حجزك بنجاح!</h2>
          <p className="text-surface-500">تم إرسال تفاصيل الحجز إلى هاتفك وبريدك الإلكتروني</p>
        </motion.div>
      </motion.div>

      {/* Booking Number */}
      <motion.div
        variants={fadeUp}
        className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 text-center"
      >
        <p className="text-sm font-medium text-brand-600 mb-2">رقم الحجز</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold text-brand-700 font-mono tracking-wider">
            {confirmation.bookingNumber}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/60 hover:bg-white transition-colors"
            title="نسخ رقم الحجز"
          >
            {copied ? (
              <Check className="w-5 h-5 text-success-600" />
            ) : (
              <Copy className="w-5 h-5 text-brand-600" />
            )}
          </button>
        </div>

        {/* QR Code */}
        <div className="mt-5 flex justify-center">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <img src={qrUrl} alt="QR Code" width={160} height={160} className="rounded-lg" />
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-2">امسح الرمز للحصول على تفاصيل الحجز</p>

        {/* Barcode */}
        <div className="mt-4">
          <p className="text-xs text-surface-400 mb-1">رقم الباركود</p>
          <p className="text-lg font-mono font-bold text-surface-700 tracking-[0.3em]">
            {confirmation.barcode}
          </p>
        </div>
      </motion.div>

      {/* Appointment Details */}
      <motion.div
        variants={fadeUp}
        className="mb-8 p-6 rounded-2xl border border-surface-200 bg-white shadow-sm"
      >
        <h3 className="text-lg font-bold text-surface-900 mb-5">تفاصيل الموعد</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">الخدمة</p>
              <p className="font-semibold text-surface-800">{confirmation.service.nameAr}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">الفرع</p>
              <p className="font-semibold text-surface-800">{confirmation.branch.nameAr}</p>
              <p className="text-sm text-surface-500">{confirmation.branch.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">التاريخ</p>
              <p className="font-semibold text-surface-800">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">الوقت</p>
              <p className="font-semibold text-surface-800">
                {confirmation.time} — وقت الانتهاء المتوقع: {confirmation.estimatedEndTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">المريض</p>
              <p className="font-semibold text-surface-800">
                {confirmation.patient.firstNameAr} {confirmation.patient.lastNameAr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">المبلغ المدفوع</p>
              <p className="font-bold text-lg text-success-700">
                {confirmation.payment.total.toFixed(2)} ر.س
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share / Download Actions */}
      <motion.div variants={fadeUp} className="mb-8">
        <h3 className="text-lg font-bold text-surface-900 mb-4">الإجراءات</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Download, label: 'تحميل الفاتورة PDF', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { icon: Calendar, label: 'إضافة للتقويم', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { icon: MessageCircle, label: 'مشاركة عبر واتساب', color: 'text-green-600 bg-green-50 hover:bg-green-100', href: whatsAppUrl },
            { icon: Mail, label: 'مشاركة عبر البريد', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
            { icon: Send, label: 'مشاركة عبر الرسائل', color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
            { icon: Copy, label: 'نسخ رقم الحجز', color: 'text-surface-600 bg-surface-50 hover:bg-surface-100', onClick: handleCopy },
            { icon: Printer, label: 'طباعة', color: 'text-surface-600 bg-surface-50 hover:bg-surface-100' },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => action.onClick?.()}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors duration-200',
                action.color
              )}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Notifications Confirmation */}
      <motion.div
        variants={fadeUp}
        className="mb-8 p-6 rounded-2xl bg-success-50 border border-success-200"
      >
        <h3 className="text-lg font-bold text-success-800 mb-4">تأكيد الإشعارات</h3>
        <div className="space-y-3">
          {[
            { label: 'تم إرسال تأكيد عبر الرسائل القصيرة (SMS)', icon: '✉️' },
            { label: 'تم إرسال تأكيد عبر البريد الإلكتروني', icon: '📧' },
            { label: 'تم إرسال تأكيد عبر واتساب', icon: '💬' },
            { label: 'تفعيل الإشعارات الفورية', icon: '📱' },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
              <span className="text-sm font-medium text-success-700">
                {n.icon} {n.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={onNewBooking}
          className="flex-1 py-4 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-bold text-lg shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          حجز موعد جديد
        </button>
        <button
          onClick={onViewAppointments}
          className="flex-1 py-4 rounded-xl border-2 border-brand-500 text-brand-600 font-bold text-lg hover:bg-brand-50 transition-all"
        >
          عرض مواعيدي
        </button>
        <button
          onClick={onNewBooking}
          className="py-4 px-6 rounded-xl text-surface-500 font-semibold hover:bg-surface-100 transition-colors"
        >
          العودة للرئيسية
        </button>
      </motion.div>

      {/* What's Next */}
      <motion.div variants={fadeUp} className="mb-10">
        <h3 className="text-lg font-bold text-surface-900 mb-4">ماذا بعد؟</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              icon: '🩺',
              title: 'استعد للتحليل',
              description: 'تأكد من الالتزام بالصيام إذا كان التحليل يتطلب ذلك، واحضر الهوية الوطنية وبطاقة التأمين إن وجدت.',
            },
            {
              step: '02',
              icon: '🗺️',
              title: 'توجه للفرع',
              description: 'توجه إلى الفرع قبل 15 دقيقة من موعدك. يمكنك استخدام الخريطة للحصول على أقرب طريق.',
            },
            {
              step: '03',
              icon: '📋',
              title: 'استلم نتائجك',
              description: 'ستكون نتائجج جاهزة خلال 24-48 ساعة. ستتلقى إشعاراً عبر البريد الإلكتروني والرسائل القصيرة.',
            },
          ].map((card, i) => (
            <motion.div
              key={card.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-5 rounded-2xl border border-surface-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-lg">
                  الخطوة {card.step}
                </span>
              </div>
              <h4 className="font-bold text-surface-900 mb-2">{card.title}</h4>
              <p className="text-sm text-surface-500 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
