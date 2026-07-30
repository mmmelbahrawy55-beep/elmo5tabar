'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn, formatDate, formatDateTime, formatNumber, formatCompactNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard, EmptyState } from '@/design-system/layout/Card';
import { Badge, Avatar } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent, Pagination } from '@/design-system/navigation/Tabs';
import { Input, Textarea, Select, Switch, Checkbox } from '@/design-system/primitives/Input';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog, LoadingSpinner, Alert, useToast } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { ChartCard } from '@/design-system/data/ChartCard';
import { notificationClient } from '@/lib/api/notifications';

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'VOICE'] as const;
const NOTIF_TYPES = ['APPOINTMENT_REMINDER', 'RESULTS_READY', 'ORDER_CONFIRMED', 'PAYMENT_RECEIVED', 'MARKETING', 'SECURITY_ALERT', 'INSURANCE_EXPIRY', 'BIRTHDAY'] as const;
const CHANNEL_LABELS: Record<string, string> = { IN_APP: 'داخل التطبيق', EMAIL: 'بريد إلكتروني', SMS: 'رسالة نصية', WHATSAPP: 'واتساب', PUSH: 'إشعار فوري', VOICE: 'مكالمة صوتية' };
const CHANNEL_COLORS: Record<string, string> = { IN_APP: 'bg-brand-50 text-brand-700', EMAIL: 'bg-info-50 text-info-700', SMS: 'bg-success-50 text-success-700', WHATSAPP: 'bg-success-50 text-success-700', PUSH: 'bg-warning-50 text-warning-700', VOICE: 'bg-danger-50 text-danger-700' };

interface DashboardData {
  today?: number;
  week?: number;
  month?: number;
  totalSent?: number;
  totalRead?: number;
  deliveryRate?: number;
  byType?: { type: string; count: number }[];
}

interface FailedNotification {
  id: string;
  userId: string;
  titleAr: string;
  titleEn: string;
  type: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface ChannelConfig {
  channel: string;
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'down';
  rateLimit: number;
  sentToday: number;
}

interface Template {
  id: string;
  type: string;
  channel: string;
  lang: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  isActive: boolean;
  version: number;
  variables?: Record<string, any>;
}

interface Campaign {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  targetAudience: string;
  status: string;
  sent: number;
  read: number;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { addToast } = useToast();

  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [failedNotifs, setFailedNotifs] = useState<FailedNotification[]>([]);
  const [failedPage, setFailedPage] = useState(1);
  const [failedTotal, setFailedTotal] = useState(0);
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { channel: 'EMAIL', enabled: true, status: 'healthy', rateLimit: 5000, sentToday: 1245 },
    { channel: 'SMS', enabled: true, status: 'healthy', rateLimit: 1000, sentToday: 567 },
    { channel: 'WHATSAPP', enabled: true, status: 'healthy', rateLimit: 2000, sentToday: 890 },
    { channel: 'PUSH', enabled: true, status: 'degraded', rateLimit: 10000, sentToday: 3456 },
    { channel: 'VOICE', enabled: false, status: 'down', rateLimit: 100, sentToday: 0 },
  ]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [sendDialog, setSendDialog] = useState(false);
  const [sendForm, setSendForm] = useState({ userId: '', userIds: '', type: 'APPOINTMENT_REMINDER', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '', channels: ['IN_APP'] as string[] });

  const [campaignDialog, setCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ nameAr: '', nameEn: '', type: 'MARKETING', targetAudience: 'ALL', channels: ['EMAIL', 'SMS'] as string[] });

  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ type: 'APPOINTMENT_REMINDER', channel: 'EMAIL', lang: 'ar', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' });

  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [retryConfirm, setRetryConfirm] = useState<string | null>(null);
  const [retryAllConfirm, setRetryAllConfirm] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await notificationClient.getAdminDashboard();
      setDashboardData(res?.data || {});
    } catch {}
  }, []);

  const fetchFailed = useCallback(async () => {
    try {
      const res = await notificationClient.getFailed({ page: failedPage, limit: 10 });
      setFailedNotifs(res?.data || []);
      setFailedTotal(res?.meta?.total || res?.total || 0);
    } catch {}
  }, [failedPage]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await notificationClient.listTemplates({});
      setTemplates(res?.data || []);
    } catch {}
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await notificationClient.listCampaigns({});
      setCampaigns(res?.data || []);
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await notificationClient.getAnalyticsDashboard();
      setAnalytics(res?.data || {});
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDashboard(), fetchFailed(), fetchTemplates(), fetchCampaigns(), fetchAnalytics()])
      .finally(() => setLoading(false));
  }, [fetchDashboard, fetchFailed, fetchTemplates, fetchCampaigns, fetchAnalytics]);

  useEffect(() => {
    if (activeTab === 'failed') fetchFailed();
  }, [activeTab, failedPage, fetchFailed]);

  const handleToggleChannel = async (channel: string, enabled: boolean) => {
    try {
      await notificationClient.updateChannelConfig(channel, { enabled });
      setChannels(prev => prev.map(c => c.channel === channel ? { ...c, enabled } : c));
      addToast({ variant: 'success', message: `تم ${enabled ? 'تفعيل' : 'تعطيل'} قناة ${CHANNEL_LABELS[channel]}` });
    } catch {
      addToast({ variant: 'danger', message: 'فشل تحديث القناة' });
    }
  };

  const handleTestChannel = async (channel: string) => {
    try {
      const res = await notificationClient.testChannel(channel, 'admin@example.com', 'هذا إشعار اختباري');
      addToast({ variant: res?.success ? 'success' : 'danger', message: res?.success ? 'تم إرسال الإشعار الاختباري' : 'فشل الإرسال' });
    } catch {
      addToast({ variant: 'danger', message: 'فشل إرسال الإشعار الاختباري' });
    }
  };

  const handleSend = async () => {
    try {
      const userIds = sendForm.userIds
        ? sendForm.userIds.split(',').map((s: string) => s.trim()).filter(Boolean)
        : sendForm.userId ? [sendForm.userId] : [];
      if (userIds.length === 0) {
        addToast({ variant: 'warning', message: 'يرجى إدخال مستلم واحد على الأقل' });
        return;
      }
      const payload = {
        userIds,
        type: sendForm.type,
        data: { titleAr: sendForm.titleAr, titleEn: sendForm.titleEn, bodyAr: sendForm.bodyAr, bodyEn: sendForm.bodyEn },
        channels: sendForm.channels,
      };
      const res = await notificationClient.sendBulk(payload);
      addToast({ variant: 'success', message: `تم إرسال الإشعار بنجاح` });
      setSendDialog(false);
      setSendForm({ userId: '', userIds: '', type: 'APPOINTMENT_REMINDER', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '', channels: ['IN_APP'] });
    } catch (err: any) {
      addToast({ variant: 'danger', message: err.message || 'فشل الإرسال' });
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await notificationClient.createCampaign(campaignForm);
      addToast({ variant: 'success', message: 'تم إنشاء الحملة بنجاح' });
      setCampaignDialog(false);
      setCampaignForm({ nameAr: '', nameEn: '', type: 'MARKETING', targetAudience: 'ALL', channels: ['EMAIL', 'SMS'] });
      fetchCampaigns();
    } catch (err: any) {
      addToast({ variant: 'danger', message: err.message || 'فشل إنشاء الحملة' });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await notificationClient.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await notificationClient.createTemplate(templateForm);
      }
      addToast({ variant: 'success', message: editingTemplate ? 'تم تحديث القالب' : 'تم إنشاء القالب' });
      setTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({ type: 'APPOINTMENT_REMINDER', channel: 'EMAIL', lang: 'ar', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' });
      fetchTemplates();
    } catch (err: any) {
      addToast({ variant: 'danger', message: err.message || 'فشل حفظ القالب' });
    }
  };

  const handleActivateTemplate = async (id: string) => {
    try {
      await notificationClient.activateTemplate(id);
      addToast({ variant: 'success', message: 'تم تفعيل القالب' });
      fetchTemplates();
    } catch {
      addToast({ variant: 'danger', message: 'فشل تفعيل القالب' });
    }
  };

  const handlePreview = async (template: Template) => {
    try {
      const res = await notificationClient.renderPreview(template.type, template.channel, template.lang, { name: 'أحمد', date: '2026-08-15', time: '10:00', testType: 'دم شامل' });
      setPreviewData(res?.data || res);
      setPreviewDialog(true);
    } catch {
      addToast({ variant: 'danger', message: 'فشل معاينة القالب' });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await notificationClient.retryFailed(id);
      addToast({ variant: 'success', message: 'تم إعادة المحاولة' });
      fetchFailed();
    } catch {
      addToast({ variant: 'danger', message: 'فشلت إعادة المحاولة' });
    }
    setRetryConfirm(null);
  };

  const handleRetryAll = async () => {
    try {
      await notificationClient.retryAllFailed();
      addToast({ variant: 'success', message: 'تم إعادة المحاولة للجميع' });
      fetchFailed();
    } catch {
      addToast({ variant: 'danger', message: 'فشلت إعادة المحاولة' });
    }
    setRetryAllConfirm(false);
  };

  const statusColor = (status: string) => {
    if (status === 'healthy') return 'bg-success-500';
    if (status === 'degraded') return 'bg-warning-500';
    return 'bg-danger-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">لوحة تحكم الإشعارات</h1>
          <p className="mt-1 text-sm text-surface-500">إدارة وإرسال ومراقبة جميع الإشعارات</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { setSendDialog(true); }}>إرسال إشعار</Button>
          <Button variant="primary" onClick={() => setCampaignDialog(true)}>حملة جديدة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="أرسلت اليوم" value={formatNumber(dashboardData?.today || 0)} icon={<BellIcon />} />
        <StatCard title="معدل التوصيل" value={`${dashboardData?.deliveryRate || 0}%`} trend={dashboardData?.deliveryRate || 0} icon={<DeliveryIcon />} />
        <StatCard title="قيد الانتظار" value={formatNumber(dashboardData?.totalSent ? dashboardData.totalSent - (dashboardData.totalRead || 0) : 0)} icon={<PendingIcon />} />
        <StatCard title="فشل" value={formatNumber(failedTotal)} icon={<FailedIcon />} trend={-failedTotal > 0 ? -failedTotal : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {channels.map(ch => (
          <Card key={ch.channel} padding="md" className="border-r-4" style={{ borderRightColor: ch.enabled ? (ch.status === 'healthy' ? '#10b981' : ch.status === 'degraded' ? '#f59e0b' : '#ef4444') : '#d1d5db' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn('h-2.5 w-2.5 rounded-full', ch.enabled ? statusColor(ch.status) : 'bg-surface-300')} />
                <div>
                  <p className="text-sm font-semibold text-surface-900">{CHANNEL_LABELS[ch.channel]}</p>
                  <p className="text-xs text-surface-400">أرسلت اليوم: {formatNumber(ch.sentToday)}</p>
                </div>
              </div>
              <Switch checked={ch.enabled} onCheckedChange={(v) => handleToggleChannel(ch.channel, v)} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="ghost" size="xs" onClick={() => handleTestChannel(ch.channel)}>اختبار</Button>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="failed" count={failedTotal}>فشل</TabsTrigger>
          <TabsTrigger value="send">إرسال</TabsTrigger>
          <TabsTrigger value="campaigns">حملات</TabsTrigger>
          <TabsTrigger value="templates">قوالب</TabsTrigger>
          <TabsTrigger value="analytics">تحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="الإرسال حسب النوع">
              <div className="space-y-3">
                {(dashboardData?.byType || []).map((item: any) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm text-surface-600">{item.type}</span>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={((item.count / (dashboardData?.totalSent || 1)) * 100)} className="h-2 w-32" />
                      <span className="text-xs text-surface-500">{formatNumber(item.count)}</span>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.byType || dashboardData.byType.length === 0) && (
                  <p className="text-sm text-surface-400 text-center py-8">لا توجد بيانات كافية</p>
                )}
              </div>
            </ChartCard>
            <ChartCard title="حالة القنوات">
              <div className="space-y-4">
                {channels.map(ch => (
                  <div key={ch.channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn('h-2 w-2 rounded-full', ch.enabled ? statusColor(ch.status) : 'bg-surface-300')} />
                      <span className="text-sm text-surface-700">{CHANNEL_LABELS[ch.channel]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-400">{formatNumber(ch.sentToday)}/{formatNumber(ch.rateLimit)}</span>
                      <ProgressBar value={(ch.sentToday / ch.rateLimit) * 100} className="h-1.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الإشعارات الفاشلة</CardTitle>
                {failedTotal > 0 && (
                  <Button variant="danger" size="sm" onClick={() => setRetryAllConfirm(true)}>إعادة محاولة الجميع</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {failedNotifs.length === 0 ? (
                <EmptyState title="لا توجد إشعارات فاشلة" description="جميع الإشعارات تعمل بنجاح" icon={<FailedIcon />} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="px-4 py-3 text-right text-surface-500 font-medium">العنوان</th>
                        <th className="px-4 py-3 text-right text-surface-500 font-medium">النوع</th>
                        <th className="px-4 py-3 text-right text-surface-500 font-medium">التاريخ</th>
                        <th className="px-4 py-3 text-right text-surface-500 font-medium">الخطأ</th>
                        <th className="px-4 py-3 text-center text-surface-500 font-medium">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {failedNotifs.map(n => (
                        <tr key={n.id} className="hover:bg-surface-50">
                          <td className="px-4 py-3 font-medium text-surface-900">{n.titleAr}</td>
                          <td className="px-4 py-3"><Badge variant="danger">{n.type}</Badge></td>
                          <td className="px-4 py-3 text-surface-500">{formatDate(n.createdAt)}</td>
                          <td className="px-4 py-3 text-danger-600 text-xs">{((n.metadata as any)?.finalError || (n.metadata as any)?.error || '—')}</td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="xs" onClick={() => setRetryConfirm(n.id)}>إعادة</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {failedTotal > 10 && (
                <div className="flex justify-center mt-4">
                  <Pagination page={failedPage} totalPages={Math.ceil(failedTotal / 10)} onPageChange={setFailedPage} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>إرسال إشعار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">معرف المستخدم</label>
                  <Input value={sendForm.userId} onChange={(e) => setSendForm(prev => ({ ...prev, userId: e.target.value }))} placeholder="معرف المستخدم" fullWidth />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">أو معرفات متعددة (مفصولة بفاصلة)</label>
                  <Input value={sendForm.userIds} onChange={(e) => setSendForm(prev => ({ ...prev, userIds: e.target.value }))} placeholder="id1, id2, id3" fullWidth />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">نوع الإشعار</label>
                  <select value={sendForm.type} onChange={(e) => setSendForm(prev => ({ ...prev, type: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm">
                    {NOTIF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">القنوات</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(ch => (
                      <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={sendForm.channels.includes(ch)}
                          onChange={(e) => setSendForm(prev => ({
                            ...prev, channels: e.target.checked
                              ? [...prev.channels, ch]
                              : prev.channels.filter(c => c !== ch)
                          }))} />
                        {CHANNEL_LABELS[ch]}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">العنوان (عربي)</label>
                  <Input value={sendForm.titleAr} onChange={(e) => setSendForm(prev => ({ ...prev, titleAr: e.target.value }))} fullWidth />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">العنوان (إنجليزي)</label>
                  <Input value={sendForm.titleEn} onChange={(e) => setSendForm(prev => ({ ...prev, titleEn: e.target.value }))} fullWidth />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">المحتوى (عربي)</label>
                  <Textarea value={sendForm.bodyAr} onChange={(e) => setSendForm(prev => ({ ...prev, bodyAr: e.target.value }))} rows={3} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">المحتوى (إنجليزي)</label>
                  <Textarea value={sendForm.bodyEn} onChange={(e) => setSendForm(prev => ({ ...prev, bodyEn: e.target.value }))} rows={3} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSend}>إرسال الإشعار</Button>
              <Button variant="ghost" onClick={() => setSendForm({ userId: '', userIds: '', type: 'APPOINTMENT_REMINDER', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '', channels: ['IN_APP'] })}>
                تفريغ
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <EmptyState title="لا توجد حملات" description="أنشئ حملة جديدة للبدء" action={<Button onClick={() => setCampaignDialog(true)}>حملة جديدة</Button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map(c => (
                  <Card key={c.id} padding="md" hover>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-surface-900">{c.nameAr}</h3>
                        <p className="text-xs text-surface-500 mt-0.5">{c.nameEn}</p>
                      </div>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'DRAFT' ? 'warning' : 'default'}>{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
                      <span>أرسلت: {formatNumber(c.sent)}</span>
                      <span>قُرئت: {formatNumber(c.read)}</span>
                      <span>{c.readRate || 0}% تفاعل</span>
                    </div>
                    <p className="text-[10px] text-surface-400 mt-2">{formatDate(c.createdAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle>قوالب الإشعارات</CardTitle>
              <Button onClick={() => { setEditingTemplate(null); setTemplateForm({ type: 'APPOINTMENT_REMINDER', channel: 'EMAIL', lang: 'ar', titleAr: '', titleEn: '', bodyAr: '', bodyEn: '' }); setTemplateDialog(true); }}>
                قالب جديد
              </Button>
            </div>
            {templates.length === 0 ? (
              <EmptyState title="لا توجد قوالب" description="أنشئ قالباً جديداً" />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {templates.map(t => (
                  <div key={t.id} className="flex items-start justify-between rounded-2xl border border-surface-100 p-4 hover:border-brand-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-surface-900 text-sm">{t.titleAr}</h3>
                        <Badge variant={t.isActive ? 'success' : 'default'} size="sm">{t.isActive ? 'نشط' : 'غير نشط'}</Badge>
                        <Badge variant="outline" size="sm">{t.type}</Badge>
                        <Badge variant="outline" size="sm">{CHANNEL_LABELS[t.channel] || t.channel}</Badge>
                        <Badge variant="outline" size="sm">v{t.version}</Badge>
                      </div>
                      <p className="text-sm text-surface-500 mt-1 line-clamp-1">{t.bodyAr}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mr-4">
                      <Button variant="ghost" size="xs" onClick={() => handlePreview(t)}>معاينة</Button>
                      <Button variant="ghost" size="xs" onClick={() => { setEditingTemplate(t); setTemplateForm({ type: t.type, channel: t.channel, lang: t.lang, titleAr: t.titleAr, titleEn: t.titleEn, bodyAr: t.bodyAr, bodyEn: t.bodyEn }); setTemplateDialog(true); }}>
                        تعديل
                      </Button>
                      {!t.isActive && (
                        <Button variant="ghost" size="xs" onClick={() => handleActivateTemplate(t.id)}>تفعيل</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="إجمالي المرسل" value={formatNumber(analytics?.summary?.totalSent || 0)} icon={<BellIcon />} />
                <StatCard title="نسبة القراءة" value={`${analytics?.summary?.overallReadRate || 0}%`} icon={<DeliveryIcon />} />
                <StatCard title="الفترة" value={`${analytics?.summary?.periodDays || 30} يوم`} icon={<PendingIcon />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics?.channelPerformance?.channels && (
                  <ChartCard title="أداء القنوات">
                    <div className="space-y-3">
                      {Object.entries(analytics.channelPerformance.channels).map(([ch, stats]: [string, any]) => (
                        <div key={ch} className="flex items-center justify-between">
                          <span className="text-sm text-surface-600">{CHANNEL_LABELS[ch] || ch}</span>
                          <div className="flex items-center gap-3">
                            <ProgressBar value={stats.deliveryRate || 0} className="h-2 w-24" />
                            <span className="text-xs text-surface-500">{stats.deliveryRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                )}
                {analytics?.typeBreakdown?.breakdown && (
                  <ChartCard title="حسب النوع">
                    <div className="space-y-2">
                      {analytics.typeBreakdown.breakdown.map((item: any) => (
                        <div key={item.type} className="flex items-center justify-between text-sm">
                          <span className="text-surface-600">{item.type}</span>
                          <span className="text-surface-500">{item.sent} أرسلت / {item.readRate}% قراءة</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                )}
              </div>
              {analytics?.userEngagement && (
                <Card>
                  <CardHeader><CardTitle>تفاعل المستخدمين</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-surface-900">{formatNumber(analytics.userEngagement.totalNotifications)}</p>
                        <p className="text-xs text-surface-500">إجمالي</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-success-600">{formatNumber(analytics.userEngagement.readNotifications)}</p>
                        <p className="text-xs text-surface-500">مقروء</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-warning-600">{formatNumber(analytics.userEngagement.unreadNotifications)}</p>
                        <p className="text-xs text-surface-500">غير مقروء</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-600">{analytics.userEngagement.engagementRate}%</p>
                        <p className="text-xs text-surface-500">معدل التفاعل</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-20"><LoadingSpinner /></div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} size="lg">
        <DialogHeader onClose={() => setSendDialog(false)}><DialogTitle>إرسال إشعار</DialogTitle></DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="معرف المستخدم" value={sendForm.userId} onChange={(e) => setSendForm(prev => ({ ...prev, userId: e.target.value }))} placeholder="معرف المستخدم" fullWidth />
            <Input label="أو معرفات متعددة" value={sendForm.userIds} onChange={(e) => setSendForm(prev => ({ ...prev, userIds: e.target.value }))} placeholder="id1, id2" fullWidth />
            <Select label="النوع" value={sendForm.type} onChange={(e) => setSendForm(prev => ({ ...prev, type: e.target.value }))} options={NOTIF_TYPES.map(t => ({ value: t, label: t }))} />
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">القنوات</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.filter(c => c !== 'VOICE').map(ch => (
                  <label key={ch} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={sendForm.channels.includes(ch)}
                      onChange={(e) => setSendForm(prev => ({ ...prev, channels: e.target.checked ? [...prev.channels, ch] : prev.channels.filter(c => c !== ch) }))} />
                    {CHANNEL_LABELS[ch]}
                  </label>
                ))}
              </div>
            </div>
            <Input label="العنوان (عربي)" value={sendForm.titleAr} onChange={(e) => setSendForm(prev => ({ ...prev, titleAr: e.target.value }))} fullWidth />
            <Input label="العنوان (إنجليزي)" value={sendForm.titleEn} onChange={(e) => setSendForm(prev => ({ ...prev, titleEn: e.target.value }))} fullWidth />
            <div className="md:col-span-2">
              <Textarea label="المحتوى (عربي)" value={sendForm.bodyAr} onChange={(e) => setSendForm(prev => ({ ...prev, bodyAr: e.target.value }))} rows={2} fullWidth />
            </div>
            <div className="md:col-span-2">
              <Textarea label="المحتوى (إنجليزي)" value={sendForm.bodyEn} onChange={(e) => setSendForm(prev => ({ ...prev, bodyEn: e.target.value }))} rows={2} fullWidth />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setSendDialog(false)}>إلغاء</Button>
          <Button onClick={handleSend}>إرسال</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={campaignDialog} onClose={() => setCampaignDialog(false)} size="md">
        <DialogHeader onClose={() => setCampaignDialog(false)}><DialogTitle>حملة جديدة</DialogTitle></DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <Input label="الاسم (عربي)" value={campaignForm.nameAr} onChange={(e) => setCampaignForm(prev => ({ ...prev, nameAr: e.target.value }))} fullWidth />
            <Input label="الاسم (إنجليزي)" value={campaignForm.nameEn} onChange={(e) => setCampaignForm(prev => ({ ...prev, nameEn: e.target.value }))} fullWidth />
            <Select label="النوع" value={campaignForm.type} onChange={(e) => setCampaignForm(prev => ({ ...prev, type: e.target.value }))} options={NOTIF_TYPES.map(t => ({ value: t, label: t }))} />
            <Input label="الجمهور المستهدف" value={campaignForm.targetAudience} onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))} fullWidth />
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">القنوات</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.filter(c => c !== 'VOICE').map(ch => (
                  <label key={ch} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={campaignForm.channels.includes(ch)}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, channels: e.target.checked ? [...prev.channels, ch] : prev.channels.filter(c => c !== ch) }))} />
                    {CHANNEL_LABELS[ch]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setCampaignDialog(false)}>إلغاء</Button>
          <Button onClick={handleCreateCampaign}>إنشاء الحملة</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} size="lg">
        <DialogHeader onClose={() => setTemplateDialog(false)}><DialogTitle>{editingTemplate ? 'تعديل قالب' : 'قالب جديد'}</DialogTitle></DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="النوع" value={templateForm.type} onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))} options={NOTIF_TYPES.map(t => ({ value: t, label: t }))} />
            <Select label="القناة" value={templateForm.channel} onChange={(e) => setTemplateForm(prev => ({ ...prev, channel: e.target.value }))} options={[{ value: 'EMAIL', label: 'البريد الإلكتروني' }, { value: 'SMS', label: 'رسالة نصية' }, { value: 'WHATSAPP', label: 'واتساب' }, { value: 'PUSH', label: 'إشعار فوري' }, { value: 'IN_APP', label: 'داخل التطبيق' }]} />
            <Select label="اللغة" value={templateForm.lang} onChange={(e) => setTemplateForm(prev => ({ ...prev, lang: e.target.value }))} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
            <div />
            <Input label="العنوان (عربي)" value={templateForm.titleAr} onChange={(e) => setTemplateForm(prev => ({ ...prev, titleAr: e.target.value }))} fullWidth />
            <Input label="العنوان (إنجليزي)" value={templateForm.titleEn} onChange={(e) => setTemplateForm(prev => ({ ...prev, titleEn: e.target.value }))} fullWidth />
            <div className="md:col-span-2">
              <Textarea label="المحتوى (عربي)" value={templateForm.bodyAr} onChange={(e) => setTemplateForm(prev => ({ ...prev, bodyAr: e.target.value }))} rows={3} fullWidth />
            </div>
            <div className="md:col-span-2">
              <Textarea label="المحتوى (إنجليزي)" value={templateForm.bodyEn} onChange={(e) => setTemplateForm(prev => ({ ...prev, bodyEn: e.target.value }))} rows={3} fullWidth />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setTemplateDialog(false)}>إلغاء</Button>
          <Button onClick={handleSaveTemplate}>{editingTemplate ? 'حفظ التعديلات' : 'إنشاء القالب'}</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} size="md">
        <DialogHeader onClose={() => setPreviewDialog(false)}><DialogTitle>معاينة القالب</DialogTitle></DialogHeader>
        <DialogContent>
          {previewData && (
            <div className="space-y-4">
              {previewData.titleAr && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">العنوان (عربي)</p>
                  <p className="text-sm font-semibold text-surface-900">{previewData.titleAr}</p>
                </div>
              )}
              {previewData.titleEn && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">العنوان (إنجليزي)</p>
                  <p className="text-sm text-surface-700">{previewData.titleEn}</p>
                </div>
              )}
              {previewData.bodyAr && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">المحتوى (عربي)</p>
                  <p className="text-sm text-surface-700 leading-relaxed">{previewData.bodyAr}</p>
                </div>
              )}
              {previewData.bodyEn && (
                <div>
                  <p className="text-xs text-surface-400 mb-1">المحتوى (إنجليزي)</p>
                  <p className="text-sm text-surface-500 leading-relaxed">{previewData.bodyEn}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setPreviewDialog(false)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!retryConfirm} onClose={() => setRetryConfirm(null)} onConfirm={() => retryConfirm && handleRetry(retryConfirm)} title="إعادة محاولة الإرسال" description="هل أنت متأكد من إعادة إرسال هذا الإشعار الفاشل؟" />
      <ConfirmDialog open={retryAllConfirm} onClose={() => setRetryAllConfirm(false)} onConfirm={handleRetryAll} title="إعادة محاولة الجميع" description={`هل أنت متأكد من إعادة إرسال جميع الإشعارات الفاشلة (${failedTotal})؟`} />
    </div>
  );
}

function BellIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>; }
function DeliveryIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>; }
function PendingIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function FailedIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>; }
