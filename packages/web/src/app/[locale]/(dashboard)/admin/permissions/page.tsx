'use client';

import { useState, useMemo } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface Permission {
  id: string;
  name: string;
  nameAr: string;
  module: string;
  moduleAr: string;
  description: string;
  assignedRoles: string[];
  status: 'active' | 'inactive';
}

interface PermissionGroup {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  permissionCount: number;
  roles: string[];
}

const MODULE_COLORS: Record<string, string> = {
  المرضى: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  الطلبات: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  التقارير: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  الفواتير: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  المستخدمون: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  الإعدادات: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  المختبر: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  المواعيد: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const ALL_PERMISSIONS: Permission[] = [
  { id: 'p1', name: 'patients.view', nameAr: 'عرض المرضى', module: 'patients', moduleAr: 'المرضى', description: 'عرض قائمة المرضى وبياناتهم', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'], status: 'active' },
  { id: 'p2', name: 'patients.create', nameAr: 'إنشاء مريض', module: 'patients', moduleAr: 'المرضى', description: 'إضافة مريض جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'], status: 'active' },
  { id: 'p3', name: 'patients.update', nameAr: 'تعديل المرضى', module: 'patients', moduleAr: 'المرضى', description: 'تعديل بيانات المرضى', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'], status: 'active' },
  { id: 'p4', name: 'patients.delete', nameAr: 'حذف المرضى', module: 'patients', moduleAr: 'المرضى', description: 'حذف سجلات المرضى', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p5', name: 'orders.view', nameAr: 'عرض الطلبات', module: 'orders', moduleAr: 'الطلبات', description: 'عرض قائمة الطلبات', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p6', name: 'orders.create', nameAr: 'إنشاء طلب', module: 'orders', moduleAr: 'الطلبات', description: 'إنشاء طلب جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'], status: 'active' },
  { id: 'p7', name: 'orders.update', nameAr: 'تعديل الطلبات', module: 'orders', moduleAr: 'الطلبات', description: 'تعديل الطلبات', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'], status: 'active' },
  { id: 'p8', name: 'orders.delete', nameAr: 'حذف الطلبات', module: 'orders', moduleAr: 'الطلبات', description: 'حذف الطلبات', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p9', name: 'orders.review', nameAr: 'مراجعة الطلبات', module: 'orders', moduleAr: 'الطلبات', description: 'مراجعة الطلبات المعلقة', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'], status: 'active' },
  { id: 'p10', name: 'orders.export', nameAr: 'تصدير الطلبات', module: 'orders', moduleAr: 'الطلبات', description: 'تصدير الطلبات لملف', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p11', name: 'reports.view', nameAr: 'عرض التقارير', module: 'reports', moduleAr: 'التقارير', description: 'عرض التقارير', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PATIENT'], status: 'active' },
  { id: 'p12', name: 'reports.create', nameAr: 'إنشاء تقرير', module: 'reports', moduleAr: 'التقارير', description: 'إنشاء تقرير جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p13', name: 'reports.update', nameAr: 'تعديل التقارير', module: 'reports', moduleAr: 'التقارير', description: 'تعديل التقارير', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p14', name: 'reports.delete', nameAr: 'حذف التقارير', module: 'reports', moduleAr: 'التقارير', description: 'حذف التقارير', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p15', name: 'reports.publish', nameAr: 'نشر التقارير', module: 'reports', moduleAr: 'التقارير', description: 'نشر التقارير للمريض', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'], status: 'active' },
  { id: 'p16', name: 'reports.print', nameAr: 'طباعة التقارير', module: 'reports', moduleAr: 'التقارير', description: 'طباعة التقارير', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'], status: 'active' },
  { id: 'p17', name: 'billing.view', nameAr: 'عرض الفواتير', module: 'billing', moduleAr: 'الفواتير', description: 'عرض الفواتير', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'BILLING_STAFF', 'RECEPTIONIST'], status: 'active' },
  { id: 'p18', name: 'billing.create', nameAr: 'إنشاء فاتورة', module: 'billing', moduleAr: 'الفواتير', description: 'إنشاء فاتورة جديدة', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'BILLING_STAFF'], status: 'active' },
  { id: 'p19', name: 'billing.update', nameAr: 'تعديل الفواتير', module: 'billing', moduleAr: 'الفواتير', description: 'تعديل الفواتير', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'BILLING_STAFF'], status: 'active' },
  { id: 'p20', name: 'billing.delete', nameAr: 'حذف الفواتير', module: 'billing', moduleAr: 'الفواتير', description: 'حذف الفواتير', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p21', name: 'billing.pay', nameAr: 'تسجيل الدفع', module: 'billing', moduleAr: 'الفواتير', description: 'تسجيل مدفوعات', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'BILLING_STAFF'], status: 'active' },
  { id: 'p22', name: 'users.view', nameAr: 'عرض المستخدمين', module: 'users', moduleAr: 'المستخدمون', description: 'عرض قائمة المستخدمين', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p23', name: 'users.create', nameAr: 'إنشاء مستخدم', module: 'users', moduleAr: 'المستخدمون', description: 'إضافة مستخدم جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p24', name: 'users.update', nameAr: 'تعديل المستخدمين', module: 'users', moduleAr: 'المستخدمون', description: 'تعديل بيانات المستخدمين', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p25', name: 'users.delete', nameAr: 'حذف المستخدمين', module: 'users', moduleAr: 'المستخدمون', description: 'حذف المستخدمين', assignedRoles: ['SUPER_ADMIN'], status: 'active' },
  { id: 'p26', name: 'users.assign_roles', nameAr: 'تعيين أدوار', module: 'users', moduleAr: 'المستخدمون', description: 'تعيين الأدوار للمستخدمين', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p27', name: 'settings.view', nameAr: 'عرض الإعدادات', module: 'settings', moduleAr: 'الإعدادات', description: 'عرض إعدادات النظام', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p28', name: 'settings.update', nameAr: 'تعديل الإعدادات', module: 'settings', moduleAr: 'الإعدادات', description: 'تعديل إعدادات النظام', assignedRoles: ['SUPER_ADMIN'], status: 'active' },
  { id: 'p29', name: 'lab.view', nameAr: 'عرض المختبر', module: 'lab', moduleAr: 'المختبر', description: 'عرض اختبارات المختبر', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p30', name: 'lab.create', nameAr: 'إنشاء اختبار', module: 'lab', moduleAr: 'المختبر', description: 'إنشاء اختبار جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p31', name: 'lab.update', nameAr: 'تعديل المختبر', module: 'lab', moduleAr: 'المختبر', description: 'تعديل اختبارات المختبر', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p32', name: 'lab.delete', nameAr: 'حذف اختبارات', module: 'lab', moduleAr: 'المختبر', description: 'حذف اختبارات المختبر', assignedRoles: ['SUPER_ADMIN', 'ADMIN'], status: 'active' },
  { id: 'p33', name: 'lab.results', nameAr: 'نتائج المختبر', module: 'lab', moduleAr: 'المختبر', description: 'إدخال نتائج المختبر', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'], status: 'active' },
  { id: 'p34', name: 'appointments.view', nameAr: 'عرض المواعيد', module: 'appointments', moduleAr: 'المواعيد', description: 'عرض المواعيد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'], status: 'active' },
  { id: 'p35', name: 'appointments.create', nameAr: 'إنشاء موعد', module: 'appointments', moduleAr: 'المواعيد', description: 'حجز موعد جديد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'], status: 'active' },
  { id: 'p36', name: 'appointments.update', nameAr: 'تعديل المواعيد', module: 'appointments', moduleAr: 'المواعيد', description: 'تعديل المواعيد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR'], status: 'active' },
  { id: 'p37', name: 'appointments.delete', nameAr: 'حذف المواعيد', module: 'appointments', moduleAr: 'المواعيد', description: 'حذف المواعيد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'], status: 'active' },
  { id: 'p38', name: 'appointments.cancel', nameAr: 'إلغاء المواعيد', module: 'appointments', moduleAr: 'المواعيد', description: 'إلغاء المواعيد', assignedRoles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'PATIENT'], status: 'active' },
];

const GROUPS: PermissionGroup[] = [
  { id: 'g1', name: 'Full Access', nameAr: 'وصول كامل', description: 'جميع الصلاحيات', permissionCount: 38, roles: ['SUPER_ADMIN'] },
  { id: 'g2', name: 'Management', nameAr: 'إدارة', description: 'صلاحيات الإدارة', permissionCount: 28, roles: ['ADMIN'] },
  { id: 'g3', name: 'Clinical', nameAr: 'طبي', description: 'صلاحيات طبية', permissionCount: 20, roles: ['DOCTOR'] },
  { id: 'g4', name: 'Nursing', nameAr: 'تمريض', description: 'صلاحيات التمريض', permissionCount: 15, roles: ['NURSE'] },
  { id: 'g5', name: 'Laboratory', nameAr: 'مختبر', description: 'صلاحيات المختبر', permissionCount: 12, roles: ['LAB_TECHNICIAN', 'PHLEBOTOMIST'] },
  { id: 'g6', name: 'Front Desk', nameAr: 'استقبال', description: 'صلاحيات الاستقبال', permissionCount: 10, roles: ['RECEPTIONIST'] },
  { id: 'g7', name: 'Billing', nameAr: 'فواتير', description: 'صلاحيات الفواتير', permissionCount: 8, roles: ['BILLING_STAFF'] },
  { id: 'g8', name: 'Patient Portal', nameAr: 'بوابة المريض', description: 'صلاحيات المريض', permissionCount: 5, roles: ['PATIENT'] },
];

export default function PermissionsPage() {
  const [permissions] = useState<Permission[]>(ALL_PERMISSIONS);
  const [groups] = useState<PermissionGroup[]>(GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['المرضى', 'الطلبات', 'التقارير']));

  const modules = useMemo(() => {
    const map = new Map<string, Permission[]>();
    permissions.forEach(p => {
      if (!map.has(p.moduleAr)) map.set(p.moduleAr, []);
      map.get(p.moduleAr)!.push(p);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    return modules.filter(([modName, perms]) =>
      modName.includes(searchQuery) || perms.some(p => p.nameAr.includes(searchQuery))
    );
  }, [modules, searchQuery]);

  const toggleModule = (mod: string) => {
    const next = new Set(expandedModules);
    next.has(mod) ? next.delete(mod) : next.add(mod);
    setExpandedModules(next);
  };

  const openAssignDialog = (perm: Permission) => {
    setSelectedPermission(perm);
    setSelectedRoles([...perm.assignedRoles]);
    setIsAssignDialogOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const stats = [
    { title: 'إجمالي الصلاحيات', value: permissions.length, icon: '🔑', trend: '+5', trendUp: true },
    { title: 'صلاحيات نشطة', value: permissions.filter(p => p.status === 'active').length, icon: '✅', trend: '+2', trendUp: true },
    { title: 'صلاحيات مخصصة', value: permissions.reduce((acc, p) => acc + p.assignedRoles.length, 0), icon: '📋', trend: '+8', trendUp: true },
    { title: 'مجموعات الصلاحيات', value: groups.length, icon: '📦', trend: '+1', trendUp: true },
  ];

  const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHLEBOTOMIST', 'RECEPTIONIST', 'BILLING_STAFF', 'PATIENT'];
  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'مدير عام', ADMIN: 'مدير', DOCTOR: 'طبيب', NURSE: 'ممرض', LAB_TECHNICIAN: 'فني مختبر',
    PHLEBOTOMIST: 'أخصائي عينات', RECEPTIONIST: 'موظفة استقبال', BILLING_STAFF: 'موظف فواتير', PATIENT: 'مريض',
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الصلاحيات</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة صلاحيات النظام ومجموعاتها</p>
        </div>
        <ExportButton data={permissions} filename="permissions" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} trendUp={stat.trendUp} />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          <TabsTrigger value="groups">مجموعات الصلاحيات</TabsTrigger>
          <TabsTrigger value="assignment">التخصيص</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات حسب الوحدة</CardTitle>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث في الصلاحيات..." />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredModules.map(([modName, perms]) => (
                  <div key={modName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleModule(modName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={cn('text-xs', MODULE_COLORS[modName] || 'bg-gray-100 text-gray-600')}>{modName}</Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{perms.length} صلاحية</span>
                      </div>
                      <span className={cn('text-gray-400 transition-transform', expandedModules.has(modName) && 'rotate-180')}>▼</span>
                    </button>
                    {expandedModules.has(modName) && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">الصلاحية</th>
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">المعرف</th>
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">الوصف</th>
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">الأدوار</th>
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                              <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-300">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perms.map(perm => (
                              <tr key={perm.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-2 px-4 font-medium text-gray-900 dark:text-white">{perm.nameAr}</td>
                                <td className="py-2 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{perm.name}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{perm.description}</td>
                                <td className="py-2 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {perm.assignedRoles.slice(0, 2).map(r => (
                                      <Badge key={r} className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{ROLE_LABELS[r]}</Badge>
                                    ))}
                                    {perm.assignedRoles.length > 2 && (
                                      <Badge className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">+{perm.assignedRoles.length - 2}</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-4">
                                  <Badge className={cn('text-xs', perm.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                                    {perm.status === 'active' ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-4">
                                  <Button variant="ghost" size="sm" onClick={() => openAssignDialog(perm)}>تخصيص</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>مجموعات الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(group => (
                  <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">{group.nameAr}</h3>
                      <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{group.permissionCount}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{group.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.roles.map(r => (
                        <Badge key={r} className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{ROLE_LABELS[r]}</Badge>
                      ))}
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={group.permissionCount} max={38} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment">
          <Card>
            <CardHeader>
              <CardTitle>تخصيص الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الصلاحية</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الوحدة</th>
                      {ALL_ROLES.map(r => (
                        <th key={r} className="text-center py-3 px-2 font-medium text-gray-600 dark:text-gray-300 text-xs">
                          {ROLE_LABELS[r]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(perm => (
                      <tr key={perm.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">{perm.nameAr}</td>
                        <td className="py-2 px-4">
                          <Badge className={cn('text-xs', MODULE_COLORS[perm.moduleAr])}>{perm.moduleAr}</Badge>
                        </td>
                        {ALL_ROLES.map(r => (
                          <td key={r} className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={perm.assignedRoles.includes(r)}
                              readOnly
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تخصيص الصلاحية: {selectedPermission?.nameAr}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPermission?.description}</p>
          <div className="space-y-2">
            {ALL_ROLES.map(role => (
              <label key={role} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">{ROLE_LABELS[role]}</span>
                <Switch checked={selectedRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => setIsAssignDialogOpen(false)}>حفظ التخصيص</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
