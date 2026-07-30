'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Table, TableHeader, TableBody, TableRow, Th, Td, type Column } from '@/design-system/layout/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog } from '@/design-system/feedback/Alert';
import { BarChart, ChartCard, MetricRow } from '@/design-system/data/ChartCard';
import { Alert } from '@/design-system/feedback/Alert';
import { Stepper } from '@/design-system/feedback/Progress';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

const mockOrders = [
  { id: 'ORD-2026-001', patient: 'أحمد بن محمد', patientId: 'P001', date: '2026-07-25', tests: ['CBC', 'Lipid Profile'], total: 350, status: 'completed', branch: 'Riyadh Main', priority: 'normal', assignedTo: 'Lab Tech 1' },
  { id: 'ORD-2026-002', patient: 'فاطمة العلي', patientId: 'P002', date: '2026-07-26', tests: ['TSH', 'Free T4'], total: 420, status: 'in-progress', branch: 'Riyadh Main', priority: 'high', assignedTo: 'Lab Tech 2' },
  { id: 'ORD-2026-003', patient: 'خالد الشمري', patientId: 'P003', date: '2026-07-27', tests: ['HbA1c', 'Fasting Glucose'], total: 280, status: 'pending', branch: 'Jeddah', priority: 'normal', assignedTo: null },
  { id: 'ORD-2026-004', patient: 'نورة الحربي', patientId: 'P004', date: '2026-07-27', tests: ['Vitamin D', 'Calcium'], total: 380, status: 'confirmed', branch: 'Riyadh Main', priority: 'normal', assignedTo: 'Lab Tech 3' },
  { id: 'ORD-2026-005', patient: 'عبدالله المطيري', patientId: 'P005', date: '2026-07-28', tests: ['CBC', 'ESR', 'CRP'], total: 320, status: 'pending', branch: 'Dammam', priority: 'high', assignedTo: null },
  { id: 'ORD-2026-006', patient: 'سارة الدوسري', patientId: 'P006', date: '2026-07-24', tests: ['Liver Panel'], total: 250, status: 'completed', branch: 'Riyadh Main', priority: 'normal', assignedTo: 'Lab Tech 1' },
];

const orderStats = [
  { label: 'قيد الانتظار', value: 2 },
  { label: 'مؤكد', value: 1 },
  { label: 'قيد التنفيذ', value: 1 },
  { label: 'مكتمل', value: 2 },
];

export default function AdminOrdersPage() {
  const [showOrderDetail, setShowOrderDetail] = React.useState<string | null>(null);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  const filteredOrders = selectedStatus === 'all' ? mockOrders : mockOrders.filter(o => o.status === selectedStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">إدارة الطلبات</h1>
          <p className="mt-1 text-sm text-surface-500">متابعة وإدارة طلبات الفحوصات المخبرية</p>
        </div>
        <Button variant="primary" icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /></svg>}>
          طلب جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلبات" value={mockOrders.length} icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="قيد الانتظار" value={mockOrders.filter(o => o.status === 'pending').length} icon={<svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} iconBg="bg-warning-50" />
        <StatCard title="قيد التنفيذ" value={mockOrders.filter(o => o.status === 'in-progress').length} icon={<svg className="h-5 w-5 text-info-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} iconBg="bg-info-50" />
        <StatCard title="الإيرادات اليوم" value={formatCurrency(mockOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0))} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>} iconBg="bg-success-50" />
      </div>

      {/* Orders Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>طلبات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={orderStats.map(s => ({ label: s.label, value: s.value }))}
              height={160}
              horizontal
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأولويات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-danger-50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger-500" />
                <span className="text-sm font-medium text-danger-700">عاجل</span>
              </div>
              <span className="text-sm font-bold text-danger-700">{mockOrders.filter(o => o.priority === 'high').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-surface-400" />
                <span className="text-sm font-medium text-surface-700">عادي</span>
              </div>
              <span className="text-sm font-bold text-surface-700">{mockOrders.filter(o => o.priority === 'normal').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-surface-900">جميع الطلبات</h3>
            <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg">
              {['all', 'pending', 'confirmed', 'in-progress', 'completed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    selectedStatus === s ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {s === 'all' ? 'الكل' : getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
          <SearchInput placeholder="بحث..." className="w-64" onSearch={() => {}} />
        </div>
        <Table hoverable>
          <TableHeader>
            <TableRow>
              <Th sortable>رقم الطلب</Th>
              <Th sortable>المريض</Th>
              <Th sortable>التاريخ</Th>
              <Th>الفحوصات</Th>
              <Th sortable align="right">المبلغ</Th>
              <Th>الفرع</Th>
              <Th>الأولوية</Th>
              <Th>الحالة</Th>
              <Th>إجراءات</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} hoverable>
                <Td className="font-medium text-surface-900">{order.id}</Td>
                <Td>
                  <div>
                    <p className="text-sm font-medium">{order.patient}</p>
                    <p className="text-xs text-surface-500">{order.patientId}</p>
                  </div>
                </Td>
                <Td className="text-sm">{formatDate(order.date)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {order.tests.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" size="sm">{t}</Badge>
                    ))}
                    {order.tests.length > 2 && <Badge variant="secondary" size="sm">+{order.tests.length - 2}</Badge>}
                  </div>
                </Td>
                <Td align="right" className="font-semibold">{formatCurrency(order.total)}</Td>
                <Td className="text-sm">{order.branch}</Td>
                <Td>
                  <Badge variant={order.priority === 'high' ? 'danger' : 'default'}>
                    {order.priority === 'high' ? 'عاجل' : 'عادي'}
                  </Badge>
                </Td>
                <Td>
                  <Badge
                    variant={
                      order.status === 'completed' ? 'success' :
                      order.status === 'in-progress' ? 'info' :
                      order.status === 'confirmed' ? 'primary' : 'warning'
                    }
                    dot
                  >
                    {getStatusLabel(order.status)}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowOrderDetail(order.id)}>تفاصيل</Button>
                    {order.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="text-success-600" onClick={() => setShowConfirm(true)}>تأكيد</Button>
                    )}
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => setShowConfirm(false)}
        title="تأكيد الطلب"
        description="هل أنت متأكد من تأكيد هذا الطلب؟ سيتم إشعار المختبر بالبدء في التنفيذ."
        confirmLabel="تأكيد الطلب"
        variant="info"
      />

      {/* Order Detail Dialog */}
      <Dialog open={!!showOrderDetail} onClose={() => setShowOrderDetail(null)} size="lg">
        <DialogHeader onClose={() => setShowOrderDetail(null)}>
          <DialogTitle>تفاصيل الطلب {showOrderDetail}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {showOrderDetail && (() => {
            const order = mockOrders.find(o => o.id === showOrderDetail);
            if (!order) return null;
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-surface-500">المريض</p>
                    <p className="text-sm font-medium">{order.patient}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">التاريخ</p>
                    <p className="text-sm font-medium">{formatDate(order.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">الفرع</p>
                    <p className="text-sm font-medium">{order.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">الحالة</p>
                    <Badge variant={order.status === 'completed' ? 'success' : order.status === 'in-progress' ? 'info' : 'warning'} dot>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-surface-500 mb-2">الفحوصات المطلوبة</p>
                  <div className="space-y-2">
                    {order.tests.map((t) => (
                      <div key={t} className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2">
                        <span className="text-sm font-medium">{t}</span>
                        <Badge variant="secondary" size="sm">مكتمل</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-surface-500 mb-2">تتبع الطلب</p>
                  <Stepper
                    steps={[
                      { label: 'تم الطلب', description: '25 Jul, 09:00' },
                      { label: 'تم التأكيد', description: '25 Jul, 09:15' },
                      { label: 'جمع العينات', description: order.status !== 'pending' ? '25 Jul, 09:30' : undefined },
                      { label: 'التحليل', description: order.status === 'completed' ? '25 Jul, 11:00' : undefined },
                      { label: 'جاهز', description: order.status === 'completed' ? '25 Jul, 13:00' : undefined },
                    ]}
                    current={
                      order.status === 'pending' ? 1 :
                      order.status === 'confirmed' ? 2 :
                      order.status === 'in-progress' ? 3 : 5
                    }
                  />
                </div>
              </div>
            );
          })()}
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowOrderDetail(null)}>إغلاق</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
