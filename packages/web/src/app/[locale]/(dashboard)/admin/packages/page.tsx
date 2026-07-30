'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection, FormActions } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog, LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface Package {
  id: string;
  name: string;
  description: string;
  tests: { id: string; name: string; code: string; price: number }[];
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  usageCount: number;
  isActive: boolean;
  category: string;
  createdAt: string;
}

interface AvailableTest {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
}

const mockAvailableTests: AvailableTest[] = [
  { id: '1', name: 'صورة الدم الكاملة', code: 'CBC-001', price: 45, category: 'الدم' },
  { id: '2', name: 'السكر التراكمي', code: 'BIO-002', price: 120, category: 'الكيمياء الحيوية' },
  { id: '3', name: 'تحليل البول', code: 'UR-003', price: 25, category: 'البول' },
  { id: '4', name: 'بروفايل الدهون', code: 'LIP-004', price: 85, category: 'الكيمياء الحيوية' },
  { id: '5', name: 'وظائف الغدة الدرقية', code: 'THY-005', price: 200, category: 'الهرمونات' },
  { id: '6', name: 'وظائف الكبد', code: 'HEP-006', price: 95, category: 'الكيمياء الحيوية' },
  { id: '7', name: 'وظائف الكلى', code: 'REN-007', price: 80, category: 'الكيمياء الحيوية' },
  { id: '8', name: 'معادلة الدم', code: 'COA-008', price: 70, category: 'الدم' },
  { id: '9', name: 'فيتامين د', code: 'VIT-009', price: 150, category: 'الكيمياء الحيوية' },
  { id: '10', name: 'الحديد والferitin', code: 'IRO-010', price: 65, category: 'الدم' },
];

const mockPackages: Package[] = [
  {
    id: '1', name: 'حزمة الفحص الشامل', description: 'فحص شامل للاختبارات الأساسية للصحة العامة',
    tests: [mockAvailableTests[0], mockAvailableTests[1], mockAvailableTests[3], mockAvailableTests[6]],
    originalPrice: 345, discountedPrice: 275, discountPercent: 20, usageCount: 342, isActive: true, category: 'عام', createdAt: '2026-01-15',
  },
  {
    id: '2', name: 'حزمة السكري', description: 'مراقبة مرضى السكري وال complications',
    tests: [mockAvailableTests[1], mockAvailableTests[0], mockAvailableTests[2]],
    originalPrice: 190, discountedPrice: 152, discountPercent: 20, usageCount: 256, isActive: true, category: 'أمراض مزمنة', createdAt: '2026-02-10',
  },
  {
    id: '3', name: 'حزمة القلب', description: 'فحص شامل لصحة القلب والأوعية الدموية',
    tests: [mockAvailableTests[3], mockAvailableTests[0], mockAvailableTests[7], mockAvailableTests[4]],
    originalPrice: 400, discountedPrice: 320, discountPercent: 20, usageCount: 189, isActive: true, category: 'القلب', createdAt: '2026-03-05',
  },
  {
    id: '4', name: 'حزمة الحمل', description: 'متابعة الحمل والصحة الإنجابية',
    tests: [mockAvailableTests[0], mockAvailableTests[1], mockAvailableTests[2], mockAvailableTests[8]],
    originalPrice: 340, discountedPrice: 272, discountPercent: 20, usageCount: 423, isActive: true, category: 'النسائية', createdAt: '2026-01-20',
  },
  {
    id: '5', name: 'حزمة ما قبل الجراحة', description: 'فحوصات ضرورية قبل أي إجراء جراحي',
    tests: [mockAvailableTests[0], mockAvailableTests[7], mockAvailableTests[6], mockAvailableTests[5]],
    originalPrice: 290, discountedPrice: 246, discountPercent: 15, usageCount: 98, isActive: false, category: 'جراحة', createdAt: '2026-04-12',
  },
  {
    id: '6', name: 'حزمة التأهيل', description: 'متابعة بعد العمليات الجراحية',
    tests: [mockAvailableTests[0], mockAvailableTests[1], mockAvailableTests[4], mockAvailableTests[9]],
    originalPrice: 465, discountedPrice: 372, discountPercent: 20, usageCount: 67, isActive: true, category: 'تأهيل', createdAt: '2026-05-01',
  },
  {
    id: '7', name: 'حزمة الهرمونات', description: 'فحص شامل للهرمونات والغدد الصماء',
    tests: [mockAvailableTests[4], mockAvailableTests[1], mockAvailableTests[8]],
    originalPrice: 470, discountedPrice: 376, discountPercent: 20, usageCount: 134, isActive: true, category: 'الهرمونات', createdAt: '2026-02-28',
  },
  {
    id: '8', name: 'حزمة كبار السن', description: 'فحوصات شاملة مخصصة لكبار السن',
    tests: [mockAvailableTests[0], mockAvailableTests[1], mockAvailableTests[3], mockAvailableTests[6], mockAvailableTests[8]],
    originalPrice: 515, discountedPrice: 386, discountPercent: 25, usageCount: 201, isActive: true, category: 'كبار السن', createdAt: '2026-03-15',
  },
  {
    id: '9', name: 'حزمة الأطفال', description: 'فحوصات أساسية للأطفال',
    tests: [mockAvailableTests[0], mockAvailableTests[2], mockAvailableTests[9]],
    originalPrice: 135, discountedPrice: 115, discountPercent: 15, usageCount: 178, isActive: false, category: 'أطفال', createdAt: '2026-06-10',
  },
];

export default function PackagesManagementPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const [newPackage, setNewPackage] = useState({
    name: '', description: '', discountPercent: 15,
  });

  const totalOriginal = selectedTests.reduce((sum, testId) => {
    const test = mockAvailableTests.find(t => t.id === testId);
    return sum + (test?.price || 0);
  }, 0);
  const totalDiscounted = totalOriginal * (1 - newPackage.discountPercent / 100);

  const filteredPackages = packages.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.description.includes(searchQuery);
    const matchesTab =
      activeTab === 'active' ? p.isActive :
      activeTab === 'inactive' ? !p.isActive : true;
    return matchesSearch && matchesTab;
  });

  const groupedByCategory = packages.reduce((acc, pkg) => {
    if (!acc[pkg.category]) acc[pkg.category] = [];
    acc[pkg.category].push(pkg);
    return acc;
  }, {} as Record<string, Package[]>);

  const handleToggleActive = (pkgId: string) => {
    setPackages(prev => prev.map(p => p.id === pkgId ? { ...p, isActive: !p.isActive } : p));
  };

  const handleSavePackage = () => {
    if (!newPackage.name || selectedTests.length === 0) return;
    setIsSaving(true);
    setTimeout(() => {
      const tests = mockAvailableTests.filter(t => selectedTests.includes(t.id));
      const pkg: Package = {
        id: String(packages.length + 1),
        name: newPackage.name,
        description: newPackage.description,
        tests,
        originalPrice: totalOriginal,
        discountedPrice: Math.round(totalDiscounted),
        discountPercent: newPackage.discountPercent,
        usageCount: 0,
        isActive: true,
        category: 'مخصص',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setPackages(prev => [...prev, pkg]);
      setIsSaving(false);
      setShowAddDialog(false);
      setNewPackage({ name: '', description: '', discountPercent: 15 });
      setSelectedTests([]);
    }, 800);
  };

  const handleDeletePackage = () => {
    if (selectedPackage) {
      setPackages(prev => prev.filter(p => p.id !== selectedPackage.id));
    }
    setShowDeleteConfirm(false);
    setSelectedPackage(null);
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]);
  };

  const averageDiscount = packages.length > 0
    ? Math.round(packages.reduce((sum, p) => sum + p.discountPercent, 0) / packages.length)
    : 0;
  const totalUsage = packages.reduce((sum, p) => sum + p.usageCount, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحزم</h1>
          <p className="text-muted-foreground mt-1">إنشاء وإدارة حزم التحاليل والعروض الترويجية</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={packages} filename="packages-report" />
          <Button onClick={() => setShowAddDialog(true)}>إضافة حزمة جديدة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الحزم" value={formatNumber(packages.length)} icon="📦" trend={{ value: 15, isPositive: true }} />
        <StatCard title="حزم نشطة" value={formatNumber(packages.filter(p => p.isActive).length)} icon="✅" trend={{ value: 10, isPositive: true }} />
        <StatCard title="متوسط الخصم" value={`%${averageDiscount}`} icon="💰" />
        <StatCard title="إجمالي الاستخدامات" value={formatNumber(totalUsage)} icon="📊" trend={{ value: 22, isPositive: true }} />
      </div>

      <div className="flex items-center gap-4">
        <SearchInput placeholder="بحث في الحزم..." value={searchQuery} onChange={setSearchQuery} className="w-80" />
        <Button variant="outline" onClick={() => setShowCompareDialog(true)}>مقارنة الحزم</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">الحزم النشطة ({packages.filter(p => p.isActive).length})</TabsTrigger>
          <TabsTrigger value="inactive">غير النشطة ({packages.filter(p => !p.isActive).length})</TabsTrigger>
          <TabsTrigger value="grouped">المجمّعة حسب الفئة</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPackages.map(pkg => (
              <Card key={pkg.id} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-primary to-primary/50" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                    </div>
                    <Badge variant="success">نشط</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">التحاليل المجمّعة</span>
                      <span className="font-medium">{pkg.tests.length} تحليل</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {pkg.tests.slice(0, 3).map(t => (
                        <Badge key={t.id} variant="outline" className="text-xs">{t.code}</Badge>
                      ))}
                      {pkg.tests.length > 3 && <Badge variant="secondary" className="text-xs">+{pkg.tests.length - 3}</Badge>}
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">السعر الأصلي</span>
                        <span className="line-through text-muted-foreground">{formatCurrency(pkg.originalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-muted-foreground text-sm">السعر بعد الخصم</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(pkg.discountedPrice)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">خصم {pkg.discountPercent}%</Badge>
                        <Badge variant="secondary">{formatNumber(pkg.usageCount)} استخدام</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">التوفير: {formatCurrency(pkg.originalPrice - pkg.discountedPrice)}</span>
                      <div className="flex items-center gap-2">
                        <Switch checked={pkg.isActive} onCheckedChange={() => handleToggleActive(pkg.id)} />
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedPackage(pkg); setShowDeleteConfirm(true); }}>حذف</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPackages.map(pkg => (
              <Card key={pkg.id} className="opacity-60 hover:opacity-100 transition-opacity">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant="secondary">غير نشط</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">عدد التحاليل</span>
                      <span>{pkg.tests.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">السعر</span>
                      <span className="font-bold">{formatCurrency(pkg.discountedPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">الاستخدامات: {formatNumber(pkg.usageCount)}</span>
                      <Switch checked={pkg.isActive} onCheckedChange={() => handleToggleActive(pkg.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPackages.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">لا توجد حزم غير نشطة</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grouped">
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([category, pkgs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-muted-foreground text-sm">({pkgs.length} حزمة)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pkgs.map(pkg => (
                    <Card key={pkg.id} className={cn('hover:shadow-md transition-shadow', !pkg.isActive && 'opacity-50')}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{pkg.name}</h4>
                          {pkg.isActive ? <Badge variant="success" className="text-xs">نشط</Badge> : <Badge variant="secondary" className="text-xs">متوقف</Badge>}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{pkg.tests.length} تحاليل</span>
                          <span className="font-bold text-primary">{formatCurrency(pkg.discountedPrice)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showAddDialog && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة حزمة جديدة</DialogTitle>
            </DialogHeader>
            {isSaving ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : (
              <FormSection>
                <FormField label="اسم الحزمة" required>
                  <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newPackage.name} onChange={e => setNewPackage(p => ({ ...p, name: e.target.value }))} placeholder="اسم الحزمة" />
                </FormField>
                <FormField label="الوصف">
                  <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[60px]" value={newPackage.description} onChange={e => setNewPackage(p => ({ ...p, description: e.target.value }))} placeholder="وصف الحزمة..." />
                </FormField>
                <FormField label="اختر التحاليل" required>
                  <div className="border border-border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                    {mockAvailableTests.map(test => (
                      <label key={test.id} className={cn(
                        'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                        selectedTests.includes(test.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                      )}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTests.includes(test.id)}
                            onChange={() => toggleTestSelection(test.id)}
                            className="rounded border-border"
                          />
                          <div>
                            <span className="text-sm font-medium">{test.name}</span>
                            <span className="text-xs text-muted-foreground mr-2">({test.code})</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(test.price)}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label={`نسبة الخصم: ${newPackage.discountPercent}%`}>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={newPackage.discountPercent}
                    onChange={e => setNewPackage(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                    className="w-full"
                  />
                </FormField>
                {selectedTests.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">السعر الأصلي</span>
                        <span>{formatCurrency(totalOriginal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">نسبة الخصم</span>
                        <span className="text-primary">%{newPackage.discountPercent}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                        <span>السعر النهائي</span>
                        <span className="text-primary">{formatCurrency(totalDiscounted)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-success">
                        <span>التوفير</span>
                        <span>{formatCurrency(totalOriginal - totalDiscounted)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </FormSection>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
              <Button onClick={handleSavePackage} disabled={isSaving || !newPackage.name || selectedTests.length === 0}>إنشاء الحزمة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showCompareDialog && (
        <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>مقارنة الحزم</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">الميزة</th>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <th key={pkg.id} className="px-3 py-2 text-center font-medium">{pkg.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">عدد التحاليل</td>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <td key={pkg.id} className="px-3 py-2 text-center font-medium">{pkg.tests.length}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">السعر الأصلي</td>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <td key={pkg.id} className="px-3 py-2 text-center line-through text-muted-foreground">{formatCurrency(pkg.originalPrice)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">السعر النهائي</td>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <td key={pkg.id} className="px-3 py-2 text-center font-bold text-primary">{formatCurrency(pkg.discountedPrice)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">نسبة التخفيض</td>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <td key={pkg.id} className="px-3 py-2 text-center"><Badge variant="success">%{pkg.discountPercent}</Badge></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">الاستخدامات</td>
                    {packages.filter(p => p.isActive).slice(0, 5).map(pkg => (
                      <td key={pkg.id} className="px-3 py-2 text-center">{formatNumber(pkg.usageCount)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompareDialog(false)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="حذف الحزمة"
        description={`هل أنت متأكد من حذف "${selectedPackage?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleDeletePackage}
        variant="danger"
      />
    </div>
  );
}
