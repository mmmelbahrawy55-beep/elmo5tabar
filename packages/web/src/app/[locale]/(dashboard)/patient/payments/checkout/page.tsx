'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { paymentClient } from '@/lib/api/payments';
import { toast } from 'sonner';

type PaymentMethod =
  | 'visa'
  | 'mastercard'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'cash'
  | 'wallet'
  | 'gift_card'
  | 'installments'
  | 'corporate';

interface InvoiceItem {
  id: string;
  name: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  patientId: string;
  patientName: string;
  patientNameAr: string;
  insuranceCoverage?: number;
  insurancePlan?: string;
  dueDate: string;
  createdAt: string;
}

interface WalletInfo {
  balance: number;
  currency: string;
}

interface GiftCardInfo {
  balance: number;
  valid: boolean;
}

interface CorporateAccountInfo {
  id: string;
  companyName: string;
  companyNameAr: string;
  creditLimit: number;
  creditRemaining: number;
  billingCycle: string;
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'visa', label: 'Visa', icon: '💳' },
  { key: 'mastercard', label: 'Mastercard', icon: '💳' },
  { key: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
  { key: 'google_pay', label: 'Google Pay', icon: '🔍' },
  { key: 'paypal', label: 'PayPal', icon: '🅿️' },
  { key: 'cash', label: 'Cash', icon: '💵' },
  { key: 'wallet', label: 'Wallet', icon: '👛' },
  { key: 'gift_card', label: 'Gift Card', icon: '🎁' },
  { key: 'installments', label: 'Installments', icon: '📅' },
  { key: 'corporate', label: 'Corporate', icon: '🏢' },
];

const INSTALLMENT_OPTIONS = [
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' },
];

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('visa');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [insuranceCoverage, setInsuranceCoverage] = useState<number | null>(null);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Wallet
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  // Gift card
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardInfo, setGiftCardInfo] = useState<GiftCardInfo | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  // Installments
  const [installmentMonths, setInstallmentMonths] = useState(3);

  // Corporate
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccountInfo[]>([]);
  const [selectedCorporateAccount, setSelectedCorporateAccount] = useState<string>('');
  const [corporateAccountInfo, setCorporateAccountInfo] = useState<CorporateAccountInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('invoiceId');
    if (invoiceId) {
      loadInvoice(invoiceId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMethod === 'wallet') {
      loadWallet();
    }
    if (selectedMethod === 'corporate') {
      loadCorporateAccounts();
    }
  }, [selectedMethod]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      const data = await paymentClient.getInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const data = await paymentClient.getWallet();
      setWallet(data);
    } catch {
      setWallet(null);
    }
  };

  const loadCorporateAccounts = async () => {
    try {
      const data = await paymentClient.getCorporateAccounts();
      setCorporateAccounts(data.accounts || data);
    } catch {
      setCorporateAccounts([]);
    }
  };

  useEffect(() => {
    if (selectedCorporateAccount) {
      loadCorporateAccountInfo(selectedCorporateAccount);
    }
  }, [selectedCorporateAccount]);

  const loadCorporateAccountInfo = async (id: string) => {
    try {
      const data = await paymentClient.getCorporateAccount(id);
      setCorporateAccountInfo(data);
    } catch {
      setCorporateAccountInfo(null);
    }
  };

  const validateCard = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const num = cardNumber.replace(/\s/g, '');

    if (num.length < 15 || num.length > 16) {
      errors.number = 'Invalid card number';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      errors.expiry = 'MM/YY format required';
    } else {
      const [month, year] = cardExpiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + year, month);
      if (expDate < now) errors.expiry = 'Card expired';
    }
    if (!/^\d{3,4}$/.test(cardCVC)) {
      errors.cvc = 'Invalid CVC';
    }
    if (!cardName.trim()) {
      errors.name = 'Name required';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  }, [cardNumber, cardExpiry, cardCVC, cardName]);

  const formatCardNumber = (value: string) => {
    const num = value.replace(/\D/g, '').slice(0, 16);
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const num = value.replace(/\D/g, '').slice(0, 4);
    if (num.length >= 2) return num.slice(0, 2) + '/' + num.slice(2);
    return num;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !invoice) return;
    setCouponError('');
    try {
      const result = await paymentClient.validateCoupon(couponCode, invoice.id);
      if (result.valid) {
        const discount = result.discountType === 'percentage'
          ? (invoice.subtotal * result.discountValue) / 100
          : result.discountValue;
        setDiscountAmount(Math.min(discount, invoice.subtotal));
        setCouponApplied(true);
        toast.success('Coupon applied successfully');
      } else {
        setCouponError(result.message || 'Invalid coupon');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
    }
  };

  const checkGiftCardBalance = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    try {
      const data = await paymentClient.getGiftCardBalance(giftCardCode);
      setGiftCardInfo(data);
    } catch {
      setGiftCardInfo(null);
      toast.error('Gift card not found');
    } finally {
      setGiftCardLoading(false);
    }
  };

  const getMonthlyAmount = () => {
    if (!invoice) return 0;
    const total = invoice.total - discountAmount - (insuranceCoverage || 0);
    return total / installmentMonths;
  };

  const getTotalAfterDiscount = () => {
    if (!invoice) return 0;
    return invoice.total - discountAmount - (insuranceCoverage || 0);
  };

  const isCardMethod = ['visa', 'mastercard'].includes(selectedMethod);
  const canPay =
    invoice &&
    ((isCardMethod && validateCard) ||
      selectedMethod === 'cash' ||
      selectedMethod === 'apple_pay' ||
      selectedMethod === 'google_pay' ||
      selectedMethod === 'paypal' ||
      (selectedMethod === 'wallet' && wallet && wallet.balance >= getTotalAfterDiscount()) ||
      (selectedMethod === 'gift_card' && giftCardInfo && giftCardInfo.valid && giftCardInfo.balance >= getTotalAfterDiscount()) ||
      (selectedMethod === 'installments') ||
      (selectedMethod === 'corporate' && selectedCorporateAccount && corporateAccountInfo));

  const handlePay = async () => {
    if (!invoice || processing) return;

    if (isCardMethod && !validateCard()) return;

    setProcessing(true);
    try {
      const payload: any = {
        invoiceId: invoice.id,
        method: selectedMethod,
        amount: getTotalAfterDiscount(),
        currency: invoice.currency,
      };

      if (isCardMethod) {
        payload.card = {
          number: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvc: cardCVC,
          name: cardName,
        };
      }

      if (selectedMethod === 'wallet') {
        payload.walletPay = true;
      }

      if (selectedMethod === 'gift_card') {
        payload.giftCardCode = giftCardCode;
      }

      if (selectedMethod === 'installments') {
        payload.installments = installmentMonths;
        payload.monthlyAmount = getMonthlyAmount();
      }

      if (selectedMethod === 'corporate') {
        payload.corporateAccountId = selectedCorporateAccount;
      }

      if (couponApplied && couponCode) {
        payload.couponCode = couponCode;
        payload.discount = discountAmount;
      }

      if (insuranceCoverage) {
        payload.insuranceCoverage = insuranceCoverage;
      }

      const result = await paymentClient.processPayment(payload);
      toast.success('Payment processed successfully');
      router.push(`/payments/${result.paymentId || result.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No invoice selected. Please select an invoice to proceed with checkout.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">{t('checkout.title', 'إتمام الدفع')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('checkout.selectMethod', 'اختر طريقة الدفع')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.key}
                  onClick={() => setSelectedMethod(method.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm ${
                    selectedMethod === method.key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{method.icon}</span>
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>

            {/* Card Input Form */}
            {isCardMethod && (
              <div className="mt-6 space-y-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.cardName', 'اسم حامل البطاقة')}</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="CARD HOLDER"
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm tracking-wider ${cardErrors.name ? 'border-destructive' : ''}`}
                  />
                  {cardErrors.name && <p className="text-destructive text-xs mt-1">{cardErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('checkout.cardNumber', 'رقم البطاقة')}</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm tracking-widest font-mono ${cardErrors.number ? 'border-destructive' : ''}`}
                  />
                  {cardErrors.number && <p className="text-destructive text-xs mt-1">{cardErrors.number}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('checkout.expiry', 'تاريخ الانتهاء')}</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono ${cardErrors.expiry ? 'border-destructive' : ''}`}
                    />
                    {cardErrors.expiry && <p className="text-destructive text-xs mt-1">{cardErrors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('checkout.cvc', 'رمز الأمان')}</label>
                    <input
                      type="text"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono ${cardErrors.cvc ? 'border-destructive' : ''}`}
                    />
                    {cardErrors.cvc && <p className="text-destructive text-xs mt-1">{cardErrors.cvc}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet */}
            {selectedMethod === 'wallet' && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                {wallet ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('checkout.walletBalance', 'رصيد المحفظة')}</p>
                      <p className="text-2xl font-bold">{wallet.balance.toLocaleString()} SAR</p>
                    </div>
                    {wallet.balance < getTotalAfterDiscount() && (
                      <p className="text-destructive text-sm">
                        {t('checkout.insufficientBalance', 'رصيد غير كافٍ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('checkout.noWallet', 'لا توجد محفظة مسجلة')}</p>
                )}
              </div>
            )}

            {/* Gift Card */}
            {selectedMethod === 'gift_card' && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                    placeholder={t('checkout.giftCardCode', 'كود بطاقة الهدايا')}
                    className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm font-mono tracking-wider"
                  />
                  <button
                    onClick={checkGiftCardBalance}
                    disabled={giftCardLoading || !giftCardCode}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {giftCardLoading ? '...' : t('checkout.check', 'تحقق')}
                  </button>
                </div>
                {giftCardInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('checkout.cardBalance', 'رصيد البطاقة')}</span>
                    <span className="font-bold">{giftCardInfo.balance.toLocaleString()} SAR</span>
                  </div>
                )}
              </div>
            )}

            {/* Installments */}
            {selectedMethod === 'installments' && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {INSTALLMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.months}
                      onClick={() => setInstallmentMonths(opt.months)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        installmentMonths === opt.months
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-bold text-lg">{opt.months}</p>
                      <p className="text-xs text-muted-foreground">{t('checkout.months', 'أشهر')}</p>
                      <p className="text-sm font-medium mt-1">
                        {getMonthlyAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                      </p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {t('checkout.installmentNote', 'سيتم خصم المبلغ شهرياً من طريقة الدفع المحددة')}
                </p>
              </div>
            )}

            {/* Corporate */}
            {selectedMethod === 'corporate' && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3">
                <select
                  value={selectedCorporateAccount}
                  onChange={(e) => setSelectedCorporateAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  <option value="">{t('checkout.selectAccount', 'اختر الحساب')}</option>
                  {corporateAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.companyNameAr || acc.companyName}
                    </option>
                  ))}
                </select>
                {corporateAccountInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('checkout.creditRemaining', 'الرصيد المتبقّي')}</span>
                    <span className="font-bold">{corporateAccountInfo.creditRemaining.toLocaleString()} SAR</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('checkout.coupon', 'كود الخصم')}</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t('checkout.couponPlaceholder', 'أدخل كود الخصم')}
                className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm tracking-wider"
                disabled={couponApplied}
              />
              {couponApplied ? (
                <button
                  onClick={() => {
                    setCouponApplied(false);
                    setCouponCode('');
                    setDiscountAmount(0);
                  }}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
                >
                  {t('checkout.remove', 'إزالة')}
                </button>
              ) : (
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {t('checkout.apply', 'تطبيق')}
                </button>
              )}
            </div>
            {couponError && <p className="text-destructive text-xs mt-2">{couponError}</p>}
            {couponApplied && <p className="text-green-600 text-xs mt-2">{t('checkout.couponApplied', 'تم تطبيق الخصم بنجاح')}</p>}
          </div>

          {/* Insurance Coverage */}
          {invoice.insuranceCoverage && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-2">{t('checkout.insurance', 'التغطية التأمينية')}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {t('checkout.insurancePlan', 'الخطة')}: {invoice.insurancePlan}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('coverageAmount', 'مبلغ التغطية')}</span>
                <span className="font-bold text-green-600">
                  {(invoice.insuranceCoverage || 0).toLocaleString()} SAR
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">{t('checkout.orderSummary', 'ملخص الطلب')}</h2>

            {/* Invoice Header */}
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-muted-foreground">
                {t('checkout.invoice', 'الفاتورة')} #{invoice.invoiceNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('checkout.patient', 'المريض')}: {invoice.patientNameAr || invoice.patientName}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4 pb-4 border-b max-h-48 overflow-y-auto">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.nameAr || item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.quantity} × {item.unitPrice.toLocaleString()} SAR
                    </p>
                  </div>
                  <span className="font-medium">{item.total.toLocaleString()} SAR</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkout.subtotal', 'المجموع الفرعي')}</span>
                <span>{invoice.subtotal.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('checkout.tax', 'الضريبة')} ({invoice.taxRate}%)</span>
                <span>{invoice.taxAmount.toLocaleString()} SAR</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('checkout.invoiceDiscount', 'خصم الفاتورة')}</span>
                  <span>-{invoice.discount.toLocaleString()} SAR</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('checkout.couponDiscount', 'خصم الكوبون')}</span>
                  <span>-{discountAmount.toLocaleString()} SAR</span>
                </div>
              )}
              {insuranceCoverage && insuranceCoverage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('checkout.insuranceCoverage', 'التغطية التأمينية')}</span>
                  <span>-{insuranceCoverage.toLocaleString()} SAR</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t text-base font-bold">
                <span>{t('checkout.total', 'المجموع')}</span>
                <span>{getTotalAfterDiscount().toLocaleString()} SAR</span>
              </div>
              {selectedMethod === 'installments' && (
                <div className="text-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    {installmentMonths}× {getMonthlyAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR/{t('checkout.month', 'شهر')}
                  </span>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={!canPay || processing}
              className="w-full mt-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  {t('checkout.processing', 'جاري المعالجة...')}
                </span>
              ) : (
                t('checkout.payNow', 'ادفع الآن') + ` ${getTotalAfterDiscount().toLocaleString()} SAR`
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('checkout.securePayment', 'جميع المعاملات آمنة ومشفرة')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
