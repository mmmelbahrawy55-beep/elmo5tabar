'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MapPin, Clock, CheckCircle2, XCircle, Phone, Download, Plus,
  RefreshCw, User, Car, Navigation, AlertTriangle, Timer,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import {
  Table, TableHeader, TableBody, TableRow, Th, Td,
} from '@/design-system/layout/Table';
import { cn } from '@/lib/utils';
import { HomeVisitRequestForm } from '@/components/reception/ReceptionComponents';
import type { HomeVisitRequest, HomeVisitStatus } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_HOME_VISITS: HomeVisitRequest[] = [
  { id: 'hv-001', requestNumber: 'HV-20260728-001', branchId: 'br-001', patientId: 'p-001', patientName: 'عبدالرحمن بن فيصل المطيري', patientPhone: '0567890123', status: 'assigned', priority: 'normal', patientAddress: 'حي النزهة، شارع الأمير سلطان، الرياض', patientCity: 'الرياض', patientLat: 24.7136, patientLng: 46.6753, preferredDate: '2026-07-28', preferredTimeStart: '10:00', preferredTimeEnd: '12:00', assignedPhlebotomistName: 'أحمد المطيري', assignedAt: '2026-07-28T08:00:00Z', distanceKm: 12.5, estimatedArrivalMinutes: 18, createdBy: 'سالم المطيري', createdAt: '2026-07-28T07:30:00Z', updatedAt: '2026-07-28T08:00:00Z' },
  { id: 'hv-002', requestNumber: 'HV-20260728-002', branchId: 'br-001', patientId: 'p-002', patientName: 'هدى بنت عمر الغامدي', patientPhone: '0534567890', status: 'en-route', priority: 'urgent', patientAddress: 'حي العليا، طريق الملك فهد، الرياض', patientCity: 'الرياض', preferredDate: '2026-07-28', preferredTimeStart: '08:00', preferredTimeEnd: '10:00', assignedPhlebotomistName: 'سعد الحربي', assignedAt: '2026-07-28T07:00:00Z', enRouteAt: '2026-07-28T08:30:00Z', distanceKm: 8.2, estimatedArrivalMinutes: 10, createdBy: 'سالم المطيري', createdAt: '2026-07-28T06:45:00Z', updatedAt: '2026-07-28T08:30:00Z' },
  { id: 'hv-003', requestNumber: 'HV-20260728-003', branchId: 'br-001', patientId: 'p-003', patientName: 'سارة بنت خالد العتيبي', patientPhone: '0512345678', status: 'completed', priority: 'vip', patientAddress: 'حي الملقا، الرياض', patientCity: 'الرياض', preferredDate: '2026-07-28', preferredTimeStart: '07:00', preferredTimeEnd: '09:00', assignedPhlebotomistName: 'أحمد المطيري', assignedAt: '2026-07-28T06:30:00Z', completedAt: '2026-07-28T07:45:00Z', distanceKm: 15.3, createdBy: 'سالم المطيري', createdAt: '2026-07-28T06:00:00Z', updatedAt: '2026-07-28T07:45:00Z' },
  { id: 'hv-004', requestNumber: 'HV-20260728-004', branchId: 'br-001', patientId: 'p-004', patientName: 'محمد بن أحمد السبيعي', patientPhone: '0523456789', status: 'pending', priority: 'normal', patientAddress: 'حي الياسمين، الرياض', patientCity: 'الرياض', preferredDate: '2026-07-28', preferredTimeStart: '14:00', preferredTimeEnd: '16:00', distanceKm: 20.1, createdBy: 'ندى القحطاني', createdAt: '2026-07-28T08:45:00Z', updatedAt: '2026-07-28T08:45:00Z' },
  { id: 'hv-005', requestNumber: 'HV-20260728-005', branchId: 'br-001', patientId: 'p-005', patientName: 'نورة بنت سعد الدوسري', patientPhone: '0534445566', status: 'sample-collected', priority: 'normal', patientAddress: 'حي الشفا، الرياض', patientCity: 'الرياض', preferredDate: '2026-07-28', assignedPhlebotomistName: 'سعد الحربي', assignedAt: '2026-07-28T07:00:00Z', enRouteAt: '2026-07-28T08:00:00Z', distanceKm: 6.8, createdBy: 'سالم المطيري', createdAt: '2026-07-28T06:30:00Z', updatedAt: '2026-07-28T09:00:00Z' },
];

const STATUS_CONFIG: Record<HomeVisitStatus, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'قيد الانتظار', icon: <Clock className="w-3.5 h-3.5" /> },
  assigned: { color: 'bg-blue-100 text-blue-700', label: 'تم التعيين', icon: <User className="w-3.5 h-3.5" /> },
  'en-route': { color: 'bg-purple-100 text-purple-700', label: 'في الطريق', icon: <Car className="w-3.5 h-3.5" /> },
  'sample-collected': { color: 'bg-orange-100 text-orange-700', label: 'تم جمع العينة', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  completed: { color: 'bg-green-100 text-green-700', label: 'مكتمل', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'ملغي', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  normal: { label: 'عادي', color: 'bg-surface-100 text-surface-600' },
  urgent: { label: 'عاجل', color: 'bg-orange-100 text-orange-700' },
  vip: { label: 'VIP', color: 'bg-purple-100 text-purple-700' },
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function HomeVisitsPage() {
  const [activeTab, setActiveTab] = React.useState('all');
  const [showForm, setShowForm] = React.useState(false);

  const filteredVisits = React.useMemo(() => {
    return MOCK_HOME_VISITS.filter((v) => {
      if (activeTab === 'all') return true;
      return v.status === activeTab;
    });
  }, [activeTab]);

  const stats = React.useMemo(() => ({
    total: MOCK_HOME_VISITS.length,
    active: MOCK_HOME_VISITS.filter((v) => ['pending', 'assigned', 'en-route', 'sample-collected'].includes(v.status)).length,
    completed: MOCK_HOME_VISITS.filter((v) => v.status === 'completed').length,
    completionRate: Math.round((MOCK_HOME_VISITS.filter((v) => v.status === 'completed').length / MOCK_HOME_VISITS.length) * 100),
    avgDistance: '12.6 كم',
  }), []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">الزيارات المنزلية</h1>
          <p className="text-sm text-surface-500 mt-1">إدارة طلبات جمع العينات المنزلية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>تصدير</Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(!showForm)}>
            طلب جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="طلبات اليوم" value={stats.total} icon={<Home className="h-5 w-5 text-teal-600" />} iconBg="bg-teal-50" />
        <StatCard title="نشطة" value={stats.active} icon={<Clock className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="مكتملة" value={stats.completed} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="متوسط المسافة" value={stats.avgDistance} icon={<MapPin className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" />
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <HomeVisitRequestForm
              onSubmit={(data) => { console.log('Home visit:', data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({MOCK_HOME_VISITS.length})</TabsTrigger>
          <TabsTrigger value="pending">معلق</TabsTrigger>
          <TabsTrigger value="assigned">معيّن</TabsTrigger>
          <TabsTrigger value="en-route">في الطريق</TabsTrigger>
          <TabsTrigger value="completed">مكتمل</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main List */}
            <div className="lg:col-span-2 space-y-3">
              {filteredVisits.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Home className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500">لا توجد طلبات في هذه الفئة</p>
                  </div>
                </Card>
              ) : (
                filteredVisits.map((hv) => {
                  const statusCfg = STATUS_CONFIG[hv.status];
                  const priorityCfg = PRIORITY_CONFIG[hv.priority];
                  return (
                    <Card key={hv.id} padding="none">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-surface-900">{hv.patientName}</p>
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', priorityCfg.color)}>{priorityCfg.label}</span>
                            </div>
                            <p className="text-sm text-surface-500 flex items-center gap-1 mb-2">
                              <MapPin className="w-3.5 h-3.5" />
                              {hv.patientAddress}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{hv.patientPhone}</span>
                              {hv.assignedPhlebotomistName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{hv.assignedPhlebotomistName}</span>}
                              {hv.distanceKm && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{hv.distanceKm} كم</span>}
                              {hv.estimatedArrivalMinutes && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{hv.estimatedArrivalMinutes} دقيقة</span>}
                            </div>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0', statusCfg.color)}>
                            {statusCfg.icon}
                            <span className="hidden sm:inline">{statusCfg.label}</span>
                          </span>
                        </div>

                        {hv.status === 'en-route' && (
                          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Car className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-purple-700">في الطريق إلى المريض</span>
                            </div>
                            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 2 }} className="h-full bg-purple-500 rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Map placeholder */}
                      <div className="h-32 bg-surface-100 border-t border-surface-100 flex items-center justify-center text-surface-300">
                        <div className="text-center">
                          <MapPin className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">خريطة الموقع</span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Sidebar — Assignment Panel */}
            <div className="space-y-4">
              <Card>
                <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
                  <h3 className="font-bold text-surface-900">الفنيون المتاحون</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'أحمد المطيري', status: 'busy', visits: 2 },
                    { name: 'سعد الحربي', status: 'available', visits: 1 },
                    { name: 'فهد الشمري', status: 'available', visits: 0 },
                    { name: 'عمر القحطاني', status: 'off-duty', visits: 0 },
                  ].map((ph) => (
                    <div key={ph.name} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                        {ph.name.split(' ')[0][0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-surface-900">{ph.name}</p>
                        <p className="text-xs text-surface-500">{ph.visits} زيارات نشطة</p>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ph.status === 'available' ? 'bg-green-100 text-green-700' : ph.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-surface-200 text-surface-500')}>
                        {ph.status === 'available' ? 'متاح' : ph.status === 'busy' ? 'مشغول' : 'خارج الخدمة'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
                  <h3 className="font-bold text-surface-900">ملخص الأداء</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">نسبة الإنجاز</span>
                    <span className="font-bold text-green-600">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.completionRate}%` }} transition={{ duration: 1 }} className="h-full bg-green-500 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">متوسط وقت الإنجاز</span>
                    <span className="font-bold text-surface-900">45 دقيقة</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">إجمالي المسافة</span>
                    <span className="font-bold text-surface-900">62.9 كم</span>
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
