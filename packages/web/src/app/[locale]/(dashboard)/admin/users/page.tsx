'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge, Avatar } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Table, TableHeader, TableBody, TableRow, Th, Td, type Column } from '@/design-system/layout/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog } from '@/design-system/feedback/Alert';
import { ProgressBar, CircularProgress } from '@/design-system/feedback/Progress';
import { formatDate, getInitials } from '@/lib/utils';

const mockUsers = [
  { id: 'U001', name: 'Admin User', nameAr: 'المدير العام', email: 'admin@almokhtabar.com', role: 'admin', status: 'active', lastLogin: '2026-07-28T09:00:00', avatar: null, branch: 'Main - Riyadh', phone: '+966501234567' },
  { id: 'U002', name: 'Dr. Sarah Al-Ahmad', nameAr: 'د. سارة الأحمد', email: 'sarah@almokhtabar.com', role: 'doctor', status: 'active', lastLogin: '2026-07-28T08:30:00', avatar: null, branch: 'Main - Riyadh', phone: '+966502345678' },
  { id: 'U003', name: 'Lab Technician 1', nameAr: 'فني مختبر 1', email: 'tech1@almokhtabar.com', role: 'technician', status: 'active', lastLogin: '2026-07-27T16:00:00', avatar: null, branch: 'Main - Riyadh', phone: '+966503456789' },
  { id: 'U004', name: 'Ahmed Patient', nameAr: 'أحمد المريض', email: 'ahmed@example.com', role: 'patient', status: 'active', lastLogin: '2026-07-26T12:00:00', avatar: null, branch: 'Main - Riyadh', phone: '+966504567890' },
  { id: 'U005', name: 'Dr. Mohammed Al-Rashid', nameAr: 'د. محمد الراشد', email: 'mohammed@almokhtabar.com', role: 'doctor', status: 'active', lastLogin: '2026-07-27T10:00:00', avatar: null, branch: 'Jeddah', phone: '+966505678901' },
  { id: 'U006', name: 'Phlebotomist 1', nameAr: 'أخصائي سحب دم 1', email: 'phlebo1@almokhtabar.com', role: 'phlebotomist', status: 'inactive', lastLogin: '2026-07-20T14:00:00', avatar: null, branch: 'Dammam', phone: '+966506789012' },
];

const roleLabels: Record<string, string> = {
  admin: 'مدير',
  doctor: 'طبيب',
  technician: 'فني مختبر',
  phlebotomist: 'أخصائي سحب دم',
  patient: 'مريض',
  manager: 'مدير فرع',
  radiologist: 'أخصائي أشعة',
  nurse: 'ممرض',
};

const roleBadgeColors: Record<string, string> = {
  admin: 'danger',
  doctor: 'primary',
  technician: 'info',
  phlebotomist: 'secondary',
  patient: 'default',
  manager: 'warning',
};

export default function AdminUsersPage() {
  const [showAddUser, setShowAddUser] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [filter, setFilter] = React.useState('all');

  const filteredUsers = filter === 'all' ? mockUsers : mockUsers.filter(u => u.role === filter);
  const activeCount = mockUsers.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-surface-500">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddUser(true)} icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /></svg>}>
          إضافة مستخدم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المستخدمين" value={mockUsers.length} icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="نشط" value={activeCount} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} iconBg="bg-success-50" />
        <StatCard title="الأطباء" value={mockUsers.filter(u => u.role === 'doctor').length} icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>} iconBg="bg-info-50" />
        <StatCard title="الفنيين" value={mockUsers.filter(u => u.role === 'technician' || u.role === 'phlebotomist').length} icon={<svg className="h-5 w-5 text-saffron-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} iconBg="bg-saffron-50" />
      </div>

      {/* Users Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-surface-900">المستخدمون</h3>
            <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg">
              {['all', 'admin', 'doctor', 'technician', 'phlebotomist', 'patient'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    filter === f ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {f === 'all' ? 'الكل' : roleLabels[f] || f}
                </button>
              ))}
            </div>
          </div>
          <SearchInput placeholder="بحث..." className="w-64" onSearch={() => {}} />
        </div>
        <Table hoverable>
          <TableHeader>
            <TableRow>
              <Th>المستخدم</Th>
              <Th>البريد الإلكتروني</Th>
              <Th>الدور</Th>
              <Th>الفرع</Th>
              <Th>آخر دخول</Th>
              <Th>الحالة</Th>
              <Th>إجراءات</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hoverable>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} alt={user.name} fallback={getInitials(user.name)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{user.nameAr}</p>
                      <p className="text-xs text-surface-500">{user.name}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-sm">{user.email}</Td>
                <Td>
                  <Badge variant={(roleBadgeColors[user.role] as any) || 'default'}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </Td>
                <Td className="text-sm">{user.branch}</Td>
                <Td className="text-sm text-surface-500">{formatDate(user.lastLogin, 'medium')}</Td>
                <Td>
                  <Badge variant={user.status === 'active' ? 'success' : 'default'} dot>
                    {user.status === 'active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">تعديل</Button>
                    <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => setShowConfirm(true)}>
                      {user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                    </Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} size="lg">
        <DialogHeader onClose={() => setShowAddUser(false)}>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-5">
            <FormSection title="المعلومات الأساسية">
              <FormGroup columns={2}>
                <FormField label="الاسم بالإنجليزية" required>
                  <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </FormField>
                <FormField label="الاسم بالعربية" required>
                  <input className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </FormField>
              </FormGroup>
              <FormGroup columns={2}>
                <FormField label="البريد الإلكتروني" required>
                  <input type="email" className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </FormField>
                <FormField label="رقم الجوال" required>
                  <input type="tel" className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="+966" />
                </FormField>
              </FormGroup>
            </FormSection>

            <FormSection title="الصلاحيات">
              <FormGroup columns={2}>
                <FormField label="الدور" required>
                  <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                    <option value="">اختر الدور</option>
                    <option value="admin">مدير</option>
                    <option value="doctor">طبيب</option>
                    <option value="technician">فني مختبر</option>
                    <option value="phlebotomist">أخصائي سحب دم</option>
                    <option value="patient">مريض</option>
                    <option value="manager">مدير فرع</option>
                  </select>
                </FormField>
                <FormField label="الفرع" required>
                  <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                    <option>الفرع الرئيسي - الرياض</option>
                    <option>فرع جدة</option>
                    <option>فرع الدمام</option>
                  </select>
                </FormField>
              </FormGroup>
            </FormSection>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowAddUser(false)}>إلغاء</Button>
          <Button variant="primary">حفظ المستخدم</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => setShowConfirm(false)}
        title="تأكيد تغيير الحالة"
        description="هل أنت متأكد من تغيير حالة هذا المستخدم؟"
        confirmLabel="تأكيد"
        variant="warning"
      />
    </div>
  );
}
