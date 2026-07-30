'use client';

import { useState } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  Building2,
  FlaskConical,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
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

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const dateRangeLabels: Record<DateRange, string> = {
  today: 'اليوم',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'هذا الربع',
  year: 'هذا العام',
  custom: 'مخصص',
};

const monthlyOrders = [
  { label: 'يناير', value: 1240 },
  { label: 'فبراير', value: 1380 },
  { label: 'مارس', value: 1520 },
  { label: 'أبريل', value: 1290 },
  { label: 'مايو', value: 1650 },
  { label: 'يونيو', value: 1780 },
  { label: 'يوليو', value: 1920 },
  { label: 'أغسطس', value: 2100 },
  { label: 'سبتمبر', value: 1850 },
  { label: 'أكتوبر', value: 2200 },
  { label: 'نوفمبر', value: 2350 },
  { label: 'ديسمبر', value: 2480 },
];

const orderTypeDistribution = [
  { label: 'تحاليل دموية', value: 4520, color: '#0077B6' },
  { label: 'تحاليل كيميائية', value: 3200, color: '#10B981' },
  { label: 'تحاليل هرمونية', value: 1800, color: '#F59E0B' },
  { label: 'تحاليل وراثية', value: 980, color: '#8B5CF6' },
  { label: 'تحاليل أخرى', value: 1500, color: '#EC4899' },
];

const topTests = [
  { label: 'صورة دم كاملة (CBC)', value: 1250, sparkData: [80, 85, 90, 88, 95] },
  { label: 'تحليل السكر التراكمي', value: 980, sparkData: [70, 72, 75, 78, 82] },
  { label: 'Profile Lipid', value: 870, sparkData: [60, 65, 68, 72, 75] },
  { label: 'تحليل وظائف الكلى', value: 760, sparkData: [55, 58, 60, 62, 65] },
  { label: 'TSH', value: 650, sparkData: [45, 48, 50, 52, 55] },
  { label: 'Vitamin D', value: 580, sparkData: [40, 42, 45, 48, 50] },
  { label: 'تحليل وظائف الكبد', value: 520, sparkData: [35, 38, 40, 42, 44] },
  { label: 'HbA1c', value: 490, sparkData: [30, 32, 35, 38, 40] },
  { label: 'B12', value: 430, sparkData: [28, 30, 32, 34, 36] },
  { label: 'تحليل البول', value: 380, sparkData: [25, 27, 28, 30, 32] },
];

const weeklyTrend = [120, 135, 128, 142, 155, 148, 160, 172, 165, 180, 195, 188, 200, 210];

const orderStatuses = [
  { label: 'مكتمل', value: 78, color: 'success' as const, count: 1856 },
  { label: 'قيد التنفيذ', value: 12, color: 'brand' as const, count: 286 },
  { label: 'قيد الانتظار', value: 6, color: 'warning' as const, count: 143 },
  { label: 'ملغي', value: 3, color: 'danger' as const, count: 71 },
  { label: 'مرتجع', value: 1, color: 'info' as const, count: 24 },
];

const peakHours = [
  [8, 12, 18, 22, 25, 20, 15],
  [15, 20, 28, 32, 35, 30, 22],
  [22, 28, 35, 42, 45, 38, 28],
  [30, 38, 48, 55, 60, 50, 35],
  [25, 32, 42, 50, 55, 45, 30],
  [18, 25, 32, 38, 42, 35, 22],
  [12, 18, 22, 28, 30, 25, 15],
  [5, 8, 12, 15, 18, 12, 8],
];

const patientComparison = {
  new: { count: 856, percentage: 35, sparkData: [60, 65, 70, 72, 75] },
  returning: { count: 1589, percentage: 65, sparkData: [120, 125, 130, 135, 140] },
};

const ageDistribution = [
  { label: '0-18', value: 420, color: '#0077B6' },
  { label: '19-35', value: 680, color: '#10B981' },
  { label: '36-50', value: 520, color: '#F59E0B' },
  { label: '51-65', value: 380, color: '#8B5CF6' },
  { label: '65+', value: 445, color: '#EC4899' },
];

const genderSplit = [
  { label: 'ذكور', value: 1350, color: '#0077B6' },
  { label: 'إناث', value: 1095, color: '#EC4899' },
];

const patientSources = [
  { label: 'إحالة طبية', value: 980, color: '#0077B6' },
  { label: 'حجز مباشر', value: 650, color: '#10B981' },
  { label: 'تأمين صحي', value: 520, color: '#F59E0B' },
  { label: '_REPEAT', value: 295, color: '#8B5CF6' },
];

const branchPerformance = [
  { branch: 'الرياض - الرئيسي', orders: 856, revenue: 125400, waitTime: '18 دقيقة', satisfaction: 4.8 },
  { branch: 'جدة', orders: 645, revenue: 94200, waitTime: '22 دقيقة', satisfaction: 4.6 },
  { branch: 'الدمام', orders: 520, revenue: 76800, waitTime: '20 دقيقة', satisfaction: 4.7 },
  { branch: 'مكة المكرمة', orders: 380, revenue: 55600, waitTime: '25 دقيقة', satisfaction: 4.5 },
  { branch: 'المدينة المنورة', orders: 295, revenue: 43200, waitTime: '28 دقيقة', satisfaction: 4.4 },
  { branch: 'الخبر', orders: 210, revenue: 31500, waitTime: '15 دقيقة', satisfaction: 4.9 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState('overview');

  const exportData = branchPerformance.map((b) => ({
    الفرع: b.branch,
    الطلبات: b.orders,
    الإيرادات: b.revenue,
    'وقت الانتظار': b.waitTime,
    الرضا: b.satisfaction,
  }));

  return (
    <div className="space-y-6 dark:bg-surface-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            التحليلات
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            تحليل شامل لأداء المختبر
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
          <ExportButton data={exportData} filename="analytics-report" title="تقرير التحليلات" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلبات"
          value={formatNumber(2384)}
          change={12.5}
          changeLabel="عن الشهر السابق"
          icon={<BarChart3 className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-50 dark:bg-brand-900/30"
        />
        <StatCard
          title="نمو الإيرادات"
          value="%18.3"
          change={18.3}
          changeLabel="مقارنة بالفترة السابقة"
          icon={<TrendingUp className="h-5 w-5 text-success-600" />}
          iconBg="bg-success-50 dark:bg-success-900/30"
        />
        <StatCard
          title="رضا المرضى"
          value="4.7 / 5"
          change={2.1}
          changeLabel=" Improvement"
          icon={<Star className="h-5 w-5 text-warning-600" />}
          iconBg="bg-warning-50 dark:bg-warning-900/30"
        />
        <StatCard
          title="متوسط وقت التسليم"
          value="24 ساعة"
          change={-5.2}
          changeLabel="تحسن عن السابق"
          icon={<Clock className="h-5 w-5 text-info-600" />}
          iconBg="bg-info-50 dark:bg-info-900/30"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="dark:border-surface-700">
          <TabsTrigger value="overview" icon={<Activity className="h-4 w-4" />}>
            عام
          </TabsTrigger>
          <TabsTrigger value="orders" icon={<FlaskConical className="h-4 w-4" />}>
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="patients" icon={<Users className="h-4 w-4" />}>
            المرضى
          </TabsTrigger>
          <TabsTrigger value="branches" icon={<Building2 className="h-4 w-4" />}>
            الفروع
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 12-Month Order Volume */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">حجم الطلبات الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={monthlyOrders} height={220} />
              </CardContent>
            </Card>

            {/* Order Type Distribution */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">توزيع أنواع الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <DonutChart
                    data={orderTypeDistribution}
                    size={160}
                    thickness={24}
                    centerLabel="إجمالي"
                    centerValue={formatNumber(12000)}
                  />
                  <DonutLegend data={orderTypeDistribution} className="flex-1" />
                </div>
              </CardContent>
            </Card>

            {/* Top 10 Tests */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">أكثر 10 فحوصات طلبًا</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                  {topTests.map((test, i) => (
                    <MetricRow
                      key={i}
                      label={`${i + 1}. ${test.label}`}
                      value={formatNumber(test.value)}
                      sparkData={test.sparkData}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">الاتجاه الأسبوعي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-surface-500 dark:text-surface-400">طلبات هذا الأسبوع</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                      {formatNumber(1458)}
                    </p>
                  </div>
                  <Sparkline data={weeklyTrend} width={160} height={48} color="#10B981" />
                </div>
                <div className="space-y-3">
                  <MetricRow
                    label="متوسط الطلبات اليومية"
                    value={formatNumber(208)}
                    change={8.5}
                    sparkData={[180, 190, 195, 200, 208]}
                  />
                  <MetricRow
                    label="أعلى طلب في اليوم"
                    value={formatNumber(285)}
                    change={12.3}
                    sparkData={[220, 240, 255, 270, 285]}
                  />
                  <MetricRow
                    label="أقل طلب في اليوم"
                    value={formatNumber(142)}
                    change={-3.2}
                    sparkData={[160, 155, 150, 148, 142]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Orders Tab ─── */}
        <TabsContent value="orders">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Status Breakdown */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">توزيع حالات الطلبات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderStatuses.map((status, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-surface-600 dark:text-surface-300">{status.label}</span>
                      <span className="text-xs font-semibold text-surface-900 dark:text-white">
                        {formatNumber(status.count)} ({status.value}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={status.value}
                      color={status.color}
                      size="md"
                      animated
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Peak Hours Heatmap */}
            <Card className="lg:col-span-2 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">ساعات الذروة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[400px]">
                    {/* Day labels */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
                      <div />
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(
                        (day) => (
                          <div key={day} className="text-center text-[10px] font-medium text-surface-500 dark:text-surface-400">
                            {day}
                          </div>
                        )
                      )}
                    </div>
                    {/* Heatmap grid */}
                    {peakHours.map((row, hourIdx) => (
                      <div key={hourIdx} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                        <div className="flex items-center text-[10px] text-surface-500 dark:text-surface-400">
                          {8 + hourIdx}:00
                        </div>
                        {row.map((val, dayIdx) => {
                          const maxVal = 60;
                          const intensity = val / maxVal;
                          return (
                            <div
                              key={dayIdx}
                              className={cn(
                                'h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors',
                                intensity > 0.7
                                  ? 'bg-brand-600 text-white'
                                  : intensity > 0.5
                                  ? 'bg-brand-400 text-white'
                                  : intensity > 0.3
                                  ? 'bg-brand-200 text-brand-800 dark:bg-brand-800 dark:text-brand-200'
                                  : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
                              )}
                              title={`${val} طلب`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <span className="text-[10px] text-surface-500 dark:text-surface-400">أقل</span>
                    {['bg-surface-100 dark:bg-surface-700', 'bg-brand-200 dark:bg-brand-800', 'bg-brand-400', 'bg-brand-600'].map(
                      (bg, i) => (
                        <div key={i} className={cn('h-4 w-4 rounded', bg)} />
                      )
                    )}
                    <span className="text-[10px] text-surface-500 dark:text-surface-400">أكثر</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Time Metrics */}
            <Card className="lg:col-span-3 dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">متوسط أوقات المعالجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {[
                    { label: 'وقت التسجيل', value: '3 دقائق', change: -10, spark: [5, 4.5, 4, 3.5, 3] },
                    { label: 'وقت المعالجة', value: '45 دقيقة', change: -8, spark: [55, 52, 50, 48, 45] },
                    { label: 'وقت مراجعة النتائج', value: '15 دقيقة', change: -15, spark: [22, 20, 18, 16, 15] },
                    { label: 'وقت التسليم', value: '24 ساعة', change: -5, spark: [28, 27, 26, 25, 24] },
                  ].map((metric, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-sm text-surface-500 dark:text-surface-400">{metric.label}</p>
                      <p className="text-xl font-bold text-surface-900 dark:text-white">{metric.value}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            metric.change < 0 ? 'text-success-600' : 'text-danger-600'
                          )}
                        >
                          {metric.change < 0 ? '↓' : '↑'} {Math.abs(metric.change)}%
                        </span>
                        <Sparkline data={metric.spark} width={60} height={20} color={metric.change < 0 ? '#10B981' : '#EF4444'} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Patients Tab ─── */}
        <TabsContent value="patients">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* New vs Returning */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">المرضى الجدد مقابل العائدين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <DonutChart
                    data={[
                      { label: 'مرضى جدد', value: patientComparison.new.count, color: '#0077B6' },
                      { label: 'مرضى عائدون', value: patientComparison.returning.count, color: '#10B981' },
                    ]}
                    size={140}
                    centerValue={formatNumber(2445)}
                    centerLabel="إجمالي"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-surface-600 dark:text-surface-300">مرضى جدد</span>
                        <span className="text-sm font-bold text-surface-900 dark:text-white">
                          {formatNumber(patientComparison.new.count)}
                        </span>
                      </div>
                      <ProgressBar value={patientComparison.new.percentage} color="brand" size="sm" />
                      <Sparkline data={patientComparison.new.sparkData} width={120} height={24} color="#0077B6" className="mt-1" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-surface-600 dark:text-surface-300">مرضى عائدون</span>
                        <span className="text-sm font-bold text-surface-900 dark:text-white">
                          {formatNumber(patientComparison.returning.count)}
                        </span>
                      </div>
                      <ProgressBar value={patientComparison.returning.percentage} color="success" size="sm" />
                      <Sparkline data={patientComparison.returning.sparkData} width={120} height={24} color="#10B981" className="mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">التوزيع العمري</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={ageDistribution}
                  height={200}
                  showValues
                />
              </CardContent>
            </Card>

            {/* Gender Split */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">التوزيع حسب الجنس</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <DonutChart
                    data={genderSplit}
                    size={160}
                    thickness={28}
                    centerValue="%55"
                    centerLabel="ذكور"
                  />
                  <DonutLegend data={genderSplit} />
                </div>
              </CardContent>
            </Card>

            {/* Patient Sources */}
            <Card className="dark:bg-surface-800 dark:border-surface-700">
              <CardHeader>
                <CardTitle className="dark:text-white">مصادر المرضى</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={patientSources}
                  horizontal
                  height={200}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Branches Tab ─── */}
        <TabsContent value="branches">
          <div className="space-y-6">
            {/* Branch Comparison Table */}
            <Card className="dark:bg-surface-800 dark:border-surface-700" padding="none">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="dark:text-white">مقارنة الفروع</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700">
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        الترتيب
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        الفرع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        الطلبات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        الإيرادات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        وقت الانتظار
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 dark:text-surface-400">
                        الرضا
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                    {branchPerformance
                      .sort((a, b) => b.orders - a.orders)
                      .map((branch, i) => (
                        <tr
                          key={branch.branch}
                          className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                                i === 0
                                  ? 'bg-saffron-100 text-saffron-700'
                                  : i === 1
                                  ? 'bg-surface-200 text-surface-700'
                                  : i === 2
                                  ? 'bg-saffron-50 text-saffron-600'
                                  : 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                              )}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-surface-900 dark:text-white">
                              {branch.branch}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-surface-700 dark:text-surface-300">
                              {formatNumber(branch.orders)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-surface-700 dark:text-surface-300">
                              {formatCurrency(branch.revenue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={branch.waitTime.includes('15') || branch.waitTime.includes('18') ? 'success' : branch.waitTime.includes('25') || branch.waitTime.includes('28') ? 'warning' : 'default'} size="sm">
                              {branch.waitTime}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
                              <span className="text-sm font-medium text-surface-900 dark:text-white">
                                {branch.satisfaction}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Performance Ranking Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branchPerformance.slice(0, 6).map((branch, i) => (
                <Card key={branch.branch} hover className="dark:bg-surface-800 dark:border-surface-700">
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{branch.branch}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-warning-400 text-warning-400" />
                          <span className="text-xs text-surface-500 dark:text-surface-400">{branch.satisfaction}</span>
                        </div>
                      </div>
                      <Badge
                        variant={i === 0 ? 'gold' : i < 3 ? 'primary' : 'default'}
                        size="sm"
                      >
                        #{i + 1}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500 dark:text-surface-400">الطلبات</span>
                        <span className="font-semibold text-surface-900 dark:text-white">{formatNumber(branch.orders)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500 dark:text-surface-400">الإيرادات</span>
                        <span className="font-semibold text-surface-900 dark:text-white">{formatCurrency(branch.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500 dark:text-surface-400">وقت الانتظار</span>
                        <span className="font-semibold text-surface-900 dark:text-white">{branch.waitTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
