'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Clock, CheckCircle2, XCircle, Shield, Download,
  RefreshCw, Timer, Users, QrCode, Phone, Eye,
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
import { WalkInForm, BarcodeGenerator } from '@/components/reception/ReceptionComponents';
import type { WalkInRegistration } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_WALKINS: WalkInRegistration[] = [
  { id: 'wk-001', registrationNumber: 'WK-20260728-001', branchId: 'br-001', isNewPatient: false, patientName: 'أحمد بن سعيد العتيبي', patientPhone: '0551234567', patientNationalId: '1098765432', requestedServices: ['cbc', 'glucose'], referralSource: 'walk-in', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:15:00Z', updatedAt: '2026-07-28T08:15:00Z' },
  { id: 'wk-002', registrationNumber: 'WK-20260728-002', branchId: 'br-001', isNewPatient: true, patientName: 'نورة بنت سعد الدوسري', patientPhone: '0534445566', patientNationalId: '1087654321', requestedServices: ['lipid', 'thyroid', 'vitamin_d'], referralSource: 'doctor-referral', insuranceProvider: 'التأمين الطبي الدولي', insuranceNumber: 'INS-789456', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:30:00Z' },
  { id: 'wk-003', registrationNumber: 'WK-20260728-003', branchId: 'br-001', isNewPatient: false, patientName: 'سارة بنت خالد العتيبي', patientPhone: '0512345678', requestedServices: ['cbc', 'lipid', 'glucose', 'vitamin_d', 'hba1c'], referralSource: 'online', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:00:00Z', updatedAt: '2026-07-28T08:00:00Z' },
  { id: 'wk-004', registrationNumber: 'WK-20260728-004', branchId: 'br-001', isNewPatient: false, patientName: 'خالد بن عبدالله الشمري', patientPhone: '0541112233', requestedServices: ['cbc'], referralSource: 'walk-in', registeredBy: 'ندى القحطاني', createdAt: '2026-07-28T07:45:00Z', updatedAt: '2026-07-28T07:45:00Z' },
  { id: 'wk-005', registrationNumber: 'WK-20260728-005', branchId: 'br-001', isNewPatient: true, patientName: 'عبدالرحمن بن فيصل المطيري', patientPhone: '0567890123', requestedServices: ['cbc', 'lipid', 'glucose', 'liver', 'kidney'], referralSource: 'corporate', insuranceProvider: 'بوبا للتأمين', insuranceNumber: 'INS-321654', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T07:30:00Z', updatedAt: '2026-07-28T07:30:00Z' },
  { id: 'wk-006', registrationNumber: 'WK-20260728-006', branchId: 'br-001', isNewPatient: false, patientName: 'هدى بنت عمر الغامدي', patientPhone: '0534567890', requestedServices: ['thyroid'], referralSource: 'walk-in', registeredBy: 'ندى القحطاني', createdAt: '2026-07-28T07:15:00Z', updatedAt: '2026-07-28T07:15:00Z' },
  { id: 'wk-007', registrationNumber: 'WK-20260728-007', branchId: 'br-001', isNewPatient: false, patientName: 'محمد بن أحمد السبيعي', patientPhone: '0523456789', requestedServices: ['cbc', 'glucose', 'hba1c'], referralSource: 'online', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T07:00:00Z' },
];

const REFERRAL_CONFIG: Record<string, { label: string; color: string }> = {
  'walk-in': { label: 'حضور', color: 'bg-blue-100 text-blue-700' },
  online: { label: 'اونلاين', color: 'bg-purple-100 text-purple-700' },
  'doctor-referral': { label: 'إحالة طبيب', color: 'bg-green-100 text-green-700' },
  corporate: { label: 'شركات', color: 'bg-orange-100 text-orange-700' },
};

const SERVICE_MAP: Record<string, string> = {
  cbc: 'صورة دم كاملة', lipid: 'الدهون', glucose: 'السكر', thyroid: 'الغدة الدرقية',
  liver: 'وظائف الكبد', kidney: 'وظائف الكلى', vitamin_d: 'فيتامين د', hba1c: 'السكر التراكمي',
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function WalkInsPage() {
  const [activeTab, setActiveTab] = React.useState('register');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [showBarcode, setShowBarcode] = React.useState(false);
  const [barcodeTarget, setBarcodeTarget] = React.useState<WalkInRegistration | null>(null);

  const filteredWalkIns = React.useMemo(() => {
    return MOCK_WALKINS.filter((w) => {
      return !searchQuery || w.patientName.includes(searchQuery) || w.registrationNumber.includes(searchQuery) || w.patientPhone.includes(searchQuery);
    });
  }, [searchQuery]);

  const todayStats = React.useMemo(() => ({
    total: MOCK_WALKINS.length,
    newPatients: MOCK_WALKINS.filter((w) => w.isNewPatient).length,
    withInsurance: MOCK_WALKINS.filter((w) => w.insuranceProvider).length,
    avgTime: '8 دقائق',
  }), []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">التسجيل الحضوري</h1>
          <p className="text-sm text-surface-500 mt-1">تسجيل المرضى الحضور بشكل مباشر</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>تصدير</Button>
          <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowForm(!showForm)}>
            تسجيل جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="تسجيلات اليوم" value={todayStats.total} icon={<UserPlus className="h-5 w-5 text-brand-600" />} iconBg="bg-brand-50" />
        <StatCard title="مرضى جدد" value={todayStats.newPatients} icon={<Users className="h-5 w-5 text-purple-600" />} iconBg="bg-purple-50" />
        <StatCard title="بتأمين" value={todayStats.withInsurance} icon={<Shield className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="متوسط التسجيل" value={todayStats.avgTime} icon={<Timer className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
      </div>

      {/* Registration Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <WalkInForm
              onSubmit={(data) => { console.log('Walk-in submitted:', data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="register">التسجيلات</TabsTrigger>
          <TabsTrigger value="recent">الأحدث</TabsTrigger>
          <TabsTrigger value="barcode">باركود</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <SearchInput placeholder="بحث بالاسم أو رقم التسجيل..." className="flex-1 w-full sm:w-auto" onSearch={setSearchQuery} />
          </div>

          <Card padding="none">
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th>رقم التسجيل</Th>
                  <Th>المريض</Th>
                  <Th>الخدمات</Th>
                  <Th>المصدر</Th>
                  <Th>التأمين</Th>
                  <Th>الوقت</Th>
                  <Th>إجراءات</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWalkIns.map((wk) => {
                  const referral = REFERRAL_CONFIG[wk.referralSource] || REFERRAL_CONFIG['walk-in'];
                  return (
                    <TableRow key={wk.id} hoverable>
                      <Td className="font-mono text-xs font-medium text-brand-600">{wk.registrationNumber}</Td>
                      <Td>
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{wk.patientName}</p>
                          <p className="text-xs text-surface-500 flex items-center gap-1"><Phone className="w-3 h-3" />{wk.patientPhone}</p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {wk.requestedServices.slice(0, 3).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-surface-100 text-xs text-surface-600">{SERVICE_MAP[s] || s}</span>
                          ))}
                          {wk.requestedServices.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-100 text-xs text-surface-500">+{wk.requestedServices.length - 3}</span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', referral.color)}>{referral.label}</span>
                      </Td>
                      <Td>
                        {wk.insuranceProvider ? (
                          <span className="flex items-center gap-1 text-xs text-surface-600"><Shield className="w-3 h-3 text-blue-500" />{wk.insuranceProvider}</span>
                        ) : (
                          <span className="text-xs text-surface-400">—</span>
                        )}
                      </Td>
                      <Td className="text-sm text-surface-500">
                        {new Date(wk.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors" title="عرض"><Eye className="w-4 h-4 text-surface-400" /></button>
                          <button onClick={() => { setBarcodeTarget(wk); setShowBarcode(true); }} className="p-1.5 hover:bg-brand-50 rounded-lg transition-colors" title="باركود"><QrCode className="w-4 h-4 text-brand-400" /></button>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredWalkIns.length === 0 && (
              <div className="p-8 text-center">
                <UserPlus className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">لا توجد تسجيلات تطابق البحث</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <div className="divide-y divide-surface-100">
              {MOCK_WALKINS.map((wk) => (
                <div key={wk.id} className="flex items-center gap-4 py-3 px-4 hover:bg-surface-50 transition-colors rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {wk.patientName.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{wk.patientName}</p>
                    <p className="text-xs text-surface-500">{wk.registrationNumber} • {wk.requestedServices.length} فحوصات • {wk.isNewPatient ? 'مريض جديد' : 'مريض مسجل'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-surface-500">{new Date(wk.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-surface-400">بواسطة {wk.registeredBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="barcode" className="mt-6">
          <Card>
            <div className="text-center py-8">
              <QrCode className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600 font-medium">اختر تسجيل من القائمة لإنشاء باركود</p>
              <p className="text-xs text-surface-400 mt-1">أو اضغط على أيقونة الباركود في جدول التسجيلات</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barcode Modal */}
      <AnimatePresence>
        {showBarcode && barcodeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowBarcode(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-md">
              <BarcodeGenerator
                entityType="walk-in"
                entityId={barcodeTarget.registrationNumber}
                onPrint={(config) => { console.log('Print:', config); setShowBarcode(false); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
