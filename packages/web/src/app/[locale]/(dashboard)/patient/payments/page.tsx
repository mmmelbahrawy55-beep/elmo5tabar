'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { paymentClient } from '@/lib/api/payments';
import { toast } from 'sonner';

interface PaymentSummary {
  totalPaid: number;
  pending: number;
  refunded: number;
  walletBalance: number;
}

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: string;
  currency: string;
  createdAt: string;
  invoiceId: string;
}

interface PaginatedResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'مدفوع' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'مدفوع' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'قيد الانتظار' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'قيد المعالجة' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'فشل' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'مسترد' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ملغى' },
  voided: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ملغى' },
};

const METHOD_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
  cash: 'نقدي',
  wallet: 'محفظة',
  gift_card: 'بطاقة هدايا',
  installments: 'تقسيط',
  corporate: 'شركي',
};

export default function PaymentHistoryPage() {
  const t = useTranslations();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    pending: 0,
    refunded: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [paymentsData, statsData, walletData] = await Promise.all([
        paymentClient.getPaymentHistory(params),
        paymentClient.getPaymentStats({ dateFrom, dateTo }),
        paymentClient.getWallet().catch(() => null),
      ]);

      setPayments(paymentsData.data || paymentsData.payments || []);
      setTotalPages(paymentsData.totalPages || Math.ceil((paymentsData.total || 0) / limit));
      setTotal(paymentsData.total || 0);

      setSummary({
        totalPaid: statsData.totalPaid || 0,
        pending: statsData.pending || 0,
        refunded: statsData.refunded || 0,
        walletBalance: walletData?.balance || 0,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportToCSV = () => {
    const headers = ['رقم الفاتورة', 'المبلغ', 'طريقة الدفع', 'الحالة', 'التاريخ'];
    const rows = payments.map((p) => [
      p.invoiceNumber,
      `${p.amount} ${p.currency}`,
      METHOD_LABELS[p.method] || p.method,
      STATUS_CONFIG[p.status]?.label || p.status,
      new Date(p.createdAt).toLocaleDateString('ar-SA'),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: t('history.totalPaid', 'المدفوع'),
      value: summary.totalPaid,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('history.pending', 'قيد الانتظار'),
      value: summary.pending,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: t('history.refunded', 'المسترد'),
      value: summary.refunded,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: t('history.walletBalance', 'رصيد المحفظة'),
      value: summary.walletBalance,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{t('history.title', 'سجل المدفوعات')}</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('history.exportCSV', 'تصدير CSV')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
              {card.value.toLocaleString()} SAR
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t('history.status', 'الحالة')}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            >
              <option value="">{t('history.all', 'الكل')}</option>
              <option value="completed">{t('status.completed', 'مدفوع')}</option>
              <option value="pending">{t('status.pending', 'قيد الانتظار')}</option>
              <option value="failed">{t('status.failed', 'فشل')}</option>
              <option value="refunded">{t('status.refunded', 'مسترد')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('history.method', 'طريقة الدفع')}</label>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            >
              <option value="">{t('history.all', 'الكل')}</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
              <option value="paypal">PayPal</option>
              <option value="cash">{t('method.cash', 'نقدي')}</option>
              <option value="wallet">{t('method.wallet', 'محفظة')}</option>
              <option value="gift_card">{t('method.giftCard', 'بطاقة هدايا')}</option>
              <option value="installments">{t('method.installments', 'تقسيط')}</option>
              <option value="corporate">{t('method.corporate', 'شركي')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('history.dateFrom', 'من تاريخ')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('history.dateTo', 'إلى تاريخ')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right px-4 py-3 font-medium">{t('history.invoice', 'الفاتورة')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('history.amount', 'المبلغ')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('history.method', 'الطريقة')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('history.status', 'الحالة')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('history.date', 'التاريخ')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('history.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {t('history.noPayments', 'لا توجد مدفوعات')}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={payment.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/payments/${payment.invoiceId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{payment.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {METHOD_LABELS[payment.method] || payment.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/payments/${payment.id}`}
                            className="text-primary text-xs hover:underline"
                          >
                            {t('history.view', 'عرض')}
                          </Link>
                          {payment.status === 'completed' || payment.status === 'paid' ? (
                            <button
                              onClick={async () => {
                                try {
                                  const receipt = await paymentClient.generatePaymentReceipt(payment.id);
                                  const blob = new Blob([receipt.html || receipt], { type: 'text/html' });
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                } catch (err: any) {
                                  toast.error(err.message);
                                }
                              }}
                              className="text-primary text-xs hover:underline"
                            >
                              {t('history.receipt', 'إيصال')}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              {t('history.showing', 'عرض')} {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{' '}
              {t('history.of', 'من')} {total}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              >
                {t('history.prev', 'السابق')}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded border text-sm ${
                      page === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              >
                {t('history.next', 'التالي')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
