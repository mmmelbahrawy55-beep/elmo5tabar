'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn, formatRelativeTime, formatDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, EmptyState } from '@/design-system/layout/Card';
import { Badge, Avatar } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { Input, Switch, Select } from '@/design-system/primitives/Input';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, LoadingSpinner, Alert, useToast } from '@/design-system/feedback/Alert';
import { Pagination } from '@/design-system/navigation/Tabs';
import { notificationClient } from '@/lib/api/notifications';

type NotificationItem = {
  id: string;
  userId: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
};

type Preference = {
  id?: string;
  userId?: string;
  channel: string;
  type: string;
  enabled: boolean;
  maxPerDay?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
};

const NOTIF_TYPE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  APPOINTMENT_REMINDER: { ar: 'موعد', en: 'Appointment', color: 'bg-info-50 text-info-700 border-info-200' },
  RESULTS_READY: { ar: 'نتيجة', en: 'Result', color: 'bg-success-50 text-success-700 border-success-200' },
  ORDER_CONFIRMED: { ar: 'طلب', en: 'Order', color: 'bg-brand-50 text-brand-700 border-brand-200' },
  PAYMENT_RECEIVED: { ar: 'دفع', en: 'Payment', color: 'bg-success-50 text-success-700 border-success-200' },
  MARKETING: { ar: 'تسويق', en: 'Marketing', color: 'bg-warning-50 text-warning-700 border-warning-200' },
  SECURITY_ALERT: { ar: 'أمان', en: 'Security', color: 'bg-danger-50 text-danger-700 border-danger-200' },
  INSURANCE_EXPIRY: { ar: 'تأمين', en: 'Insurance', color: 'bg-warning-50 text-warning-700 border-warning-200' },
  BIRTHDAY: { ar: 'تهنئة', en: 'Birthday', color: 'bg-pink-50 text-pink-700 border-pink-200' },
};

const TAB_TYPES: Record<string, string | undefined> = {
  all: undefined,
  unread: 'unread',
  appointments: 'APPOINTMENT_REMINDER',
  results: 'RESULTS_READY',
  marketing: 'MARKETING',
};

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: 'داخل التطبيق',
  EMAIL: 'البريد الإلكتروني',
  SMS: 'رسالة نصية',
  WHATSAPP: 'واتساب',
  PUSH: 'إشعار فوري',
};

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const { addToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (TAB_TYPES[activeTab] === 'unread') {
        params.read = 'false';
      } else if (TAB_TYPES[activeTab]) {
        params.type = TAB_TYPES[activeTab];
      }
      if (filterType && activeTab === 'all') params.type = filterType;
      if (filterDate) {
        const d = new Date(filterDate);
        params.dateFrom = d.toISOString().split('T')[0] + 'T00:00:00.000Z';
        params.dateTo = d.toISOString().split('T')[0] + 'T23:59:59.999Z';
      }
      const res = await notificationClient.list(params);
      setNotifications(res?.data || []);
      setTotal(res?.pagination?.total || res?.meta?.total || 0);
    } catch (err: any) {
      addToast({ variant: 'danger', message: err.message || 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, filterDate, filterType, addToast]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationClient.getUnreadCount();
      setUnreadCount(res?.data?.unreadCount ?? res?.unreadCount ?? 0);
    } catch {}
  }, []);

  const fetchPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const res = await notificationClient.getPreferences();
      setPreferences(res?.data || []);
    } catch {
      setPreferences([]);
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${process.env.NEXT_PUBLIC_WS_HOST || 'localhost:3001'}/notifications`;
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setConnectionStatus('connected');
        ws?.send(JSON.stringify({ event: 'auth', data: { token } }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'notificationReceived') {
            setNotifications(prev => [msg.data, ...prev]);
            setTotal(prev => prev + 1);
            setUnreadCount(prev => prev + 1);
          }
        } catch {}
      };
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimer = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationClient.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationClient.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      addToast({ variant: 'success', message: 'تم تحديد الكل كمقروء' });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationClient.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      addToast({ variant: 'success', message: 'تم حذف الإشعار' });
    } catch {}
  };

  const handleTogglePreference = async (channel: string, type: string, enabled: boolean) => {
    try {
      await notificationClient.updatePreference(channel, type, enabled);
      setPreferences(prev => prev.map(p =>
        p.channel === channel && p.type === type ? { ...p, enabled } : p
      ));
    } catch {}
  };

  const handleQuietHoursChange = async (channel: string, start: string, end: string) => {
    try {
      await notificationClient.setQuietHours(channel, start, end);
      addToast({ variant: 'success', message: 'تم تحديث أوقات الإرسال' });
      fetchPreferences();
    } catch {}
  };

  const handleMaxPerDayChange = async (channel: string, max: number) => {
    try {
      await notificationClient.setMaxPerDay(channel, max);
      addToast({ variant: 'success', message: 'تم تحديث الحد اليومي' });
      fetchPreferences();
    } catch {}
  };

  const openDetail = (notif: NotificationItem) => {
    setSelectedNotif(notif);
    setDetailOpen(true);
    if (!notif.isRead) handleMarkRead(notif.id);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">الإشعارات</h1>
          <p className="mt-1 text-sm text-surface-500">جميع الإشعارات والتحديثات الخاصة بك</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={cn(
              'h-2 w-2 rounded-full',
              connectionStatus === 'connected' ? 'bg-success-500' : connectionStatus === 'connecting' ? 'bg-warning-500' : 'bg-danger-500'
            )} />
            <span className="text-surface-400">
              {connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال' : 'غير متصل'}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setPrefsOpen(true); fetchPreferences(); }}>
            الإعدادات
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              تحديد الكل مقروء ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="unread" count={unreadCount}>غير مقروء</TabsTrigger>
          <TabsTrigger value="appointments">المواعيد</TabsTrigger>
          <TabsTrigger value="results">النتائج</TabsTrigger>
          <TabsTrigger value="marketing">تسويق</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center gap-3 py-3">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-44"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-700"
          >
            <option value="">جميع الأنواع</option>
            {Object.entries(NOTIF_TYPE_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.ar}</option>
            ))}
          </select>
        </div>

        {['all', 'unread', 'appointments', 'results', 'marketing'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                title="لا توجد إشعارات"
                description="ستظهر الإشعارات هنا عندما تصلك"
                icon={
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const typeLabel = NOTIF_TYPE_LABELS[notif.type] || { ar: notif.type, en: notif.type, color: 'bg-surface-50 text-surface-700 border-surface-200' };
                  return (
                    <div
                      key={notif.id}
                      onClick={() => openDetail(notif)}
                      className={cn(
                        'flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all',
                        'hover:border-brand-200 hover:shadow-sm',
                        notif.isRead ? 'bg-white border-surface-100' : 'bg-brand-50/30 border-brand-100'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar size="md" fallback={notif.titleAr?.charAt(0) || 'ن'} />
                        {!notif.isRead && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={cn('text-sm', notif.isRead ? 'font-medium text-surface-700' : 'font-semibold text-surface-900')}>
                              {notif.titleAr}
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notif.bodyAr}</p>
                          </div>
                          <Badge variant="outline" className={cn('shrink-0', typeLabel.color)}>
                            {typeLabel.ar}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-surface-400">{formatRelativeTime(notif.createdAt)}</span>
                          {notif.isRead && notif.readAt && (
                            <span className="text-[10px] text-surface-300">مقروء {formatRelativeTime(notif.readAt)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                        className="shrink-0 p-1.5 rounded-lg text-surface-300 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 4h12M5.333 4V2.667A1.333 1.333 0 016.667 1.333h2.666a1.333 1.333 0 011.334 1.334V4M12.667 4v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} size="md">
        <DialogHeader onClose={() => setDetailOpen(false)}>
          <DialogTitle>{selectedNotif?.titleAr || 'تفاصيل الإشعار'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedNotif && (
            <div className="space-y-4">
              <Badge variant="outline" className={cn(NOTIF_TYPE_LABELS[selectedNotif.type]?.color || '')}>
                {NOTIF_TYPE_LABELS[selectedNotif.type]?.ar || selectedNotif.type}
              </Badge>
              <p className="text-sm text-surface-700 leading-relaxed">{selectedNotif.bodyAr}</p>
              {selectedNotif.bodyEn && (
                <p className="text-sm text-surface-500 leading-relaxed border-t border-surface-100 pt-3">{selectedNotif.bodyEn}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-surface-400 border-t border-surface-100 pt-3">
                <span>تاريخ الإرسال: {formatDateTime(selectedNotif.createdAt)}</span>
                {selectedNotif.isRead && selectedNotif.readAt && (
                  <span>مقروء: {formatDateTime(selectedNotif.readAt)}</span>
                )}
              </div>
              {selectedNotif.metadata && Object.keys(selectedNotif.metadata).length > 0 && (
                <div className="bg-surface-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-surface-500 mb-2">بيانات إضافية</p>
                  <pre className="text-[10px] text-surface-400 whitespace-pre-wrap">{JSON.stringify(selectedNotif.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {selectedNotif && !selectedNotif.isRead && (
            <Button variant="secondary" onClick={() => { handleMarkRead(selectedNotif.id); setDetailOpen(false); }}>
              تحديد كمقروء
            </Button>
          )}
          <Button variant="ghost" onClick={() => setDetailOpen(false)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={prefsOpen} onClose={() => setPrefsOpen(false)} size="lg">
        <DialogHeader onClose={() => setPrefsOpen(false)}>
          <DialogTitle>إعدادات الإشعارات</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {prefsLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <span className="text-sm font-medium text-surface-700">القناة</span>
                <span className="text-sm font-medium text-surface-700">تفعيل</span>
              </div>
              {['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'].map(channel => {
                const pref = preferences.find(p => p.channel === channel);
                return (
                  <div key={channel} className="space-y-2 border-b border-surface-100 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-surface-700">{CHANNEL_LABELS[channel] || channel}</span>
                      <Switch
                        checked={pref?.enabled !== false}
                        onCheckedChange={(checked) => handleTogglePreference(channel, 'ALL', checked)}
                      />
                    </div>
                    {pref && (
                      <div className="flex flex-wrap gap-4 mr-8">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-surface-500">من:</span>
                          <input
                            type="time"
                            defaultValue={pref.quietHoursStart || ''}
                            onChange={(e) => handleQuietHoursChange(channel, e.target.value, pref.quietHoursEnd || '')}
                            className="h-8 rounded-lg border border-surface-200 px-2 text-xs"
                          />
                          <span className="text-xs text-surface-500">إلى:</span>
                          <input
                            type="time"
                            defaultValue={pref.quietHoursEnd || ''}
                            onChange={(e) => handleQuietHoursChange(channel, pref.quietHoursStart || '', e.target.value)}
                            className="h-8 rounded-lg border border-surface-200 px-2 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-surface-500">الحد اليومي:</span>
                          <input
                            type="number"
                            defaultValue={pref.maxPerDay || 100}
                            min={1}
                            onChange={(e) => handleMaxPerDayChange(channel, parseInt(e.target.value) || 100)}
                            className="h-8 w-20 rounded-lg border border-surface-200 px-2 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setPrefsOpen(false)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
