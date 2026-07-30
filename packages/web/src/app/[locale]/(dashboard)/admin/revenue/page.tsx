'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Building2,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  PiggyBank,
  Receipt,
  AlertCircle,
  Filter,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent, Dropdown, DropdownItem } from '@/design-system/navigation/Tabs';
import { BarChart, DonutChart, DonutLegend, Sparkline, MetricRow } from '@/design-system/data/ChartCard';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ExportButton } from '@/components/admin/ExportButton';

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

const dateRangeLabels: Record<DateRange, string> = {
  today: 'اليوم',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'هذا الربع',
  year: 'هذا العام',
};

const monthlyRevenue = [
  { label: 'يناير', value: 185000 },
  { label: 'فبراير', value: 198000 },
  { label: 'مارس', value: 215000 },
  { label: 'أبريل', value: 192000 },
  { label: 'مايو', value: 235000 },
  { label: 'يونيو', value: 248000 },
  { label: 'يوليو', value: 262000 },
  { label: 'أغسطس', value: 285000 },
  { label: 'سبتمبر', value: 255000 },
  { label: 'أكتوبر', value: 298000 },
  { label: 'نوفمبر', value: 312000 },
  { label: 'ديسمبر', value: 345000 },
];

const revenueByCategory = [
  { label: 'تحاليل طبية', value: 1850000, color: '#0077B6' },
  { label: 'حزم فحوصات', value: 680000, color: '#10B981' },
  { label: 'خدمات خاصة', value: 420000, color: '#F59E0B' },
  { label: 'تأمين صحي', value: 350000, color: '#8B5CF6' },
];

const dailyRevenue = [
  8500, 12300, 9800, 15200, 11500, 14800, 16200, 13500, 18900, 15600,
  17200, 19800, 16500, 20100, 18500, 22300, 19800, 21500, 24200, 20800,
  23500, 25100, 22800, 26500, 24200, 27800, 25500, 28900, 26200, 29500,
];

const paymentMethods = [
  { method: 'نقداً', transactions: 1250, amount: 485000, percentage: 28, trend: 5.2 },
  { method: 'فيزا/ماستركارد', transactions: 980, amount: 620000, percentage: 35, trend: 12.8 },
  { method: 'أبل باي', transactions: 420, amount: 285000, percentage: 16, trend: 22.5 },
  { method: 'تحويل بنكي', transactions: 185, amount: 245000, percentage: 14, trend: -3.1 },
  { method: 'تأمين صحي', transactions: 256, amount: 125000, percentage: 7, trend: 8.4 },
];

const insuranceClaims = [
  { company: 'شركة بوبا', claims: 145, amount: 125000, pending: 12, approved: 128, rejected: 5 },
  { company: 'شركة معاد', claims: 98, amount: 85000, pending: 8, approved: 86, rejected: 4 },
  { company: 'شركة ألفا', claims: 75, amount: 62000, pending: 5, approved: 68, rejected: 2 },
  { company: 'الشركة السعودية', claims: 65, amount: 55000, pending: 7, approved: 54, rejected: 4 },
  { company: 'شركة وفا', claims: 42, amount: 38000, pending: 3, approved: 37, rejected: 2 },
];

const outstandingPayments = [
  { patient: 'أحمد بن سعيد', amount: 1250, date: '2026-07-15', daysOverdue: 13 },
  { patient: 'فاطمة الزهراء', amount: 850, date: '2026-07-20', daysOverdue: 8 },
  { patient: 'خالد الشمري', amount: 2100, date: '2026-07-10', daysOverdue: 18 },
  { patient: 'نورة الحربي', amount: 650, date: '2026-07-22', daysOverdue: 6 },
  { patient: 'عبدالله المطيري', amount: 1800, date: '2026-07-18', daysOverdue: 10 },
  { patient: 'سارة العلي', amount: 950, date: '2026-07-25', daysOverdue: 3 },
];

const branchRevenue = [
  { branch: 'الرياض - الرئيسي', revenue: 345000, growth: 15.2, target: 400000 },
  { branch: 'جدة', revenue: 248000, growth: 12.8, target: 280000 },
  { branch: 'الدمام', revenue: 195000, growth: 8.5, target: 220000 },
  { branch: 'مكة المكرمة', revenue: 142000, growth: 6.2, target: 160000 },
  { branch: 'المدينة المنورة', revenue: 98000, growth: 4.8, target: 120000 },
  { branch: 'الخبر', revenue: 85000, growth: 18.5, target: 100000 },
];

const doctorRevenue = [
  { name: 'د. سارة الأحمد', specialty: 'الطب الباطني', revenue: 125000, patients: 380 },
  { name: 'د. محمد الراشد', specialty: 'الغدد الصماء', revenue: 98000, patients: 295 },
  { name: 'د. فاطمة الزهراء', specialty: 'أمراض الدم', revenue: 85000, patients: 260 },
  { name: 'د. خالد العمري', specialty: 'الكلى', revenue: 72000, patients: 210 },
  { name: 'د. نورة السعيد', specialty: 'الغدد الصماء', revenue: 65000, patients: 195 },
];

const departmentRevenue = [
  { department: 'التحاليل الدموية', revenue: 520000, percentage: 38, color: '#0077B6' },
  { department: 'التحاليل الكيميائية', revenue: 385000, percentage: 28, color: '#10B981' },
  { department: 'التحاليل الهرمونية', revenue: 245000, percentage: 18, color: '#F59E0B' },
  { department: 'التحاليل الجينية', revenue: 135000, percentage: 10, color: '#8B5CF6' },
  { department: 'خدمات أخرى', revenue: 80000, percentage: 6, color: '#EC4899' },
];

const forecastData = [
  { month: 'يناير', actual: 185000, predicted: 180000, low: 170000, high: 195000 },
  { month: 'فبراير', actual: 198000, predicted: 195000, low: 182000, high: 210000 },
  { month: 'مارس', actual: 215000, predicted: 210000, low: 198000, high: 228000 },
  { month: 'أبريل', actual: 192000, predicted: 205000, low: 190000, high: 222000 },
  { month: 'مايو', actual: 235000, predicted: 228000, low: 212000, high: 248000 },
  { month: 'يونيو', actual: 248000, predicted: 245000, low: 228000, high: 265000 },
  { month: 'يوليو', actual: 262000, predicted: 258000, low: 240000, high: 278000 },
  { month: 'أغسطس', actual: 285000, predicted: 275000, low: 255000, high: 298000 },
  { month: 'سبتمبر', actual: 255000, predicted: 268000, low: 248000, high: 290000 },
  { month: 'أكتوبر', actual: 298000, predicted: 290000, low: 268000, high: 315000 },
  { month: 'نوفمبر', actual: 312000, predicted: 310000, low: 285000, high: 338000 },
  { month: 'ديسمبر', actual: 345000, predicted: 335000, low: 308000, high: 365000 },
];

const growthRecommendations = [
  {
    title: 'توسيع خدمات التحاليل الجينية',
    impact: 'مرتفع',
    estimatedRevenue: 85000,
    description: 'زيادة استثماراتنا في التحاليل الجينية المتقدمة يمكن أن تزيد الإيرادات بنسبة 15% خلال 6 أشهر.',
  },
  {
    title: 'برامج الولاء للمرضى العائدين',
    impact: 'متوسط',
    estimatedRevenue: 45000,
    description: 'إطلاق برنامج ولاء يمنح خصومات للمرضى الدائمين سيزيد من معدل العائد بنسبة 25%.',
  },
  {
    title: 'الشراكات مع العيادات الخارجية',
    impact: 'مرتفع',
    estimatedRevenue: 120000,
    description: 'توسيع الشراكات مع 20 عيادة خارجية إضافية سيوفر تدفقاً مستمراً للمرضى.',
  },
  {
    title: 'خدمات التحاليل المنزليّة',
    impact: 'متوسط',
    estimatedRevenue: 65000,
    description: 'إطلاق خدمة جمع العينات منزلياً سيجذب فئة جديدة من المرضى.',
  },
];

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const totalMonthlyRevenue = monthlyRevenue[monthlyRevenue.length - 1].value;
  const todayRevenue = dailyRevenue[dailyRevenue.length - 1];
  const avgOrderValue = Math.round(totalMonthlyRevenue / 2384);
  const profitMargin = 42.5;

  const exportBranchData = branchRevenue.map((b) => ({
    الفرع: b.branch,
    الإيرادات: b.revenue,
    'نسبة النمو': `${b.growth}%`,
    الهدف: b.target,
  }));

  const exportPaymentData = paymentMethods.map((p) => ({
    'طريقة الدفع': p.method,
    المعاملات: p.transactions,
    المبلغ: p.amount,
    'النسبة': `${p.percentage}%`,
  }));

  const allExportData = [...exportBranchData, ...exportPaymentData];

  return (
    <div className="space-y-6 dark:bg-surface-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            تحليل الإيرادات
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            تتبع وتحليل الإيرادات والمصادر المالية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                <Filter className="h-4 w-4" />
                {dateRangeLabels[dateRange]}
              </Button>
            }
          >
            {(
              [
                ['today', 'اليوم'],
                ['week', 'هذا الأسبوع'],
                ['month', 'هذا الشهر'],
                ['quarter', 'هذا الربع'],
                ['year', 'هذا العام'],
              ] as const
            ).map(([key, label]) => (
              <DropdownItem
                key={key}
                onClick={() => setDateRange(key)}
                className={cn(dateRange === key && 'bg-brand-50 text-brand-600 font-semibold')}
              >
                {label}
              </DropdownItem>
            ))}
          </Dropdown>
          <ExportButton data={allExportData} filename="revenue-report" title="تقرير الإيرادات" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="الإيرادات الشهرية"
          value={formatCurrency(totalMonthlyRevenue)}
          change={14.8}
          changeLabel="عن الشهر السابق"
          icon={<DollarSign className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-50 dark:bg-brand-900/30"
        />
        <StatCard
          title="الإيرادات اليومية"
          value={formatCurrency(todayRevenue)}
          change={8.2}
          changeLabel="مقارنة بالأمس"
          icon={<Calendar className="h-5 w-5 text-success-600" />}
          iconBg="bg-success-50 dark:bg-success-900/30"
        />
        <StatCard
          title="متوسط قيمة الطلب"
          value={formatCurrency(avgOrderValue)}
          change={5.5}
          changeLabel="عن الشهر السابق"
          icon={<Wallet className="h-5 w-5 text-info-600" />}
          iconBg="bg-info-50 dark:bg-info-900/30"
        />
        <StatCard
          title="هامش الربح"
          value={`${profitMargin}%`}
          change={2.3}
          changeLabel="تحسن"
          icon={<PiggyBank className="h-5 w-5 text-warning-600" />}
          iconBg="bg-warning-50 dark:bg-warning-900/30"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="dark:border-surface-700">
          <TabsTrigger value="overview" icon={<TrendingUp className="h-4 w-4" />}>
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="sources" icon={<CreditCard className="h-4 w-4" />}>
            المصادر
          </TabsTrigger>
          <TabsTrigger value="branches" icon={<Building2 className="h-4 w-4" />}>
            الفروع
          </TabsTrigger>
          <TabsTrigger value="predictions" icon={<Brain className="h-4 w-4" />}>
            التنبؤات
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 12-Month Revenue Trend */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">اتجاه الإيرادات الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={monthlyRevenue.map((d) => ({
                    ...d,
                    value: d.value / 1000,
                    color: '#0077B6',
                  }))}
                  height={220}
                  showValues
                />
                <p className="text-[10px] text-surface-400 dark:text-surface-500 text-center mt-2">
                  القيم بالآلاف (ر.س)
                </p>
              </CardContent>
            </Card>

            {/* Revenue by Category */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الإيرادات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <DonutChart
                    data={revenueByCategory}
                    size={160}
                    thickness={24}
                    centerLabel="إجمالي"
                    centerValue={formatCurrency(3300000)}
                  />
                  <DonutLegend data={revenueByCategory} className="flex-1" />
                </div>
              </CardContent>
            </Card>

            {/* Daily Revenue Sparkline */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الإيرادات اليومية - الشهر الحالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-surface-500 dark:text-surface-400">إجمالي الشهر</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                      {formatCurrency(totalMonthlyRevenue)}
                    </p>
                  </div>
                  <Sparkline data={dailyRevenue} width={160} height={48} color="#10B981" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">أعلى يوم</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">
                      {formatCurrency(Math.max(...dailyRevenue))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">متوسط يومي</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">
                      {formatCurrency(Math.round(dailyRevenue.reduce((a, b) => a + b, 0) / dailyRevenue.length))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">أقل يوم</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">
                      {formatCurrency(Math.min(...dailyRevenue))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">مؤشرات الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 divide-y divide-surface-100 dark:divide-surface-700">
                  <MetricRow
                    label="تقدم الهدف الشهري"
                    value={`${Math.round((totalMonthlyRevenue / 380000) * 100)}%`}
                    change={14.8}
                    sparkData={[60, 65, 70, 75, 80, 85]}
                  />
                  <MetricRow
                    label="النمو مقارنة بالعام السابق"
                    value="18.5%"
                    change={18.5}
                    sparkData={[10, 12, 14, 16, 18]}
                  />
                  <MetricRow
                    label="إيرادات الشهر الحالي مقابل السابق"
                    value={formatCurrency(totalMonthlyRevenue - 312000)}
                    change={10.6}
                    sparkData={[280, 290, 300, 312, 345]}
                  />
                  <MetricRow
                    label="متوسط الإيراد لكل مريض"
                    value={formatCurrency(Math.round(totalMonthlyRevenue / 2445))}
                    change={6.2}
                    sparkData={[120, 125, 130, 135, 141]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Sources Tab ─── */}
        <TabsContent value="sources">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Payment Methods Table */}
            <Card className="lg:col-span-2 dark:bg-surface-800 dark:border-surface-700" padding="none">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="dark:text-white">الإيرادات حسب طريقة الدفع</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700">
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">طريقة الدفع</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">المعاملات</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">النسبة</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">الاتجاه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                    {paymentMethods.map((pm) => (
                      <tr key={pm.method} className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-surface-400" />
                            <span className="text-sm font-medium text-surface-900 dark:text-white">{pm.method}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-700 dark:text-surface-300">
                          {formatNumber(pm.transactions)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-surface-900 dark:text-white">
                          {formatCurrency(pm.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={pm.percentage} size="sm" color="brand" className="w-20" />
                            <span className="text-xs text-surface-500 dark:text-surface-400">{pm.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              pm.trend > 0 ? 'text-success-600' : 'text-danger-600'
                            )}
                          >
                            {pm.trend > 0 ? '↑' : '↓'} {Math.abs(pm.trend)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Insurance Claims */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">مطالبات التأمين</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insuranceClaims.map((claim) => (
                  <div key={claim.company} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-surface-900 dark:text-white">{claim.company}</span>
                      <Badge variant="outline" size="sm">{formatCurrency(claim.amount)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-success-600">مقبول: {claim.approved}</span>
                      <span className="text-warning-600">معلق: {claim.pending}</span>
                      <span className="text-danger-600">مرفوض: {claim.rejected}</span>
                    </div>
                    <ProgressBar
                      value={claim.approved}
                      max={claim.claims}
                      size="sm"
                      color="success"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Outstanding Payments */}
            <Card className="lg:col-span-3 dark:bg-surface-800 dark:border-surface-700" padding="none">
              <CardHeader className="px-6 pt-6 flex-row items-center justify-between">
                <CardTitle className="dark:text-white">المدفوعات المعلقة</CardTitle>
                <Badge variant="danger" dot>{outstandingPayments.length} معلّق</Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700">
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">المريض</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">المبلغ</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">الأيام المتأخرة</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                    {outstandingPayments.map((payment, i) => (
                      <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-surface-900 dark:text-white">{payment.patient}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-surface-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-700 dark:text-surface-300">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={payment.daysOverdue > 14 ? 'danger' : payment.daysOverdue > 7 ? 'warning' : 'default'}
                            size="sm"
                            dot
                          >
                            {payment.daysOverdue} يوم
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">تذكير</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Branches Tab ─── */}
        <TabsContent value="branches">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue per Branch */}
            <Card className="lg:col-span-2 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الإيرادات حسب الفرع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchRevenue.map((branch, i) => (
                    <div key={branch.branch} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                              i === 0 ? 'bg-saffron-100 text-saffron-700' : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-surface-900 dark:text-white">{branch.branch}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-surface-900 dark:text-white">
                            {formatCurrency(branch.revenue)}
                          </span>
                          <span className="text-xs font-semibold text-success-600">
                            ↑ {branch.growth}%
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <ProgressBar
                          value={branch.revenue}
                          max={branch.target}
                          size="md"
                          color={branch.revenue >= branch.target ? 'success' : 'brand'}
                          animated
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-surface-400 dark:text-surface-500">
                            {Math.round((branch.revenue / branch.target) * 100)}% من الهدف
                          </span>
                          <span className="text-[10px] text-surface-400 dark:text-surface-500">
                            الهدف: {formatCurrency(branch.target)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue per Doctor */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الإيرادات حسب الطبيب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doctorRevenue.map((doc, i) => (
                  <div key={doc.name} className="flex items-center gap-3 py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                        i === 0 ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-surface-500 dark:text-surface-400">{doc.specialty} - {doc.patients} مريض</p>
                    </div>
                    <span className="text-sm font-bold text-surface-900 dark:text-white shrink-0">
                      {formatCurrency(doc.revenue)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Revenue per Department */}
            <Card className="lg:col-span-3 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الإيرادات حسب القسم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <DonutChart
                    data={departmentRevenue}
                    size={160}
                    thickness={24}
                    centerLabel="إجمالي"
                    centerValue={formatCurrency(1365000)}
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {departmentRevenue.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                          <span className="text-sm text-surface-600 dark:text-surface-300">{dept.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-surface-900 dark:text-white">
                            {formatCurrency(dept.revenue)}
                          </span>
                          <span className="text-[10px] text-surface-400 dark:text-surface-500">
                            ({dept.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Predictions Tab ─── */}
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue Forecast */}
            <Card className="lg:col-span-2 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-brand-600" />
                  <CardTitle className="dark:text-white">تنبؤ الإيرادات بالذكاء الاصطناعي</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Forecast Chart */}
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="flex items-end gap-1.5" style={{ height: 220 }}>
                      {forecastData.map((d, i) => {
                        const maxVal = 365000;
                        const actualH = (d.actual / maxVal) * 100;
                        const predH = (d.predicted / maxVal) * 100;
                        const highH = (d.high / maxVal) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 gap-1">
                            <div className="w-full flex gap-0.5 items-end" style={{ height: `${highH}%` }}>
                              <div className="flex-1 flex flex-col items-center">
                                {/* Confidence interval line */}
                                <div
                                  className="w-full rounded-t opacity-30 bg-brand-300 dark:bg-brand-700"
                                  style={{ height: `${((d.high - d.low) / maxVal) * 100}%` }}
                                />
                                {/* Actual bar */}
                                <div
                                  className="w-full rounded bg-brand-500"
                                  style={{ height: `${(d.actual / maxVal) * 40}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-[8px] text-surface-500 dark:text-surface-400 truncate w-full text-center">
                              {d.month.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-brand-500" />
                        <span className="text-[10px] text-surface-500 dark:text-surface-400">الإيرادات الفعلية</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-brand-300 dark:bg-brand-700 opacity-50" />
                        <span className="text-[10px] text-surface-500 dark:text-surface-400">نطاق الثقة (95%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                  <div className="text-center">
                    <p className="text-xs text-surface-500 dark:text-surface-400">دقة التنبؤ</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">94.2%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-surface-500 dark:text-surface-400">الخطأ المتوسط</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">3.8%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-surface-500 dark:text-surface-400">فترة التنبؤ</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">6 أشهر</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">تحليل الاتجاهات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-success-50 dark:bg-success-900/20">
                    <ArrowUpRight className="h-5 w-5 text-success-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-success-700 dark:text-success-400">اتجاه صاعد</p>
                      <p className="text-xs text-success-600 dark:text-success-500">الإيرادات تزداد بنسبة 12% شهرياً</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-info-50 dark:bg-info-900/20">
                    <TrendingUp className="h-5 w-5 text-info-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-info-700 dark:text-info-400">موسمية</p>
                      <p className="text-xs text-info-600 dark:text-info-500">الشهر 8 و 12 أعلى الأشهر إيرادات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20">
                    <AlertCircle className="h-5 w-5 text-warning-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-warning-700 dark:text-warning-400">تنبيه</p>
                      <p className="text-xs text-warning-600 dark:text-warning-500"> شهر أبريل شهد انخفاضاً مؤقتاً</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-surface-100 dark:border-surface-700 space-y-2">
                  <MetricRow label="معدل النمو الشهري" value="12.3%" sparkData={[8, 9, 10, 11, 12]} />
                  <MetricRow label="التنبؤ للربع القادم" value={formatCurrency(1080000)} change={15.8} sparkData={[950, 980, 1020, 1050, 1080]} />
                </div>
              </CardContent>
            </Card>

            {/* Growth Recommendations */}
            <Card className="lg:col-span-3 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning-500" />
                  <CardTitle className="dark:text-white">توصيات النمو</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {growthRecommendations.map((rec, i) => (
                    <Card key={i} hover className="dark:bg-surface-700 dark:border-surface-600">
                      <CardContent className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">{rec.title}</h4>
                          <Badge
                            variant={rec.impact === 'مرتفع' ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {rec.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                          {rec.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-600">
                          <span className="text-xs text-surface-500 dark:text-surface-400">الإيراد المتوقع</span>
                          <span className="text-sm font-bold text-success-600">
                            {formatCurrency(rec.estimatedRevenue)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
