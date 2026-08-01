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

type OfferStatus = 'نشط' | 'قادم' | 'منتهي';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'نسبة' | 'ثابت';
  discountValue: number;
  validFrom: string;
  validTo: string;
  testsIncluded: string[];
  packagesIncluded: string[];
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
  status: OfferStatus;
  revenue: number;
  conversions: number;
}

const mockOffers: Offer[] = [
  { id: '1', title: 'عرض الصيف الصحي', description: 'خصم 25% على جميع التحاليل الطبية خلال فصل الصيف', discountType: 'نسبة', discountValue: 25, validFrom: '2024-06-01', validTo: '2024-08-31', testsIncluded: ['تحليل سكر', 'تحليل كوليسترول', 'تحليل وظائف الكلى'], packagesIncluded: ['باقة الفحص الشامل'], usageCount: 456, maxUsage: 1000, isActive: true, status: 'نشط', revenue: 125000, conversions: 380 },
  { id: '2', title: 'باقة العائلة', description: 'خصم 30% عند إجراء فحوصات لـ 4 أفراد أو أكثر', discountType: 'نسبة', discountValue: 30, validFrom: '2024-06-15', validTo: '2024-09-15', testsIncluded: [], packagesIncluded: ['باقة العائلة', 'باقة الأطفال'], usageCount: 234, maxUsage: 500, isActive: true, status: 'نشط', revenue: 98000, conversions: 195 },
  { id: '3', title: 'خصم التأمين الجديد', description: 'خصم 200 ريال على بوليصة التأمين الجديدة', discountType: 'ثابت', discountValue: 200, validFrom: '2024-07-01', validTo: '2024-07-31', testsIncluded: [], packagesIncluded: ['تأمين صحي شامل', 'تأمين أساسي'], usageCount: 123, maxUsage: 300, isActive: true, status: 'نشط', revenue: 67000, conversions: 123 },
  { id: '4', title: 'عرض الطلاب', description: 'خصم 15% لطلاب الجامعات على جميع الخدمات', discountType: 'نسبة', discountValue: 15, validFrom: '2024-06-01', validTo: '2024-12-31', testsIncluded: ['جميع التحاليل'], packagesIncluded: ['باقة الطالب'], usageCount: 189, maxUsage: 800, isActive: true, status: 'نشط', revenue: 45000, conversions: 189 },
  { id: '5', title: 'عرض العودة للمدارس', description: 'خصم 20% على فحوصات ما قبل الالتحاق بالمدارس', discountType: 'نسبة', discountValue: 20, validFrom: '2024-08-15', validTo: '2024-09-15', testsIncluded: ['فحص شامل', 'تحاليل الدم'], packagesIncluded: ['باقة الطالب'], usageCount: 0, maxUsage: 500, isActive: false, status: 'قادم', revenue: 0, conversions: 0 },
  { id: '6', title: 'عرض نهاية العام', description: 'خصم 35% على الباقة الشاملة في نهاية العام', discountType: 'نسبة', discountValue: 35, validFrom: '2024-12-01', validTo: '2024-12-31', testsIncluded: [], packagesIncluded: ['باقة الفحص الشامل', 'باقة التأمين'], usageCount: 0, maxUsage: 200, isActive: false, status: 'قادم', revenue: 0, conversions: 0 },
  { id: '7', title: 'عرض رمضان المبارك', description: 'خصم خاص خلال شهر رمضان المبارك', discountType: 'نسبة', discountValue: 20, validFrom: '2024-03-01', validTo: '2024-04-01', testsIncluded: ['تحليل صائم', 'تحليل سكر'], packagesIncluded: [], usageCount: 312, maxUsage: 500, isActive: false, status: 'منتهي', revenue: 89000, conversions: 312 },
  { id: '8', title: 'عرض رأس السنة', description: 'خصم 25% للاحتفال بالسنة الجديدة', discountType: 'نسبة', discountValue: 25, validFrom: '2024-01-01', validTo: '2024-01-15', testsIncluded: [], packagesIncluded: ['باقة الفحص الشامل'], usageCount: 278, maxUsage: 400, isActive: false, status: 'منتهي', revenue: 78000, conversions: 278 },
];

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [offers, setOffers] = useState(mockOffers);

  const stats = {
    activeOffers: 6,
    upcomingOffers: 3,
    totalUsage: 1234,
    avgDiscount: 18,
  };

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'نشط': return 'success';
      case 'قادم': return 'info';
      case 'منتهي': return 'secondary';
      default: return 'default';
    }
  };

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o =>
      o.id === id ? { ...o, isActive: !o.isActive } : o
    ));
  };

  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.title.includes(searchQuery);
    return matchesSearch;
  });

  const activeOffers = filteredOffers.filter(o => o.status === 'نشط');
  const upcomingOffers = filteredOffers.filter(o => o.status === 'قادم');
  const endedOffers = filteredOffers.filter(o => o.status === 'منتهي');

  const totalRevenue = offers.reduce((acc, o) => acc + o.revenue, 0);
  const totalConversions = offers.reduce((acc, o) => acc + o.conversions, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">العروض</h1>
          <p className="text-muted-foreground mt-1">إدارة عروض التخفيض والعروض الترويجية</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button onClick={() => setShowCreateDialog(true)}>عرض جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="عروض نشطة" value={stats.activeOffers} icon="🏷️" />
        <StatCard title="عروض قادمة" value={stats.upcomingOffers} icon="📅" />
        <StatCard title="إجمالي الاستخدام" value={stats.totalUsage.toLocaleString('ar-SA')} icon="📊" />
        <StatCard title="متوسط الخصم" value={`${stats.avgDiscount}%`} icon="💰" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">العروض النشطة</TabsTrigger>
          <TabsTrigger value="upcoming">قادمة</TabsTrigger>
          <TabsTrigger value="ended">منتهية</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-4">
            <SearchInput
              placeholder="بحث في العروض..."
              value={searchQuery}
              onChange={(v) => setSearchQuery(v)}
              className="max-w-md"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOffers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{offer.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(offer.status)}>{offer.status}</Badge>
                        <Switch checked={offer.isActive} onCheckedChange={() => toggleOffer(offer.id)} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {offer.discountType === 'نسبة' ? `${offer.discountValue}%` : formatCurrency(offer.discountValue, 'SAR')}
                        </p>
                        <p className="text-xs text-muted-foreground">خصم</p>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-1">الاستخدام</div>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={(offer.usageCount / offer.maxUsage) * 100} className="flex-1" />
                          <span className="text-sm font-medium">{offer.usageCount}/{offer.maxUsage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">من:</span>
                        <span className="mr-2 font-medium">{formatDate(new Date(offer.validFrom))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">إلى:</span>
                        <span className="mr-2 font-medium">{formatDate(new Date(offer.validTo))}</span>
                      </div>
                    </div>

                    {offer.testsIncluded.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">التحاليل المشمولة:</p>
                        <div className="flex flex-wrap gap-1">
                          {offer.testsIncluded.map((test, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{test}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {offer.packagesIncluded.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">الباقات المشمولة:</p>
                        <div className="flex flex-wrap gap-1">
                          {offer.packagesIncluded.map((pkg, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{pkg}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">الإيراد: </span>
                          <span className="font-bold">{formatCurrency(offer.revenue, 'SAR')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">التحويلات: </span>
                          <span className="font-bold">{offer.conversions}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">تعديل</Button>
                        <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow opacity-80">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{offer.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                    </div>
                    <Badge variant="info">{offer.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {offer.discountType === 'نسبة' ? `${offer.discountValue}%` : formatCurrency(offer.discountValue, 'SAR')}
                      </p>
                      <p className="text-xs text-muted-foreground">خصم</p>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-muted-foreground">يبدأ: {formatDate(new Date(offer.validFrom))}</p>
                      <p className="text-muted-foreground">ينتهي: {formatDate(new Date(offer.validTo))}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">تعديل</Button>
                    <Button size="sm">تفعيل مبكر</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ended">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endedOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{offer.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                    </div>
                    <Badge variant="secondary">{offer.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{offer.usageCount}</p>
                      <p className="text-xs text-muted-foreground">مرات الاستخدام</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(offer.revenue, 'SAR')}</p>
                      <p className="text-xs text-muted-foreground">الإيراد</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{offer.conversions}</p>
                      <p className="text-xs text-muted-foreground">التحويلات</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">إعادة استخدام</Button>
                    <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء العروض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{formatCurrency(totalRevenue, 'SAR')}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الإيراد</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{totalConversions.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {offers.sort((a, b) => b.revenue - a.revenue).map((offer) => (
                    <div key={offer.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{offer.title}</div>
                        <div className="text-xs text-muted-foreground">{offer.status}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{formatCurrency(offer.revenue, 'SAR')}</div>
                        <div className="text-xs text-muted-foreground">{offer.conversions} تحويل</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offers.filter(o => o.status === 'نشط').map((offer) => (
                    <div key={offer.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{offer.title}</span>
                        <span className="text-sm">{offer.usageCount}/{offer.maxUsage}</span>
                      </div>
                      <ProgressBar value={(offer.usageCount / offer.maxUsage) * 100} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogHeader>
          <DialogTitle>إنشاء عرض جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات العرض">
            <FormGroup>
              <FormField label="عنوان العرض" placeholder="أدخل عنوان العرض" />
            </FormGroup>
            <div className="space-y-2">
              <label className="text-sm font-medium">الوصف</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-foreground resize-y"
                placeholder="وصف العرض..."
              />
            </div>
            <FormGroup>
              <FormField label="نوع الخصم" placeholder="نسبة أو ثابت" />
              <FormField label="قيمة الخصم" placeholder="25" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="تاريخ البدء" type="date" />
              <FormField label="تاريخ الانتهاء" type="date" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحد الأقصى للاستخدام" placeholder="1000" type="number" />
            </FormGroup>
          </FormSection>
          <FormSection title="الخدمات المشمولة">
            <FormGroup>
              <FormField label="التحاليل" placeholder="اختر التحاليل" />
              <FormField label="الباقات" placeholder="اختر الباقات" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowCreateDialog(false)}>إنشاء العرض</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
