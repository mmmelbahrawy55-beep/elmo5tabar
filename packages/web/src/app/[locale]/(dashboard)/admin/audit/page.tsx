'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userAr: string;
  action: string;
  actionAr: string;
  resource: string;
  resourceAr: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'security' | 'modification' | 'access' | 'export';
  orderId?: string;
}

const SEVERITY_MAP: Record<string, { label: string; className: string }> = {
  info: { label: 'معلومة', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  warning: { label: 'تحذير', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'حرج', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const CATEGORY_MAP: Record<string, string> = {
  security: 'أمنية', modification: 'تعديلات', access: 'دخول/خروج', export: 'تصدير',
};

const MOCK_LOGS: AuditLog[] = [
  { id: '1', timestamp: '2026-07-28T14:32:00', user: 'admin@elm.com', userAr: 'أحمد محمد', action: 'LOGIN', actionAr: 'تسجيل دخول', resource: 'auth', resourceAr: 'المصادقة', resourceId: 'usr-001', details: 'تسجيل دخول ناجح من متصفح Chrome', ipAddress: '192.168.1.100', severity: 'info', category: 'access' },
  { id: '2', timestamp: '2026-07-28T14:28:00', user: 'dr.sara@elm.com', userAr: 'د. سارة أحمد', action: 'UPDATE', actionAr: 'تعديل', resource: 'patient', resourceAr: 'مريض', resourceId: 'pat-4521', details: 'تعديل بيانات المريض: تحديث العنوان', ipAddress: '192.168.1.105', severity: 'info', category: 'modification' },
  { id: '3', timestamp: '2026-07-28T14:15:00', user: 'system', userAr: 'النظام', action: 'FAILED_LOGIN', actionAr: 'فشل تسجيل دخول', resource: 'auth', resourceAr: 'المصادقة', resourceId: 'usr-099', details: '3 محاولات فاشلة متتالية - حظر مؤقت', ipAddress: '45.33.12.88', severity: 'critical', category: 'security' },
  { id: '4', timestamp: '2026-07-28T14:10:00', user: 'billing@elm.com', userAr: 'خالد علي', action: 'EXPORT', actionAr: 'تصدير', resource: 'reports', resourceAr: 'تقارير', resourceId: 'rpt-monthly', details: 'تصدير تقرير الفواتير الشهري - 1,234 سجل', ipAddress: '192.168.1.110', severity: 'warning', category: 'export' },
  { id: '5', timestamp: '2026-07-28T13:55:00', user: 'nurse.mona@elm.com', userAr: 'م. منى حسن', action: 'CREATE', actionAr: 'إنشاء', resource: 'order', resourceAr: 'طلب', resourceId: 'ord-7890', orderId: 'ord-7890', details: 'إنشاء طلب اختبار دم جديد للمريض pat-3321', ipAddress: '192.168.1.120', severity: 'info', category: 'modification' },
  { id: '6', timestamp: '2026-07-28T13:40:00', user: 'lab@elm.com', userAr: 'محمد صابر', action: 'PUBLISH', actionAr: 'نشر', resource: 'report', resourceAr: 'تقرير', resourceId: 'rpt-6543', details: 'نشر نتائج التحاليل للمريض pat-2210', ipAddress: '192.168.1.115', severity: 'info', category: 'modification' },
  { id: '7', timestamp: '2026-07-28T13:25:00', user: 'system', userAr: 'النظام', action: 'BACKUP', actionAr: 'نسخ احتياطي', resource: 'system', resourceAr: 'النظام', resourceId: 'backup-daily', details: 'نسخ احتياطي يومي مكتمل - 2.3GB', ipAddress: '127.0.0.1', severity: 'info', category: 'security' },
  { id: '8', timestamp: '2026-07-28T13:10:00', user: 'reception@elm.com', userAr: 'نورا سعيد', action: 'DELETE', actionAr: 'حذف', resource: 'appointment', resourceAr: 'موعد', resourceId: 'apt-9012', details: 'إلغاء موعد المريض pat-1122', ipAddress: '192.168.1.130', severity: 'warning', category: 'modification' },
  { id: '9', timestamp: '2026-07-28T12:50:00', user: 'admin@elm.com', userAr: 'أحمد محمد', action: 'ROLE_CHANGE', actionAr: 'تغيير دور', resource: 'user', resourceAr: 'مستخدم', resourceId: 'usr-045', details: 'تغيير دور المستخدم من NURSE إلى DOCTOR', ipAddress: '192.168.1.100', severity: 'warning', category: 'security' },
  { id: '10', timestamp: '2026-07-28T12:30:00', user: 'superadmin@elm.com', userAr: '超级管理员', action: 'CONFIG_CHANGE', actionAr: 'تغيير إعدادات', resource: 'system', resourceAr: 'النظام', resourceId: 'cfg-general', details: 'تعديل إعدادات النظام: تغيير مهلة الجلسة إلى 60 دقيقة', ipAddress: '192.168.1.10', severity: 'critical', category: 'security' },
  { id: '11', timestamp: '2026-07-28T12:15:00', user: 'phlebo@elm.com', userAr: 'ياسمين خالد', action: 'CREATE', actionAr: 'إنشاء', resource: 'specimen', resourceAr: 'عينة', resourceId: 'spc-8890', details: 'تسجيل عينة دم للمريض pat-5566', ipAddress: '192.168.1.140', severity: 'info', category: 'modification' },
  { id: '12', timestamp: '2026-07-28T11:50:00', user: 'system', userAr: 'النظام', action: 'SECURITY_SCAN', actionAr: 'فحص أمني', resource: 'system', resourceAr: 'النظام', resourceId: 'scan-daily', details: 'فحص أمني يومي: لا توجد تهديدات', ipAddress: '127.0.0.1', severity: 'info', category: 'security' },
  { id: '13', timestamp: '2026-07-28T11:30:00', user: 'billing@elm.com', userAr: 'خالد علي', action: 'PAYMENT', actionAr: 'دفع', resource: 'invoice', resourceAr: 'فاتورة', resourceId: 'inv-3344', details: 'تسجيل دفعة 1,500 ج.م للمريض pat-7788', ipAddress: '192.168.1.110', severity: 'info', category: 'modification' },
  { id: '14', timestamp: '2026-07-28T11:10:00', user: 'unknown', userAr: 'مجهول', action: 'UNAUTHORIZED', actionAr: 'وصول غير مصرح', resource: 'admin', resourceAr: 'إدارة', resourceId: 'panel', details: 'محاولة وصول لوحة الإدارة من IP غير مصرح', ipAddress: '103.45.67.89', severity: 'critical', category: 'security' },
  { id: '15', timestamp: '2026-07-28T10:45:00', user: 'dr.ali@elm.com', userAr: 'د. علي محمود', action: 'LOGIN', actionAr: 'تسجيل دخول', resource: 'auth', resourceAr: 'المصادقة', resourceId: 'usr-012', details: 'تسجيل دخول ناجح عبر تطبيق الجوال', ipAddress: '192.168.1.150', severity: 'info', category: 'access' },
];

export default function AuditPage() {
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<AuditLog[]>([]);
  const realtimeRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    let result = [...logs, ...realtimeLogs];
    if (searchQuery) {
      result = result.filter(log =>
        log.userAr.includes(searchQuery) || log.actionAr.includes(searchQuery) || log.resourceAr.includes(searchQuery) || log.details.includes(searchQuery)
      );
    }
    if (activeTab !== 'all') {
      const catMap: Record<string, string> = { security: 'security', modifications: 'modification', access: 'access', export: 'export' };
      result = result.filter(log => log.category === catMap[activeTab]);
    }
    if (filterSeverity !== 'all') result = result.filter(log => log.severity === filterSeverity);
    if (filterCategory !== 'all') result = result.filter(log => log.category === filterCategory);
    return result;
  }, [logs, realtimeLogs, searchQuery, activeTab, filterSeverity, filterCategory]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const actions = ['LOGIN', 'UPDATE', 'CREATE', 'EXPORT'];
      const severities: Array<'info' | 'warning' | 'critical'> = ['info', 'info', 'info', 'warning'];
      const idx = Math.floor(Math.random() * actions.length);
      const newLog: AuditLog = {
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        user: 'auto@elm.com',
        userAr: 'مستخدم تلقائي',
        action: actions[idx],
        actionAr: actions[idx] === 'LOGIN' ? 'تسجيل دخول' : actions[idx] === 'UPDATE' ? 'تعديل' : actions[idx] === 'CREATE' ? 'إنشاء' : 'تصدير',
        resource: 'system',
        resourceAr: 'النظام',
        resourceId: `res-${Math.floor(Math.random() * 9999)}`,
        details: 'حدث تلقائي من المراقبة',
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        severity: severities[idx],
        category: 'modification',
      };
      setRealtimeLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (realtimeRef.current) {
      realtimeRef.current.scrollTop = 0;
    }
  }, [realtimeLogs]);

  const stats = [
    { title: 'إجمالي السجلات', value: '45,678', icon: '📋', trend: '+234', trendUp: true },
    { title: 'سجلات اليوم', value: '234', icon: '📊', trend: '+12%', trendUp: true },
    { title: 'تحذيرات', value: 12, icon: '⚠️', trend: '-3', trendUp: false },
    { title: 'أحداث حرجة', value: 3, icon: '🔴', trend: '+1', trendUp: false },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجلات التدقيق</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">مراقبة وتتبع جميع أحداث النظام</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm text-gray-600 dark:text-gray-300">تحديث تلقائي</span>
          </label>
          <ExportButton data={filteredLogs} filename="audit-logs" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} trendUp={stat.trendUp} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث في السجلات..." />
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
            >
              <option value="all">جميع الشدات</option>
              <option value="info">معلومة</option>
              <option value="warning">تحذير</option>
              <option value="critical">حرج</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
            >
              <option value="all">جميع الفئات</option>
              <option value="security">أمنية</option>
              <option value="modification">تعديلات</option>
              <option value="access">دخول/خروج</option>
              <option value="export">تصدير</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="security">أمنية</TabsTrigger>
          <TabsTrigger value="modifications">تعديلات</TabsTrigger>
          <TabsTrigger value="access">دخول/خروج</TabsTrigger>
          <TabsTrigger value="export">تصدير</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent>
              <div ref={realtimeRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">الوقت</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">المستخدم</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">الإجراء</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">المورد</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">معرّف المورد</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">التفاصيل</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">عنوان IP</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300">الشدة</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className={cn(
                        'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                        log.severity === 'critical' && 'bg-red-50/50 dark:bg-red-900/10',
                        log.severity === 'warning' && 'bg-orange-50/50 dark:bg-orange-900/10',
                      )}>
                        <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <div>
                            <span className="text-gray-900 dark:text-white font-medium">{log.userAr}</span>
                            <span className="block text-xs text-gray-400 font-mono">{log.user}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{log.actionAr}</td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{log.resourceAr}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-500 dark:text-gray-400">{log.resourceId}</td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 max-w-[250px] truncate">{log.details}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-500 dark:text-gray-400">{log.ipAddress}</td>
                        <td className="py-2.5 px-3">
                          <Badge className={cn('text-xs', SEVERITY_MAP[log.severity].className)}>{SEVERITY_MAP[log.severity].label}</Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}>تفاصيل</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">لا توجد سجلات مطابقة</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحدث</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">الوقت</label>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedLog.timestamp).toLocaleString('ar-EG')}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">المستخدم</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.userAr} ({selectedLog.user})</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">الإجراء</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.actionAr}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">المورد</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resourceAr}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">معرّف المورد</label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedLog.resourceId}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">عنوان IP</label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">الشدة</label>
                  <Badge className={cn('text-xs', SEVERITY_MAP[selectedLog.severity].className)}>{SEVERITY_MAP[selectedLog.severity].label}</Badge>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">الفئة</label>
                  <p className="text-sm text-gray-900 dark:text-white">{CATEGORY_MAP[selectedLog.category]}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">التفاصيل</label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedLog.details}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">JSON</label>
                <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
