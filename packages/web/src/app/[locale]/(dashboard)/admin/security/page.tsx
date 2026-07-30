'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { CircularProgress, ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { ExportButton } from '@/components/admin/ExportButton';
import { BarChart, MetricRow } from '@/design-system/data/ChartCard';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  description: string;
  blocked: boolean;
  timestamp: string;
}

interface FirewallRule {
  id: string;
  name: string;
  action: 'allow' | 'block';
  protocol: string;
  port: string;
  source: string;
  enabled: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
}

interface IpEntry {
  id: string;
  ip: string;
  label: string;
  addedAt: string;
  type: 'whitelist' | 'blacklist';
}

export default function SecurityPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedEvent, setSelectedEvent] = React.useState<SecurityEvent | null>(null);
  const [showAddRule, setShowAddRule] = React.useState(false);
  const [showAddIp, setShowAddIp] = React.useState(false);

  const [stats] = React.useState({
    eventsToday: 23,
    failedLogins: 8,
    threatsBlocked: 45,
    securityScore: 92,
  });

  const [securityEvents] = React.useState<SecurityEvent[]>([
    { id: '1', type: 'محاولة دخول فاشلة', severity: 'high', sourceIp: '185.220.101.45', description: '10 محاولات فاشلة خلال 5 دقائق', blocked: true, timestamp: '2026-07-28T10:30:00' },
    { id: '2', type: 'هجوم Brute Force', severity: 'critical', sourceIp: '91.134.203.12', description: 'هجوم مكثف على صفحة تسجيل الدخول', blocked: true, timestamp: '2026-07-28T10:25:00' },
    { id: '3', type: 'محاولة SQL Injection', severity: 'critical', sourceIp: '45.33.32.156', description: 'محاولة حقن SQL في حقل البحث', blocked: true, timestamp: '2026-07-28T10:20:00' },
    { id: '4', type: 'XSS Attempt', severity: 'high', sourceIp: '104.236.228.48', description: 'محاولة حقن Script في نموذج التعليقات', blocked: true, timestamp: '2026-07-28T10:15:00' },
    { id: '5', type: 'وصول غير مصرح به', severity: 'medium', sourceIp: '192.168.1.105', description: 'محاولة الوصول لوحة التحكم بدون صلاحيات', blocked: false, timestamp: '2026-07-28T10:10:00' },
    { id: '6', type: 'محاولة دخول فاشلة', severity: 'medium', sourceIp: '203.0.113.50', description: '3 محاولات فاشلة - حساب غير موجود', blocked: false, timestamp: '2026-07-28T09:50:00' },
    { id: '7', type: 'XSS Attempt', severity: 'high', sourceIp: '198.51.100.23', description: 'محاولة إدراج HTML في URL', blocked: true, timestamp: '2026-07-28T09:30:00' },
    { id: '8', type: 'وصول غير مصرح به', severity: 'low', sourceIp: '172.16.0.55', description: 'طلب API بدون مفتاح صالح', blocked: true, timestamp: '2026-07-28T09:00:00' },
    { id: '9', type: 'محاولة SQL Injection', severity: 'critical', sourceIp: '192.0.2.1', description: 'محاولة تعديل بيانات عبر SQL', blocked: true, timestamp: '2026-07-28T08:45:00' },
    { id: '10', type: 'هجوم Brute Force', severity: 'high', sourceIp: '198.18.0.1', description: '50 محاولة خلال دقيقة واحدة', blocked: true, timestamp: '2026-07-28T08:30:00' },
  ]);

  const [firewallRules] = React.useState<FirewallRule[]>([
    { id: '1', name: 'حظر IPs المشبوهة', action: 'block', protocol: 'TCP', port: '*', source: 'قائمة سوداء', enabled: true },
    { id: '2', name: 'السماح بطلبات API', action: 'allow', protocol: 'TCP', port: '443', source: '0.0.0.0/0', enabled: true },
    { id: '3', name: 'حظر Port Scanning', action: 'block', protocol: 'TCP', port: '1-1024', source: '0.0.0.0/0', enabled: true },
    { id: '4', name: 'السماح بـ SSH', action: 'allow', protocol: 'TCP', port: '22', source: '10.0.0.0/8', enabled: true },
    { id: '5', name: 'حظر ICMP Flood', action: 'block', protocol: 'ICMP', port: '*', source: '0.0.0.0/0', enabled: true },
    { id: '6', name: ' Rate Limiting', action: 'block', protocol: 'TCP', port: '80,443', source: '>100 req/s', enabled: true },
  ]);

  const [sslCert] = React.useState({
    issuer: "Let's Encrypt",
    validFrom: '2026-01-15',
    validTo: '2026-07-15',
    daysRemaining: -14,
    domain: '*.almokhtabar.com',
    autoRenew: true,
  });

  const [twoFaAdoption] = React.useState([
    { department: 'الإدارة', rate: 95 },
    { department: 'المختبر', rate: 78 },
    { department: 'ال财务', rate: 88 },
    { department: 'الموارد البشرية', rate: 65 },
    { department: 'الدعم الفني', rate: 72 },
    { department: 'المبيعات', rate: 58 },
  ]);

  const [recommendations] = React.useState<Recommendation[]>([
    { id: '1', title: 'تفعيل المصادقة الثنائية للموظفين', priority: 'high', status: 'in-progress', description: '65% من الموظفين فقط فعّلوا 2FA' },
    { id: '2', title: 'تجديد شهادة SSL', priority: 'high', status: 'pending', description: 'الشهادة منتهية الصلاحية منذ 14 يوم' },
    { id: '3', title: 'تحديث سياسة كلمات المرور', priority: 'medium', status: 'completed', description: 'تم تحديث السياسة لتشمل 12 حرفاً على الأقل' },
    { id: '4', title: 'تفعيل WAF', priority: 'high', status: 'pending', description: 'جدار حماية تطبيقات الويب غير مفعّل' },
    { id: '5', title: 'مراجعة صلاحيات المستخدمين', priority: 'medium', status: 'in-progress', description: '12 مستخدم بصلاحيات管理员' },
    { id: '6', title: 'إضافة IP إلى القائمة البيضاء', priority: 'low', status: 'completed', description: 'تمت إضافة 5 عناوين IP للقائمة البيضاء' },
  ]);

  const [ipList] = React.useState<IpEntry[]>([
    { id: '1', ip: '10.0.0.1', label: 'خادم الم办公室', addedAt: '2026-01-10', type: 'whitelist' },
    { id: '2', ip: '192.168.1.0/24', label: 'شبكة المكتب', addedAt: '2026-02-15', type: 'whitelist' },
    { id: '3', ip: '185.220.101.45', label: 'مهاجم معروف', addedAt: '2026-07-28', type: 'blacklist' },
    { id: '4', ip: '91.134.203.12', label: 'Brute Force', addedAt: '2026-07-28', type: 'blacklist' },
    { id: '5', ip: '45.33.32.156', label: 'SQL Injection', addedAt: '2026-07-28', type: 'blacklist' },
    { id: '6', ip: '104.236.228.48', label: 'XSS Attacker', addedAt: '2026-07-28', type: 'blacklist' },
    { id: '7', ip: '203.0.113.0/24', label: 'مزود خدمة آمن', addedAt: '2026-03-20', type: 'whitelist' },
  ]);

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="danger">حرج</Badge>;
      case 'high': return <Badge variant="warning">مرتفع</Badge>;
      case 'medium': return <Badge variant="info">متوسط</Badge>;
      case 'low': return <Badge variant="secondary">منخفض</Badge>;
      default: return <Badge variant="default">{severity}</Badge>;
    }
  };

  const typeBadge = (type: string) => {
    if (type.includes('SQL')) return <Badge variant="danger">{type}</Badge>;
    if (type.includes('Brute')) return <Badge variant="danger">{type}</Badge>;
    if (type.includes('XSS')) return <Badge variant="warning">{type}</Badge>;
    if (type.includes('دخول')) return <Badge variant="warning">{type}</Badge>;
    return <Badge variant="info">{type}</Badge>;
  };

  const scoreColor = (score: number) => score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = (score: number) => score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : 'يحتاج تحسين';

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'high': return <Badge variant="danger">عالي</Badge>;
      case 'medium': return <Badge variant="warning">متوسط</Badge>;
      case 'low': return <Badge variant="secondary">منخفض</Badge>;
      default: return <Badge variant="default">{p}</Badge>;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'completed': return <Badge variant="success">مكتمل</Badge>;
      case 'in-progress': return <Badge variant="info">قيد التنفيذ</Badge>;
      case 'pending': return <Badge variant="warning">قيد الانتظار</Badge>;
      default: return <Badge variant="default">{s}</Badge>;
    }
  };

  const certDaysLabel = sslCert.daysRemaining < 0
    ? `منتهية منذ ${Math.abs(sslCert.daysRemaining)} يوم`
    : `${sslCert.daysRemaining} يوم متبقي`;

  const exportEvents = securityEvents.map((e) => ({
    'النوع': e.type,
    'الشدة': e.severity === 'critical' ? 'حرج' : e.severity === 'high' ? 'مرتفع' : e.severity === 'medium' ? 'متوسط' : 'منخفض',
    'IP المصدر': e.sourceIp,
    'الوصف': e.description,
    'محجوب': e.blocked ? 'نعم' : 'لا',
    'الوقت': formatDate(e.timestamp),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">مركز الأمان</h1>
          <p className="mt-1 text-sm text-surface-500">مراقبة الأحداث الأمنية والتهديدات والحماية</p>
        </div>
        <ExportButton data={exportEvents} filename="security-events" title="الأحداث الأمنية" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="أحداث أمنية اليوم" value={stats.eventsToday} icon={<svg className="h-5 w-5 text-warning-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} iconBg="bg-warning-50" />
        <StatCard title="محاولات دخول فاشلة" value={stats.failedLogins} icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>} iconBg="bg-danger-50" />
        <StatCard title="تهديدات محجوبة" value={stats.threatsBlocked} change={15} changeLabel="عن الأمس" icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>} iconBg="bg-success-50" />
        <StatCard title="درجة الأمان" value={`${stats.securityScore}/100`} icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} iconBg="bg-brand-50" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="threats" count={securityEvents.length}>التهديدات</TabsTrigger>
          <TabsTrigger value="rules">القواعد</TabsTrigger>
          <TabsTrigger value="certs">الشهادات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center py-8">
              <CircularProgress value={stats.securityScore} size={160} strokeWidth={12} color={scoreColor(stats.securityScore)} showValue />
              <p className="mt-4 text-xl font-bold text-surface-900">درجة الأمان</p>
              <Badge variant={stats.securityScore >= 80 ? 'success' : 'warning'} size="lg" className="mt-2">{scoreLabel(stats.securityScore)}</Badge>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>التهديدات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'محاولة دخول فاشلة', count: 8, color: 'bg-warning-500', max: 10 },
                    { label: 'هجوم Brute Force', count: 3, color: 'bg-danger-500', max: 10 },
                    { label: 'SQL Injection', count: 2, color: 'bg-danger-600', max: 10 },
                    { label: 'XSS Attempt', count: 4, color: 'bg-orange-500', max: 10 },
                    { label: 'وصول غير مصرح به', count: 6, color: 'bg-info-500', max: 10 },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-surface-600">{t.label}</span>
                      <div className="flex-1 h-3 bg-surface-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', t.color)} style={{ width: `${(t.count / t.max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-sm font-semibold text-surface-900 text-center">{t.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>تبنى المصادقة الثنائية حسب القسم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {twoFaAdoption.map((d) => (
                    <div key={d.department} className="flex items-center gap-3">
                      <span className="w-40 text-sm text-surface-600">{d.department}</span>
                      <div className="flex-1 h-3 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', d.rate >= 80 ? 'bg-success-500' : d.rate >= 60 ? 'bg-warning-500' : 'bg-danger-500')}
                          style={{ width: `${d.rate}%` }}
                        />
                      </div>
                      <span className="w-10 text-sm font-semibold text-surface-900 text-center">{d.rate}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>الأحداث الأمنية الأخيرة</CardTitle>
              <SearchInput placeholder="بحث في الأحداث..." onSearch={setSearchQuery} className="w-64" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="py-3 px-3 text-right font-medium text-surface-500">النوع</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الشدة</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">IP المصدر</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الوصف</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">محجوب</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الوقت</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">تفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents
                      .filter((e) => !searchQuery || e.type.includes(searchQuery) || e.sourceIp.includes(searchQuery) || e.description.includes(searchQuery))
                      .map((event) => (
                      <tr key={event.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-3">{typeBadge(event.type)}</td>
                        <td className="py-3 px-3">{severityBadge(event.severity)}</td>
                        <td className="py-3 px-3 font-mono text-xs">{event.sourceIp}</td>
                        <td className="py-3 px-3 text-surface-700 max-w-[200px] truncate">{event.description}</td>
                        <td className="py-3 px-3">
                          {event.blocked ? (
                            <svg className="h-5 w-5 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          ) : (
                            <svg className="h-5 w-5 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-surface-500">{formatDate(event.timestamp)}</td>
                        <td className="py-3 px-3">
                          <Button variant="ghost" size="xs" onClick={() => setSelectedEvent(event)}>عرض</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>قواعد جدار الحماية</CardTitle>
              <Button variant="primary" size="sm" onClick={() => setShowAddRule(true)}>إضافة قاعدة</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الاسم</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">الإجراء</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">البروتوكول</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">المنفذ</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">المصدر</th>
                      <th className="py-3 px-3 text-right font-medium text-surface-500">مفعّل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-surface-900">{rule.name}</td>
                        <td className="py-3 px-3">
                          <Badge variant={rule.action === 'allow' ? 'success' : 'danger'}>
                            {rule.action === 'allow' ? 'سماح' : 'حظر'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">{rule.protocol}</td>
                        <td className="py-3 px-3 font-mono text-xs">{rule.port}</td>
                        <td className="py-3 px-3 font-mono text-xs">{rule.source}</td>
                        <td className="py-3 px-3">
                          <Switch checked={rule.enabled} onCheckedChange={() => {}} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>شهادة SSL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={sslCert.daysRemaining < 0 ? 'danger' : sslCert.daysRemaining < 30 ? 'warning' : 'success'} size="lg" dot>
                      {sslCert.daysRemaining < 0 ? 'منتهية' : sslCert.daysRemaining < 30 ? 'قريبة الانتهاء' : 'صالحة'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-surface-50">
                      <p className="text-xs text-surface-500">المجال</p>
                      <p className="text-sm font-medium text-surface-900 font-mono">{sslCert.domain}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-50">
                      <p className="text-xs text-surface-500">الجهة المصدرة</p>
                      <p className="text-sm font-medium text-surface-900">{sslCert.issuer}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-50">
                      <p className="text-xs text-surface-500">تاريخ البدء</p>
                      <p className="text-sm font-medium text-surface-900">{formatDate(sslCert.validFrom)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-50">
                      <p className="text-xs text-surface-500">تاريخ الانتهاء</p>
                      <p className="text-sm font-medium text-danger-600">{formatDate(sslCert.validTo)}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-danger-50 border border-danger-200">
                    <p className="text-sm font-medium text-danger-700">{certDaysLabel}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-600">تجديد تلقائي</span>
                    <Switch checked={sslCert.autoRenew} onCheckedChange={() => {}} />
                  </div>
                  <Button variant="danger" fullWidth>تجديد الآن</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التوصيات الأمنية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl border border-surface-100 hover:bg-surface-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-surface-900">{r.title}</h4>
                        <div className="flex items-center gap-2">
                          {priorityBadge(r.priority)}
                          {statusBadge(r.status)}
                        </div>
                      </div>
                      <p className="text-xs text-surface-500 mt-1">{r.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>القائمة البيضاء / السوداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button variant="primary" size="sm" onClick={() => setShowAddIp(true)}>إضافة IP</Button>
                </div>
                <div className="space-y-2">
                  {ipList.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                      <div className="flex items-center gap-3">
                        <span className={cn('h-2.5 w-2.5 rounded-full', entry.type === 'whitelist' ? 'bg-success-500' : 'bg-danger-500')} />
                        <div>
                          <span className="text-sm font-mono font-medium text-surface-900">{entry.ip}</span>
                          <span className="text-xs text-surface-500 mr-2">{entry.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.type === 'whitelist' ? 'success' : 'danger'} size="sm">
                          {entry.type === 'whitelist' ? 'بيضاء' : 'سوداء'}
                        </Badge>
                        <Button variant="ghost" size="icon-xs">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l10 10M13 3l-10 10" strokeLinecap="round" /></svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'المصادقة الثنائية', desc: 'إلزام جميع المستخدمين بتفعيل 2FA', checked: false },
                    { title: 'قفل الحساب', desc: 'قفل الحساب بعد 5 محاولات فاشلة', checked: true },
                    { title: 'تسجيل العمليات', desc: 'تسجيل جميع العمليات الأمنية', checked: true },
                    { title: 'تنبيهات البريد', desc: 'إرسال تنبيhes عند حدوث أحداث حرجة', checked: true },
                    { title: 'فحص الـ WAF', desc: 'جدار حماية تطبيقات الويب', checked: false },
                    { title: 'حظر SOCKS Proxies', desc: 'حظر الوصول عبر Proxies', checked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-surface-900">{item.title}</p>
                        <p className="text-xs text-surface-500">{item.desc}</p>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={() => {}} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} size="lg">
        <DialogHeader onClose={() => setSelectedEvent(null)}>
          <DialogTitle>تفاصيل الحدث الأمني</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {typeBadge(selectedEvent.type)}
                {severityBadge(selectedEvent.severity)}
                {selectedEvent.blocked ? (
                  <Badge variant="success" dot>محجوب</Badge>
                ) : (
                  <Badge variant="warning" dot>غير محجوب</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">IP المصدر</p>
                  <p className="text-sm font-mono font-medium text-surface-900">{selectedEvent.sourceIp}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50">
                  <p className="text-xs text-surface-500">الوقت</p>
                  <p className="text-sm font-medium text-surface-900">{formatDate(selectedEvent.timestamp)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">الوصف</p>
                <p className="text-sm text-surface-900 p-3 bg-surface-50 rounded-xl">{selectedEvent.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {selectedEvent && !selectedEvent.blocked && (
            <Button variant="danger" onClick={() => setSelectedEvent(null)}>حظر IP</Button>
          )}
          <Button variant="secondary" onClick={() => setSelectedEvent(null)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showAddRule} onClose={() => setShowAddRule(false)} size="md">
        <DialogHeader onClose={() => setShowAddRule(false)}>
          <DialogTitle>إضافة قاعدة جديدة</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <FormField label="اسم القاعدة" required>
              <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm" placeholder="اسم توضيحي للقاعدة" />
            </FormField>
            <FormGroup columns={2}>
              <FormField label="الإجراء" required>
                <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm">
                  <option value="allow">سماح</option>
                  <option value="block">حظر</option>
                </select>
              </FormField>
              <FormField label="البروتوكول" required>
                <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm">
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </FormField>
            </FormGroup>
            <FormGroup columns={2}>
              <FormField label="المنفذ">
                <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm" placeholder="443" />
              </FormField>
              <FormField label="المصدر">
                <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm" placeholder="0.0.0.0/0" />
              </FormField>
            </FormGroup>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowAddRule(false)}>إلغاء</Button>
          <Button variant="primary" onClick={() => setShowAddRule(false)}>إضافة</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showAddIp} onClose={() => setShowAddIp(false)} size="md">
        <DialogHeader onClose={() => setShowAddIp(false)}>
          <DialogTitle>إضافة عنوان IP</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <FormField label="عنوان IP" required>
              <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-mono" placeholder="192.168.1.1" />
            </FormField>
            <FormField label="الوصف" required>
              <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm" placeholder="وصف توضيحي" />
            </FormField>
            <FormField label="القائمة" required>
              <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm">
                <option value="whitelist">القائمة البيضاء</option>
                <option value="blacklist">القائمة السوداء</option>
              </select>
            </FormField>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowAddIp(false)}>إلغاء</Button>
          <Button variant="primary" onClick={() => setShowAddIp(false)}>إضافة</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
