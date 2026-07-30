'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, AlertTriangle, Clock, CheckCircle2, XCircle, Stethoscope,
  Download, Plus, Phone, Activity, Thermometer, Wind, Droplets,
  ArrowRight, User, Timer,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import {
  Table, TableHeader, TableBody, TableRow, Th, Td,
} from '@/design-system/layout/Table';
import { cn } from '@/lib/utils';
import { EmergencyRegistrationForm } from '@/components/reception/ReceptionComponents';
import type { EmergencyCase, EmergencySeverity, EmergencyStatus } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_EMERGENCIES: EmergencyCase[] = [
  { id: 'em-001', caseNumber: 'EMG-20260728-001', branchId: 'br-001', patientName: 'خالد بن عبدالله الشمري', severityLevel: 'urgent', symptoms: 'ألم شديد في الصدر، صعوبة في التنفس', vitals: { bloodPressure: '140/90', heartRate: 95, temperature: 37.8, oxygenSaturation: 94, respiratoryRate: 22 }, assignedDoctorName: 'د. سارة الأحمد', status: 'in-treatment', createdAt: '2026-07-28T08:25:00Z', updatedAt: '2026-07-28T08:35:00Z' },
  { id: 'em-002', caseNumber: 'EMG-20260728-002', branchId: 'br-001', patientName: 'رائد بن فهد الحربي', severityLevel: 'moderate', symptoms: 'دوخة وغثيان منذ الصباح', vitals: { bloodPressure: '110/70', heartRate: 78, temperature: 36.8, oxygenSaturation: 97 }, assignedDoctorName: 'د. محمد الراشد', status: 'triaged', createdAt: '2026-07-28T07:45:00Z', updatedAt: '2026-07-28T08:00:00Z' },
  { id: 'em-003', caseNumber: 'EMG-20260728-003', branchId: 'br-001', patientName: 'عمر بن خالد الفيصل', severityLevel: 'critical', symptoms: 'فقدان الوعي، نزيف من الأنف', vitals: { bloodPressure: '90/60', heartRate: 110, temperature: 38.5, oxygenSaturation: 88, respiratoryRate: 28 }, status: 'transferred', transferredTo: 'مستشفى الملك فيصل التخصصي', transferNotes: 'حاجة لعناية مركزة', createdAt: '2026-07-28T06:45:00Z', updatedAt: '2026-07-28T07:30:00Z' },
  { id: 'em-004', caseNumber: 'EMG-20260728-004', branchId: 'br-001', patientName: 'هدى بنت عمر الغامدي', severityLevel: 'moderate', symptoms: 'حساسية شديدة بعد أخذ دواء', vitals: { bloodPressure: '120/80', heartRate: 88, temperature: 37.2, oxygenSaturation: 96 }, assignedDoctorName: 'د. نورا الحربي', status: 'stabilized', createdAt: '2026-07-28T08:40:00Z', updatedAt: '2026-07-28T09:00:00Z' },
];

const SEVERITY_CONFIG: Record<EmergencySeverity, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-400', label: 'حرج', icon: <Heart className="w-3.5 h-3.5" /> },
  urgent: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-400', label: 'عاجل', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  moderate: { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400', label: 'متوسط', icon: <Activity className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<EmergencyStatus, { color: string; label: string }> = {
  triaged: { color: 'bg-blue-100 text-blue-700', label: 'تم الفرز' },
  'in-treatment': { color: 'bg-orange-100 text-orange-700', label: 'قيد العلاج' },
  stabilized: { color: 'bg-green-100 text-green-700', label: 'مستقر' },
  transferred: { color: 'bg-purple-100 text-purple-700', label: 'منقول للمستشفى' },
  completed: { color: 'bg-green-100 text-green-700', label: 'مكتمل' },
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = React.useState('active');
  const [showForm, setShowForm] = React.useState(false);

  const activeCases = MOCK_EMERGENCIES.filter((e) => ['triaged', 'in-treatment', 'stabilized'].includes(e.status));
  const stats = React.useMemo(() => ({
    total: MOCK_EMERGENCIES.length,
    active: activeCases.length,
    critical: MOCK_EMERGENCIES.filter((e) => e.severityLevel === 'critical').length,
    transferred: MOCK_EMERGENCIES.filter((e) => e.status === 'transferred').length,
    avgResponse: '4 دقائق',
  }), [activeCases]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header — Red themed */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-l from-red-50 to-orange-50 rounded-2xl p-5 border border-red-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center animate-pulse">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-900">الطوارئ</h1>
            <p className="text-sm text-red-600 mt-1">إدارة حالات الطوارئ والفرز</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" icon={<Download className="w-4 h-4" />}>تصدير</Button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            تسجيل طوارئ
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="حالات اليوم" value={stats.total} icon={<Heart className="h-5 w-5 text-red-600" />} iconBg="bg-red-50" />
        <StatCard title="نشطة" value={stats.active} icon={<Activity className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" />
        <StatCard title="حرجة" value={stats.critical} icon={<AlertTriangle className="h-5 w-5 text-red-700" />} iconBg="bg-red-100" />
        <StatCard title="متوسط الاستجابة" value={stats.avgResponse} icon={<Timer className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <EmergencyRegistrationForm
              onSubmit={(data) => { console.log('Emergency:', data); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => {
          const count = MOCK_EMERGENCIES.filter((e) => e.severityLevel === key).length;
          return (
            <div key={key} className={cn('p-4 rounded-xl border-2', cfg.border, cfg.bg)}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cfg.color}>{cfg.icon}</span>
                <span className={cn('font-semibold', cfg.color)}>{cfg.label}</span>
              </div>
              <p className={cn('text-3xl font-bold', cfg.color)}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">الحالات النشطة ({activeCases.length})</TabsTrigger>
          <TabsTrigger value="all">جميع الحالات</TabsTrigger>
          <TabsTrigger value="transferred">منقول</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-3">
          {(activeTab === 'active' ? activeCases : activeTab === 'transferred' ? MOCK_EMERGENCIES.filter((e) => e.status === 'transferred') : MOCK_EMERGENCIES).map((em) => {
            const severityCfg = SEVERITY_CONFIG[em.severityLevel];
            const statusCfg = STATUS_CONFIG[em.status];
            return (
              <Card key={em.id} padding="none" className={cn(em.severityLevel === 'critical' && 'border-red-300 animate-pulse')}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-red-600">{em.caseNumber}</span>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', severityCfg.bg, severityCfg.color, severityCfg.border, 'border')}>
                          {severityCfg.icon}
                          {severityCfg.label}
                        </span>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="font-bold text-surface-900 text-lg mb-1">{em.patientName}</p>
                      <p className="text-sm text-surface-600 mb-3">{em.symptoms}</p>

                      {/* Vitals */}
                      {em.vitals && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {em.vitals.bloodPressure && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100">
                              <Droplets className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-xs font-mono font-semibold text-red-700">{em.vitals.bloodPressure}</span>
                            </div>
                          )}
                          {em.vitals.heartRate && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 border border-pink-100">
                              <Heart className="w-3.5 h-3.5 text-pink-500" />
                              <span className="text-xs font-mono font-semibold text-pink-700">{em.vitals.heartRate} bpm</span>
                            </div>
                          )}
                          {em.vitals.temperature && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-xs font-mono font-semibold text-orange-700">{em.vitals.temperature}°C</span>
                            </div>
                          )}
                          {em.vitals.oxygenSaturation && (
                            <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border', em.vitals.oxygenSaturation < 92 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
                              <Wind className={cn('w-3.5 h-3.5', em.vitals.oxygenSaturation < 92 ? 'text-red-500' : 'text-green-500')} />
                              <span className={cn('text-xs font-mono font-semibold', em.vitals.oxygenSaturation < 92 ? 'text-red-700' : 'text-green-700')}>{em.vitals.oxygenSaturation}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
                        {em.assignedDoctorName && <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{em.assignedDoctorName}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(em.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                        {em.transferredTo && <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{em.transferredTo}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="اتصال"><Phone className="w-4 h-4 text-red-400" /></button>
                      {em.status !== 'transferred' && em.status !== 'completed' && (
                        <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors" title="تحويل للمستشفى">
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {(activeTab === 'active' ? activeCases : activeTab === 'transferred' ? MOCK_EMERGENCIES.filter((e) => e.status === 'transferred') : MOCK_EMERGENCIES).length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">لا توجد حالات طوارئ في هذه الفئة</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
