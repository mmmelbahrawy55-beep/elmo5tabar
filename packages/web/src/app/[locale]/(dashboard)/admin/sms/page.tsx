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

const TEMPLATE_VARIABLES = [
  { key: '{{name}}', label: 'اسم المستلم' },
  { key: '{{phone}}', label: 'رقم الهاتف' },
  { key: '{{date}}', label: 'التاريخ' },
  { key: '{{time}}', label: 'الوقت' },
  { key: '{{code}}', label: 'الكود' },
  { key: '{{amount}}', label: 'المبلغ' },
];

const CREDIT_TIERS = [
  { id: '1', credits: 1000, price: 50, pricePerSms: 0.05, popular: false },
  { id: '2', credits: 5000, price: 200, pricePerSms: 0.04, popular: true },
  { id: '3', credits: 10000, price: 350, pricePerSms: 0.035, popular: false },
  { id: '4', credits: 50000, price: 1500, pricePerSms: 0.03, popular: false },
  { id: '5', credits: 100000, price: 2500, pricePerSms: 0.025, popular: false },
];

interface SmsMessage {
  id: string;
  recipient: string;
  message: string;
  status: string;
  sentAt: string;
  cost: number;
  characters: number;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  usageCount: number;
  isActive: boolean;
}

const mockMessages: SmsMessage[] = [
  { id: '1', recipient: '+201012345678', message: 'مرحباً أحمد، تذكير بموعدك الطبي غداً الساعة 10:00 صباحاً.', status: 'تم التوصيل', sentAt: '2026-07-27T10:00:00Z', cost: 0.05, characters: 68 },
  { id: '2', recipient: '+201098765432', message: 'نتائج فحصك المخبري جاهزة. الرجاء الاطلاع عليها من العيادة.', status: 'تم التوصيل', sentAt: '2026-07-27T09:30:00Z', cost: 0.05, characters: 62 },
  { id: '3', recipient: '+201123456789', message: 'كود التحقق الخاص بك هو: 4521. صالح لمدة 10 دقائق.', status: 'تم التوصيل', sentAt: '2026-07-26T16:45:00Z', cost: 0.05, characters: 48 },
  { id: '4', recipient: '+201055544433', message: 'تم تأكيد موعدك يوم الأحد 30/07 الساعة 2:00 مساءً.', status: 'فشل', sentAt: '2026-07-26T14:00:00Z', cost: 0, characters: 50 },
  { id: '5', recipient: '+201077788899', message: 'فاتورتك الشهرية جاهزة: 1,250 جنيه. يرجى الدفع خلال 7 أيام.', status: 'تم التوصيل', sentAt: '2026-07-25T11:00:00Z', cost: 0.05, characters: 61 },
  { id: '6', recipient: '+201011122233', message: 'تم إلغاء موعدك المحدد ليوم 28/07. يرجى إعادة الحجز.', status: 'مرسل', sentAt: '2026-07-25T08:30:00Z', cost: 0.05, characters: 55 },
  { id: '7', recipient: '+201033344455', message: 'عرض خاص: خصم 20% على جميع الفحوصات المخبرية هذا الأسبوع.', status: 'تم التوصيل', sentAt: '2026-07-24T15:00:00Z', cost: 0.05, characters: 58 },
  { id: '8', recipient: '+201066677788', message: 'شكراً لزيارتك. يرجى تعبئة استبيان الرضا: رابط الاستبيان.', status: 'قيد الانتظار', sentAt: '2026-07-24T12:00:00Z', cost: 0, characters: 57 },
];

const mockSmsTemplates: SmsTemplate[] = [
  { id: '1', name: 'تذكير بالموعد', category: 'مواعيد', content: 'مرحباً {{name}}، تذكير بموعدك الطبي يوم {{date}} الساعة {{time}}.', variables: ['name', 'date', 'time'], usageCount: 1234, isActive: true },
  { id: '2', name: 'كود التحقق', category: 'أمان', content: 'كود التحقق الخاص بك هو: {{code}}. صالح لمدة 10 دقائق.', variables: ['code'], usageCount: 5678, isActive: true },
  { id: '3', name: 'تأكيد الموعد', category: 'مواعيد', content: 'تم تأكيد موعدك يوم {{date}} الساعة {{time}}. شكراً لك.', variables: ['date', 'time'], usageCount: 890, isActive: true },
  { id: '4', name: 'إشعار الفاتورة', category: 'فواتير', content: 'فاتورتك جاهزة: {{amount}} جنيه. يرجى الدفع خلال 7 أيام.', variables: ['amount'], usageCount: 456, isActive: true },
  { id: '5', name: 'نتائج الفحص', category: 'نتائج', content: '{{name}}، نتيجة فحصك جاهزة. الرجاء الاطلاع عليها من العيادة.', variables: ['name'], usageCount: 234, isActive: true },
  { id: '6', name: 'رسالة ترحيب', category: 'ترحيب', content: 'مرحباً {{name}}! أهلاً بك في منصة {{name}}. نتمنى لك تجربة مميزة.', variables: ['name'], usageCount: 123, isActive: true },
];

export default function SmsPage() {
  const [activeTab, setActiveTab] = useState('send');
  const [messages] = useState<SmsMessage[]>(mockMessages);
  const [templates, setTemplates] = useState<SmsTemplate[]>(mockSmsTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendMode, setSendMode] = useState<'manual' | 'bulk' | 'template'>('manual');
  const [recipient, setRecipient] = useState('');
  const [bulkRecipients, setBulkRecipients] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageText, setMessageText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [rechargeDialog, setRechargeDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState('2');

  const maxChars = 160;
  const charCount = messageText.length;
  const smsParts = charCount <= maxChars ? 1 : Math.ceil(charCount / maxChars);
  const estimatedCost = smsParts * 0.05;

  const filteredMessages = messages.filter(
    (m) => m.recipient.includes(searchQuery) || m.message.includes(searchQuery)
  );

  const insertVariable = (variable: string) => {
    setMessageText((prev) => prev + variable);
  };

  const handleToggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) setMessageText(tpl.content);
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'تم التوصيل') return 'success';
    if (status === 'فشل') return 'error';
    if (status === 'مرسل') return 'info';
    return 'warning';
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل النصية</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إرسال وإدارة الرسائل النصية القصيرة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredMessages} filename="sms-log" />
          <Button onClick={() => setRechargeDialog(true)}>شحن الرصيد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الرسائل" value="34,567" trend={6.7} icon="💬" />
        <StatCard title="تم التوصيل" value="33,890" trend={5.4} icon="✅" />
        <StatCard title="فشل التوصيل" value="677" trend={-12.3} icon="❌" />
        <StatCard title="الرصيد المتبقي" value="45,234" trend={-2.1} icon="💳" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="send">الإرسال</TabsTrigger>
          <TabsTrigger value="log">السجل</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="recharge">الشحن</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>إرسال رسالة نصية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    {(['manual', 'bulk', 'template'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSendMode(mode)}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          sendMode === mode
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        )}
                      >
                        {mode === 'manual' ? 'إرسال يدوي' : mode === 'bulk' ? 'إرسال جماعي' : 'إرسال بالقالب'}
                      </button>
                    ))}
                  </div>

                  <FormSection title="بيانات الرسالة">
                    <FormGroup>
                      {sendMode === 'manual' && (
                        <FormField label="رقم الهاتف">
                          <input
                            type="tel"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="+201012345678"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </FormField>
                      )}

                      {sendMode === 'bulk' && (
                        <FormField label="أرقام الهواتف (كل رقم في سطر)">
                          <textarea
                            rows={4}
                            value={bulkRecipients}
                            onChange={(e) => setBulkRecipients(e.target.value)}
                            placeholder="+201012345678&#10;+201098765432&#10;+201123456789"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </FormField>
                      )}

                      {sendMode === 'template' && (
                        <FormField label="اختر القالب">
                          <select
                            value={selectedTemplate}
                            onChange={(e) => handleSelectTemplate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">اختر قالباً...</option>
                            {templates.filter((t) => t.isActive).map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </FormField>
                      )}

                      <FormField label="الرسالة">
                        <textarea
                          rows={5}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="اكتب رسالتك هنا..."
                          maxLength={500}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>

                      <FormField label="جدولة الإرسال (اختياري)">
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </FormField>
                    </FormGroup>
                  </FormSection>

                  <div className="mt-4 flex justify-end gap-3">
                    <Button variant="outline">معاينة</Button>
                    <Button>إرسال الرسالة</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل الرسالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">عدد الأحرف</span>
                      <span className={cn('font-mono text-sm font-medium', charCount > maxChars ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>
                        {charCount}/{maxChars}
                      </span>
                    </div>
                    <ProgressBar value={Math.min((charCount / maxChars) * 100, 100)} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">عدد الرسائل المطلوبة</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{smsParts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">التكلفة التقديرية</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">الدعم العربي</span>
                      <Badge variant="success">مدعوم ✓</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إدراج المتغيرات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سجل الرسائل النصية</CardTitle>
                <SearchInput value={searchQuery} onChange={(v) => setSearchQuery(v)} placeholder="بحث في الرسائل..." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الرقم</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الرسالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الأحرف</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">الكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMessages.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{m.recipient}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-gray-900 dark:text-white">{m.message}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(m.status) as any}>{m.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(new Date(m.sentAt))}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.characters}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${m.cost.toFixed(2)}</td>
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
                <CardTitle>قوالب الرسائل النصية</CardTitle>
                <Button>إنشاء قالب جديد</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((t) => (
                  <div key={t.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{t.name}</h3>
                          <Badge variant={t.category === 'أمان' ? 'error' : t.category === 'مواعيد' ? 'info' : 'default'}>{t.category}</Badge>
                          <Badge variant="default">الاستخدام: {t.usageCount.toLocaleString('ar-EG')}</Badge>
                        </div>
                        <p className="mt-2 rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {t.content}
                        </p>
                        <div className="mt-2 flex gap-1">
                          {t.variables.map((v) => (
                            <span key={v} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={t.isActive} onCheckedChange={() => handleToggleTemplate(t.id)} />
                        <Button variant="outline" size="sm">تعديل</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recharge">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>شحن الرصيد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center justify-center gap-8 rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">الرصيد الحالي</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">45,234</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">رسالة متبقية</p>
                  </div>
                  <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">استهلاك هذا الشهر</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">3,890</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">رسالة</p>
                  </div>
                  <div className="h-12 w-px bg-gray-200 dark:bg-gray-700" />
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">التكلفة الشهرية</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">$194.50</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">دولار</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CREDIT_TIERS.map((tier) => (
                <Card
                  key={tier.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedTier === tier.id ? 'border-2 border-blue-500' : '',
                    tier.popular ? 'border border-blue-200 dark:border-blue-800' : ''
                  )}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="rounded-t-lg bg-blue-600 px-3 py-1 text-center text-xs font-medium text-white">
                      الأكثر شعبية
                    </div>
                  )}
                  <CardContent className={cn('pt-6', tier.popular && 'pt-4')}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{tier.credits.toLocaleString('ar-EG')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">رسالة</p>
                      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${tier.price}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">${tier.pricePerSms} للرسالة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button size="lg" onClick={() => setRechargeDialog(true)}>
                شحن الرصيد
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={rechargeDialog} onOpenChange={setRechargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد شحن الرصيد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">الباقة المحددة</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {CREDIT_TIERS.find((t) => t.id === selectedTier)?.credits.toLocaleString('ar-EG')} رسالة
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">المبلغ الإجمالي</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ${CREDIT_TIERS.find((t) => t.id === selectedTier)?.price}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">الرصيد بعد الشحن</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {(45234 + (CREDIT_TIERS.find((t) => t.id === selectedTier)?.credits || 0)).toLocaleString('ar-EG')} رسالة
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeDialog(false)}>إلغاء</Button>
            <Button onClick={() => setRechargeDialog(false)}>تأكيد الدفع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
