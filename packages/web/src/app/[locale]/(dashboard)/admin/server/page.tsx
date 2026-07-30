'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { FormField } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { CircularProgress, ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { ExportButton } from '@/components/admin/ExportButton';
import { BarChart, Sparkline, MetricRow } from '@/design-system/data/ChartCard';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

interface DatabaseQuery {
  id: string;
  query: string;
  duration: number;
  executions: number;
  table: string;
}

interface TableSize {
  name: string;
  rows: number;
  size: string;
  growth: number;
}

export default function ServerMonitorPage() {
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [refreshInterval, setRefreshInterval] = React.useState('10');
  const [selectedLog, setSelectedLog] = React.useState<SystemLog | null>(null);

  const [stats] = React.useState({
    uptime: '45 يوم، 12 ساعة',
    requestsPerSecond: 1234,
    activeConnections: 567,
    errorRate: 0.08,
  });

  const [cpu, setCpu] = React.useState(45);
  const [ram, setRam] = React.useState(68);
  const [disk, setDisk] = React.useState(52);
  const [network, setNetwork] = React.useState(34);

  const [inTraffic] = React.useState(Array.from({ length: 30 }, () => Math.floor(Math.random() * 500) + 200));
  const [outTraffic] = React.useState(Array.from({ length: 30 }, () => Math.floor(Math.random() * 300) + 100));

  const [connectionTimeline] = React.useState(Array.from({ length: 24 }, (_, i) => ({
    label: `${i}:00`,
    value: Math.floor(Math.random() * 400) + 200,
  })));

  const [bandwidth] = React.useState({
    inbound: '245 MB/s',
    outbound: '128 MB/s',
    totalToday: '18.5 GB',
    peakInbound: '312 MB/s',
    peakOutbound: '198 MB/s',
  });

  const [slowQueries] = React.useState<DatabaseQuery[]>([
    { id: '1', query: 'SELECT * FROM orders JOIN patients WHERE ...', duration: 2340, executions: 456, table: 'orders', },
    { id: '2', query: 'UPDATE inventory SET quantity = ...', duration: 1890, executions: 234, table: 'inventory', },
    { id: '3', query: 'SELECT COUNT(*) FROM audit_logs WHERE ...', duration: 1560, executions: 789, table: 'audit_logs', },
    { id: '4', query: 'INSERT INTO notifications ...', duration: 1230, executions: 1234, table: 'notifications', },
    { id: '5', query: 'DELETE FROM sessions WHERE expired ...', duration: 980, executions: 567, table: 'sessions', },
  ]);

  const [tableSizes] = React.useState<TableSize[]>([
    { name: 'orders', rows: 1234567, size: '2.3 GB', growth: 12 },
    { name: 'patients', rows: 876543, size: '1.8 GB', growth: 8 },
    { name: 'audit_logs', rows: 5678901, size: '4.5 GB', growth: 25 },
    { name: 'inventory', rows: 234567, size: '567 MB', growth: 5 },
    { name: 'invoices', rows: 456789, size: '890 MB', growth: 15 },
    { name: 'notifications', rows: 2345678, size: '1.2 GB', growth: 30 },
  ]);

  const [connectionPool] = React.useState({
    total: 100,
    active: 45,
    idle: 35,
    waiting: 5,
    maxUsed: 78,
  });

  const [queryPerformance] = React.useState({
    avgQueryTime: '12ms',
    queriesPerSecond: 3456,
    slowQueries: 12,
    failedQueries: 2,
  });

  const [logs] = React.useState<SystemLog[]>([
    { id: '1', timestamp: '2026-07-28T10:30:12', level: 'info', source: 'nginx', message: 'تم قبول اتصال SSL جديد من 192.168.1.100' },
    { id: '2', timestamp: '2026-07-28T10:30:05', level: 'warn', source: 'node', message: 'استخدام الذاكرة تجاوز 70% - يُنصح بالتحقق' },
    { id: '3', timestamp: '2026-07-28T10:29:58', level: 'error', source: 'database', message: 'فشل الاتصال بقاعدة البيانات - إعادة المحاولة #3' },
    { id: '4', timestamp: '2026-07-28T10:29:45', level: 'info', source: 'redis', message: 'تم حفظ 1,234 مفتاح في الكاش' },
    { id: '5', timestamp: '2026-07-28T10:29:30', level: 'debug', source: 'scheduler', message: 'بدء مهمة النسخ الاحتياطي التلقائي' },
    { id: '6', timestamp: '2026-07-28T10:29:15', level: 'info', source: 'auth', message: 'تسجيل دخول ناجح: admin@almokhtabar.com' },
    { id: '7', timestamp: '2026-07-28T10:29:00', level: 'warn', source: 'nginx', message: 'تجاوز حد الطلبات: 503 طلب/ثانية' },
    { id: '8', timestamp: '2026-07-28T10:28:45', level: 'error', source: 'node', message: 'Unhandled Promise Rejection في /api/v1/reports' },
    { id: '9', timestamp: '2026-07-28T10:28:30', level: 'info', source: 'cron', message: 'إتمام مهمة تنظيف السجلات القديمة' },
    { id: '10', timestamp: '2026-07-28T10:28:15', level: 'info', source: 'ssl', message: 'تجديد شهادة SSL بنجاح - صالحة حتى 2027-07-28' },
    { id: '11', timestamp: '2026-07-28T10:28:00', level: 'debug', source: 'cache', message: 'مسح الكاش: 2,345 مفتاح محذوف' },
    { id: '12', timestamp: '2026-07-28T10:27:45', level: 'warn', source: 'database', message: 'استعلام بطيء: 2,340ms - orders JOIN patients' },
  ]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCpu(Math.min(100, Math.max(10, cpu + (Math.random() * 10 - 5))));
      setRam(Math.min(100, Math.max(30, ram + (Math.random() * 6 - 3))));
    }, parseInt(refreshInterval) * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, cpu, ram]);

  const getCpuColor = (val: number) => val > 80 ? '#EF4444' : val > 60 ? '#F59E0B' : '#10B981';
  const getRamColor = (val: number) => val > 85 ? '#EF4444' : val > 70 ? '#F59E0B' : '#3B82F6';

  const logLevelBadge = (level: string) => {
    switch (level) {
      case 'info': return <Badge variant="info">معلومات</Badge>;
      case 'warn': return <Badge variant="warning">تحذير</Badge>;
      case 'error': return <Badge variant="danger">خطأ</Badge>;
      case 'debug': return <Badge variant="secondary">تنقيح</Badge>;
      default: return <Badge variant="default">{level}</Badge>;
    }
  };

  const logLevelIcon = (level: string) => {
    const cls = 'h-2 w-2 rounded-full';
    switch (level) {
      case 'info': return <span className={cn(cls, 'bg-info-500')} />;
      case 'warn': return <span className={cn(cls, 'bg-warning-500')} />;
      case 'error': return <span className={cn(cls, 'bg-danger-500')} />;
      case 'debug': return <span className={cn(cls, 'bg-surface-400')} />;
      default: return <span className={cn(cls, 'bg-surface-300')} />;
    }
  };

  const serverHealth = [
    { name: 'nginx', status: 'online' as const },
    { name: 'node.js', status: 'online' as const },
    { name: 'PostgreSQL', status: 'online' as const },
    { name: 'Redis', status: 'online' as const },
    { name: 'Meilisearch', status: 'online' as const },
    { name: ' RabbitMQ', status: 'degraded' as const },
  ];

  const exportLogs = logs.map((l) => ({
    'الوقت': formatDate(l.timestamp),
    'المستوى': l.level === 'info' ? 'معلومات' : l.level === 'warn' ? 'تحذير' : l.level === 'error' ? 'خطأ' : 'تنقيح',
    'المصدر': l.source,
    'الرسالة': l.message,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">مراقبة الخادم</h1>
          <p className="mt-1 text-sm text-surface-500">مراقبة الموارد والشبكة وقواعد البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportLogs} filename="server-logs" title="سجلات الخادم" />
          <div className="flex items-center gap-3">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="h-9 rounded-xl border border-surface-200 bg-white px-3 text-sm"
            >
              <option value="5">5 ثوانٍ</option>
              <option value="10">10 ثوانٍ</option>
              <option value="30">30 ثانية</option>
              <option value="60">60 ثانية</option>
            </select>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} label="تحديث تلقائي" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {serverHealth.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', s.status === 'online' ? 'bg-success-500' : s.status === 'degraded' ? 'bg-warning-500 animate-pulse' : 'bg-danger-500')} />
            <span className="text-sm text-surface-700">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="وقت التشغيل" value={stats.uptime} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><polyline points="12 6 12 12 16 14" /></svg>} iconBg="bg-success-50" />
        <StatCard title="طلبات/ثانية" value={stats.requestsPerSecond.toLocaleString('ar-SA')} change={5.2} changeLabel="عن الساعة الماضية" icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="اتصالات نشطة" value={stats.activeConnections.toLocaleString('ar-SA')} change={-3.1} changeLabel="عن الساعة الماضية" icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>} iconBg="bg-info-50" />
        <StatCard title="معدل الخطأ" value={`${stats.errorRate}%`} change={-12.5} changeLabel="عن الأمس" icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} iconBg="bg-danger-50" />
      </div>

      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">الموارد</TabsTrigger>
          <TabsTrigger value="network">الشبكة</TabsTrigger>
          <TabsTrigger value="database">قواعد البيانات</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex flex-col items-center py-8">
              <CircularProgress value={cpu} size={140} strokeWidth={10} color={getCpuColor(cpu)} showValue />
              <p className="mt-4 text-lg font-semibold text-surface-900">المعالج (CPU)</p>
              <p className="text-sm text-surface-500">8 أنوية × 3.5 GHz</p>
              <div className="mt-3 w-full px-6">
                <ProgressBar value={cpu} color={cpu > 80 ? 'danger' : cpu > 60 ? 'warning' : 'success'} size="sm" />
              </div>
            </Card>

            <Card className="flex flex-col items-center py-8">
              <CircularProgress value={ram} size={140} strokeWidth={10} color={getRamColor(ram)} showValue />
              <p className="mt-4 text-lg font-semibold text-surface-900">الذاكرة (RAM)</p>
              <p className="text-sm text-surface-500">{Math.round(ram * 0.32)} / 32 GB</p>
              <div className="mt-3 w-full px-6">
                <ProgressBar value={ram} color={ram > 85 ? 'danger' : ram > 70 ? 'warning' : 'brand'} size="sm" />
              </div>
            </Card>

            <Card className="flex flex-col items-center py-8">
              <CircularProgress value={disk} size={140} strokeWidth={10} color="#8B5CF6" showValue />
              <p className="mt-4 text-lg font-semibold text-surface-900"> القرص الصلب (Disk)</p>
              <p className="text-sm text-surface-500">{Math.round(disk * 5)} / 500 GB</p>
              <div className="mt-3 w-full px-6">
                <ProgressBar value={disk} color="info" size="sm" />
              </div>
            </Card>

            <Card className="flex flex-col items-center py-8">
              <CircularProgress value={network} size={140} strokeWidth={10} color="#06B6D4" showValue />
              <p className="mt-4 text-lg font-semibold text-surface-900">الشبكة (Network)</p>
              <p className="text-sm text-surface-500">{network}% من النطاق الترددي</p>
              <div className="mt-3 w-full px-6">
                <ProgressBar value={network} color="info" size="sm" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>حركة الوارد (Inbound)</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={inTraffic} color="#3B82F6" height={80} width={400} />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <MetricRow label="النطاق الحالي" value={bandwidth.inbound} />
                  <MetricRow label="الذروة" value={bandwidth.peakInbound} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حركة الصادر (Outbound)</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={outTraffic} color="#10B981" height={80} width={400} />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <MetricRow label="النطاق الحالي" value={bandwidth.outbound} />
                  <MetricRow label="الذروة" value={bandwidth.peakOutbound} />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>الاتصالات النشطة (24 ساعة)</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={connectionTimeline} height={180} showValues={false} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>ملخص النطاق الترددي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <MetricRow label="الإجمالي اليوم" value={bandwidth.totalToday} />
                  <MetricRow label="الوارد" value={bandwidth.inbound} sparkData={inTraffic.slice(-10)} />
                  <MetricRow label="الصادر" value={bandwidth.outbound} sparkData={outTraffic.slice(-10)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء الاستعلامات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-50">
                    <p className="text-xs text-surface-500">متوسط وقت الاستعلام</p>
                    <p className="text-2xl font-bold text-surface-900">{queryPerformance.avgQueryTime}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-50">
                    <p className="text-xs text-surface-500">الاستعلامات/ثانية</p>
                    <p className="text-2xl font-bold text-surface-900">{queryPerformance.queriesPerSecond.toLocaleString('ar-SA')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-50">
                    <p className="text-xs text-surface-500">الاستعلامات البطيئة</p>
                    <p className="text-2xl font-bold text-warning-600">{queryPerformance.slowQueries}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-50">
                    <p className="text-xs text-surface-500">الاستعلامات الفاشلة</p>
                    <p className="text-2xl font-bold text-danger-600">{queryPerformance.failedQueries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مجمع الاتصالات (Connection Pool)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-600">نشط</span>
                    <span className="text-sm font-semibold text-brand-600">{connectionPool.active} / {connectionPool.total}</span>
                  </div>
                  <ProgressBar value={connectionPool.active} max={connectionPool.total} color="brand" size="md" />
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="text-center p-2 rounded-lg bg-success-50">
                      <p className="text-lg font-bold text-success-600">{connectionPool.idle}</p>
                      <p className="text-xs text-surface-500">خامل</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-warning-50">
                      <p className="text-lg font-bold text-warning-600">{connectionPool.waiting}</p>
                      <p className="text-xs text-surface-500">بانتظار</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-danger-50">
                      <p className="text-lg font-bold text-danger-600">{connectionPool.maxUsed}</p>
                      <p className="text-xs text-surface-500">أقصى استخدام</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الاستعلامات البطيئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {slowQueries.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-surface-700 truncate max-w-[250px]">{q.query}</span>
                        <Badge variant={q.duration > 2000 ? 'danger' : 'warning'} size="sm">{q.duration}ms</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-surface-400">الجدول: {q.table}</span>
                        <span className="text-xs text-surface-400">{q.executions.toLocaleString('ar-SA')} تنفيذ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أحجام الجداول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tableSizes.map((t) => (
                    <div key={t.name} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-surface-900">{t.name}</span>
                          <span className="text-xs text-surface-500">{t.size}</span>
                        </div>
                        <ProgressBar value={t.rows} max={6000000} size="sm" color="brand" />
                      </div>
                      <Badge variant={t.growth > 20 ? 'danger' : t.growth > 10 ? 'warning' : 'success'} size="sm">+{t.growth}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>السجلات الأخيرة</CardTitle>
              <div className="flex gap-2">
                <Badge variant="info" size="sm">{logs.filter((l) => l.level === 'info').length} معلومات</Badge>
                <Badge variant="warning" size="sm">{logs.filter((l) => l.level === 'warn').length} تحذيرات</Badge>
                <Badge variant="danger" size="sm">{logs.filter((l) => l.level === 'error').length} أخطاء</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 cursor-pointer transition-colors"
                  >
                    {logLevelIcon(log.level)}
                    <span className="text-xs text-surface-400 tabular-nums whitespace-nowrap mt-0.5">{formatDate(log.timestamp)}</span>
                    <Badge variant={log.level === 'info' ? 'info' : log.level === 'warn' ? 'warning' : log.level === 'error' ? 'danger' : 'secondary'} size="sm">
                      {log.source}
                    </Badge>
                    <span className="text-sm text-surface-700 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} size="md">
        <DialogHeader onClose={() => setSelectedLog(null)}>
          <DialogTitle>تفاصيل السجل</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedLog && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {logLevelIcon(selectedLog.level)}
                {logLevelBadge(selectedLog.level)}
                <Badge variant="outline">{selectedLog.source}</Badge>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">الوقت</p>
                <p className="text-sm text-surface-900">{formatDate(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">الرسالة</p>
                <p className="text-sm text-surface-900 p-3 bg-surface-50 rounded-xl font-mono">{selectedLog.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setSelectedLog(null)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
