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

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  branch: string;
  licenseNumber: string;
  patientsCount: number;
  rating: number;
  status: 'نشط' | 'في إجازة' | 'مقيم';
  email: string;
  phone: string;
  joinDate: string;
  schedule: string;
  consultationsToday: number;
  totalConsultations: number;
}

const initialDoctors: Doctor[] = [
  { id: 'D-001', name: 'د. سعيد بن عبدالرحمن البقمي', specialty: 'طب القلب', department: 'القلب والأوعية الدموية', branch: 'الفرع الرئيسي', licenseNumber: 'MD-10234', patientsCount: 342, rating: 4.9, status: 'نشط', email: 'saeed@clinic.com', phone: '0501111222', joinDate: '2019-03-15', schedule: 'الأحد - الخميس', consultationsToday: 8, totalConsultations: 12450 },
  { id: 'D-002', name: 'د. نورة بنت فهد السالم', specialty: 'طب الأطفال', department: 'طب الأطفال', branch: 'فرع الشمال', licenseNumber: 'MD-10567', patientsCount: 528, rating: 4.8, status: 'نشط', email: 'noura@clinic.com', phone: '0553333444', joinDate: '2020-07-01', schedule: 'الأحد - الخميس', consultationsToday: 12, totalConsultations: 18900 },
  { id: 'D-003', name: 'د. خالد محمد العمري', specialty: 'جراحة العظام', department: 'الجراحة', branch: 'الفرع الرئيسي', licenseNumber: 'MD-10890', patientsCount: 189, rating: 4.7, status: 'في إجازة', email: 'khalid@clinic.com', phone: '0565555666', joinDate: '2018-01-20', schedule: 'السبت - الأربعاء', consultationsToday: 0, totalConsultations: 8700 },
  { id: 'D-004', name: 'د. مريم بنت أحمد الحربي', specialty: 'طب العيون', department: 'طب العيون', branch: 'فرع الجنوب', licenseNumber: 'MD-11012', patientsCount: 275, rating: 4.9, status: 'نشط', email: 'mariam@clinic.com', phone: '0547777888', joinDate: '2021-05-10', schedule: 'الأحد - الخميس', consultationsToday: 6, totalConsultations: 9200 },
  { id: 'D-005', name: 'د. عبدالله صالح المطيري', specialty: 'طب الباطنية', department: 'الباطنية', branch: 'الفرع الرئيسي', licenseNumber: 'MD-11234', patientsCount: 412, rating: 4.6, status: 'مقيم', email: 'abdullah@clinic.com', phone: '0539999000', joinDate: '2022-09-01', schedule: 'الاثنين - الجمعة', consultationsToday: 15, totalConsultations: 5600 },
  { id: 'D-006', name: 'د. ريم عبدالعزيز الدوسري', specialty: 'الأمراض الجلدية', department: 'الأمراض الجلدية', branch: 'فرع الشمال', licenseNumber: 'MD-11456', patientsCount: 310, rating: 4.8, status: 'نشط', email: 'reem@clinic.com', phone: '0521111222', joinDate: '2020-11-15', schedule: 'الأحد - الخميس', consultationsToday: 10, totalConsultations: 14200 },
  { id: 'D-007', name: 'د. ياسر سعيد القحطاني', specialty: 'طب الأعصاب', department: 'طب الأعصاب', branch: 'الفرع الرئيسي', licenseNumber: 'MD-11678', patientsCount: 156, rating: 4.5, status: 'نشط', email: 'yasser@clinic.com', phone: '0513333444', joinDate: '2023-02-28', schedule: 'السبت - الأربعاء', consultationsToday: 4, totalConsultations: 3200 },
  { id: 'D-008', name: 'د. هند فهد الشمري', specialty: 'طب الأسنان', department: 'طب الأسنان', branch: 'فرع الجنوب', licenseNumber: 'MD-11890', patientsCount: 445, rating: 4.9, status: 'في إجازة', email: 'hind@clinic.com', phone: '0505555666', joinDate: '2019-08-20', schedule: 'الأحد - الخميس', consultationsToday: 0, totalConsultations: 16800 },
];

const departments = ['الكل', 'القلب والأوعية الدموية', 'طب الأطفال', 'الجراحة', 'طب العيون', 'الباطنية', 'الأمراض الجلدية', 'طب الأعصاب', 'طب الأسنان'];
const doctorBranches = ['الكل', 'الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'];
const specialties = ['طب القلب', 'طب الأطفال', 'جراحة العظام', 'طب العيون', 'طب الباطنية', 'الأمراض الجلدية', 'طب الأعصاب', 'طب الأسنان'];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [branchFilter, setBranchFilter] = useState('الكل');
  const [specialtyFilter, setSpecialtyFilter] = useState('الكل');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', specialty: 'طب القلب', department: 'القلب والأوعية الدموية', branch: 'الفرع الرئيسي',
    licenseNumber: '', email: '', phone: '', schedule: 'الأحد - الخميس',
  });

  const stats = [
    { title: 'إجمالي الأطباء', value: '86', change: '+2', trend: 'up' as const },
    { title: 'أطباء نشطين', value: '72', change: '+5', trend: 'up' as const },
    { title: 'أطباء متصلين', value: '12', change: '-3', trend: 'down' as const },
    { title: 'متوسط التقييم', value: '4.8', change: '+0.1', trend: 'up' as const },
  ];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch = d.name.includes(searchQuery) || d.licenseNumber.includes(searchQuery) || d.specialty.includes(searchQuery);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && d.status === 'نشط') ||
        (activeTab === 'vacation' && d.status === 'في إجازة') ||
        (activeTab === 'resident' && d.status === 'مقيم');
      const matchesDept = deptFilter === 'الكل' || d.department === deptFilter;
      const matchesBranch = branchFilter === 'الكل' || d.branch === branchFilter;
      const matchesSpec = specialtyFilter === 'الكل' || d.specialty === specialtyFilter;
      return matchesSearch && matchesTab && matchesDept && matchesBranch && matchesSpec;
    });
  }, [doctors, searchQuery, activeTab, deptFilter, branchFilter, specialtyFilter]);

  const handleSave = () => {
    if (editingDoctor) {
      setDoctors(doctors.map((d) =>
        d.id === editingDoctor.id
          ? { ...d, ...formData }
          : d
      ));
    } else {
      const newDoctor: Doctor = {
        id: `D-${String(doctors.length + 1).padStart(3, '0')}`,
        ...formData, patientsCount: 0, rating: 0, status: 'نشط',
        joinDate: new Date().toISOString().split('T')[0],
        consultationsToday: 0, totalConsultations: 0,
      };
      setDoctors([...doctors, newDoctor]);
    }
    setIsDialogOpen(false);
  };

  const handleExport = () => {
    const csv = [
      ['المعرّف', 'الاسم', 'التخصص', 'القسم', 'الفرع', 'رقم الترخيص', 'المرضى', 'التقييم', 'الحالة'].join(','),
      ...filteredDoctors.map((d) => [d.id, d.name, d.specialty, d.department, d.branch, d.licenseNumber, d.patientsCount, d.rating, d.status].join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'doctors.csv';
    link.click();
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name, specialty: doctor.specialty, department: doctor.department,
      branch: doctor.branch, licenseNumber: doctor.licenseNumber, email: doctor.email,
      phone: doctor.phone, schedule: doctor.schedule,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingDoctor(null);
    setFormData({ name: '', specialty: 'طب القلب', department: 'القلب والأوعية الدموية', branch: 'الفرع الرئيسي', licenseNumber: '', email: '', phone: '', schedule: 'الأحد - الخميس' });
    setIsDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn('text-sm', i < Math.floor(rating) ? 'text-yellow-500' : 'text-muted-foreground')}>
            ★
          </span>
        ))}
        <span className="mr-1 text-xs text-muted-foreground">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأطباء</h1>
          <p className="mt-1 text-muted-foreground">إدارة بيانات الأطباء و他们的 schedules</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>📊 تصدير البيانات</Button>
          <Button onClick={openAddDialog}>+ إضافة طبيب جديد</Button>
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
            <CardTitle>قائمة الأطباء</CardTitle>
            <div className="flex flex-wrap gap-3">
              <SearchInput placeholder="بحث بالاسم، رقم الترخيص، التخصص..." value={searchQuery} onChange={setSearchQuery} className="w-72" />
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {departments.map((d) => <option key={d} value={d}>القسم: {d}</option>)}
              </select>
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {doctorBranches.map((b) => <option key={b} value={b}>الفرع: {b}</option>)}
              </select>
              <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {specialties.map((s) => <option key={s} value={s}>التخصص: {s}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">الكل ({doctors.length})</TabsTrigger>
              <TabsTrigger value="active">النشطين ({doctors.filter((d) => d.status === 'نشط').length})</TabsTrigger>
              <TabsTrigger value="vacation">في الإجازة ({doctors.filter((d) => d.status === 'في إجازة').length})</TabsTrigger>
              <TabsTrigger value="resident">مقيمين ({doctors.filter((d) => d.status === 'مقيم').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الاسم</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">التخصص</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">القسم</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الفرع</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">رقم الترخيص</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">المرضى</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">التقييم</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map((doctor) => (
                      <>
                        <tr key={doctor.id} className="border-b border-border transition-colors hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-foreground">{doctor.name}</td>
                          <td className="px-4 py-3 text-foreground">{doctor.specialty}</td>
                          <td className="px-4 py-3 text-muted-foreground">{doctor.department}</td>
                          <td className="px-4 py-3 text-foreground">{doctor.branch}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{doctor.licenseNumber}</td>
                          <td className="px-4 py-3 text-foreground">{doctor.patientsCount}</td>
                          <td className="px-4 py-3">{renderStars(doctor.rating)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={doctor.status === 'نشط' ? 'success' : doctor.status === 'في إجازة' ? 'warning' : 'default'}>
                              {doctor.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setExpandedRow(expandedRow === doctor.id ? null : doctor.id)}>
                                {expandedRow === doctor.id ? 'إخفاء' : 'عرض'}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(doctor)}>تعديل</Button>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === doctor.id && (
                          <tr key={`${doctor.id}-expanded`} className="border-b border-border bg-muted/30">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <Card>
                                  <CardHeader><CardTitle className="text-sm">المعلومات الشخصية</CardTitle></CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">البريد:</span><span>{doctor.email}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">الجوال:</span><span dir="ltr">{doctor.phone}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الالتحاق:</span><span>{formatDate(doctor.joinDate)}</span></div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader><CardTitle className="text-sm">الجدول والملفات</CardTitle></CardHeader>
                                  <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">أيام العمل:</span><span>{doctor.schedule}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">استشارات اليوم:</span><span>{doctor.consultationsToday}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الاستشارات:</span><span>{doctor.totalConsultations.toLocaleString()}</span></div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader><CardTitle className="text-sm">إحصائيات الأداء</CardTitle></CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div>
                                      <div className="mb-1 flex justify-between"><span className="text-muted-foreground">المرضى</span><span>{doctor.patientsCount}/600</span></div>
                                      <ProgressBar value={(doctor.patientsCount / 600) * 100} />
                                    </div>
                                    <div>
                                      <div className="mb-1 flex justify-between"><span className="text-muted-foreground">الرضا</span><span>{doctor.rating * 20}%</span></div>
                                      <ProgressBar value={doctor.rating * 20} />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {filteredDoctors.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">لا توجد نتائج مطابقة</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}</DialogTitle>
          </DialogHeader>
          <FormGroup>
            <FormField label="الاسم الكامل" required>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="د. ..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="التخصص" required>
                <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="القسم" required>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {departments.filter((d) => d !== 'الكل').map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="الفرع" required>
                <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {doctorBranches.filter((b) => b !== 'الكل').map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </FormField>
              <FormField label="رقم الترخيص" required>
                <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="MD-XXXXX" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </FormField>
            </div>
            <FormField label="البريد الإلكتروني">
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="رقم الجوال">
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </FormField>
              <FormField label="أيام العمل">
                <input type="text" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </FormField>
            </div>
          </FormGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.licenseNumber}>
              {editingDoctor ? 'حفظ التعديلات' : 'إضافة الطبيب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
