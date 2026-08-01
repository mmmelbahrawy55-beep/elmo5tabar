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

interface TestItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  department: string;
  sampleType: string;
  turnaroundTime: string;
  price: number;
  branches: string[];
  status: 'active' | 'inactive' | 'pending';
  normalRange: string;
  instructions: string;
}

interface TestCategory {
  id: string;
  name: string;
  icon: string;
  testCount: number;
  description: string;
}

interface BundlePackage {
  id: string;
  name: string;
  tests: string[];
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  usageCount: number;
  isActive: boolean;
}

interface BranchPrice {
  branch: string;
  testCode: string;
  price: number;
  lastUpdated: string;
}

const mockTests: TestItem[] = [
  { id: '1', code: 'CBC-001', nameAr: 'صورة الدم الكاملة', nameEn: 'Complete Blood Count', category: '血液学', department: 'المختبر العام', sampleType: 'دم', turnaroundTime: '2 ساعة', price: 45, branches: ['الفرع الرئيسي', 'فرع الرياض'], status: 'active', normalRange: 'WBC: 4.5-11.0', instructions: 'صيام 8 ساعات' },
  { id: '2', code: 'BIO-002', nameAr: 'السكر التراكمي', nameEn: 'HbA1c', category: 'الكيمياء الحيوية', department: 'السكري', sampleType: 'دم', turnaroundTime: '4 ساعات', price: 120, branches: ['الفرع الرئيسي'], status: 'active', normalRange: '< 5.7%', instructions: 'لا يحتاج صيام' },
  { id: '3', code: 'UR-003', nameAr: 'تحليل البول', nameEn: 'Urinalysis', category: 'البول', department: 'المختبر العام', sampleType: 'بول', turnaroundTime: '1 ساعة', price: 25, branches: ['الفرع الرئيسي', 'فرع الرياض', 'فرع جدة'], status: 'active', normalRange: 'SG: 1.005-1.030', instructions: 'عينة صباحية' },
  { id: '4', code: 'LIP-004', nameAr: 'بروفايل الدهون', nameEn: 'Lipid Profile', category: 'الكيمياء الحيوية', department: 'القلب', sampleType: 'دم', turnaroundTime: '6 ساعات', price: 85, branches: ['الفرع الرئيسي'], status: 'active', normalRange: 'Cholesterol < 200', instructions: 'صيام 12 ساعة' },
  { id: '5', code: 'THY-005', nameAr: 'وظائف الغدة الدرقية', nameEn: 'Thyroid Function', category: 'الهرمونات', department: 'الغدد الصماء', sampleType: 'دم', turnaroundTime: '24 ساعة', price: 200, branches: ['الفرع الرئيسي', 'فرع الرياض'], status: 'active', normalRange: 'TSH: 0.4-4.0', instructions: 'صيام اختياري' },
  { id: '6', code: 'HEP-006', nameAr: 'وظائف الكبد', nameEn: 'Liver Function', category: 'الكيمياء الحيوية', department: 'المختبر العام', sampleType: 'دم', turnaroundTime: '4 ساعات', price: 95, branches: ['الفرع الرئيسي'], status: 'inactive', normalRange: 'ALT: 7-56', instructions: 'صيام 8 ساعات' },
  { id: '7', code: 'REN-007', nameAr: 'وظائف الكلى', nameEn: 'Kidney Function', category: 'الكيمياء الحيوية', department: 'المختبر العام', sampleType: 'دم', turnaroundTime: '4 ساعات', price: 80, branches: ['الفرع الرئيسي', 'فرع جدة'], status: 'active', normalRange: 'Creatinine: 0.6-1.2', instructions: 'صيام 8 ساعات' },
  { id: '8', code: 'COA-008', nameAr: 'معادلة الدم', nameEn: 'Coagulation Profile', category: 'الدم', department: 'المختبر العام', sampleType: 'دم', turnaroundTime: '2 ساعة', price: 70, branches: ['الفرع الرئيسي'], status: 'pending', normalRange: 'PT: 11-13.5 sec', instructions: 'إبلاغ بالأدوية' },
];

const mockCategories: TestCategory[] = [
  { id: '1', name: 'الكيمياء الحيوية', icon: '🧬', testCount: 45, description: 'تحليلات الكيمياء الحيوية والإنزيمات' },
  { id: '2', name: 'الدم', icon: '🩸', testCount: 32, description: 'صورة الدم وتحليلات التخثر' },
  { id: '3', name: 'البول', icon: '💧', testCount: 18, description: 'تحليلات البول والكلى' },
  { id: '4', name: 'الهرمونات', icon: '⚡', testCount: 28, description: 'تحليلات الهرمونات والغدد الصماء' },
  { id: '5', name: 'الأمراض المعدية', icon: '🦠', testCount: 35, description: 'culture and sensitivity tests' },
  { id: '6', name: 'المناعة', icon: '🛡️', testCount: 20, description: 'immunology and autoantibodies' },
  { id: '7', name: 'الوراثة', icon: '🧬', testCount: 12, description: 'Genetic and chromosomal analysis' },
  { id: '8', name: 'الفحوصات الدورية', icon: '📋', testCount: 25, description: 'Comprehensive health checkups' },
];

const mockPackages: BundlePackage[] = [
  { id: '1', name: 'حزمة الفحص الشامل', tests: ['CBC-001', 'BIO-002', 'LIP-004', 'REN-007'], originalPrice: 345, discountedPrice: 275, discountPercent: 20, usageCount: 342, isActive: true },
  { id: '2', name: 'حزمة السكري', tests: ['BIO-002', 'CBC-001'], originalPrice: 165, discountedPrice: 140, discountPercent: 15, usageCount: 256, isActive: true },
  { id: '3', name: 'حزمة القلب', tests: ['LIP-004', 'CBC-001', 'COA-008'], originalPrice: 200, discountedPrice: 160, discountPercent: 20, usageCount: 189, isActive: true },
  { id: '4', name: 'حزمة الحمل', tests: ['CBC-001', 'BIO-002', 'UR-003'], originalPrice: 190, discountedPrice: 152, discountPercent: 20, usageCount: 423, isActive: true },
  { id: '5', name: 'حزمة ما قبل الجراحة', tests: ['CBC-001', 'COA-008', 'REN-007', 'HEP-006'], originalPrice: 290, discountedPrice: 245, discountPercent: 15, usageCount: 98, isActive: false },
  { id: '6', name: 'حزمة التأهيل', tests: ['CBC-001', 'BIO-002', 'THY-005'], originalPrice: 365, discountedPrice: 290, discountPercent: 20, usageCount: 67, isActive: false },
];

const mockBranchPrices: BranchPrice[] = [
  { branch: 'الفرع الرئيسي', testCode: 'CBC-001', price: 45, lastUpdated: '2026-07-20' },
  { branch: 'فرع الرياض', testCode: 'CBC-001', price: 48, lastUpdated: '2026-07-18' },
  { branch: 'فرع جدة', testCode: 'CBC-001', price: 50, lastUpdated: '2026-07-15' },
  { branch: 'الفرع الرئيسي', testCode: 'BIO-002', price: 120, lastUpdated: '2026-07-20' },
  { branch: 'فرع الرياض', testCode: 'BIO-002', price: 125, lastUpdated: '2026-07-18' },
  { branch: 'الفرع الرئيسي', testCode: 'LIP-004', price: 85, lastUpdated: '2026-07-20' },
  { branch: 'فرع جدة', testCode: 'LIP-004', price: 90, lastUpdated: '2026-07-15' },
];

export default function TestsManagementPage() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tests, setTests] = useState<TestItem[]>(mockTests);
  const [categories] = useState<TestCategory[]>(mockCategories);
  const [packages] = useState<BundlePackage[]>(mockPackages);
  const [branchPrices] = useState<BranchPrice[]>(mockBranchPrices);

  const [formData, setFormData] = useState({
    code: '', nameAr: '', nameEn: '', category: '', department: '',
    sampleType: '', turnaroundTime: '', price: '', branches: [] as string[],
    normalRange: '', instructions: '',
  });

  const filteredTests = tests.filter(t => {
    const matchesSearch = t.nameAr.includes(searchQuery) || t.code.includes(searchQuery) || t.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (test: TestItem) => {
    setSelectedTest(test);
    setFormData({
      code: test.code, nameAr: test.nameAr, nameEn: test.nameEn,
      category: test.category, department: test.department,
      sampleType: test.sampleType, turnaroundTime: test.turnaroundTime,
      price: test.price.toString(), branches: test.branches,
      normalRange: test.normalRange, instructions: test.instructions,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (test: TestItem) => {
    setSelectedTest(test);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTest) {
      setTests(prev => prev.filter(t => t.id !== selectedTest.id));
    }
    setShowDeleteConfirm(false);
    setSelectedTest(null);
  };

  const handleSaveTest = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (showEditDialog && selectedTest) {
        setTests(prev => prev.map(t => t.id === selectedTest.id ? { ...t, ...formData, price: Number(formData.price) } : t));
      } else {
        const newTest: TestItem = {
          id: String(tests.length + 1), ...formData, price: Number(formData.price), status: 'pending',
        };
        setTests(prev => [...prev, newTest]);
      }
      setIsLoading(false);
      setShowAddDialog(false);
      setShowEditDialog(false);
      setFormData({ code: '', nameAr: '', nameEn: '', category: '', department: '', sampleType: '', turnaroundTime: '', price: '', branches: [], normalRange: '', instructions: '' });
    }, 800);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">نشط</Badge>;
      case 'inactive': return <Badge variant="danger">غير نشط</Badge>;
      case 'pending': return <Badge variant="warning">قيد المراجعة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة التحاليل</h1>
          <p className="text-muted-foreground mt-1">إدارة كتالوج التحاليل والمختبرات والأسعار</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={tests} filename="tests-catalog" />
          <Button onClick={() => setShowAddDialog(true)}>إضافة تحليل جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي التحاليل" value={formatNumber(450)} icon="🧪" change={{ value: 12, isPositive: true }} />
        <StatCard title="تحاليل نشطة" value={formatNumber(380)} icon="✅" change={{ value: 8, isPositive: true }} />
        <StatCard title="فئات التحاليل" value={formatNumber(15)} icon="📁" />
        <StatCard title="التحاليل الأكثر طلباً" value="CBC" icon="🏆" change={{ value: 23, isPositive: true }} />
      </div>

      <div className="flex items-center gap-4">
        <SearchInput placeholder="بحث بالاسم أو الكود..." value={searchQuery} onChange={setSearchQuery} className="w-80" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">جميع الفئات</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="pending">قيد المراجعة</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">الكتالوج</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="packages">التحاليل المجمّعة</TabsTrigger>
          <TabsTrigger value="prices">الأسعار</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الكود</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">اسم التحليل</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الفئة</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">السعر</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">مدة النتائج</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الفرع</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map(test => (
                      <tr key={test.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{test.code}</td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{test.nameAr}</div>
                            <div className="text-xs text-muted-foreground">{test.nameEn}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline">{test.category}</Badge></td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(test.price)}</td>
                        <td className="px-4 py-3">{test.turnaroundTime}</td>
                        <td className="px-4 py-3">{statusBadge(test.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {test.branches.map((b, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(test)}>تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(test)}>حذف</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTests.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">لا توجد نتائج مطابقة</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <Card key={cat.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{cat.icon}</div>
                    <Badge variant="secondary">{cat.testCount} تحليل</Badge>
                  </div>
                  <h3 className="font-semibold mt-3 text-lg">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                  <div className="mt-3">
                    <ProgressBar value={cat.testCount} max={50} size="sm" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <Card key={pkg.id} className={cn('hover:shadow-md transition-shadow', !pkg.isActive && 'opacity-60')}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant={pkg.isActive ? 'success' : 'secondary'}>{pkg.isActive ? 'نشط' : 'غير نشط'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">عدد التحاليل</span>
                      <span className="font-medium">{pkg.tests.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">السعر الأصلي</span>
                      <span className="line-through text-muted-foreground">{formatCurrency(pkg.originalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">السعر بعد الخصم</span>
                      <span className="font-bold text-lg text-primary">{formatCurrency(pkg.discountedPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">نسبة التخفيض</span>
                      <Badge variant="success">%{pkg.discountPercent}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">عدد الاستخدامات</span>
                      <span className="font-medium">{formatNumber(pkg.usageCount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الفرع</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">كود التحليل</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">السعر</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">آخر تحديث</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchPrices.map((bp, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{bp.branch}</td>
                        <td className="px-4 py-3 font-mono text-xs">{bp.testCode}</td>
                        <td className="px-4 py-3 font-bold">{formatCurrency(bp.price)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(bp.lastUpdated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {(showAddDialog || showEditDialog) && (
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={() => { setShowAddDialog(false); setShowEditDialog(false); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showEditDialog ? 'تعديل التحليل' : 'إضافة تحليل جديد'}</DialogTitle>
            </DialogHeader>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : (
              <FormSection>
                <FormGroup columns={2}>
                  <FormField label="كود التحليل" required>
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="مثال: CBC-001" />
                  </FormField>
                  <FormField label="اسم التحليل بالعربية" required>
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.nameAr} onChange={e => setFormData(p => ({ ...p, nameAr: e.target.value }))} placeholder="اسم التحليل" />
                  </FormField>
                  <FormField label="اسم التحليل بالإنجليزية">
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.nameEn} onChange={e => setFormData(p => ({ ...p, nameEn: e.target.value }))} placeholder="Test name" />
                  </FormField>
                  <FormField label="الفئة" required>
                    <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">اختر الفئة</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="القسم">
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} placeholder="القسم" />
                  </FormField>
                  <FormField label="نوع العينة">
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.sampleType} onChange={e => setFormData(p => ({ ...p, sampleType: e.target.value }))} placeholder="دم، بول..." />
                  </FormField>
                  <FormField label="مدة النتائج">
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.turnaroundTime} onChange={e => setFormData(p => ({ ...p, turnaroundTime: e.target.value }))} placeholder="2 ساعة" />
                  </FormField>
                  <FormField label="السعر (ر.س)" required>
                    <input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="0" />
                  </FormField>
                </FormGroup>
                <FormField label="المجالات الطبيعية">
                  <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={formData.normalRange} onChange={e => setFormData(p => ({ ...p, normalRange: e.target.value }))} placeholder="WBC: 4.5-11.0" />
                </FormField>
                <FormField label="تعليمات">
                  <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px]" value={formData.instructions} onChange={e => setFormData(p => ({ ...p, instructions: e.target.value }))} placeholder="تعليمات إضافية..." />
                </FormField>
                <FormField label="الفروع">
                  <div className="flex flex-wrap gap-3">
                    {['الفرع الرئيسي', 'فرع الرياض', 'فرع جدة', 'فرع الدمام'].map(branch => (
                      <label key={branch} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.branches.includes(branch)}
                          onChange={e => {
                            if (e.target.checked) setFormData(p => ({ ...p, branches: [...p.branches, branch] }));
                            else setFormData(p => ({ ...p, branches: p.branches.filter(b => b !== branch) }));
                          }}
                          className="rounded border-border"
                        />
                        {branch}
                      </label>
                    ))}
                  </div>
                </FormField>
              </FormSection>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); }}>إلغاء</Button>
              <Button onClick={handleSaveTest} disabled={isLoading}>{showEditDialog ? 'حفظ التعديلات' : 'إضافة التحليل'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="حذف التحليل"
        description={`هل أنت متأكد من حذف تحليل "${selectedTest?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleConfirmDelete}
        variant="danger"
      />
    </div>
  );
}
