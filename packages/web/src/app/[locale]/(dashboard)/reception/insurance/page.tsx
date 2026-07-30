'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Clock, Search, Download, RefreshCw,
  AlertTriangle, Loader2, TrendingUp, Eye, BarChart3,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput } from '@/design-system/forms/FormField';
import {
  Table, TableHeader, TableBody, TableRow, Th, Td,
} from '@/design-system/layout/Table';
import { cn } from '@/lib/utils';
import { InsuranceVerificationPanel } from '@/components/reception/ReceptionComponents';
import type { InsuranceVerification, InsuranceVerificationStatus } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_VERIFICATIONS: InsuranceVerification[] = [
  { id: 'iv-001', verificationNumber: 'VER-20260728-001', branchId: 'br-001', patientId: 'p-001', insuranceProvider: 'التأمين الطبي الدولي', insuranceNumber: 'INS-789456', insuranceExpiry: '2027-03-15', verificationStatus: 'verified', coveragePercentage: 80, coveredAmount: 400, totalAmount: 500, approvalCode: 'APR-20260728-5512', verifiedBy: 'سالم المطيري', createdAt: '2026-07-28T08:10:00Z', updatedAt: '2026-07-28T08:12:00Z' },
  { id: 'iv-002', verificationNumber: 'VER-20260728-002', branchId: 'br-001', patientId: 'p-002', insuranceProvider: 'بوبا للتأمين', insuranceNumber: 'INS-321654', insuranceExpiry: '2026-12-01', verificationStatus: 'pending', coveragePercentage: 70, createdAt: '2026-07-28T08:25:00Z', updatedAt: '2026-07-28T08:25:00Z' },
  { id: 'iv-003', verificationNumber: 'VER-20260728-003', branchId: 'br-001', patientId: 'p-003', insuranceProvider: 'ميدغلف', insuranceNumber: 'INS-987123', insuranceExpiry: '2026-06-30', verificationStatus: 'rejected', rejectionReason: 'البوليصة منتهية الصلاحية', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:32:00Z' },
  { id: 'iv-004', verificationNumber: 'VER-20260728-004', branchId: 'br-001', patientId: 'p-004', insuranceProvider: 'التأمين الطبي الدولي', insuranceNumber: 'INS-456123', insuranceExpiry: '2027-01-20', verificationStatus: 'verified', coveragePercentage: 100, coveredAmount: 350, totalAmount: 350, approvalCode: 'APR-20260728-6623', verifiedBy: 'سالم المطيري', createdAt: '2026-07-28T07:45:00Z', updatedAt: '2026-07-28T07:48:00Z' },
  { id: 'iv-005', verificationNumber: 'VER-20260728-005', branchId: 'br-001', patientId: 'p-005', insuranceProvider: 'بوبا للتأمين', insuranceNumber: 'INS-789321', verificationStatus: 'pending', createdAt: '2026-07-28T07:30:00Z', updatedAt: '2026-07-28T07:30:00Z' },
  { id: 'iv-006', verificationNumber: 'VER-20260728-006', branchId: 'br-001', patientId: 'p-006', insuranceProvider: 'التأمينات الاجتماعية', insuranceNumber: 'INS-654987', insuranceExpiry: '2027-06-01', verificationStatus: 'verified', coveragePercentage: 90, coveredAmount: 270, totalAmount: 300, approvalCode: 'APR-20260728-7734', verifiedBy: 'ندى القحطاني', createdAt: '2026-07-28T07:15:00Z', updatedAt: '2026-07-28T07:18:00Z' },
  { id: 'iv-007', verificationNumber: 'VER-20260728-007', branchId: 'br-001', patientId: 'p-007', insuranceProvider: 'ميدغلف', insuranceNumber: 'INS-123789', verificationStatus: 'partial', coveragePercentage: 50, createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T07:05:00Z' },
];

const STATUS_CONFIG: Record<InsuranceVerificationStatus, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'قيد التحقق', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  verified: { color: 'bg-green-100 text-green-700', label: 'موثق', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { color: 'bg-red-100 text-red-700', label: 'مرفوض', icon: <XCircle className="w-3.5 h-3.5" /> },
  expired: { color: 'bg-gray-100 text-gray-700', label: 'منتهي', icon: <Clock className="w-3.5 h-3.5" /> },
  partial: { color: 'bg-orange-100 text-orange-700', label: 'جزئي', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const PROVIDER_BREAKDOWN = [
  { name: 'التأمين الطبي الدولي', count: 3, color: 'bg-blue-500' },
  { name: 'بوبا للتأمين', count: 2, color: 'bg-green-500' },
  { name: 'ميدغلف', count: 2, color: 'bg-purple-500' },
  { name: 'التأمينات الاجتماعية', count: 1, color: 'bg-orange-500' },
  { name: 'أخرى', count: 1, color: 'bg-gray-400' },
];

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function InsurancePage() {
  const [activeTab, setActiveTab] = React.useState('pending');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNewForm, setShowNewForm] = React.useState(false);

  const filteredVerifications = React.useMemo(() => {
    return MOCK_VERIFICATIONS.filter((v) => {
      const matchesStatus = activeTab === 'all' || v.verificationStatus === activeTab || (activeTab === 'pending' && v.verificationStatus === 'pending');
      const matchesSearch = !searchQuery || v.insuranceProvider.includes(searchQuery) || v.insuranceNumber.includes(searchQuery) || v.verificationNumber.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const stats = React.useMemo(() => ({
    verified: MOCK_VERIFICATIONS.filter((v) => v.verificationStatus === 'verified').length,
    rejected: MOCK_VERIFICATIONS.filter((v) => v.verificationStatus === 'rejected').length,
    pending: MOCK_VERIFICATIONS.filter((v) => v.verificationStatus === 'pending').length,
    totalCoverage: MOCK_VERIFICATIONS.filter((v) => v.coveredAmount).reduce((sum, v) => sum + (v.coveredAmount || 0), 0),
  }), []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">التحقق من التأمين</h1>
          <p className="text-sm text-surface-500 mt-1">إدارة التحقق من التغطية التأمينية للمرضى</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>تصدير</Button>
          <Button variant="primary" size="sm" icon={<Shield className="w-4 h-4" />} onClick={() => setShowNewForm(!showNewForm)}>
            تحقق جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="موثق" value={stats.verified} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="مرفوض" value={stats.rejected} icon={<XCircle className="h-5 w-5 text-red-600" />} iconBg="bg-red-50" />
        <StatCard title="قيد الانتظار" value={stats.pending} icon={<Clock className="h-5 w-5 text-yellow-600" />} iconBg="bg-yellow-50" />
        <StatCard title="إجمالي التغطية" value={`${stats.totalCoverage.toLocaleString('ar-SA')} ر.س`} icon={<TrendingUp className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
      </div>

      {/* New Verification Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  طلب تحقق جديد
                </h3>
                <button onClick={() => setShowNewForm(false)} className="text-surface-400 hover:text-surface-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">شركة التأمين *</label>
                  <select className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none">
                    <option value="">اختر شركة التأمين...</option>
                    <option>التأمين الطبي الدولي</option>
                    <option>بوبا للتأمين</option>
                    <option>ميدغلف</option>
                    <option>التأمينات الاجتماعية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">رقم البوليصة *</label>
                  <input type="text" className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none" placeholder="INS-XXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">رقم المريض أو البحث</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
                    <input type="text" className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none" placeholder="بحث عن المريض..." />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="primary" size="sm" icon={<Shield className="w-4 h-4" />}>بدء التحقق</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">قيد الانتظار ({stats.pending})</TabsTrigger>
          <TabsTrigger value="verified">موثق ({stats.verified})</TabsTrigger>
          <TabsTrigger value="rejected">مرفوض ({stats.rejected})</TabsTrigger>
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          <SearchInput placeholder="بحث بالشركة أو رقم البوليصة..." className="w-full sm:w-96" onSearch={setSearchQuery} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {filteredVerifications.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500">لا توجد طلبات تحقق في هذه الفئة</p>
                  </div>
                </Card>
              ) : (
                filteredVerifications.map((v) => (
                  <InsuranceVerificationPanel
                    key={v.id}
                    verification={v}
                    onVerify={() => console.log('Verify:', v.id)}
                    onReject={() => console.log('Reject:', v.id)}
                  />
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
                  <h3 className="font-bold text-surface-900">توزيع الشركات</h3>
                </div>
                <div className="space-y-3">
                  {PROVIDER_BREAKDOWN.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', p.color)} />
                      <span className="text-sm text-surface-700 flex-1">{p.name}</span>
                      <span className="text-sm font-semibold text-surface-900">{p.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
                  <h3 className="font-bold text-surface-900">ملخص التغطية</h3>
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-surface-400">متوسط نسبة التغطية</p>
                    <p className="text-2xl font-bold text-brand-600 mt-1">80%</p>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden mt-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1 }} className="h-full bg-brand-500 rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-green-50">
                      <p className="text-lg font-bold text-green-700">970 ر.س</p>
                      <p className="text-xs text-green-600">المبلغ المشمول</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-50">
                      <p className="text-lg font-bold text-surface-700">1,150 ر.س</p>
                      <p className="text-xs text-surface-500">المبلغ الإجمالي</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
