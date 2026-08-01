'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Building2, Clock, CheckCircle2, XCircle,
  Download, Plus, RefreshCw, AlertTriangle, MapPin, Loader2, Eye,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import {
  Table, TableHeader, TableBody, TableRow, Th, Td,
} from '@/design-system/layout/Table';
import { cn } from '@/lib/utils';
import { TransferForm } from '@/components/reception/ReceptionComponents';
import type { BranchTransfer, TransferStatus } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_TRANSFERS: BranchTransfer[] = [
  { id: 'tr-001', transferNumber: 'TRF-20260728-001', fromBranchId: 'br-001', fromBranchName: 'الرياض الرئيسي', toBranchId: 'br-002', toBranchName: 'جدة', patientId: 'p-001', patientName: 'يوسف بن سليمان الزهراني', reason: 'إعادة جدولة الموعد في الفرع الأقرب', status: 'completed', priority: 'normal', transferredBy: 'سالم المطيري', acceptedBy: 'محمد العتيبي', transferredAt: '2026-07-28T07:00:00Z', completedAt: '2026-07-28T07:30:00Z', createdAt: '2026-07-28T06:55:00Z', updatedAt: '2026-07-28T07:30:00Z' },
  { id: 'tr-002', transferNumber: 'TRF-20260728-002', fromBranchId: 'br-001', fromBranchName: 'الرياض الرئيسي', toBranchId: 'br-003', toBranchName: 'الدمام', patientId: 'p-002', patientName: 'منال بنت عبدالعزيز الأحمدي', reason: 'نقل المريض للفرع الأقرب لمحل إقامتها', status: 'accepted', priority: 'urgent', transferredBy: 'سالم المطيري', transferredAt: '2026-07-28T08:15:00Z', acceptedAt: '2026-07-28T08:20:00Z', createdAt: '2026-07-28T08:10:00Z', updatedAt: '2026-07-28T08:20:00Z' },
  { id: 'tr-003', transferNumber: 'TRF-20260728-003', fromBranchId: 'br-002', fromBranchName: 'جدة', toBranchId: 'br-001', toBranchName: 'الرياض الرئيسي', patientId: 'p-003', patientName: 'أريج بنت محمد القرني', reason: 'إحالة لإجراء فحوصات متخصصة', status: 'pending', priority: 'normal', transferredBy: 'خالد الغامدي', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:30:00Z' },
  { id: 'tr-004', transferNumber: 'TRF-20260728-004', fromBranchId: 'br-001', fromBranchName: 'الرياض الرئيسي', toBranchId: 'br-004', toBranchName: 'مكة المكرمة', patientId: 'p-004', patientName: 'تركي بن سعود العنزي', reason: 'قرب المريض من فرع مكة', status: 'pending', priority: 'urgent', transferredBy: 'سالم المطيري', createdAt: '2026-07-28T08:45:00Z', updatedAt: '2026-07-28T08:45:00Z' },
  { id: 'tr-005', transferNumber: 'TRF-20260728-005', fromBranchId: 'br-003', fromBranchName: 'الدمام', toBranchId: 'br-005', toBranchName: 'المدينة المنورة', patientId: 'p-005', patientName: 'رائد بن فهد الحربي', reason: 'نقلPermanent', status: 'rejected', priority: 'normal', transferredBy: 'سعود الدوسري', createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T07:15:00Z' },
];

const STATUS_CONFIG: Record<TransferStatus, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'قيد الانتظار', icon: <Clock className="w-3.5 h-3.5" /> },
  accepted: { color: 'bg-blue-100 text-blue-700', label: 'مقبول', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'in-transit': { color: 'bg-purple-100 text-purple-700', label: 'قيد النقل', icon: <ArrowRight className="w-3.5 h-3.5" /> },
  completed: { color: 'bg-green-100 text-green-700', label: 'مكتمل', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { color: 'bg-red-100 text-red-700', label: 'مرفوض', icon: <XCircle className="w-3.5 h-3.5" /> },
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function TransfersPage() {
  const [activeTab, setActiveTab] = React.useState('all');
  const [showForm, setShowForm] = React.useState(false);

  const filteredTransfers = React.useMemo(() => {
    return MOCK_TRANSFERS.filter((t) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'outgoing') return t.fromBranchId === 'br-001';
      if (activeTab === 'incoming') return t.toBranchId === 'br-001';
      return t.status === activeTab;
    });
  }, [activeTab]);

  const stats = React.useMemo(() => ({
    total: MOCK_TRANSFERS.length,
    pending: MOCK_TRANSFERS.filter((t) => t.status === 'pending').length,
    accepted: MOCK_TRANSFERS.filter((t) => t.status === 'accepted' || t.status === 'completed').length,
    rejected: MOCK_TRANSFERS.filter((t) => t.status === 'rejected').length,
    acceptanceRate: Math.round((MOCK_TRANSFERS.filter((t) => t.status === 'accepted' || t.status === 'completed').length / MOCK_TRANSFERS.filter((t) => t.status !== 'pending').length) * 100),
    avgTime: '25 دقيقة',
  }), []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">التحويلات بين الفروع</h1>
          <p className="text-sm text-surface-500 mt-1">إدارة تحويلات المرضى بين الفروع</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>تصدير</Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(!showForm)}>
            تحويل جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي التحويلات" value={stats.total} icon={<ArrowRight className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="معدل القبول" value={`${stats.acceptanceRate}%`} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="قيد الانتظار" value={stats.pending} icon={<Clock className="h-5 w-5 text-yellow-600" />} iconBg="bg-yellow-50" />
        <StatCard title="متوسط وقت النقل" value={stats.avgTime} icon={<RefreshCw className="h-5 w-5 text-purple-600" />} iconBg="bg-purple-50" />
      </div>

      {/* Transfer Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <TransferForm
              branches={[
                { id: 'br-002', name: 'جدة' },
                { id: 'br-003', name: 'الدمام' },
                { id: 'br-004', name: 'مكة المكرمة' },
                { id: 'br-005', name: 'المدينة المنورة' },
              ]}
              onSubmit={(data) => { console.log('Transfer:', data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({MOCK_TRANSFERS.length})</TabsTrigger>
          <TabsTrigger value="outgoing">صادر</TabsTrigger>
          <TabsTrigger value="incoming">وارد</TabsTrigger>
          <TabsTrigger value="pending">معلق ({stats.pending})</TabsTrigger>
          <TabsTrigger value="completed">مكتمل</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card padding="none">
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th>رقم التحويل</Th>
                  <Th>المريض</Th>
                  <Th>من فرع</Th>
                  <Th>إلى فرع</Th>
                  <Th>الأولوية</Th>
                  <Th>الحالة</Th>
                  <Th>الوقت</Th>
                  <Th>إجراءات</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((t) => {
                  const statusCfg = STATUS_CONFIG[t.status];
                  return (
                    <TableRow key={t.id} hoverable>
                      <Td className="font-mono text-xs font-medium text-blue-600">{t.transferNumber}</Td>
                      <Td>
                        <p className="text-sm font-semibold text-surface-900">{t.patientName}</p>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-sm text-surface-600">
                          <Building2 className="w-3.5 h-3.5" />
                          {t.fromBranchName}
                        </span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-sm text-surface-600">
                          <MapPin className="w-3.5 h-3.5" />
                          {t.toBranchName}
                        </span>
                      </Td>
                      <Td>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', t.priority === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-600')}>
                          {t.priority === 'urgent' ? 'عاجل' : 'عادي'}
                        </span>
                      </Td>
                      <Td>
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.color)}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </Td>
                      <Td className="text-sm text-surface-500">
                        {new Date(t.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          {t.status === 'pending' && (
                            <>
                              <button className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="قبول"><CheckCircle2 className="w-4 h-4 text-green-500" /></button>
                              <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="رفض"><XCircle className="w-4 h-4 text-red-400" /></button>
                            </>
                          )}
                          <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors" title="تفاصيل">
                            <Eye className="w-4 h-4 text-surface-400" />
                          </button>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredTransfers.length === 0 && (
              <div className="p-8 text-center">
                <ArrowRight className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">لا توجد تحويلات في هذه الفئة</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
