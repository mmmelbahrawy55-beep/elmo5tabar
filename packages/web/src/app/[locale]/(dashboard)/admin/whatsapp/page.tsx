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

interface Conversation {
  id: string;
  contactName: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'pending' | 'closed';
  unread: number;
  avatar: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Campaign {
  id: string;
  name: string;
  templateName: string;
  status: string;
  recipients: number;
  sentAt: string;
  delivered: number;
  read: number;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  status: string;
  language: string;
  usageCount: number;
}

interface ApiSettings {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookUrl: string;
  verifyToken: string;
  isSandbox: boolean;
  isConnected: boolean;
  lastSync: string;
}

const mockConversations: Conversation[] = [
  { id: '1', contactName: 'أحمد محمد علي', phone: '+201012345678', lastMessage: 'شكراً، سأكون في الموعد.', timestamp: '2026-07-27T10:30:00Z', status: 'active', unread: 0, avatar: 'أ' },
  { id: '2', contactName: 'سارة عبدالله حسن', phone: '+201098765432', lastMessage: 'هل يمكنني تأجيل الموعد؟', timestamp: '2026-07-27T09:45:00Z', status: 'pending', unread: 2, avatar: 'س' },
  { id: '3', contactName: 'خالد إبراهيم أحمد', phone: '+201123456789', lastMessage: 'تم استلام النتائج، شكراً.', timestamp: '2026-07-26T16:20:00Z', status: 'closed', unread: 0, avatar: 'خ' },
  { id: '4', contactName: 'مريم سعيد محمود', phone: '+201055544433', lastMessage: 'أريد حجز موعد جديد.', timestamp: '2026-07-27T11:00:00Z', status: 'active', unread: 1, avatar: 'م' },
  { id: '5', contactName: 'عمر فتحي حسن', phone: '+201077788899', lastMessage: 'ما هو سعر الفحص الشامل؟', timestamp: '2026-07-26T14:30:00Z', status: 'pending', unread: 3, avatar: 'ع' },
  { id: '6', contactName: 'نورا حسين محمد', phone: '+201011122233', lastMessage: 'الموعد مناسب، شكراً لكم.', timestamp: '2026-07-25T12:00:00Z', status: 'closed', unread: 0, avatar: 'ن' },
  { id: '7', contactName: 'يوسف طارق العلي', phone: '+201033344455', lastMessage: 'هل أنتم تستقبلون التأمين الصحي؟', timestamp: '2026-07-27T08:15:00Z', status: 'active', unread: 0, avatar: 'ي' },
];

const mockChatMessages: ChatMessage[] = [
  { id: '1', sender: 'contact', text: 'مرحباً، أريد الاستفسار عن مواعيد العمل.', timestamp: '2026-07-27T10:00:00Z', status: 'read' },
  { id: '2', sender: 'user', text: 'مرحباً أحمد! أوقات العمل من 9 صباحاً حتى 9 مساءً يومياً.', timestamp: '2026-07-27T10:02:00Z', status: 'read' },
  { id: '3', sender: 'contact', text: 'هل يمكنني حجز موعد ليوم الأحد؟', timestamp: '2026-07-27T10:05:00Z', status: 'read' },
  { id: '4', sender: 'user', text: 'بالطبع! لديك الأوقات المتاحة: 10:00، 12:00، 2:00، 4:00. أيهم يناسبك؟', timestamp: '2026-07-27T10:07:00Z', status: 'delivered' },
  { id: '5', sender: 'contact', text: 'الموعد الساعة 12:00 مناسب.', timestamp: '2026-07-27T10:10:00Z', status: 'read' },
  { id: '6', sender: 'user', text: 'تم تأكيد موعدك يوم الأحد الساعة 12:00 ظهراً. ستتلقى تذكيراً قبل الموعد بيوم.', timestamp: '2026-07-27T10:12:00Z', status: 'delivered' },
  { id: '7', sender: 'contact', text: 'شكراً، سأكون في الموعد.', timestamp: '2026-07-27T10:30:00Z', status: 'delivered' },
];

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'تذكير المواعيد الأسبوعي', templateName: 'تذكير بالموعد', status: 'مكتملة', recipients: 1234, sentAt: '2026-07-27T08:00:00Z', delivered: 1220, read: 980 },
  { id: '2', name: 'عرض الفحوصات الشاملة', templateName: 'عرض ترويجي', status: 'نشطة', recipients: 3456, sentAt: '2026-07-27T10:00:00Z', delivered: 3400, read: 1800 },
  { id: '3', name: 'رسالة ترحيب الأعضاء الجدد', templateName: 'رسالة ترحيب', status: 'مكتملة', recipients: 567, sentAt: '2026-07-25T09:00:00Z', delivered: 560, read: 450 },
  { id: '4', name: 'إشعار النتائج المخبرية', templateName: 'نتائج الفحص', status: 'مكتملة', recipients: 890, sentAt: '2026-07-24T14:00:00Z', delivered: 885, read: 720 },
  { id: '5', name: 'حملة استبيان الرضا', templateName: 'استبيان', status: 'مجدولة', recipients: 2100, sentAt: '2026-07-29T10:00:00Z', delivered: 0, read: 0 },
];

const mockWhatsAppTemplates: WhatsAppTemplate[] = [
  { id: '1', name: 'تذكير بالموعد', category: 'مواعيد', content: 'مرحباً {{1}}، تذكير بموعدك الطبي يوم {{2}} الساعة {{3}}. الرجاء الحضور في الوقت المحدد.', variables: ['الاسم', 'التاريخ', 'الوقت'], status: 'مقبول', language: 'العربية', usageCount: 4567 },
  { id: '2', name: 'نتائج الفحص', category: 'نتائج', content: '{{1}}، نتيجة فحصك {{2}} جاهزة. يمكنك الاطلاع عليها من العيادة.', variables: ['الاسم', 'نوع الفحص'], status: 'مقبول', language: 'العربية', usageCount: 2345 },
  { id: '3', name: 'رسالة ترحيب', category: 'ترحيب', content: 'مرحباً {{1}}! أهلاً بك في {{2}}. نحن سعداء بانضمامك. للمساعدة ارسل "مساعدة" في أي وقت.', variables: ['الاسم', 'اسم المنصة'], status: 'مقبول', language: 'العربية', usageCount: 1234 },
  { id: '4', name: 'عرض ترويجي', category: 'تسويقي', content: 'عرض خاص {{1}}! خصم {{2}}% على {{3}}. العرض ساري حتى {{4}}. للمزيد اضغط: {{5}}', variables: ['للمستخدم', 'نسبة الخصم', 'الخدمة', 'نهاية العرض', 'الرابط'], status: 'قيد المراجعة', language: 'العربية', usageCount: 890 },
  { id: '5', name: 'تأكيد الحجز', category: 'مواعيد', content: 'تم تأكيد حجزك {{1}} يوم {{2}} الساعة {{3}}. رقم الحجز: {{4}}.', variables: ['نوع الخدمة', 'التاريخ', 'الوقت', 'رقم الحجز'], status: 'مقبول', language: 'العربية', usageCount: 678 },
];

const mockApiSettings: ApiSettings = {
  phoneNumberId: '10987654321',
  businessAccountId: 'WABA-2024-ELM5TBER',
  accessToken: '••••••••••••••••',
  webhookUrl: 'https://api.elm5tber.com/webhook/whatsapp',
  verifyToken: 'elm5tber_verify_2026',
  isSandbox: false,
  isConnected: true,
  lastSync: '2026-07-27T10:30:00Z',
};

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [chatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [whatsappTemplates] = useState<WhatsAppTemplate[]>(mockWhatsAppTemplates);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(mockApiSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', template: '', recipients: 'الجميع', schedule: '' });
  const [statusFilter, setStatusFilter] = useState<string>('الكل');

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.contactName.includes(searchQuery) || c.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'الكل' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  const handleCreateCampaign = () => {
    setCampaignDialog(false);
    setCampaignForm({ name: '', template: '', recipients: 'الجميع', schedule: '' });
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'active') return 'success';
    if (status === 'pending') return 'warning';
    return 'default';
  };

  const statusLabel = (status: string) => {
    if (status === 'active') return 'نشط';
    if (status === 'pending') return 'قيد الانتظار';
    return 'مغلق';
  };

  const templateStatusBadge = (status: string) => {
    if (status === 'مقبول') return 'success';
    if (status === 'قيد المراجعة') return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">واتساب</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة المحادثات والحملات عبر واتساب
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
            apiSettings.isConnected
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            <span className={cn('h-2 w-2 rounded-full', apiSettings.isConnected ? 'bg-green-500' : 'bg-red-500')} />
            {apiSettings.isConnected ? 'متصل بـ WhatsApp Business' : 'غير متصل'}
          </span>
          <ExportButton data={filteredConversations} filename="whatsapp-conversations" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الرسائل" value="12,345" trend={11.2} icon="💬" />
        <StatCard title="تم التوصيل" value="12,100" trend={9.8} icon="✅" />
        <StatCard title="المحادثات النشطة" value="23" trend={4.3} icon="🟢" />
        <StatCard title="معدل الرضا" value="96.7%" trend={1.8} icon="⭐" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations">المحادثات</TabsTrigger>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="h-[600px]">
                <CardHeader>
                  <div className="space-y-3">
                    <CardTitle>المحادثات</CardTitle>
                    <SearchInput value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث..." />
                    <div className="flex gap-1">
                      {['الكل', 'active', 'pending', 'closed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn(
                            'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                            statusFilter === s
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                          )}
                        >
                          {s === 'الكل' ? 'الكل' : statusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-y-auto p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversation(conv)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                          activeConversation?.id === conv.id && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
                          {conv.avatar}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">{conv.contactName}</span>
                            <Badge variant={statusBadgeVariant(conv.status) as any} className="text-[10px]">
                              {statusLabel(conv.status)}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{conv.lastMessage}</p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(new Date(conv.timestamp))}</span>
                        </div>
                        {conv.unread > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                {activeConversation ? (
                  <>
                    <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
                          {activeConversation.avatar}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{activeConversation.contactName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{activeConversation.phone}</p>
                        </div>
                        <Badge variant={statusBadgeVariant(activeConversation.status) as any} className="mr-auto">
                          {statusLabel(activeConversation.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <div className="flex-1 overflow-y-auto space-y-3 p-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn('flex', msg.sender === 'user' ? 'justify-start' : 'justify-end')}
                        >
                          <div
                            className={cn(
                              'max-w-xs rounded-2xl px-4 py-2 text-sm',
                              msg.sender === 'user'
                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                                : 'bg-green-100 text-gray-900 dark:bg-green-900/30 dark:text-green-100'
                            )}
                          >
                            <p>{msg.text}</p>
                            <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]')}>
                              <span className="text-gray-400 dark:text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender === 'user' && (
                                <span className={msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}>
                                  {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="اكتب رسالة..."
                          className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <Button onClick={handleSendMessage} className="rounded-full px-6">
                          إرسال
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                    اختر محادثة للبدء
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>حملات واتساب</CardTitle>
                <Button onClick={() => setCampaignDialog(true)}>إنشاء حملة جديدة</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">اسم الحملة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">القالب</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">المستلمون</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">التوصيل</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">القراءة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.templateName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={c.status === 'مكتملة' ? 'success' : c.status === 'نشطة' ? 'info' : c.status === 'مجدولة' ? 'warning' : 'error'}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.recipients.toLocaleString('ar-EG')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={c.recipients > 0 ? (c.delivered / c.recipients) * 100 : 0} className="h-2 w-16" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{c.delivered.toLocaleString('ar-EG')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={c.delivered > 0 ? (c.read / c.delivered) * 100 : 0} className="h-2 w-16" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{c.read.toLocaleString('ar-EG')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(new Date(c.sentAt))}</td>
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
                <CardTitle>قوالب واتساب</CardTitle>
                <Button>إنشاء قالب جديد</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {whatsappTemplates.map((t) => (
                  <div key={t.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{t.name}</h3>
                          <Badge variant={templateStatusBadge(t.status) as any}>{t.status}</Badge>
                          <Badge variant="default">{t.category}</Badge>
                          <Badge variant="default">{t.language}</Badge>
                        </div>
                        <p className="mt-2 rounded bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {t.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex gap-1">
                            {t.variables.map((v, i) => (
                              <span key={i} className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                {`{{${i + 1}}} - ${v}`}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">الاستخدام: {t.usageCount.toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">معاينة</Button>
                        <Button variant="outline" size="sm">تعديل</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>إعدادات WhatsApp Business API</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
                      apiSettings.isConnected
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      <span className={cn('h-2 w-2 rounded-full', apiSettings.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
                      {apiSettings.isConnected ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormSection title="معلومات الاتصال">
                  <FormGroup>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Phone Number ID">
                        <input
                          type="text"
                          value={apiSettings.phoneNumberId}
                          readOnly
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                      <FormField label="Business Account ID">
                        <input
                          type="text"
                          value={apiSettings.businessAccountId}
                          readOnly
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                      <FormField label="Access Token">
                        <input
                          type="password"
                          value={apiSettings.accessToken}
                          readOnly
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                      <FormField label="وضع الاختبار (Sandbox)">
                        <div className="flex items-center pt-2">
                          <Switch
                            checked={apiSettings.isSandbox}
                            onCheckedChange={(v) => setApiSettings((prev) => ({ ...prev, isSandbox: v }))}
                          />
                          <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">
                            {apiSettings.isSandbox ? 'وضع الاختبار' : 'وضع الإنتاج'}
                          </span>
                        </div>
                      </FormField>
                    </div>
                  </FormGroup>
                </FormSection>

                <FormSection title="الـ Webhook">
                  <FormGroup>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Webhook URL">
                        <input
                          type="url"
                          value={apiSettings.webhookUrl}
                          onChange={(e) => setApiSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                      <FormField label="Verify Token">
                        <input
                          type="text"
                          value={apiSettings.verifyToken}
                          onChange={(e) => setApiSettings((prev) => ({ ...prev, verifyToken: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                    </div>
                  </FormGroup>
                </FormSection>

                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="font-medium text-gray-900 dark:text-white">حالة الاتصال</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">آخر مزامنة</span>
                      <span className="text-sm text-gray-900 dark:text-white">{formatDate(new Date(apiSettings.lastSync))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">حالة Webhook</span>
                      <Badge variant="success">نشط</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">حالة API</span>
                      <Badge variant="success">يعمل بشكل طبيعي</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline">اختبار الاتصال</Button>
                  <Button variant="outline">مزامنة الآن</Button>
                  <Button>حفظ الإعدادات</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={campaignDialog} onOpenChange={setCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء حملة واتساب</DialogTitle>
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
              <FormField label="القالب">
                <select
                  value={campaignForm.template}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, template: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">اختر قالباً...</option>
                  {whatsappTemplates.filter((t) => t.status === 'مقبول').map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="المستلمون">
                <select
                  value={campaignForm.recipients}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, recipients: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="الجميع">الجميع</option>
                  <option value="المرضى">المرضى</option>
                  <option value="الأطباء">الأطباء</option>
                  <option value="مستخدمون محددون">مستخدمون محددون</option>
                </select>
              </FormField>
              <FormField label="جدولة الإرسال (اختياري)">
                <input
                  type="datetime-local"
                  value={campaignForm.schedule}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, schedule: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </FormField>
            </FormGroup>
          </FormSection>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialog(false)}>إلغاء</Button>
            <Button variant="outline">معاينة</Button>
            <Button onClick={handleCreateCampaign}>إرسال الحملة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
