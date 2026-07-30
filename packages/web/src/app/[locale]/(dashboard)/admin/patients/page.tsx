'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { cn, formatDate } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  phone: string;
  email: string;
  lastVisit: string;
  status: 'نشط' | 'غير نشط' | 'مفضل';
  branch: string;
  insurance: string;
  totalVisits: number;
}

const initialPatients: Patient[] = [
  { id: 'P-001', name: 'أحمد محمد العلي', age: 34, gender: 'ذكر', phone: '0501234567', email: 'ahmed@email.com', lastVisit: '2026-07-20', status: 'نشط', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي', totalVisits: 12 },
  { id: 'P-002', name: 'فاطمة خالد الحربي', age: 28, gender: 'أنثى', phone: '0559876543', email: 'fatima@email.com', lastVisit: '2026-07-22', status: 'نشط', branch: 'فرع الشمال', insurance: 'تأمين بريمي', totalVisits: 8 },
  { id: 'P-003', name: 'عبدالله سالم المطيري', age: 45, gender: 'ذكر', phone: '0561122334', email: 'abdullah@email.com', lastVisit: '2026-06-15', status: 'غير نشط', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي', totalVisits: 3 },
  { id: 'P-004', name: 'نورة عبدالعزيز الشمري', age: 52, gender: 'أنثى', phone: '0545566778', email: 'noura@email.com', lastVisit: '2026-07-25', status: 'مفضل', branch: 'فرع الجنوب', insurance: 'تأمين أسرة', totalVisits: 24 },
  { id: 'P-005', name: 'محمد عمر القحطاني', age: 19, gender: 'ذكر', phone: '0538899001', email: 'mohammed@email.com', lastVisit: '2026-07-18', status: 'نشط', branch: 'فرع الشمال', insurance: 'بلا تأمين', totalVisits: 2 },
  { id: 'P-006', name: 'سارة فهد الدوسري', age: 31, gender: 'أنثى', phone: '0527788990', email: 'sara@email.com', lastVisit: '2026-07-10', status: 'غير نشط', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي', totalVisits: 5 },
  { id: 'P-007', name: 'خالد ياسر الغامدي', age: 67, gender: 'ذكر', phone: '0516677889', email: 'khalid@email.com', lastVisit: '2026-07-26', status: 'نشط', branch: 'فرع الجنوب', insurance: 'تأمين بريمي', totalVisits: 45 },
  { id: 'P-008', name: 'رائد ناصر العتيبي', age: 41, gender: 'ذكر', phone: '0504455667', email: 'raed@email.com', lastVisit: '2026-05-01', status: 'غير نشط', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي', totalVisits: 1 },
];

const branches = ['الكل', 'الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'];
const statuses = ['الكل', 'نشط', 'غير نشط', 'مفضل'];
const genderFilters = ['الكل', 'ذكر', 'أنثى'];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [branchFilter, setBranchFilter] = useState('الكل');
  const [genderFilter, setGenderFilter] = useState('الكل');
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'ذكر' as 'ذكر' | 'أنثى', phone: '', email: '', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي',
  });
  const [sortField, setSortField] = useState<keyof Patient>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const stats = [
    { title: 'إجمالي المرضى', value: '12,847', change: '+3.2%', trend: 'up' as const },
    { title: 'مرضى جدد هذا الشهر', value: '234', change: '+12.5%', trend: 'up' as const },
    { title: 'مرضى نشطين', value: '8,921', change: '+1.8%', trend: 'up' as const },
    { title: 'معدل الرضا', value: '94.2%', change: '+0.5%', trend: 'up' as const },
  ];

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.includes(searchQuery) ||
        p.id.includes(searchQuery) ||
        p.phone.includes(searchQuery) ||
        p.email.includes(searchQuery);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && p.status === 'نشط') ||
        (activeTab === 'inactive' && p.status === 'غير نشط') ||
        (activeTab === 'favorite' && p.status === 'مفضل');
      const matchesStatus = statusFilter === 'الكل' || p.status === statusFilter;
      const matchesBranch = branchFilter === 'الكل' || p.branch === branchFilter;
      const matchesGender = genderFilter === 'الكل' || p.gender === genderFilter;
      const matchesAge = p.age >= ageRange[0] && p.age <= ageRange[1];
      return matchesSearch && matchesTab && matchesStatus && matchesBranch && matchesGender && matchesAge;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [patients, searchQuery, activeTab, statusFilter, branchFilter, genderFilter, ageRange, sortField, sortDirection]);

  const handleSort = (field: keyof Patient) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openAddDialog = () => {
    setEditingPatient(null);
    setFormData({ name: '', age: '', gender: 'ذكر', phone: '', email: '', branch: 'الفرع الرئيسي', insurance: 'التأمين الصحي' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name, age: String(patient.age), gender: patient.gender,
      phone: patient.phone, email: patient.email, branch: patient.branch, insurance: patient.insurance,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingPatient) {
      setPatients(patients.map((p) =>
        p.id === editingPatient.id
          ? { ...p, name: formData.name, age: Number(formData.age), gender: formData.gender, phone: formData.phone, email: formData.email, branch: formData.branch, insurance: formData.insurance }
          : p
      ));
    } else {
      const newPatient: Patient = {
        id: `P-${String(patients.length + 1).padStart(3, '0')}`,
        name: formData.name, age: Number(formData.age), gender: formData.gender,
        phone: formData.phone, email: formData.email, lastVisit: new Date().toISOString().split('T')[0],
        status: 'نشط', branch: formData.branch, insurance: formData.insurance, totalVisits: 0,
      };
      setPatients([...patients, newPatient]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletingPatientId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingPatientId) {
      setPatients(patients.filter((p) => p.id !== deletingPatientId));
      setIsDeleteConfirmOpen(false);
      setDeletingPatientId(null);
    }
  };

  const handleExport = () => {
    const csv = [
      ['المعرّف', 'الاسم', 'العمر', 'الجنس', 'رقم الجوال', 'البريد الإلكتروني', 'آخر زيارة', 'الحالة', 'الفرع'].join(','),
      ...filteredPatients.map((p) => [p.id, p.name, p.age, p.gender, p.phone, p.email, p.lastVisit, p.status, p.branch].join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patients.csv';
    link.click();
  };

  const SortIcon = ({ field }: { field: keyof Patient }) => (
    <span className={cn('mr-1 text-xs', sortField === field ? 'text-blue-500' : 'text-muted-foreground')}>
      {sortField === field ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المرضى</h1>
          <p className="mt-1 text-muted-foreground">إدارة وعرض جميع بيانات المرضى في النظام</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            📊 تصدير البيانات
          </Button>
          <Button onClick={openAddDialog}>+ إضافة مريض جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} trend={stat.trend} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>قائمة المرضى</CardTitle>
            <div className="flex flex-wrap gap-3">
              <SearchInput placeholder="بحث بالاسم، المعرّف، الجوال، البريد..." value={searchQuery} onChange={setSearchQuery} className="w-72" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {branches.map((b) => <option key={b} value={b}>الفرع: {b}</option>)}
              </select>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {genderFilters.map((g) => <option key={g} value={g}>الجنس: {g}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">العمر:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ageRange[0]}
                  onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ageRange[1]}
                  onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">الكل ({patients.length})</TabsTrigger>
              <TabsTrigger value="active">النشطين ({patients.filter((p) => p.status === 'نشط').length})</TabsTrigger>
              <TabsTrigger value="inactive">غير النشطين ({patients.filter((p) => p.status === 'غير نشط').length})</TabsTrigger>
              <TabsTrigger value="favorite">المفضلين ({patients.filter((p) => p.status === 'مفضل').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        { key: 'id' as const, label: 'المعرّف' },
                        { key: 'name' as const, label: 'الاسم' },
                        { key: 'age' as const, label: 'العمر' },
                        { key: 'gender' as const, label: 'الجنس' },
                        { key: 'phone' as const, label: 'رقم الجوال' },
                        { key: 'lastVisit' as const, label: 'آخر زيارة' },
                        { key: 'status' as const, label: 'الحالة' },
                      ].map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="cursor-pointer px-4 py-3 text-right font-semibold text-muted-foreground hover:text-foreground"
                        >
                          {col.label}
                          <SortIcon field={col.key} />
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{patient.id}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{patient.name}</td>
                        <td className="px-4 py-3 text-foreground">{patient.age}</td>
                        <td className="px-4 py-3">
                          <Badge variant={patient.gender === 'ذكر' ? 'default' : 'secondary'}>{patient.gender}</Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground" dir="ltr">{patient.phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(patient.lastVisit)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              patient.status === 'نشط' ? 'success' :
                              patient.status === 'مفضل' ? 'warning' : 'destructive'
                            }
                          >
                            {patient.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(patient)}>عرض</Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(patient)}>تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(patient.id)}>حذف</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPatients.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">لا توجد نتائج مطابقة لمعايير البحث</div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>عرض {filteredPatients.length} من {patients.length} مريض</span>
                <div className="flex items-center gap-2">
                  <span>صفحة</span>
                  <Badge variant="outline">1</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}</DialogTitle>
          </DialogHeader>
          <FormGroup>
            <FormField label="الاسم الكامل" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المريض"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="العمر" required>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                />
              </FormField>
              <FormField label="الجنس" required>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'ذكر' | 'أنثى' })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </FormField>
            </div>
            <FormField label="رقم الجوال" required>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </FormField>
            <FormField label="الفرع" required>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              >
                {branches.filter((b) => b !== 'الكل').map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </FormField>
            <FormField label="نوع التأمين">
              <select
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="التأمين الصحي">التأمين الصحي</option>
                <option value="تأمين بريمي">تأمين بريمي</option>
                <option value="تأمين أسرة">تأمين أسرة</option>
                <option value="بلا تأمين">بلا تأمين</option>
              </select>
            </FormField>
          </FormGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.age}>
              {editingPatient ? 'حفظ التعديلات' : 'إضافة المريض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-foreground">هل أنت متأكد من حذف هذا المريض؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmDelete}>نعم، حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
