'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { Table, TableHeader, TableBody, TableRow, Th, Td } from '@/design-system/layout/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { Alert } from '@/design-system/feedback/Alert';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';

const mockInvoices = [
  { id: 'INV-2026-001', date: '2026-07-25', tests: ['CBC', 'Lipid Profile'], total: 450, paid: 450, status: 'paid', paymentMethod: 'Visa ****4521' },
  { id: 'INV-2026-002', date: '2026-07-18', tests: ['Thyroid Panel'], total: 320, paid: 0, status: 'unpaid', paymentMethod: null },
  { id: 'INV-2026-003', date: '2026-07-10', tests: ['HbA1c', 'Fasting Glucose'], total: 280, paid: 140, status: 'partial-payment', paymentMethod: 'Apple Pay' },
  { id: 'INV-2026-004', date: '2026-07-05', tests: ['Liver Panel'], total: 380, paid: 380, status: 'paid', paymentMethod: 'Mada ****7890' },
];

export default function BillingPage() {
  const [showPayment, setShowPayment] = React.useState(false);

  const totalDue = mockInvoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total - i.paid), 0);
  const totalPaid = mockInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">الفواتير والمدفوعات</h1>
          <p className="mt-1 text-sm text-surface-500">إدارة فواتيرك وتابع حالة المدفوعات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المدفوعات" value={formatCurrency(totalPaid)} icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>} iconBg="bg-success-50" />
        <StatCard title="المبلغ المتبقي" value={formatCurrency(totalDue)} icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>} iconBg="bg-danger-50" />
        <StatCard title="الفواتير" value={mockInvoices.length} icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="فواتير معلقة" value={mockInvoices.filter(i => i.status !== 'paid').length} icon={<svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} iconBg="bg-warning-50" />
      </div>

      {totalDue > 0 && (
        <Alert variant="warning" title="يوجد مبالغ مستحقة" action={<Button variant="ghost" size="sm" onClick={() => setShowPayment(true)}>ادفع الآن</Button>}>
          لديك فواتير غير مدفوعة بقيمة {formatCurrency(totalDue)}
        </Alert>
      )}

      {/* Invoices Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900">الفواتير</h3>
          <SearchInput placeholder="بحث..." className="w-64" onSearch={() => {}} />
        </div>
        <Table hoverable>
          <TableHeader>
            <TableRow>
              <Th>رقم الفاتورة</Th>
              <Th>التاريخ</Th>
              <Th>الفحوصات</Th>
              <Th align="right">الإجمالي</Th>
              <Th align="right">المدفوع</Th>
              <Th>الحالة</Th>
              <Th>إجراءات</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((inv) => (
              <TableRow key={inv.id} hoverable>
                <Td className="font-medium text-surface-900">{inv.id}</Td>
                <Td className="text-sm">{formatDate(inv.date)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {inv.tests.map((t) => (
                      <Badge key={t} variant="secondary" size="sm">{t}</Badge>
                    ))}
                  </div>
                </Td>
                <Td align="right" className="font-semibold">{formatCurrency(inv.total)}</Td>
                <Td align="right">{formatCurrency(inv.paid)}</Td>
                <Td>
                  <Badge
                    variant={inv.status === 'paid' ? 'success' : inv.status === 'unpaid' ? 'danger' : 'warning'}
                    dot
                  >
                    {getStatusLabel(inv.status)}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    {inv.status !== 'paid' && (
                      <Button variant="ghost" size="sm" className="text-brand-600" onClick={() => setShowPayment(true)}>
                        دفع
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">تحميل</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onClose={() => setShowPayment(false)} size="md">
        <DialogHeader onClose={() => setShowPayment(false)}>
          <DialogTitle>إتمام الدفع</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-5">
            <div className="rounded-xl bg-surface-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-600">المبلغ المستحق</span>
                <span className="text-lg font-bold text-surface-900">{formatCurrency(totalDue)}</span>
              </div>
            </div>

            <FormField label="طريقة الدفع" required>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-3 text-right">
                  <div className="h-8 w-12 rounded bg-brand-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">VISA</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Visa</p>
                    <p className="text-xs text-surface-500">****4521</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border-2 border-surface-200 p-3 text-right hover:border-brand-300 transition-colors">
                  <div className="h-8 w-12 rounded bg-surface-900 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">MADA</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Mada</p>
                    <p className="text-xs text-surface-500">****7890</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border-2 border-surface-200 p-3 text-right hover:border-brand-300 transition-colors">
                  <div className="h-8 w-12 rounded bg-surface-900 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">Apple</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Apple Pay</p>
                    <p className="text-xs text-surface-500">متاح</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border-2 border-surface-200 p-3 text-right hover:border-brand-300 transition-colors">
                  <div className="h-8 w-12 rounded bg-success-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">STC</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">STC Pay</p>
                    <p className="text-xs text-surface-500">متاح</p>
                  </div>
                </button>
              </div>
            </FormField>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowPayment(false)}>إلغاء</Button>
          <Button variant="primary">ادفع {formatCurrency(totalDue)}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
