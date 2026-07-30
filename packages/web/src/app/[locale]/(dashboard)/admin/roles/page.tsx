'use client';

import { useState, useMemo } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: 'active' | 'inactive';
  color: string;
}

interface Permission {
  id: string;
  name: string;
  nameAr: string;
  module: string;
  moduleAr: string;
}

const MODULES = [
  { id: 'patients', nameAr: 'المرضى', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف'] },
  { id: 'orders', nameAr: 'الطلبات', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'مراجعة'] },
  { id: 'reports', nameAr: 'التقارير', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'نشر'] },
  { id: 'billing', nameAr: 'الفواتير', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'دفع'] },
  { id: 'users', nameAr: 'المستخدمون', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'تعيين أدوار'] },
  { id: 'settings', nameAr: 'الإعدادات', permissions: ['عرض', 'تعديل'] },
  { id: 'lab', nameAr: 'المختبر', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'نتائج'] },
  { id: 'appointments', nameAr: 'المواعيد', permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'إلغاء'] },
];

const ROLES: Role[] = [
  { id: '1', name: 'SUPER_ADMIN', nameAr: 'مدير عام', description: 'صلاحيات كاملة على النظام', userCount: 2, permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'مراجعة', 'نشر', 'دفع', 'تعيين أدوار', 'نتائج', 'إلغاء'], status: 'active', color: 'red' },
  { id: '2', name: 'ADMIN', nameAr: 'مدير', description: 'إدارة المستخدمين والإعدادات', userCount: 5, permissions: ['عرض', 'إنشاء', 'تعديل', 'حذف', 'تعيين أدوار'], status: 'active', color: 'blue' },
  { id: '3', name: 'DOCTOR', nameAr: 'طبيب', description: 'إدارة المرضى والطلبات والتقارير', userCount: 45, permissions: ['عرض', 'إنشاء', 'تعديل', 'نتائج'], status: 'active', color: 'green' },
  { id: '4', name: 'NURSE', nameAr: 'ممرض', description: 'رعاية المرضى وتسجيل البيانات', userCount: 60, permissions: ['عرض', 'إنشاء', 'تعديل'], status: 'active', color: 'teal' },
  { id: '5', name: 'LAB_TECHNICIAN', nameAr: 'فني مختبر', description: 'إدارة اختبارات المختبر', userCount: 30, permissions: ['عرض', 'إنشاء', 'تعديل', 'نتائج'], status: 'active', color: 'purple' },
  { id: '6', name: 'PHLEBOTOMIST', nameAr: 'أخصائي أخذ عينات', description: 'أخذ وتسجيل العينات', userCount: 25, permissions: ['عرض', 'إنشاء'], status: 'active', color: 'orange' },
  { id: '7', name: 'RECEPTIONIST', nameAr: 'موظفة استقبال', description: 'إدارة المواعيد واستقبال المرضى', userCount: 20, permissions: ['عرض', 'إنشاء', 'تعديل', 'إلغاء'], status: 'active', color: 'pink' },
  { id: '8', name: 'BILLING_STAFF', nameAr: 'موظف فواتير', description: 'إدارة الفواتير والمدفوعات', userCount: 15, permissions: ['عرض', 'إنشاء', 'تعديل', 'دفع'], status: 'active', color: 'indigo' },
  { id: '9', name: 'PATIENT', nameAr: 'مريض', description: 'عرض التقارير والمواعيد', userCount: 43, permissions: ['عرض'], status: 'active', color: 'gray' },
];

const BADGE_COLORS: Record<string, string> = {
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(ROLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('roles');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '', permissions: [] as string[] });
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, boolean>>>({});

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.nameAr.includes(searchQuery) || role.name.includes(searchQuery) || role.description.includes(searchQuery)
    );
  }, [roles, searchQuery]);

  const stats = [
    { title: 'إجمالي الأدوار', value: roles.length, icon: '🎭', trend: '+1', trendUp: true },
    { title: 'إجمالي المستخدمين', value: 245, icon: '👥', trend: '+12', trendUp: true },
    { title: 'صلاحيات مخصصة', value: 56, icon: '🔑', trend: '+3', trendUp: true },
    { title: 'آخر تحديث', value: 'اليوم', icon: '📅', trend: '', trendUp: true },
  ];

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ name: '', nameAr: '', description: '', permissions: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, nameAr: role.nameAr, description: role.description, permissions: [...role.permissions] });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.nameAr) return;
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: formData.name, nameAr: formData.nameAr, description: formData.description, permissions: formData.permissions } : r));
    } else {
      const newRole: Role = {
        id: String(Date.now()),
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description,
        userCount: 0,
        permissions: formData.permissions,
        status: 'active',
        color: 'blue',
      };
      setRoles([...roles, newRole]);
    }
    setIsDialogOpen(false);
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm],
    }));
  };

  const toggleMatrixPermission = (roleId: string, permission: string) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || {}), [permission]: !(prev[roleId] && prev[roleId][permission]) },
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الأدوار</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة أدوار المستخدمين وصلاحياتهم</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreateDialog}>+ إنشاء دور</Button>
          <ExportButton data={filteredRoles} filename="roles" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} trendUp={stat.trendUp} />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="create">إنشاء دور</TabsTrigger>
          <TabsTrigger value="matrix">خريطة الصلاحيات</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الأدوار</CardTitle>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث في الأدوار..." />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الدور</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الوصف</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">عدد المستخدمين</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الصلاحيات</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => (
                      <tr key={role.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs', BADGE_COLORS[role.color])}>{role.nameAr}</Badge>
                            <span className="text-xs text-gray-400 font-mono">{role.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{role.description}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 dark:text-white">{role.userCount}</span>
                          <span className="text-gray-500 dark:text-gray-400 mr-1">مستخدم</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map(p => (
                              <Badge key={p} className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{p}</Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">+{role.permissions.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={cn('text-xs', role.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                            {role.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">حذف</Button>
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

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingRole ? 'تعديل الدور' : 'إنشاء دور جديد'}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSection title="بيانات الدور">
                <FormGroup>
                  <FormField label="اسم الدور بالإنجليزية" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="SUPER_ADMIN" />
                  <FormField label="اسم الدور بالعربية" value={formData.nameAr} onChange={v => setFormData({ ...formData, nameAr: v })} placeholder="مدير عام" />
                  <FormField label="الوصف" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} placeholder="وصف الدور..." />
                </FormGroup>
              </FormSection>
              <FormSection title="الصلاحيات">
                <div className="space-y-4">
                  {MODULES.map(mod => (
                    <div key={mod.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">{mod.nameAr}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {mod.permissions.map(perm => (
                          <label key={perm} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button onClick={handleSave}>{editingRole ? 'حفظ التعديلات' : 'إنشاء الدور'}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>خريطة الصلاحيات</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Matrix الصلاحيات حسب الدور</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الصلاحية</th>
                      {roles.map(role => (
                        <th key={role.id} className="text-center py-3 px-2 font-medium text-gray-600 dark:text-gray-300">
                          <Badge className={cn('text-xs', BADGE_COLORS[role.color])}>{role.nameAr}</Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod =>
                      mod.permissions.map(perm => (
                        <tr key={`${mod.id}-${perm}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-2 px-4 text-gray-700 dark:text-gray-300">
                            <span className="text-xs text-gray-400 ml-2">{mod.nameAr}</span>
                            {perm}
                          </td>
                          {roles.map(role => (
                            <td key={role.id} className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={role.permissions.includes(perm)}
                                onChange={() => toggleMatrixPermission(role.id, perm)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'تعديل الدور' : 'إنشاء دور جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="اسم الدور" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
            <FormField label="الاسم بالعربية" value={formData.nameAr} onChange={v => setFormData({ ...formData, nameAr: v })} />
            <FormField label="الوصف" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
