'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { ExportButton } from '@/components/admin/ExportButton';

interface Backup {
  id: string;
  date: string;
  size: string;
  type: 'auto' | 'manual';
  status: 'success' | 'failed' | 'in-progress';
}

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'pending' | 'disconnected';
  icon: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('general');
  const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);
  const [showBackupConfirm, setShowBackupConfirm] = React.useState(false);
  const [savingTab, setSavingTab] = React.useState<string | null>(null);

  const [stats] = React.useState({
    modifiedSettings: 45,
    activeSettings: 123,
    lastBackup: 'اليوم',
    uptime: '45 يوم',
  });

  const [companyInfo, setCompanyInfo] = React.useState({
    nameAr: 'المختبر',
    nameEn: 'Al Mokhtabar Laboratory',
    email: 'info@almokhtabar.com',
    phone: '+966501234567',
    timezone: 'Asia/Riyadh',
    language: 'ar',
    dateFormat: 'dd/MM/yyyy',
  });

  const [companyLegal, setCompanyLegal] = React.useState({
    address: 'الرياض، حي العليا، شارع التحلية',
    crNumber: '1010123456',
    zatcaRegistration: 'Active',
    vatNumber: '300012345678901',
  });

  const [branchSettings] = React.useState({
    defaultBranch: 'الفرع الرئيسي - الرياض',
    workingHours: '08:00 - 17:00',
    holidays: 'الجمعة، السبت',
  });

  const [billingSettings, setBillingSettings] = React.useState({
    invoicePrefix: 'INV-',
    vatRate: 15,
    paymentTerms: 30,
    lateFeeRate: 1.5,
  });

  const [securitySettings, setSecuritySettings] = React.useState({
    passwordMinLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    sessionTimeout: 30,
    twoFaEnabled: true,
    ipWhitelist: '10.0.0.0/8, 192.168.1.0/24',
  });

  const [emailSettings, setEmailSettings] = React.useState({
    smtpHost: 'smtp.almokhtabar.com',
    smtpPort: '587',
    smtpUser: 'noreply@almokhtabar.com',
    smtpPass: '••••••••',
    smtpEncryption: 'TLS',
  });

  const [smsSettings, setSmsSettings] = React.useState({
    gateway: 'Unifonic',
    apiKey: '••••••••••••••••',
    senderName: 'المختبر',
    enabled: true,
  });

  const [whatsappSettings, setWhatsappSettings] = React.useState({
    apiUrl: 'https://graph.facebook.com/v18.0',
    phoneNumberId: '123456789',
    accessToken: '••••••••••••',
    enabled: true,
  });

  const [paymentSettings] = React.useState({
    visaEnabled: true,
    madaEnabled: true,
    applePayEnabled: true,
    stcPayEnabled: false,
    merchantId: '••••••••••••',
  });

  const [systemSettings, setSystemSettings] = React.useState({
    maintenanceMode: false,
    debugMode: false,
    cacheEnabled: true,
    cacheTtl: 3600,
    maxUploadSize: 10,
    maxFileTypes: 'pdf,jpg,png,xlsx',
  });

  const [backups] = React.useState<Backup[]>([
    { id: '1', date: '2026-07-28T03:00:00', size: '2.3 GB', type: 'auto', status: 'success' },
    { id: '2', date: '2026-07-27T03:00:00', size: '2.2 GB', type: 'auto', status: 'success' },
    { id: '3', date: '2026-07-26T15:30:00', size: '2.1 GB', type: 'manual', status: 'success' },
    { id: '4', date: '2026-07-26T03:00:00', size: '2.1 GB', type: 'auto', status: 'failed' },
    { id: '5', date: '2026-07-25T03:00:00', size: '2.0 GB', type: 'auto', status: 'success' },
  ]);

  const [integrations] = React.useState<Integration[]>([
    { id: '1', name: 'Nphies', description: 'نظام التأمين الصحي - الاتصال بالמבטسين', status: 'connected', icon: '🏥' },
    { id: '2', name: 'CCHI', description: 'الهيئة السعودية للاتصالات والفضاء والإلكترونيات', status: 'connected', icon: '📡' },
    { id: '3', name: 'Meilisearch', description: 'محرك بحث فائق السرعة', status: 'connected', icon: '🔍' },
    { id: '4', name: 'Redis', description: 'خادم الكاش في الذاكرة', status: 'connected', icon: '⚡' },
    { id: '5', name: 'AWS S3', description: 'تخزين سحابي للملفات', status: 'connected', icon: '☁️' },
    { id: '6', name: 'ZATCA', description: 'هيئة الزكاة والضريبة - الفوترة الإلكترونية', status: 'connected', icon: '🏛️' },
    { id: '7', name: 'Google Calendar', description: 'مزامنة المواعيد', status: 'disconnected', icon: '📅' },
    { id: '8', name: 'Slack', description: 'إشعارات الفريق', status: 'pending', icon: '💬' },
  ]);

  const handleSaveTab = (tab: string) => {
    setSavingTab(tab);
    setTimeout(() => {
      setSavingTab(null);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }, 1000);
  };

  const inputClass = 'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">الإعدادات</h1>
          <p className="mt-1 text-sm text-surface-500">إدارة إعدادات النظام والتفضيلات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الإعدادات المُعدّلة" value={stats.modifiedSettings} icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="إعدادات نشطة" value={stats.activeSettings} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} iconBg="bg-success-50" />
        <StatCard title="آخر نسخة احتياطية" value={stats.lastBackup} icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>} iconBg="bg-info-50" />
        <StatCard title="وقت التشغيل" value={stats.uptime} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><polyline points="12 6 12 12 16 14" /></svg>} iconBg="bg-success-50" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="pills" className="flex-wrap">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="company">الشركة</TabsTrigger>
          <TabsTrigger value="branches">الفروع</TabsTrigger>
          <TabsTrigger value="billing">الفوترة</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="email">البريد</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
          <TabsTrigger value="payment">الدفع</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="integrations">التكاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المختبر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormGroup columns={2}>
                    <FormField label="اسم المختبر (عربي)" required>
                      <input value={companyInfo.nameAr} onChange={(e) => setCompanyInfo({ ...companyInfo, nameAr: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="اسم المختبر (إنجليزي)" required>
                      <input value={companyInfo.nameEn} onChange={(e) => setCompanyInfo({ ...companyInfo, nameEn: e.target.value })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormGroup columns={2}>
                    <FormField label="البريد الإلكتروني" required>
                      <input type="email" value={companyInfo.email} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="رقم الجوال" required>
                      <input type="tel" value={companyInfo.phone} onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormField label="الشعار">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl bg-brand-50 flex items-center justify-center">
                        <span className="text-2xl font-bold text-brand-600">م</span>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">تغيير الشعار</Button>
                        <p className="text-xs text-surface-400 mt-1">PNG أو SVG، الحد الأقصى 2MB</p>
                      </div>
                    </div>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormGroup columns={2}>
                    <FormField label="المنطقة الزمنية">
                      <select value={companyInfo.timezone} onChange={(e) => setCompanyInfo({ ...companyInfo, timezone: e.target.value })} className={inputClass}>
                        <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                        <option value="Asia/Dubai">دبي (GMT+4)</option>
                        <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                      </select>
                    </FormField>
                    <FormField label="اللغة الافتراضية">
                      <select value={companyInfo.language} onChange={(e) => setCompanyInfo({ ...companyInfo, language: e.target.value })} className={inputClass}>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </FormField>
                  </FormGroup>
                  <FormField label="تنسيق التاريخ">
                    <select value={companyInfo.dateFormat} onChange={(e) => setCompanyInfo({ ...companyInfo, dateFormat: e.target.value })} className={inputClass}>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </FormField>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">الوضع الليلي</p>
                      <p className="text-xs text-surface-500">تفعيل المظهر الداكن</p>
                    </div>
                    <Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">الإشعارات الصوتية</p>
                      <p className="text-xs text-surface-500">تشغيل صوت عند وصول إشعار جديد</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">حفظ تلقائي للمسودات</p>
                      <p className="text-xs text-surface-500">حفظ التغييرات تلقائياً كل 30 ثانية</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('general')} loading={savingTab === 'general'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="company">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>المعلومات القانونية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormField label="العنوان">
                    <input value={companyLegal.address} onChange={(e) => setCompanyLegal({ ...companyLegal, address: e.target.value })} className={inputClass} />
                  </FormField>
                  <FormGroup columns={2}>
                    <FormField label="رقم السجل التجاري" required>
                      <input value={companyLegal.crNumber} onChange={(e) => setCompanyLegal({ ...companyLegal, crNumber: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="رقم التسجيل في زاتكا">
                      <div className="flex items-center gap-2">
                        <input value={companyLegal.zatcaRegistration} onChange={(e) => setCompanyLegal({ ...companyLegal, zatcaRegistration: e.target.value })} className={inputClass} />
                        <Badge variant="success" dot>نشط</Badge>
                      </div>
                    </FormField>
                  </FormGroup>
                  <FormField label="الرقم الضريبي (VAT)">
                    <input value={companyLegal.vatNumber} onChange={(e) => setCompanyLegal({ ...companyLegal, vatNumber: e.target.value })} className={inputClass} />
                  </FormField>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('company')} loading={savingTab === 'company'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الفروع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <FormField label="الفرع الافتراضي">
                  <input value={branchSettings.defaultBranch} readOnly className={inputClass} />
                </FormField>
                <FormGroup columns={2}>
                  <FormField label="ساعات العمل">
                    <input value={branchSettings.workingHours} readOnly className={inputClass} />
                  </FormField>
                  <FormField label="العطل الرسمية">
                    <input value={branchSettings.holidays} readOnly className={inputClass} />
                  </FormField>
                </FormGroup>
                <div className="flex items-center justify-between py-3 border-b border-surface-100">
                  <div>
                    <p className="text-sm font-medium text-surface-900">السماح بالحجز خارج ساعات العمل</p>
                    <p className="text-xs text-surface-500">السماح للموظفين بحجز مواعيد بعد انتهاء الدوام</p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">إشعارات الفرع</p>
                    <p className="text-xs text-surface-500">إرسال إشعارات عند تغيير حالة الطلب لكل فرع</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الفوترة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormGroup columns={2}>
                    <FormField label="بادئة رقم الفاتورة">
                      <input value={billingSettings.invoicePrefix} onChange={(e) => setBillingSettings({ ...billingSettings, invoicePrefix: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="نسبة ضريبة القيمة المضافة (%)">
                      <input type="number" value={billingSettings.vatRate} onChange={(e) => setBillingSettings({ ...billingSettings, vatRate: Number(e.target.value) })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormGroup columns={2}>
                    <FormField label="مدة السداد (أيام)">
                      <input type="number" value={billingSettings.paymentTerms} onChange={(e) => setBillingSettings({ ...billingSettings, paymentTerms: Number(e.target.value) })} className={inputClass} />
                    </FormField>
                    <FormField label="رسوم التأخير (%)">
                      <input type="number" value={billingSettings.lateFeeRate} onChange={(e) => setBillingSettings({ ...billingSettings, lateFeeRate: Number(e.target.value) })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">إضافة تلقائية للضريبة</p>
                      <p className="text-xs text-surface-500">إضافة 15% ضريبة تلقائياً على جميع الفواتير</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">إرسال الفواتير تلقائياً</p>
                      <p className="text-xs text-surface-500">إرسال الفواتير عبر البريد عند الإصدار</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('billing')} loading={savingTab === 'billing'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>سياسة كلمات المرور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormField label="الحد الأدنى لطول كلمة المرور">
                    <input type="number" value={securitySettings.passwordMinLength} onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: Number(e.target.value) })} className={inputClass} />
                  </FormField>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-surface-100">
                      <p className="text-sm font-medium text-surface-900">استخدام أحرف كبيرة</p>
                      <Switch checked={securitySettings.requireUppercase} onCheckedChange={(v) => setSecuritySettings({ ...securitySettings, requireUppercase: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-surface-100">
                      <p className="text-sm font-medium text-surface-900">استخدام أرقام</p>
                      <Switch checked={securitySettings.requireNumbers} onCheckedChange={(v) => setSecuritySettings({ ...securitySettings, requireNumbers: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm font-medium text-surface-900">استخدام رموز خاصة</p>
                      <Switch checked={securitySettings.requireSymbols} onCheckedChange={(v) => setSecuritySettings({ ...securitySettings, requireSymbols: v })} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات الجلسة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormField label="مدة انتهاء الجلسة (دقيقة)">
                    <input type="number" value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })} className={inputClass} />
                  </FormField>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">المصادقة الثنائية</p>
                      <p className="text-xs text-surface-500">إلزام جميع المستخدمين بتفعيل 2FA</p>
                    </div>
                    <Switch checked={securitySettings.twoFaEnabled} onCheckedChange={(v) => setSecuritySettings({ ...securitySettings, twoFaEnabled: v })} />
                  </div>
                  <FormField label="القائمة البيضاء لعناوين IP" description="فصل بفاصلة">
                    <textarea value={securitySettings.ipWhitelist} onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })} className={cn(inputClass, 'min-h-[80px]')} />
                  </FormField>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('security')} loading={savingTab === 'security'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات SMTP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormGroup columns={2}>
                    <FormField label="SMTP Host" required>
                      <input value={emailSettings.smtpHost} onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="المنفذ" required>
                      <input value={emailSettings.smtpPort} onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormGroup columns={2}>
                    <FormField label="اسم المستخدم" required>
                      <input value={emailSettings.smtpUser} onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="كلمة المرور" required>
                      <input type="password" value={emailSettings.smtpPass} onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormField label="التشفير">
                    <select value={emailSettings.smtpEncryption} onChange={(e) => setEmailSettings({ ...emailSettings, smtpEncryption: e.target.value })} className={inputClass}>
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="none">بدون تشفير</option>
                    </select>
                  </FormField>
                  <Button variant="outline-brand" size="sm">اختبار الاتصال</Button>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('email')} loading={savingTab === 'email'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormField label="مزود الخدمة">
                    <select value={smsSettings.gateway} onChange={(e) => setSmsSettings({ ...smsSettings, gateway: e.target.value })} className={inputClass}>
                      <option value="Unifonic">Unifonic</option>
                      <option value="Twilio">Twilio</option>
                      <option value="Vonage">Vonage</option>
                    </select>
                  </FormField>
                  <FormField label="API Key" required>
                    <input type="password" value={smsSettings.apiKey} onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })} className={inputClass} />
                  </FormField>
                  <FormField label="اسم المرسل">
                    <input value={smsSettings.senderName} onChange={(e) => setSmsSettings({ ...smsSettings, senderName: e.target.value })} className={inputClass} />
                  </FormField>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">تفعيل خدمة SMS</p>
                      <p className="text-xs text-surface-500">إرسال رسائل نصية للعملاء</p>
                    </div>
                    <Switch checked={smsSettings.enabled} onCheckedChange={(v) => setSmsSettings({ ...smsSettings, enabled: v })} />
                  </div>
                  <Button variant="outline-brand" size="sm">اختبار الإرسال</Button>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('sms')} loading={savingTab === 'sms'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <FormField label="API URL" required>
                    <input value={whatsappSettings.apiUrl} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, apiUrl: e.target.value })} className={inputClass} />
                  </FormField>
                  <FormGroup columns={2}>
                    <FormField label="رقم الهاتف (Phone Number ID)" required>
                      <input value={whatsappSettings.phoneNumberId} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value })} className={inputClass} />
                    </FormField>
                    <FormField label="Access Token" required>
                      <input type="password" value={whatsappSettings.accessToken} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, accessToken: e.target.value })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">تفعيل واتساب</p>
                      <p className="text-xs text-surface-500">إرسال إشعارات عبر واتساب للأطباء والمرضى</p>
                    </div>
                    <Switch checked={whatsappSettings.enabled} onCheckedChange={(v) => setWhatsappSettings({ ...whatsappSettings, enabled: v })} />
                  </div>
                  <Button variant="outline-brand" size="sm">اختبار الاتصال</Button>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('whatsapp')} loading={savingTab === 'whatsapp'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>بوابات الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'visaEnabled', label: 'Visa / Mastercard', desc: 'قبول بطاقات الائتمان', checked: paymentSettings.visaEnabled },
                    { key: 'madaEnabled', label: 'مدى', desc: 'قبول بطاقات مدى', checked: paymentSettings.madaEnabled },
                    { key: 'applePayEnabled', label: 'Apple Pay', desc: 'الدفع عبر أبل باي', checked: paymentSettings.applePayEnabled },
                    { key: 'stcPayEnabled', label: 'STC Pay', desc: 'الدفع عبر STC Pay', checked: paymentSettings.stcPayEnabled },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-surface-900">{item.label}</p>
                        <p className="text-xs text-surface-500">{item.desc}</p>
                      </div>
                      <Switch checked={item.checked} onCheckedChange={() => setPaymentSettings({ ...paymentSettings, [item.key]: !item.checked })} />
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <FormField label="رقم التاجر (Merchant ID)">
                    <input type="password" value={paymentSettings.merchantId} onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantId: e.target.value })} className={inputClass} />
                  </FormField>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('payment')} loading={savingTab === 'payment'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">وضع الصيانة</p>
                      <p className="text-xs text-surface-500">تعطيل الوصول للمستخدمين أثناء الصيانة</p>
                    </div>
                    <Switch checked={systemSettings.maintenanceMode} onCheckedChange={(v) => setSystemSettings({ ...systemSettings, maintenanceMode: v })} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">وضع التنقيح</p>
                      <p className="text-xs text-surface-500">عرض الأخطاء التفصيلية (لا يُنصح به في الإنتاج)</p>
                    </div>
                    <Switch checked={systemSettings.debugMode} onCheckedChange={(v) => setSystemSettings({ ...systemSettings, debugMode: v })} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">تفعيل الكاش</p>
                      <p className="text-xs text-surface-500">تخزين مؤقت لتسريع الأداء</p>
                    </div>
                    <Switch checked={systemSettings.cacheEnabled} onCheckedChange={(v) => setSystemSettings({ ...systemSettings, cacheEnabled: v })} />
                  </div>
                </div>
                <div className="mt-5 space-y-5">
                  <FormGroup columns={2}>
                    <FormField label="مدة صلاحية الكاش (ثانية)">
                      <input type="number" value={systemSettings.cacheTtl} onChange={(e) => setSystemSettings({ ...systemSettings, cacheTtl: Number(e.target.value) })} className={inputClass} />
                    </FormField>
                    <FormField label="الحد الأقصى لحجم الرفع (MB)">
                      <input type="number" value={systemSettings.maxUploadSize} onChange={(e) => setSystemSettings({ ...systemSettings, maxUploadSize: Number(e.target.value) })} className={inputClass} />
                    </FormField>
                  </FormGroup>
                  <FormField label="أنواع الملفات المسموحة">
                    <input value={systemSettings.maxFileTypes} onChange={(e) => setSystemSettings({ ...systemSettings, maxFileTypes: e.target.value })} className={inputClass} />
                  </FormField>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => handleSaveTab('system')} loading={savingTab === 'system'}>حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>النسخ الاحتياطي</CardTitle>
                <Button variant="primary" size="sm" onClick={() => setShowBackupConfirm(true)}>نسخة احتياطية الآن</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-surface-100">
                    <div>
                      <p className="text-sm font-medium text-surface-900">نسخ احتياطي تلقائي</p>
                      <p className="text-xs text-surface-500">إنشاء نسخة احتياطية يومياً الساعة 3:00 صباحاً</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-700 mb-3">سجل النسخ الاحتياطية</p>
                    <div className="space-y-2">
                      {backups.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                          <div className="flex items-center gap-3">
                            <Badge variant={backup.status === 'success' ? 'success' : backup.status === 'failed' ? 'danger' : 'info'} dot>
                              {backup.status === 'success' ? 'ناجح' : backup.status === 'failed' ? 'فشل' : 'جاري'}
                            </Badge>
                            <div>
                              <p className="text-sm text-surface-900">{formatDate(backup.date)}</p>
                              <p className="text-xs text-surface-500">{backup.size} - {backup.type === 'auto' ? 'تلقائي' : 'يدوي'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="xs">استعادة</Button>
                            <Button variant="ghost" size="xs">تحميل</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>التكاملات الخارجية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{integration.name}</p>
                        <p className="text-xs text-surface-500">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={integration.status === 'connected' ? 'success' : integration.status === 'pending' ? 'warning' : 'default'}
                        dot
                      >
                        {integration.status === 'connected' ? 'متصل' : integration.status === 'pending' ? 'قيد المراجعة' : 'غير متصل'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        {integration.status === 'connected' ? 'إدارة' : 'اتصال'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSaveConfirm} onClose={() => setShowSaveConfirm(false)} size="sm">
        <DialogHeader onClose={() => setShowSaveConfirm(false)}>
          <DialogTitle>تم الحفظ بنجاح</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50">
              <svg className="h-5 w-5 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <p className="text-sm text-surface-700">تم حفظ التغييرات بنجاح</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupConfirm} onClose={() => setShowBackupConfirm(false)} size="sm">
        <DialogHeader onClose={() => setShowBackupConfirm(false)}>
          <DialogTitle>نسخة احتياطية</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-surface-500">هل أنت متأكد من إنشاء نسخة احتياطية الآن؟ قد يستغرق هذا بضع دقائق.</p>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowBackupConfirm(false)}>إلغاء</Button>
          <Button variant="primary" onClick={() => setShowBackupConfirm(false)}>إنشاء النسخة</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
