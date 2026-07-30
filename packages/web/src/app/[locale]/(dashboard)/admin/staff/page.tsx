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

interface StaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
  branch: string;
  employeeNumber: string;
  joinDate: string;
  status: 'نشط' | 'في إجازة' | 'مهمّش';
  phone: string;
  email: string;
  hoursThisWeek: number;
  attendanceRate: number;
  shift: 'صباحي' | 'مسائي' | 'ليلي';
}

const initialStaff: StaffMember[] = [
  { id: 'S-001', name: 'أحمد خالد الراشد', department: 'الاستقبال', role: 'موظّف استقبال', branch: 'الفرع الرئيسي', employeeNumber: 'EMP-1001', joinDate: '2021-04-10', status: 'نشط', phone: '0501234567', email: 'ahmed.r@clinic.com', hoursThisWeek: 40, attendanceRate: 98, shift: 'صباحي' },
  { id: 'S-002', name: 'سارة محمد القحطاني', department: 'المختبر', role: 'فني مختبر', branch: 'الفرع الرئيسي', employeeNumber: 'EMP-1002', joinDate: '2020-08-15', status: 'نشط', phone: '0559876543', email: 'sara.q@clinic.com', hoursThisWeek: 38, attendanceRate: 95, shift: 'صباحي' },
  { id: 'S-003', name: 'عبدالرحمن ناصر الشمري', department: 'الصيدلية', role: 'صيدلي', branch: 'فرع الشمال', employeeNumber: 'EMP-1003', joinDate: '2019-01-20', status: 'في إجازة', phone: '0561122334', email: 'abdulrahman.s@clinic.com', hoursThisWeek: 0, attendanceRate: 92, shift: 'مسائي' },
  { id: 'S-004', name: 'منال فهد العتيبي', department: 'ال/admin', role: 'مديرة مكتب', branch: 'الفرع الرئيسي', employeeNumber: 'EMP-1004', joinDate: '2018-06-01', status: 'نشط', phone: '0545566778', email: 'manal.o@clinic.com', hoursThisWeek: 42, attendanceRate: 99, shift: 'صباحي' },
  { id: 'S-005', name: 'يوسف عبدالعزيز الدوسري', department: 'الأشعة', role: 'فني أشعة', branch: 'فرع الجنوب', employeeNumber: 'EMP-1005', joinDate: '2022-03-15', status: 'نشط', phone: '0538899001', email: 'yousef.d@clinic.com', hoursThisWeek: 36, attendanceRate: 88, shift: 'مسائي' },
  { id: 'S-006', name: 'هند سعيد المطيري', department: 'الاستقبال', role: 'موظّفة استقبال', branch: 'فرع الشمال', employeeNumber: 'EMP-1006', joinDate: '2023-01-05', status: 'نشط', phone: '0527788990', email: 'hind.m@clinic.com', hoursThisWeek: 32, attendanceRate: 94, shift: 'صباحي' },
  { id: 'S-007', name: 'عمر خالد الغامدي', department: 'الصيانة', role: 'فني صيانة', branch: 'الفرع الرئيسي', employeeNumber: 'EMP-1007', joinDate: '2021-11-20', status: 'مهمّش', phone: '0516677889', email: 'omar.g@clinic.com', hoursThisWeek: 0, attendanceRate: 75, shift: 'ليلي' },
  { id: 'S-008', name: 'نورة أحمد الحربي', department: 'ال驾', role: 'ممرضة', branch: 'الفرع الرئيسي', employeeNumber: 'EMP-1008', joinDate: '2020-05-10', status: 'نشط', phone: '0504455667', email: 'noura.h@clinic.com', hoursThisWeek: 44, attendanceRate: 97, shift: 'صباحي' },
];

const departments = ['الكل', 'الاستقبال', 'المختبر', 'الصيدلية', 'ال/admin', 'الأشعة', 'الصيانة', 'ال驾'];
const roles = ['الكل', 'موظّف استقبال', 'فني مختبر', 'صيدلي', 'مديرة مكتب', 'فني أشعة', 'فني صيانة', 'ممرضة'];
const staffBranches = ['الكل', 'الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'];
const statusOptions = ['الكل', 'نشط', 'في إجازة', 'مهمّش'];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [roleFilter, setRoleFilter] = useState('الكل');
  const [branchFilter, setBranchFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isScheduleView, setIsScheduleView] = useState(false);
  const [formData, setFormData] = useState({
    name: '', department: 'الاستقبال', role: 'موظّف استقبال', branch: 'الفرع الرئيسي',
    employeeNumber: '', phone: '', email: '', shift: 'صباحي' as 'صباحي' | 'مسائي' | 'ليلي',
  });

  const stats = [
    { title: 'إجمالي الموظفين', value: '245', change: '+8', trend: 'up' as const },
    { title: 'موظفون نشطون', value: '212', change: '+5', trend: 'up' as const },
    { title: 'طلب إجازة', value: '8', change: '+2', trend: 'up' as const },
    { title: 'ساعات العمل اليوم', value: '1,696', change: '-3%', trend: 'down' as const },
  ];

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch = s.name.includes(searchQuery) || s.employeeNumber.includes(searchQuery) || s.phone.includes(searchQuery) || s.email.includes(searchQuery);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'doctors' && s.department === '驾') ||
        (activeTab === 'technicians' && ['المختبر', 'الأشعة', 'الصيانة'].includes(s.department)) ||
        (activeTab === 'reception' && s.department === 'الاستقبال') ||
        (activeTab === 'admin' && s.department === 'ال/admin');
      const matchesDept = deptFilter === 'الكل' || s.department === deptFilter;
      const matchesRole = roleFilter === 'الكل' || s.role === roleFilter;
      const matchesBranch = branchFilter === 'الكل' || s.branch === branchFilter;
      const matchesStatus = statusFilter === 'الكل' || s.status === statusFilter;
      return matchesSearch && matchesTab && matchesDept && matchesRole && matchesBranch && matchesStatus;
    });
  }, [staff, searchQuery, activeTab, deptFilter, roleFilter, branchFilter, statusFilter]);

  const handleSave = () => {
    if (editingStaff) {
      setStaff(staff.map((s) => s.id === editingStaff.id ? { ...s, ...formData } : s));
    } else {
      const newStaff: StaffMember = {
        id: `S-${String(staff.length + 1).padStart(3, '0')}`,
        ...formData, joinDate: new Date().toISOString().split('T')[0], status: 'نشط',
        hoursThisWeek: 0, attendanceRate: 100,
      };
      setStaff([...staff, newStaff]);
    }
    setIsDialogOpen(false);
  };

  const handleExport = () => {
    const csv = [
      ['المعرّف', 'الاسم', 'القسم', 'المنصب', 'الفرع', 'رقم الموظف', 'تاريخ الالتحاق', 'الحالة'].join(','),
      ...filteredStaff.map((s) => [s.id, s.name, s.department, s.role, s.branch, s.employeeNumber, s.joinDate, s.status].join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'staff.csv';
    link.click();
  };

  const openAddDialog = () => {
    setEditingStaff(null);
    setFormData({ name: '', department: 'الاستقبال', role: 'موظّف استقبال', branch: 'الفرع الرئيسي', employeeNumber: '', phone: '', email: '', shift: 'صباحي' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (s: StaffMember) => {
    setEditingStaff(s);
    setFormData({ name: s.name, department: s.department, role: s.role, branch: s.branch, employeeNumber: s.employeeNumber, phone: s.phone, email: s.email, shift: s.shift });
    setIsDialogOpen(true);
  };

  const scheduleDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];
  const shifts = ['صباحي', 'مسائي', 'ليلي'];

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة طاقم العمل</h1>
          <p className="mt-1 text-muted-foreground">إدارة بيانات الموظفين والجداول والحضور</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsScheduleView(!isScheduleView)}>
            {isScheduleView ? '📋 عرض القائمة' : '📅 جدول العمل'}
          </Button>
          <Button variant="outline" onClick={handleExport}>📊 تصدير البيانات</Button>
          <Button onClick={openAddDialog}>+ إضافة موظف</Button>
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
            <CardTitle>قائمة الموظفين</CardTitle>
            <div className="flex flex-wrap gap-3">
              <SearchInput placeholder="بحث بالاسم، رقم الموظف، الجوال..." value={searchQuery} onChange={setSearchQuery} className="w-72" />
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {departments.map((d) => <option key={d} value={d}>القسم: {d}</option>)}
              </select>
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {staffBranches.map((b) => <option key={b} value={b}>الفرع: {b}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {statusOptions.map((s) => <option key={s} value={s}>الحالة: {s}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">الكل ({staff.length})</TabsTrigger>
              <TabsTrigger value="reception">الاستقبال ({staff.filter((s) => s.department === 'الاستقبال').length})</TabsTrigger>
              <TabsTrigger value="technicians">الفنيين ({staff.filter((s) => ['المختبر', 'الأشعة', 'الصيانة'].includes(s.department)).length})</TabsTrigger>
              <TabsTrigger value="admin">الإداريين ({staff.filter((s) => s.department === 'ال/admin').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isScheduleView ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الموظف</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">القسم</th>
                        {scheduleDays.map((day) => (
                          <th key={day} className="px-4 py-3 text-center font-semibold text-muted-foreground">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((member) => (
                        <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{member.department}</td>
                          {scheduleDays.map((day) => (
                            <td key={day} className="px-4 py-3 text-center">
                              <Badge
                                variant={
                                  day === 'السبت' ? 'destructive' :
                                  member.shift === 'صباحي' ? 'success' :
                                  member.shift === 'مسائي' ? 'warning' : 'default'
                                }
                                className="text-xs"
                              >
                                {day === 'السبت' ? 'عطلة' : member.shift}
                              </Badge>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الاسم</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">القسم</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">المنصب</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الفرع</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">رقم الموظف</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">تاريخ الالتحاق</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الحالة</th>
                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((member) => (
                        <tr key={member.id} className="border-b border-border transition-colors hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
                          <td className="px-4 py-3 text-foreground">{member.department}</td>
                          <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
                          <td className="px-4 py-3 text-foreground">{member.branch}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{member.employeeNumber}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(member.joinDate)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={member.status === 'نشط' ? 'success' : member.status === 'في إجازة' ? 'warning' : 'destructive'}>
                              {member.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>عرض</Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>تعديل</Button>
                              <Button variant="ghost" size="sm" className="text-destructive">حذف</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStaff.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">لا توجد نتائج مطابقة</div>
                  )}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle className="text-sm">الحضور اليومي</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredStaff.slice(0, 5).map((m) => (
                        <div key={m.id}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-foreground">{m.name}</span>
                            <span className="text-muted-foreground">{m.attendanceRate}%</span>
                          </div>
                          <ProgressBar value={m.attendanceRate} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">ساعات العمل هذا الأسبوع</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredStaff.slice(0, 5).map((m) => (
                        <div key={m.id}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-foreground">{m.name}</span>
                            <span className="text-muted-foreground">{m.hoursThisWeek} ساعة</span>
                          </div>
                          <ProgressBar value={(m.hoursThisWeek / 48) * 100} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">توزيع المناوبات</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {shifts.map((shift) => {
                        const count = filteredStaff.filter((m) => m.shift === shift).length;
                        return (
                          <div key={shift} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={shift === 'صباحي' ? 'success' : shift === 'مسائي' ? 'warning' : 'default'}>{shift}</Badge>
                              <span className="text-sm text-foreground">{count} موظف</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round((count / filteredStaff.length) * 100)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
          </DialogHeader>
          <FormGroup>
            <FormField label="الاسم الكامل" required>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="القسم" required>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {departments.filter((d) => d !== 'الكل').map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="المنصب" required>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {roles.filter((r) => r !== 'الكل').map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="الفرع" required>
                <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {staffBranches.filter((b) => b !== 'الكل').map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </FormField>
              <FormField label="رقم الموظف">
                <input type="text" value={formData.employeeNumber} onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </FormField>
            </div>
            <FormField label="الجوال">
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
            </FormField>
            <FormField label="المناوبة">
              <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value as 'صباحي' | 'مسائي' | 'ليلي' })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                <option value="صباحي">صباحي</option>
                <option value="مسائي">مسائي</option>
                <option value="ليلي">ليلي</option>
              </select>
            </FormField>
          </FormGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingStaff ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
