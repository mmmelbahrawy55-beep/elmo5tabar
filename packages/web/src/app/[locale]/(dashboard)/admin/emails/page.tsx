'use client';

import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { ExportButton } from '@/components/admin/ExportButton';

const RECIPIENT_OPTIONS = ['الجميع', 'المرضى', 'الأطباء', 'مستخدمون محددون'] as const;

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipients: number;
  sentAt: string;
  openRate: number;
  clickRate: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  preview: string;
  lastModified: string;
  isActive: boolean;
}

interface SmtpSettings {
  host: string;
  port: string;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  encryption: string;
  isActive: boolean;
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'حملة التذكير بالمواعيد', subject: 'تذكير بموعدك القادم', status: 'مكتملة', recipients: 3456, sentAt: '2026-07-27T10:00:00Z', openRate: 72.3, clickRate: 28.5 },
  { id: '2', name: 'نشرة الأنشطة الصحية', subject: 'أحدث الأنشطة والبرامج الصحية', status: 'مكتملة', recipients: 5678, sentAt: '2026-07-25T14:00:00Z', openRate: 54.1, clickRate: 15.8 },
  { id: '3', name: 'عرض نهاية العام', subject: 'خصومات حصرية لعملائنا الكرام', status: 'مجدولة', recipients: 8901, sentAt: '2026-08-01T09:00:00Z', openRate: 0, clickRate: 0 },
  { id: '4', name: 'رسالة ترحيب الأعضاء الجدد', subject: 'مرحباً بك في عائلتنا الصحية', status: 'مكتملة', recipients: 234, sentAt: '2026-07-24T11:30:00Z', openRate: 91.5, clickRate: 45.2 },
  { id: '5', name: ' campaigned النتائج المخبرية', subject: 'نتائج فحوصاتك جاهزة', status: 'نشطة', recipients: 1234, sentAt: '2026-07-27T08:00:00Z', openRate: 82.7, clickRate: 38.9 },
  { id: '6', name: 'استبيان الرضا', subject: 'رأيك يهمنا - استبيان رضا المرضى', status: 'مكتملة', recipients: 4567, sentAt: '2026-07-20T10:00:00Z', openRate: 45.6, clickRate: 32.1 },
  { id: '7', name: 'إشعار تجديد الاشتراك', subject: 'تجديد اشتراكك القريب', status: 'فاشلة', recipients: 678, sentAt: '2026-07-22T16:00:00Z', openRate: 0, clickRate: 0 },
];

const mockEmailTemplates: EmailTemplate[] = [
  { id: '1', name: 'تذكير بالموعد', category: 'مواعيد', subject: 'تذكير بموعدك الطبي', preview: 'مرحباً {{name}}، لديك موعد طبي يوم {{date}}...', lastModified: '2026-07-25T10:00:00Z', isActive: true },
  { id: '2', name: 'نتائج الفحوصات', category: 'نتائج', subject: 'نتائج فحوصاتك جاهزة', preview: 'تم الانتهاء من تحليل {{testType}} الخاص بك...', lastModified: '2026-07-24T14:00:00Z', isActive: true },
  { id: '3', name: 'رسالة ترحيب', category: 'ترحيب', subject: 'مرحباً بك في {{platform}}', preview: 'يسعدنا انضمامك إلى منصتنا الصحية...', lastModified: '2026-07-20T09:00:00Z', isActive: true },
  { id: '4', name: 'فاتورة المستحقات', category: 'فواتير', subject: 'فاتورة مستحقاتك', preview: 'نفيدكم بأنه يوجد مستحقات مالية...',
    lastModified: '2026-07-22T11:00:00Z', isActive: true },
  { id: '5', name: 'إشعار صيانة', category: 'نظامي', subject: 'صيانة مجدولة للنظام', preview: 'سيكون النظام غير متاح اعتباراً من...',
    lastModified: '2026-07-18T15:00:00Z', isActive: false },
  { id: '6', name: 'استبيان الرضا', category: 'استبيانات', subject: 'ساعدنا في التحسن', preview: 'نقدّر تواصلكم معنا، الرجاء إكمال الاستبيان...',
    lastModified: '2026-07-15T10:00:00Z', isActive: true },
];

const mockSmtp: SmtpSettings = {
  host: 'smtp.elm5tber.com',
  port: '587',
  username: 'noreply@elm5tber.com',
  password: '••••••••',
  fromName: 'منصة المختبر',
  fromEmail: 'noreply@elm5tber.com',
  encryption: 'TLS',
  isActive: true,
};

const mockStatistics = {
  totalSent: 23456,
  delivered: 22123,
  opened: 15678,
  clicked: 4567,
  bounced: 892,
  unsubscribed: 234,
  deliveryRate: 94.3,
  openRate: 66.3,
  clickRate: 19.3,
  bounceRate: 3.8,
  avgOpenTime: '2.4 ساعة',
  peakHour: '10:00 صباحاً',
};

const monthlyData = [
  { month: 'يناير', sent: 1800, opened: 1200, clicked: 400 },
  { month: 'فبراير', sent: 2100, opened: 1400, clicked: 520 },
  { month: 'مارس', sent: 2400, opened: 1700, clicked: 610 },
  { month: 'أبريل', sent: 2200, opened: 1500, clicked: 480 },
  { month: 'مايو', sent: 2600, opened: 1800, clicked: 650 },
  { month: 'يونيو', sent: 2900, opened: 2000, clicked: 720 },
  { month: 'يوليو', sent: 3200, opened: 2200, clicked: 780 },
];

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [emailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(mockSmtp);
  const [statistics] = useState(mockStatistics);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    recipients: 'الجميع',
    content: '',
    scheduleDate: '',
  });
  const [smtpForm, setSmtpForm] = useState({ ...mockSmtp, password: '' });

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.includes(searchQuery) || c.subject.includes(searchQuery)
  );

  const handleCreateCampaign = () => {
    setCreateDialog(false);
    setCampaignForm({ name: '', subject: '', recipients: 'الجميع', content: '', scheduleDate: '' });
  };

  const handleSaveSmtp = () => {
    setSmtpSettings((prev) => ({
      ...prev,
      ...smtpForm,
      password: smtpForm.password || prev.password,
    }));
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'مكتملة') return 'success';
    if (status === 'نشطة') return 'info';
    if (status === 'مجدولة') return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">البريد الإلكتروني</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة حملات البريد الإلكتروني والقوالب
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredCampaigns} filename="email-campaigns" />
          <Button onClick={() => setCreateDialog(true)}>إنشاء حملة جديدة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الرسائل" value="23,456" trend={8.3} icon="📧" />
        <StatCard title="تم التوصيل" value="22,123" trend={6.1} icon="✅" />
        <StatCard title="فتحت" value="15,678" trend={4.5} icon="👁️" />
        <StatCard title="النقرات" value="4,567" trend={3.2} icon="🖱️" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>حملات البريد الإلكتروني</CardTitle>
                <SearchInput value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في الحملات..." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">العنوان</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">المستلمين</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">تاريخ الإرسال</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">معدل الفتح</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">معدل النقر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{c.subject}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(c.status) as any}>{c.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.recipients.toLocaleString('ar-EG')}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(new Date(c.sentAt))}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={c.openRate} className="h-2 w-16" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{c.openRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={c.clickRate} className="h-2 w-16" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{c.clickRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قوالب البريد الإلكتروني</CardTitle>
                <Button>إنشاء قالب جديد</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {emailTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{t.name}</h3>
                        <Badge variant="default" className="mt-1">{t.category}</Badge>
                      </div>
                      <Switch checked={t.isActive} onCheckedChange={() => {}} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.subject}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{t.preview}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        آخر تعديل: {formatDate(new Date(t.lastModified))}
                      </span>
                      <Button variant="outline" size="sm">تعديل</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">معدل التوصيل</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.deliveryRate}%</p>
                  <ProgressBar value={statistics.deliveryRate} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">معدل الفتح</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.openRate}%</p>
                  <ProgressBar value={statistics.openRate} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">معدل النقر</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.clickRate}%</p>
                  <ProgressBar value={statistics.clickRate} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">معدل الارتداد</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.bounceRate}%</p>
                  <ProgressBar value={statistics.bounceRate} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">متوسط وقت الفتح</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.avgOpenTime}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ساعة الذروة</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.peakHour}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>الأداء الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center gap-4">
                      <span className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">{data.month}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 rounded bg-blue-500" style={{ width: `${(data.sent / 3200) * 100}%` }} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{data.sent} مرسلة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 rounded bg-green-500" style={{ width: `${(data.opened / 3200) * 100}%` }} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{data.opened} فُتحت</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 rounded bg-purple-500" style={{ width: `${(data.clicked / 3200) * 100}%` }} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{data.clicked} نقرة</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">رسائل ارتداد</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.bounced.toLocaleString('ar-EG')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">إلغاء الاشتراك</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.unsubscribed.toLocaleString('ar-EG')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">النقرات الفريدة</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.clicked.toLocaleString('ar-EG')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>إعدادات SMTP</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={cn('flex items-center gap-1 text-sm', smtpSettings.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    <span className={cn('h-2 w-2 rounded-full', smtpSettings.isActive ? 'bg-green-500' : 'bg-red-500')} />
                    {smtpSettings.isActive ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormSection title="بيانات الخادم">
                <FormGroup>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="الخادم (Host)">
                      <input
                        type="text"
                        value={smtpForm.host}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, host: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="المنفذ (Port)">
                      <input
                        type="text"
                        value={smtpForm.port}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, port: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="اسم المستخدم">
                      <input
                        type="text"
                        value={smtpForm.username}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="كلمة المرور">
                      <input
                        type="password"
                        value={smtpForm.password}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="اسم المرسل">
                      <input
                        type="text"
                        value={smtpForm.fromName}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, fromName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="بريد المرسل">
                      <input
                        type="email"
                        value={smtpForm.fromEmail}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </FormField>
                    <FormField label="التشفير">
                      <select
                        value={smtpForm.encryption}
                        onChange={(e) => setSmtpForm((prev) => ({ ...prev, encryption: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="TLS">TLS</option>
                        <option value="SSL">SSL</option>
                        <option value="none">بدون تشفير</option>
                      </select>
                    </FormField>
                    <FormField label="تفعيل SMTP">
                      <div className="flex items-center pt-2">
                        <Switch checked={smtpForm.isActive} onCheckedChange={(v) => setSmtpForm((prev) => ({ ...prev, isActive: v }))} />
                      </div>
                    </FormField>
                  </div>
                </FormGroup>
              </FormSection>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline">اختبار الاتصال</Button>
                <Button onClick={handleSaveSmtp}>حفظ الإعدادات</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء حملة جديدة</DialogTitle>
          </DialogHeader>
          <FormSection title="بيانات الحملة">
            <FormGroup>
              <FormField label="اسم الحملة">
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم الحملة"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </FormField>
              <FormField label="الموضوع">
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="موضوع الرسالة"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </FormField>
              <FormField label="المستلمون">
                <select
                  value={campaignForm.recipients}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, recipients: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {RECIPIENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="المحتوى">
                <textarea
                  rows={6}
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="اكتب محتوى الرسالة هنا... يمكنك استخدام {{name}} للإشارة للمستلم"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </FormField>
              <FormField label="جدولة الإرسال (اختياري)">
                <input
                  type="datetime-local"
                  value={campaignForm.scheduleDate}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </FormField>
            </FormGroup>
          </FormSection>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
            <Button variant="outline">حفظ كمسودة</Button>
            <Button onClick={handleCreateCampaign}>إرسال الحملة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
