'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { ExportButton } from '@/components/admin/ExportButton';
import { BarChart, DonutChart, DonutLegend, Sparkline, MetricRow } from '@/design-system/data/ChartCard';

interface ApiEndpoint {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  avgResponse: number;
  p95: number;
  p99: number;
  totalRequests: number;
  errorRate: number;
  lastCalled: string;
  status: 'healthy' | 'degraded' | 'down';
}

interface ErrorLog {
  id: string;
  timestamp: string;
  endpoint: string;
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function ApiMonitorPage() {
  const [requestCount, setRequestCount] = React.useState(234567);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [thresholdFilter, setThresholdFilter] = React.useState<number>(0);
  const [selectedApi, setSelectedApi] = React.useState<ApiEndpoint | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  const [stats] = React.useState({
    totalRequests: 234567,
    avgResponseTime: 45,
    errorRate: 0.12,
    activeApis: 48,
  });

  const [requestVolume] = React.useState(
    Array.from({ length: 24 }, (_, i) => ({
      label: `${i}:00`,
      value: Math.floor(Math.random() * 15000) + 5000,
    }))
  );

  const [statusCodes] = React.useState([
    { label: '2xx (نجاح)', value: 89234, color: '#10B981' },
    { label: '3xx (إعادة توجيه)', value: 3421, color: '#3B82F6' },
    { label: '4xx (خطأ عميل)', value: 1245, color: '#F59E0B' },
    { label: '5xx (خطأ خادم)', value: 287, color: '#EF4444' },
  ]);

  const [responseTimeDistribution] = React.useState([
    { label: '<20ms', value: 45000, color: 'bg-success-500' },
    { label: '20-50ms', value: 67000, color: 'bg-brand-500' },
    { label: '50-100ms', value: 34000, color: 'bg-warning-500' },
    { label: '100-200ms', value: 12000, color: 'bg-orange-500' },
    { label: '>200ms', value: 3200, color: 'bg-danger-500' },
  ]);

  const [errorTrend] = React.useState(
    Array.from({ length: 24 }, (_, i) => ({
      label: `${i}:00`,
      value: Math.random() * 0.5,
    }))
  );

  const [apis] = React.useState<ApiEndpoint[]>([
    { id: '1', endpoint: '/api/v1/patients', method: 'GET', avgResponse: 32, p95: 89, p99: 156, totalRequests: 45678, errorRate: 0.05, lastCalled: '2026-07-28T10:30:00', status: 'healthy' },
    { id: '2', endpoint: '/api/v1/orders', method: 'POST', avgResponse: 67, p95: 145, p99: 312, totalRequests: 23456, errorRate: 0.12, lastCalled: '2026-07-28T10:29:00', status: 'healthy' },
    { id: '3', endpoint: '/api/v1/auth/login', method: 'POST', avgResponse: 89, p95: 234, p99: 567, totalRequests: 12345, errorRate: 0.45, lastCalled: '2026-07-28T10:28:00', status: 'degraded' },
    { id: '4', endpoint: '/api/v1/reports/generate', method: 'GET', avgResponse: 234, p95: 567, p99: 1234, totalRequests: 8765, errorRate: 0.89, lastCalled: '2026-07-28T10:25:00', status: 'degraded' },
    { id: '5', endpoint: '/api/v1/invoices', method: 'PUT', avgResponse: 45, p95: 98, p99: 178, totalRequests: 15678, errorRate: 0.03, lastCalled: '2026-07-28T10:27:00', status: 'healthy' },
    { id: '6', endpoint: '/api/v1/settings', method: 'DELETE', avgResponse: 23, p95: 45, p99: 67, totalRequests: 2345, errorRate: 0.01, lastCalled: '2026-07-28T09:15:00', status: 'healthy' },
    { id: '7', endpoint: '/api/v1/health', method: 'GET', avgResponse: 5, p95: 12, p99: 18, totalRequests: 67890, errorRate: 0.0, lastCalled: '2026-07-28T10:30:00', status: 'healthy' },
    { id: '8', endpoint: '/api/v1/payments/process', method: 'POST', avgResponse: 156, p95: 456, p99: 890, totalRequests: 5678, errorRate: 1.23, lastCalled: '2026-07-28T10:26:00', status: 'down' },
    { id: '9', endpoint: '/api/v1/reports/export', method: 'GET', avgResponse: 345, p95: 789, p99: 1567, totalRequests: 3456, errorRate: 2.1, lastCalled: '2026-07-28T08:45:00', status: 'down' },
    { id: '10', endpoint: '/api/v1/users', method: 'GET', avgResponse: 38, p95: 78, p99: 134, totalRequests: 28765, errorRate: 0.04, lastCalled: '2026-07-28T10:30:00', status: 'healthy' },
  ]);

  const [errors] = React.useState<ErrorLog[]>([
    { id: '1', timestamp: '2026-07-28T10:30:12', endpoint: '/api/v1/payments/process', message: 'Timeout: الاتصال بالخادم انتهى', count: 23, severity: 'critical' },
    { id: '2', timestamp: '2026-07-28T10:28:45', endpoint: '/api/v1/reports/export', message: 'Internal Server Error: فشل إنشاء التقرير', count: 15, severity: 'high' },
    { id: '3', timestamp: '2026-07-28T10:25:30', endpoint: '/api/v1/auth/login', message: 'Rate Limit: تجاوز عدد محاولات الدخول', count: 45, severity: 'medium' },
    { id: '4', timestamp: '2026-07-28T10:20:00', endpoint: '/api/v1/orders', message: 'Validation Error: بيانات غير صحيحة', count: 8, severity: 'low' },
    { id: '5', timestamp: '2026-07-28T09:15:22', endpoint: '/api/v1/patients', message: 'Not Found: المريض غير موجود', count: 12, severity: 'low' },
    { id: '6', timestamp: '2026-07-28T08:30:00', endpoint: '/api/v1/invoices', message: 'Conflict: الفاتورة موجودة مسبقاً', count: 3, severity: 'medium' },
  ]);

  const [performanceHeatmap] = React.useState(() => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return days.map((day) =>
      hours.map((hour) => ({
        day,
        hour,
        value: Math.floor(Math.random() * 100),
      }))
    );
  });

  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRequestCount((prev) => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredApis = React.useMemo(() => {
    return apis.filter((api) => {
      if (searchQuery && !api.endpoint.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (methodFilter !== 'all' && api.method !== methodFilter) return false;
      if (statusFilter !== 'all' && api.status !== statusFilter) return false;
      if (thresholdFilter > 0 && api.avgResponse > thresholdFilter) return false;
      return true;
    });
  }, [apis, searchQuery, methodFilter, statusFilter, thresholdFilter]);

  const methodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'default';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="success" dot>صحي</Badge>;
      case 'degraded': return <Badge variant="warning" dot>متضرر</Badge>;
      case 'down': return <Badge variant="danger" dot>متعطل</Badge>;
      default: return <Badge variant="default">غير معروف</Badge>;
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="danger">حرج</Badge>;
      case 'high': return <Badge variant="warning">مرتفع</Badge>;
      case 'medium': return <Badge variant="info">متوسط</Badge>;
      case 'low': return <Badge variant="secondary">منخفض</Badge>;
      default: return <Badge variant="default">غير معروف</Badge>;
    }
  };

  const getHeatmapColor = (value: number) => {
    if (value < 20) return 'bg-success-100';
    if (value < 40) return 'bg-success-300';
    if (value < 60) return 'bg-warning-300';
    if (value < 80) return 'bg-orange-400';
    return 'bg-danger-500';
  };

  const exportData = filteredApis.map((a) => ({
    'النقطة': a.endpoint,
    'الطريقة': a.method,
    'متوسط الاستجابة': `${a.avgResponse}ms`,
    'P95': `${a.p95}ms`,
    'P99': `${a.p99}ms`,
    'إجمالي الطلبات': a.totalRequests.toLocaleString('ar-SA'),
    'معدل الخطأ': `${a.errorRate}%`,
    'الحالة': a.status === 'healthy' ? 'صحي' : a.status === 'degraded' ? 'متضرر' : 'متعطل',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">مراقبة API</h1>
          <p className="mt-1 text-sm text-surface-500">مراقبة وتحليل أداء واجهات البرمجة</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportData} filename="api-monitor" title="تقرير مراقبة API" />
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} label="تحديث تلقائي" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-200">
        <div className="h-3 w-3 rounded-full bg-brand-500 animate-pulse" />
        <span className="text-sm font-semibold text-brand-700">الطلبات الحية:</span>
        <span className="text-2xl font-bold text-brand-900 tabular-nums">{requestCount.toLocaleString('ar-SA')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلبات اليوم" value={stats.totalRequests.toLocaleString('ar-SA')} change={12.5} changeLabel="عن الأمس" icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="متوسط وقت الاستجابة" value={`${stats.avgResponseTime}ms`} change={-8.3} changeLabel="عن الأمس" icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} iconBg="bg-success-50" />
        <StatCard title="معدل الخطأ" value={`${stats.errorRate}%`} change={-15.2} changeLabel="عن الأمس" icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>} iconBg="bg-danger-50" />
        <StatCard title="APIs النشطة" value={stats.activeApis} change={3} changeLabel="جديد اليوم" icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>} iconBg="bg-info-50" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="apis" count={apis.length}>الـ APIs</TabsTrigger>
          <TabsTrigger value="errors" count={errors.length}>الأخطاء</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>حجم الطلبات (24 ساعة)</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={requestVolume} height={200} showValues={false} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع أوقات الاستجابة</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={responseTimeDistribution} height={200} horizontal />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدل الخطأ (24 ساعة)</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={errorTrend.map((e) => e.value)} color="#EF4444" height={120} width={400} />
                <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع حالات الحالة</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <DonutChart data={statusCodes} size={140} thickness={20} centerValue="94,187" centerLabel="إجمالي" />
                <DonutLegend data={statusCodes} className="flex-1" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>واجهات البرمجة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchInput placeholder="البحث في النقطة..." onSearch={setSearchQuery} className="w-64" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="h-9 rounded-xl border border-surface-200 bg-white px-3 text-sm"
                >
                  <option value="all">جميع الطرق</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-xl border border-surface-200 bg-white px-3 text-sm"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="healthy">صحي</option>
                  <option value="degraded">متضرر</option>
                  <option value="down">متعطل</option>
                </select>
                <FormField label="عتبة الاستجابة">
                  <input
                    type="number"
                    value={thresholdFilter}
                    onChange={(e) => setThresholdFilter(Number(e.target.value))}
                    placeholder="0ms"
                    className="h-9 w-24 rounded-xl border border-surface-200 bg-white px-3 text-sm"
                  />
                </FormField>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="py-3 px-3 text-right font-medium text-surface-500">النقطة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الطريقة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">متوسط الاستجابة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">P95</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">P99</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">إجمالي الطلبات</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">معدل الخطأ</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">آخر استدعاء</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الحالة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">تفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApis.map((api) => (
                      <tr key={api.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-surface-900 font-mono text-xs">{api.endpoint}</td>
                        <td className="py-3 px-3">
                          <Badge variant={methodBadgeColor(api.method) as any} size="sm">{api.method}</Badge>
                        </td>
                        <td className="py-3 px-3 tabular-nums">{api.avgResponse}ms</td>
                        <td className="py-3 px-3 tabular-nums">{api.p95}ms</td>
                        <td className="py-3 px-3 tabular-nums">{api.p99}ms</td>
                        <td className="py-3 px-3 tabular-nums">{api.totalRequests.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-3">
                          <span className={cn('font-medium', api.errorRate > 1 ? 'text-danger-600' : api.errorRate > 0.5 ? 'text-warning-600' : 'text-success-600')}>
                            {api.errorRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-surface-500 text-xs">{formatDate(api.lastCalled)}</td>
                        <td className="py-3 px-3">{statusBadge(api.status)}</td>
                        <td className="py-3 px-3">
                          <Button variant="ghost" size="xs" onClick={() => setSelectedApi(api)}>عرض</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>سجل الأخطاء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الوقت</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">النقطة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الرسالة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">العدد</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الشدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((error) => (
                      <tr key={error.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-3 text-surface-500 text-xs">{formatDate(error.timestamp)}</td>
                        <td className="py-3 px-3 font-mono text-xs text-surface-900">{error.endpoint}</td>
                        <td className="py-3 px-3 text-surface-700">{error.message}</td>
                        <td className="py-3 px-3 tabular-nums font-medium">{error.count}</td>
                        <td className="py-3 px-3">{severityBadge(error.severity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>خريطة الأداء (24 ساعة × 7 أيام)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="flex gap-1 mb-2">
                    <div className="w-16" />
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="flex-1 text-center text-[10px] text-surface-400">{i}</div>
                    ))}
                  </div>
                  {performanceHeatmap.map((dayData, dayIdx) => (
                    <div key={dayIdx} className="flex gap-1 mb-1">
                      <div className="w-16 text-xs text-surface-500 flex items-center">{dayData[0]?.day}</div>
                      {dayData.map((cell, hourIdx) => (
                        <div
                          key={hourIdx}
                          className={cn('flex-1 h-6 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-brand-400', getHeatmapColor(cell.value))}
                          title={`${cell.day} ${cell.hour}:00 - الحمل: ${cell.value}%`}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <span className="text-[10px] text-surface-400">منخفض</span>
                    {['bg-success-100', 'bg-success-300', 'bg-warning-300', 'bg-orange-400', 'bg-danger-500'].map((c, i) => (
                      <div key={i} className={cn('h-3 w-6 rounded-sm', c)} />
                    ))}
                    <span className="text-[10px] text-surface-400">مرتفع</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedApi} onClose={() => setSelectedApi(null)} size="lg">
        <DialogHeader onClose={() => setSelectedApi(null)}>
          <DialogTitle>تفاصيل API</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedApi && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={methodBadgeColor(selectedApi.method) as any}>{selectedApi.method}</Badge>
                <span className="font-mono text-sm text-surface-900">{selectedApi.endpoint}</span>
                {statusBadge(selectedApi.status)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">متوسط الاستجابة</p>
                  <p className="text-lg font-bold text-surface-900">{selectedApi.avgResponse}ms</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">P95</p>
                  <p className="text-lg font-bold text-surface-900">{selectedApi.p95}ms</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">P99</p>
                  <p className="text-lg font-bold text-surface-900">{selectedApi.p99}ms</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">معدل الخطأ</p>
                  <p className={cn('text-lg font-bold', selectedApi.errorRate > 1 ? 'text-danger-600' : 'text-success-600')}>{selectedApi.errorRate}%</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-surface-700 mb-2">إجمالي الطلبات</p>
                <ProgressBar value={selectedApi.totalRequests} max={70000} size="lg" showValue color="brand" />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setSelectedApi(null)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
