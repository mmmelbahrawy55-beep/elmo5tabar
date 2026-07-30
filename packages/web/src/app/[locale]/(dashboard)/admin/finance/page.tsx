'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { paymentClient } from '@/lib/api/payments';
import { toast } from 'sonner';

interface KPIData {
  totalRevenue: number;
  outstanding: number;
  refunds: number;
  collectionRate: number;
  activeSubscriptions: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface MethodDistribution {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

interface AgingBucket {
  label: string;
  range: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CorporateAccount {
  id: string;
  companyName: string;
  companyNameAr: string;
  balance: number;
  outstanding: number;
  lastPayment: string;
}

interface LargePayment {
  id: string;
  amount: number;
  method: string;
  patientName: string;
  invoiceNumber: string;
  createdAt: string;
}

interface FraudAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminFinanceDashboard() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [kpi, setKpi] = useState<KPIData>({
    totalRevenue: 0,
    outstanding: 0,
    refunds: 0,
    collectionRate: 0,
    activeSubscriptions: 0,
  });
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [methodDistribution, setMethodDistribution] = useState<MethodDistribution[]>([]);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([]);
  const [largePayments, setLargePayments] = useState<LargePayment[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;

      const [stats, revenue, methods, aging, corpAccounts, corpReport, fraud] = await Promise.all([
        paymentClient.getPaymentStats(params).catch(() => ({
          totalRevenue: 0,
          outstanding: 0,
          refunds: 0,
          collectionRate: 0,
        })),
        paymentClient.getRevenueReport(params).catch(() => ({ data: [] })),
        paymentClient.getMethodReport(params).catch(() => ({ data: [] })),
        paymentClient.getAgingReport(params).catch(() => ({ data: [] })),
        paymentClient.getCorporateAccounts({ limit: 10, sortBy: 'outstanding', sortOrder: 'desc' }).catch(() => ({ data: [] })),
        paymentClient.getCorporateReport().catch(() => ({ data: [] })),
        paymentClient.getFraudAlerts({ status: 'open', limit: 5 }).catch(() => ({ data: [] })),
      ]);

      setKpi({
        totalRevenue: stats.totalRevenue || 0,
        outstanding: stats.outstanding || 0,
        refunds: stats.refunds || 0,
        collectionRate: stats.collectionRate || 0,
        activeSubscriptions: stats.activeSubscriptions || 0,
      });

      setRevenueData(revenue.data || revenue.monthly || []);
      setMethodDistribution(methods.data || methods.methods || []);
      setAgingBuckets(aging.data || aging.buckets || []);
      setCorporateAccounts((corpAccounts.data || corpAccounts.accounts || []).slice(0, 10));
      setLargePayments(corpReport.recentLargePayments || []);
      setFraudAlerts(fraud.data || fraud.alerts || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: t('finance.totalRevenue', 'إجمالي الإيرادات'),
      value: kpi.totalRevenue,
      icon: '💰',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('finance.outstanding', 'المستحقات'),
      value: kpi.outstanding,
      icon: '📋',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: t('finance.refunds', 'المرتجعات'),
      value: kpi.refunds,
      icon: '↩️',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: t('finance.collectionRate', 'نسبة التحصيل'),
      value: kpi.collectionRate,
      icon: '📊',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isPercentage: true,
    },
    {
      label: t('finance.activeSubscriptions', 'الاشتراكات النشطة'),
      value: kpi.activeSubscriptions,
      icon: '🔄',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      isCount: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{t('finance.title', 'لوحة المالية')}</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
              {card.isPercentage
                ? `${card.value.toFixed(1)}%`
                : card.isCount
                ? card.value.toLocaleString()
                : `${card.value.toLocaleString()} SAR`}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.revenueChart', 'الإيرادات الشهرية')}</h2>
          <div className="h-64">
            <RevenueChart data={revenueData} />
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.methodDistribution', 'توزيع طرق الدفع')}</h2>
          <div className="h-64">
            <MethodPieChart data={methodDistribution} />
          </div>
        </div>
      </div>

      {/* Aging Report */}
      <div className="bg-card rounded-xl border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('finance.agingReport', 'تقرير أعمار الذمم')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right px-4 py-3 font-medium">{t('finance.bucket', 'الفئة')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('finance.range', 'النطاق')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('finance.amount', 'المبلغ')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('finance.count', 'العدد')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('finance.percentage', 'النسبة')}</th>
              </tr>
            </thead>
            <tbody>
              {agingBuckets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('finance.noAgingData', 'لا توجد بيانات')}
                  </td>
                </tr>
              ) : (
                agingBuckets.map((bucket, i) => {
                  const colors = ['text-green-600', 'text-yellow-600', 'text-orange-600', 'text-red-600', 'text-red-800'];
                  return (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{bucket.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{bucket.range}</td>
                      <td className={`px-4 py-3 font-medium ${colors[i] || ''}`}>
                        {bucket.amount.toLocaleString()} SAR
                      </td>
                      <td className="px-4 py-3">{bucket.count}</td>
                      <td className="px-4 py-3">{bucket.percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Corporate Accounts */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.topCorporate', 'أكبر 10 حسابات شركية')}</h2>
          <div className="space-y-3">
            {corporateAccounts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{t('finance.noAccounts', 'لا توجد حسابات')}</p>
            ) : (
              corporateAccounts.map((acc, i) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{acc.companyNameAr || acc.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('finance.lastPayment', 'آخر دفعة')}: {acc.lastPayment ? new Date(acc.lastPayment).toLocaleDateString('ar-SA') : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{acc.outstanding.toLocaleString()} SAR</p>
                    <p className="text-xs text-muted-foreground">
                      {t('finance.limit', 'الحد')}: {acc.balance.toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Large Payments */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.largePayments', 'المدفوعات الكبيرة الأخيرة')}</h2>
          <div className="space-y-3">
            {largePayments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{t('finance.noPayments', 'لا توجد مدفوعات')}</p>
            ) : (
              largePayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{p.patientName}</p>
                    <p className="text-xs text-muted-foreground">#{p.invoiceNumber}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-green-600">{p.amount.toLocaleString()} SAR</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fraud Alerts */}
      <div className="bg-card rounded-xl border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('finance.fraudAlerts', 'تنبيهات الاحتيال')}</h2>
          <Link href="/fraud/alerts" className="text-sm text-primary hover:underline">
            {t('finance.viewAll', 'عرض الكل')}
          </Link>
        </div>
        {fraudAlerts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            {t('finance.noFraudAlerts', 'لا توجد تنبيهات احتيال نشطة')}
          </p>
        ) : (
          <div className="space-y-3">
            {fraudAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-600' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.type} — {alert.amount.toLocaleString()} SAR
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  alert.status === 'open' ? 'bg-red-100 text-red-800' :
                  alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{t('finance.quickActions', 'إجراءات سريعة')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            href="/invoices/create"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <span className="text-xl">📄</span>
            <span className="font-medium text-sm">{t('finance.createInvoice', 'إنشاء فاتورة')}</span>
          </Link>
          <Link
            href="/refunds/create"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <span className="text-xl">↩️</span>
            <span className="font-medium text-sm">{t('finance.processRefund', 'معالجة مرتجع')}</span>
          </Link>
          <Link
            href="/gift-cards/purchase"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <span className="text-xl">🎁</span>
            <span className="font-medium text-sm">{t('finance.purchaseGiftCard', 'شراء بطاقة هدايا')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Simple Bar Chart (Revenue) ──────────────────────────────────
function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.amount));

  return (
    <div className="flex items-end gap-1 h-full pt-4">
      {data.map((d, i) => {
        const height = maxVal > 0 ? (d.amount / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {d.amount >= 1000 ? `${(d.amount / 1000).toFixed(0)}K` : d.amount}
            </span>
            <div
              className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${d.month}: ${d.amount.toLocaleString()} SAR`}
            />
            <span className="text-[10px] text-muted-foreground">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Simple Pie Chart (Methods) ─────────────────────────────────
const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function MethodPieChart({ data }: { data: MethodDistribution[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex items-center gap-6 h-full">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.reduce<{ elements: JSX.Element[]; cumulative: number }>(
            (acc, d, i) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              const dasharray = `${pct} ${100 - pct}`;
              acc.elements.push(
                <circle
                  key={i}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={PIE_COLORS[i % PIE_COLORS.length]}
                  strokeWidth="3.5"
                  strokeDasharray={dasharray}
                  strokeDashoffset={-acc.cumulative}
                />,
              );
              acc.cumulative += pct;
              return acc;
            },
            { elements: [], cumulative: 0 },
          ).elements}
        </svg>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="flex-1 truncate">{d.method}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
