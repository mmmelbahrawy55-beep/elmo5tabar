'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Table, TableHeader, TableBody, TableRow, Th, Td } from '@/design-system/layout/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { formatDate, getStatusColor, getStatusLabel, formatTime } from '@/lib/utils';

const mockAppointments = [
  { id: 'APT-001', date: '2026-07-28', time: '09:00', type: 'فحص دوري', branch: 'الفرع الرئيسي - الرياض', doctor: 'د. سارة الأحمد', status: 'confirmed', tests: ['CBC', 'Lipid Profile'] },
  { id: 'APT-002', date: '2026-08-05', time: '14:30', type: 'متابعة', branch: 'فرع جدة', doctor: 'د. محمد الراشد', status: 'pending', tests: ['HbA1c'] },
  { id: 'APT-003', date: '2026-07-20', time: '10:00', type: 'فحص شامل', branch: 'الفرع الرئيسي - الرياض', doctor: 'د. فاطمة الزهراء', status: 'completed', tests: ['CBC', 'Lipid Profile', 'TSH', 'Liver Panel'] },
  { id: 'APT-004', date: '2026-07-15', time: '11:30', type: 'تحاليل خاصة', branch: 'فرع الدمام', doctor: 'د. سارة الأحمد', status: 'cancelled', tests: ['Vitamin D'] },
];

const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export default function AppointmentsPage() {
  const [showBooking, setShowBooking] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">المواعيد</h1>
          <p className="mt-1 text-sm text-surface-500">إدارة مواعيد الفحوصات المخبرية</p>
        </div>
        <Button variant="primary" onClick={() => setShowBooking(true)} icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /></svg>}>
          حجز موعد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="مواعيد قادمة" value="2" icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="هذا الشهر" value="4" icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} iconBg="bg-info-50" />
        <StatCard title="مكتملة" value="1" icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} iconBg="bg-success-50" />
        <StatCard title="ملغاة" value="1" icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>} iconBg="bg-danger-50" />
      </div>

      {/* Appointments List */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900">جميع المواعيد</h3>
          <SearchInput placeholder="بحث..." className="w-64" onSearch={() => {}} />
        </div>
        <Table hoverable>
          <TableHeader>
            <TableRow>
              <Th>الموعد</Th>
              <Th>التاريخ والوقت</Th>
              <Th>النوع</Th>
              <Th>الفرع</Th>
              <Th>الطبيب</Th>
              <Th>الفحوصات</Th>
              <Th>الحالة</Th>
              <Th>إجراءات</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAppointments.map((apt) => (
              <TableRow key={apt.id} hoverable>
                <Td className="font-medium text-surface-900">{apt.id}</Td>
                <Td>
                  <div>
                    <p className="text-sm">{formatDate(apt.date)}</p>
                    <p className="text-xs text-surface-500">{apt.time}</p>
                  </div>
                </Td>
                <Td><Badge variant="primary">{apt.type}</Badge></Td>
                <Td className="text-sm">{apt.branch}</Td>
                <Td className="text-sm">{apt.doctor}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {apt.tests.map((t) => (
                      <Badge key={t} variant="secondary" size="sm">{t}</Badge>
                    ))}
                  </div>
                </Td>
                <Td>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : apt.status === 'completed' ? 'info' : 'danger'} dot>
                    {getStatusLabel(apt.status)}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    {apt.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="text-success-600">تأكيد</Button>
                    )}
                    <Button variant="ghost" size="sm">تفاصيل</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onClose={() => setShowBooking(false)} size="lg">
        <DialogHeader onClose={() => setShowBooking(false)}>
          <DialogTitle>حجز موعد جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-5">
            <FormGroup columns={2}>
              <FormField label="التاريخ" required>
                <input type="date" className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </FormField>
              <FormField label="الفرع" required>
                <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                  <option>الفرع الرئيسي - الرياض</option>
                  <option>فرع جدة</option>
                  <option>فرع الدمام</option>
                </select>
              </FormField>
            </FormGroup>

            <FormField label="الوقت المتاح" required>
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    className="rounded-xl border border-surface-200 px-3 py-2 text-sm font-medium text-surface-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="نوع الفحص" required>
              <select className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                <option>فحص دوري</option>
                <option>فحص شامل</option>
                <option>متابعة</option>
                <option>تحاليل خاصة</option>
              </select>
            </FormField>

            <FormField label="ملاحظات">
              <textarea rows={3} placeholder="أي ملاحظات إضافية..." className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </FormField>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowBooking(false)}>إلغاء</Button>
          <Button variant="primary">تأكيد الحجز</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
