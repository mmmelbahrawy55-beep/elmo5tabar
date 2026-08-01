'use client';

import { useState, useCallback } from 'react';
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

type CouponStatus = 'نشط' | 'منتهي' | 'غير نشط';
type CouponType = 'نسبة' | 'ثابت';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageCount: number;
  maxUsage: number;
  validFrom: string;
  validTo: string;
  status: CouponStatus;
  isActive: boolean;
  totalDiscount: number;
  appliesTo: string[];
}

const mockCoupons: Coupon[] = [
  { id: '1', code: 'SUMMER25', type: 'نسبة', value: 25, minOrder: 200, maxDiscount: 150, usageCount: 567, maxUsage: 1000, validFrom: '2024-06-01', validTo: '2024-08-31', status: 'نشط', isActive: true, totalDiscount: 8500, appliesTo: ['جميع الخدمات'] },
  { id: '2', code: 'WELCOME100', type: 'ثابت', value: 100, minOrder: 300, usageCount: 345, maxUsage: 500, validFrom: '2024-01-01', validTo: '2024-12-31', status: 'نشط', isActive: true, totalDiscount: 34500, appliesTo: ['العملاء الجدد'] },
  { id: '3', code: 'HEALTH15', type: 'نسبة', value: 15, minOrder: 100, usageCount: 890, maxUsage: 2000, validFrom: '2024-03-01', validTo: '2024-09-30', status: 'نشط', isActive: true, totalDiscount: 6700, appliesTo: ['التحاليل الطبية'] },
  { id: '4', code: 'FAMILY20', type: 'نسبة', value: 20, minOrder: 500, maxDiscount: 300, usageCount: 234, maxUsage: 400, validFrom: '2024-06-15', validTo: '2024-09-15', status: 'نشط', isActive: true, totalDiscount: 12000, appliesTo: ['باقات العائلة'] },
  { id: '5', code: 'STUDENT10', type: 'نسبة', value: 10, minOrder: 50, usageCount: 678, maxUsage: 1500, validFrom: '2024-01-01', validTo: '2024-12-31', status: 'نشط', isActive: true, totalDiscount: 3400, appliesTo: ['طلاب'] },
  { id: '6', code: 'VIP500', type: 'ثابت', value: 500, minOrder: 2000, usageCount: 45, maxUsage: 100, validFrom: '2024-06-01', validTo: '2024-12-31', status: 'نشط', isActive: true, totalDiscount: 22500, appliesTo: ['VIP'] },
  { id: '7', code: 'NEWYEAR30', type: 'نسبة', value: 30, minOrder: 300, maxDiscount: 200, usageCount: 456, maxUsage: 500, validFrom: '2024-01-01', validTo: '2024-01-15', status: 'منتهي', isActive: false, totalDiscount: 18000, appliesTo: ['جميع الخدمات'] },
  { id: '8', code: 'RAMADAN20', type: 'نسبة', value: 20, minOrder: 150, usageCount: 789, maxUsage: 800, validFrom: '2024-03-01', validTo: '2024-04-01', status: 'منتهي', isActive: false, totalDiscount: 15600, appliesTo: ['جميع الخدمات'] },
  { id: '9', code: 'SPRING15', type: 'نسبة', value: 15, minOrder: 100, usageCount: 345, maxUsage: 600, validFrom: '2024-03-20', validTo: '2024-04-20', status: 'منتهي', isActive: false, totalDiscount: 5200, appliesTo: ['التحاليل'] },
  { id: '10', code: 'LEGACY50', type: 'ثابت', value: 50, minOrder: 100, usageCount: 0, maxUsage: 100, validFrom: '2024-07-01', validTo: '2024-07-31', status: 'غير نشط', isActive: false, totalDiscount: 0, appliesTo: ['جميع الخدمات'] },
  { id: '11', code: 'TEST100', type: 'نسبة', value: 100, minOrder: 50, usageCount: 0, maxUsage: 10, validFrom: '2024-06-01', validTo: '2024-06-01', status: 'غير نشط', isActive: false, totalDiscount: 0, appliesTo: ['اختبار'] },
];

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [coupons, setCoupons] = useState(mockCoupons);
  const [generatedCode, setGeneratedCode] = useState('');

  const stats = {
    activeCoupons: 15,
    totalUsage: 3456,
    totalDiscount: 23000,
    avgCouponValue: 15,
  };

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case 'نشط': return 'success';
      case 'منتهي': return 'secondary';
      case 'غير نشط': return 'destructive';
      default: return 'default';
    }
  };

  const toggleCoupon = (id: string) => {
    setCoupons(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive, status: c.isActive ? 'غير نشط' : 'نشط' } : c
    ));
  };

  const generateCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
  }, []);

  const filteredCoupons = coupons.filter(c => {
    return c.code.includes(searchQuery.toUpperCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCoupons = filteredCoupons.filter(c => c.status === 'نشط');
  const endedCoupons = filteredCoupons.filter(c => c.status === 'منتهي');
  const inactiveCoupons = filteredCoupons.filter(c => c.status === 'غير نشط');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الكوبونات</h1>
          <p className="text-muted-foreground mt-1">إدارة كوبونات التخفيض والترويج</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button variant="outline" onClick={() => setShowBulkDialog(true)}>إنشاء مجمع</Button>
          <Button onClick={() => setShowCreateDialog(true)}>كوبون جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="كوبونات نشطة" value={stats.activeCoupons} icon="🎟️" />
        <StatCard title="إجمالي الاستخدام" value={stats.totalUsage.toLocaleString('ar-SA')} icon="📊" />
        <StatCard title="إجمالي التخفيضات" value={formatCurrency(stats.totalDiscount, 'SAR')} icon="💰" />
        <StatCard title="متوسط قيمة الكوبون" value={formatCurrency(stats.avgCouponValue, 'SAR')} icon="📉" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">الكوبونات النشطة</TabsTrigger>
          <TabsTrigger value="ended">منتهية</TabsTrigger>
          <TabsTrigger value="inactive">غير نشطة</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>الكوبونات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <SearchInput
                  placeholder="بحث بالكود..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="max-w-md"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكود</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">القيمة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحد الأدنى</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الخصم الأقصى</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاستخدامات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الصلاحية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التفعيل</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCoupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <code className="px-2 py-1 rounded bg-muted font-mono font-bold text-sm">
                            {coupon.code}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={coupon.type === 'نسبة' ? 'info' : 'outline'}>{coupon.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-primary">
                            {coupon.type === 'نسبة' ? `${coupon.value}%` : formatCurrency(coupon.value, 'SAR')}
                          </span>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(coupon.minOrder, 'SAR')}</td>
                        <td className="py-3 px-4">
                          {coupon.maxDiscount ? formatCurrency(coupon.maxDiscount, 'SAR') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{coupon.usageCount}/{coupon.maxUsage}</div>
                            <ProgressBar value={(coupon.usageCount / coupon.maxUsage) * 100} className="w-20 mt-1" />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          <div>{formatDate(new Date(coupon.validFrom))}</div>
                          <div>إلى {formatDate(new Date(coupon.validTo))}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(coupon.status)}>{coupon.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Switch checked={coupon.isActive} onCheckedChange={() => toggleCoupon(coupon.id)} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
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

        <TabsContent value="ended">
          <Card>
            <CardHeader>
              <CardTitle>الكوبونات المنتهية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكود</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">القيمة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاستخدامات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">إجمالي التخفيض</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الصلاحية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endedCoupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-muted/50 transition-colors opacity-70">
                        <td className="py-3 px-4">
                          <code className="px-2 py-1 rounded bg-muted font-mono font-bold text-sm">
                            {coupon.code}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{coupon.type}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {coupon.type === 'نسبة' ? `${coupon.value}%` : formatCurrency(coupon.value, 'SAR')}
                        </td>
                        <td className="py-3 px-4">{coupon.usageCount}/{coupon.maxUsage}</td>
                        <td className="py-3 px-4 font-bold">{formatCurrency(coupon.totalDiscount, 'SAR')}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {formatDate(new Date(coupon.validFrom))} - {formatDate(new Date(coupon.validTo))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">إعادة استخدام</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
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

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>الكوبونات غير النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكود</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">القيمة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاستخدامات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveCoupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-muted/50 transition-colors opacity-60">
                        <td className="py-3 px-4">
                          <code className="px-2 py-1 rounded bg-muted font-mono font-bold text-sm">
                            {coupon.code}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{coupon.type}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {coupon.type === 'نسبة' ? `${coupon.value}%` : formatCurrency(coupon.value, 'SAR')}
                        </td>
                        <td className="py-3 px-4">{coupon.usageCount}/{coupon.maxUsage}</td>
                        <td className="py-3 px-4">
                          <Badge variant="destructive">{coupon.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleCoupon(coupon.id)}>تفعيل</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
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
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogHeader>
          <DialogTitle>إنشاء كوبون جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات الكوبون">
            <FormGroup>
              <FormField label="كود الكوبون" placeholder="SUMMER2024" defaultValue={generatedCode} />
            </FormGroup>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={generateCode}>توليد كود عشوائي</Button>
              {generatedCode && (
                <span className="text-sm text-muted-foreground">الكود الحالي: <code className="font-mono font-bold">{generatedCode}</code></span>
              )}
            </div>
            <FormGroup>
              <FormField label="نوع الخصم" placeholder="نسبة أو ثابت" />
              <FormField label="قيمة الخصم" placeholder="25" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحد الأدنى للطلب (SAR)" placeholder="100" type="number" />
              <FormField label="الخصم الأقصى (SAR)" placeholder="اختياري" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحد الأقصى للاستخدام" placeholder="1000" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="تاريخ البدء" type="date" />
              <FormField label="تاريخ الانتهاء" type="date" />
            </FormGroup>
            <FormGroup>
              <FormField label="ينطبق على" placeholder="جميع الخدمات" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowCreateDialog(false)}>إنشاء الكوبون</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogHeader>
          <DialogTitle>إنشاء كوبونات مجمعة</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="إعدادات الإنشاء المجمع">
            <FormGroup>
              <FormField label="عدد الكوبونات" placeholder="10" type="number" />
              <FormField label="طول الكود" placeholder="8" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="البادئة (اختياري)" placeholder="SALE" />
            </FormGroup>
            <FormGroup>
              <FormField label="نوع الخصم" placeholder="نسبة أو ثابت" />
              <FormField label="قيمة الخصم" placeholder="20" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحد الأدنى للطلب (SAR)" placeholder="100" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحد الأقصى للاستخدام لكل كوبون" placeholder="100" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="تاريخ البدء" type="date" />
              <FormField label="تاريخ الانتهاء" type="date" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowBulkDialog(false)}>إنشاء المجمع</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
