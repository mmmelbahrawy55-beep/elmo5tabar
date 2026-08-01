'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

type PartnerType = 'إحالة' | 'شركات' | 'تأمين';
type PartnerStatus = 'نشط' | 'غير نشط' | 'معلق';

interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contact: string;
  email: string;
  phone: string;
  referrals: number;
  revenue: number;
  commission: number;
  commissionRate: number;
  status: PartnerStatus;
  contractExpiry: string;
  performanceScore: number;
  monthlyTrend: number;
}

const mockPartners: Partner[] = [
  { id: '1', name: 'شركة المستقبل للتسويق', type: 'شركات', contact: 'أحمد العلي', email: 'ahmad@future.sa', phone: '+966501234567', referrals: 456, revenue: 125000, commission: 12500, commissionRate: 10, status: 'نشط', contractExpiry: '2025-12-31', performanceScore: 92, monthlyTrend: 12 },
  { id: '2', name: 'مؤسسة الرائد الطبي', type: 'تأمين', contact: 'سارة الحربي', email: 'sara@raed.sa', phone: '+966509876543', referrals: 312, revenue: 98000, commission: 9800, commissionRate: 10, status: 'نشط', contractExpiry: '2025-09-15', performanceScore: 87, monthlyTrend: 8 },
  { id: '3', name: 'محمد بن خالد الإحالة', type: 'إحالة', contact: 'محمد خالد', email: 'mohammed@ref.sa', phone: '+966551112233', referrals: 234, revenue: 67000, commission: 6700, commissionRate: 10, status: 'نشط', contractExpiry: '2025-11-01', performanceScore: 78, monthlyTrend: -3 },
  { id: '4', name: 'أكاديمية النخبة', type: 'شركات', contact: 'فهد العتيبي', email: 'fahad@elite.sa', phone: '+966553334455', referrals: 189, revenue: 54000, commission: 5400, commissionRate: 10, status: 'نشط', contractExpiry: '2026-03-20', performanceScore: 82, monthlyTrend: 15 },
  { id: '5', name: ' grupo medico', type: 'تأمين', contact: 'ليلى الشمري', email: 'layla@gmed.sa', phone: '+966556667788', referrals: 167, revenue: 43000, commission: 4300, commissionRate: 10, status: 'معلق', contractExpiry: '2025-06-30', performanceScore: 65, monthlyTrend: -12 },
  { id: '6', name: 'دار السلام للخدمات', type: 'إحالة', contact: 'عبدالله القحطاني', email: 'abdullah@daar.sa', phone: '+966559990011', referrals: 145, revenue: 38000, commission: 3800, commissionRate: 10, status: 'نشط', contractExpiry: '2025-08-15', performanceScore: 74, monthlyTrend: 5 },
  { id: '7', name: 'نيوم للتأمين', type: 'تأمين', contact: 'نورة السبيعي', email: 'noura@neom-t.sa', phone: '+966562223344', referrals: 123, revenue: 32000, commission: 3200, commissionRate: 10, status: 'غير نشط', contractExpiry: '2025-01-01', performanceScore: 45, monthlyTrend: -25 },
  { id: '8', name: 'مساعد الرقمي', type: 'إحالة', contact: 'يوسف المطيري', email: 'yusuf@digital.sa', phone: '+966565556677', referrals: 378, revenue: 110000, commission: 11000, commissionRate: 10, status: 'نشط', contractExpiry: '2026-06-01', performanceScore: 95, monthlyTrend: 22 },
];

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState('referral');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const partners = mockPartners;

  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.name.includes(searchQuery) || p.contact.includes(searchQuery);
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    totalPartners: 34,
    activePartners: 28,
    totalReferrals: 2341,
    monthlyCommission: 45000,
  };

  const getStatusColor = (status: PartnerStatus) => {
    switch (status) {
      case 'نشط': return 'success';
      case 'غير نشط': return 'error';
      case 'معلق': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: PartnerType) => {
    switch (type) {
      case 'إحالة': return '🔗';
      case 'شركات': return '🏢';
      case 'تأمين': return '🛡️';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الشركاء</h1>
          <p className="text-muted-foreground mt-1">إدارة شركاء الإحالة والشركات والتأمين</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button onClick={() => setShowCreateDialog(true)}>إضافة شريك</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الشركاء" value={stats.totalPartners} icon="👥" />
        <StatCard title="شركاء نشطين" value={stats.activePartners} icon="✅" />
        <StatCard title="إجمالي الإحالات" value={stats.totalReferrals.toLocaleString('ar-SA')} icon="🔗" />
        <StatCard title="العمولة الشهرية" value={formatCurrency(stats.monthlyCommission, 'SAR')} icon="💰" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="referral">شركاء الإحالة</TabsTrigger>
          <TabsTrigger value="corporate">شركاء الشركات</TabsTrigger>
          <TabsTrigger value="insurance">شركاء التأمين</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="referral">
          <Card>
            <CardHeader>
              <CardTitle>شركاء الإحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchInput
                  placeholder="بحث عن شريك..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="flex-1"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background text-foreground"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                  <option value="معلق">معلق</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">جهة الاتصال</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإحالات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإيرادات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العمولة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الأداء</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العقد</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.filter(p => p.type === 'إحالة').map((partner) => (
                      <tr key={partner.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{partner.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{getTypeIcon(partner.type)} {partner.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{partner.contact}</div>
                            <div className="text-xs text-muted-foreground">{partner.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{partner.referrals}</td>
                        <td className="py-3 px-4">{formatCurrency(partner.revenue, 'SAR')}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{formatCurrency(partner.commission, 'SAR')}</div>
                            <div className="text-xs text-muted-foreground">{partner.commissionRate}%</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={partner.performanceScore} className="w-16" />
                            <span className="text-xs">{partner.performanceScore}%</span>
                            <span className={cn('text-xs', partner.monthlyTrend > 0 ? 'text-green-500' : 'text-red-500')}>
                              {partner.monthlyTrend > 0 ? '↑' : '↓'} {Math.abs(partner.monthlyTrend)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(partner.status)}>{partner.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {formatDate(new Date(partner.contractExpiry))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedPartner(partner); setShowDetailDialog(true); }}
                            >
                              عرض
                            </Button>
                            <Button variant="ghost" size="sm">تعديل</Button>
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

        <TabsContent value="corporate">
          <Card>
            <CardHeader>
              <CardTitle>شركاء الشركات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.filter(p => p.type === 'شركات').map((partner) => (
                  <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{partner.name}</h3>
                          <p className="text-sm text-muted-foreground">{partner.contact}</p>
                        </div>
                        <Badge variant={getStatusColor(partner.status)}>{partner.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">الإحالات</p>
                          <p className="text-lg font-bold">{partner.referrals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الإيرادات</p>
                          <p className="text-lg font-bold">{formatCurrency(partner.revenue, 'SAR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">العمولة</p>
                          <p className="text-lg font-bold">{formatCurrency(partner.commission, 'SAR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الأداء</p>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={partner.performanceScore} className="flex-1" />
                            <span className="text-sm font-bold">{partner.performanceScore}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">انتهاء العقد: {formatDate(new Date(partner.contractExpiry))}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">تعديل</Button>
                          <Button size="sm">عرض التفاصيل</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>شركاء التأمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.filter(p => p.type === 'تأمين').map((partner) => (
                  <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{partner.name}</h3>
                          <p className="text-sm text-muted-foreground">{partner.contact}</p>
                        </div>
                        <Badge variant={getStatusColor(partner.status)}>{partner.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">الإحالات</p>
                          <p className="text-lg font-bold">{partner.referrals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الإيرادات</p>
                          <p className="text-lg font-bold">{formatCurrency(partner.revenue, 'SAR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">نسبة العمولة</p>
                          <p className="text-lg font-bold">{partner.commissionRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الاتجاه الشهري</p>
                          <span className={cn('text-lg font-bold', partner.monthlyTrend > 0 ? 'text-green-500' : 'text-red-500')}>
                            {partner.monthlyTrend > 0 ? '+' : ''}{partner.monthlyTrend}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{partner.phone}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">تعديل</Button>
                          <Button size="sm">عرض التفاصيل</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء الشركاء - أعلى 5</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partners.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5).map((partner, idx) => (
                    <div key={partner.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{partner.name}</span>
                          <span className="text-sm text-muted-foreground">{partner.performanceScore}%</span>
                        </div>
                        <ProgressBar value={partner.performanceScore} className="w-full" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{formatCurrency(partner.commission, 'SAR')}</div>
                        <div className="text-xs text-muted-foreground">{partner.referrals} إحالة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تتبع العمولات - الشهور الأخيرة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'].map((month, idx) => (
                      <div key={month} className="flex items-center gap-4">
                        <span className="text-sm w-20 text-muted-foreground">{month}</span>
                        <div className="flex-1">
                          <ProgressBar value={60 + idx * 5} className="w-full" />
                        </div>
                        <span className="text-sm font-medium w-24 text-left">{formatCurrency(35000 + idx * 2000, 'SAR')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع الشركاء حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔗</span>
                        <span className="font-medium">شركاء الإحالة</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold">15</span>
                        <span className="text-sm text-muted-foreground mr-2">(44%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏢</span>
                        <span className="font-medium">شركاء الشركات</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold">12</span>
                        <span className="text-sm text-muted-foreground mr-2">(35%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🛡️</span>
                        <span className="font-medium">شركاء التأمين</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold">7</span>
                        <span className="text-sm text-muted-foreground mr-2">(21%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogHeader>
          <DialogTitle>إضافة شريك جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات الشريك">
            <FormGroup>
              <FormField label="اسم الشريك" placeholder="أدخل اسم الشريك" />
              <FormField label="جهة الاتصال" placeholder="اسم المسؤول" />
            </FormGroup>
            <FormGroup>
              <FormField label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
              <FormField label="رقم الهاتف" placeholder="+966XXXXXXXXX" />
            </FormGroup>
            <FormGroup>
              <FormField label="نوع الشريك" placeholder="إختر النوع" />
              <FormField label="نسبة العمولة (%)" placeholder="10" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="تاريخ انتهاء العقد" type="date" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowCreateDialog(false)}>إضافة الشريك</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogHeader>
          <DialogTitle>تفاصيل الشريك - {selectedPartner?.name}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{selectedPartner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">النوع</p>
                  <Badge variant="outline">{selectedPartner.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جهة الاتصال</p>
                  <p className="font-medium">{selectedPartner.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الإحالات</p>
                  <p className="text-xl font-bold">{selectedPartner.referrals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الإيرادات</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedPartner.revenue, 'SAR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العمولة</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedPartner.commission, 'SAR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الأداء</p>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={selectedPartner.performanceScore} className="flex-1" />
                    <span className="font-bold">{selectedPartner.performanceScore}%</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">الاتجاه الشهري</p>
                <span className={cn('text-lg font-bold', selectedPartner.monthlyTrend > 0 ? 'text-green-500' : 'text-red-500')}>
                  {selectedPartner.monthlyTrend > 0 ? '↑' : '↓'} {Math.abs(selectedPartner.monthlyTrend)}%
                </span>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
