'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, CheckCircle2, XCircle, AlertTriangle, Filter, Download,
  RefreshCw, Settings, Trash2, Plus, Eye, ArrowRight, ArrowLeft, Zap,
  Star, Timer, BarChart3, History, UserCheck, Loader2,
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
import {
  QueueBoard,
  QueueStatsBar,
  ServicePointCard,
} from '@/components/reception/ReceptionComponents';
import type {
  QueueEntry, QueueServicePoint, QueueStats, QueuePriority, QueueStatus,
} from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_QUEUE_ENTRIES: QueueEntry[] = [
  { id: 'qe-001', ticketNumber: 'Q-20260728-0001', branchId: 'br-001', patientName: 'أحمد بن سعيد العتيبي', patientPhone: '0551234567', serviceType: 'walk-in', priority: 'normal', status: 'waiting', createdAt: '2026-07-28T08:15:00Z', updatedAt: '2026-07-28T08:15:00Z', estimatedWaitMinutes: 12 },
  { id: 'qe-002', ticketNumber: 'Q-20260728-0002', branchId: 'br-001', patientName: 'فاطمة بنت محمد القحطاني', patientPhone: '0559876543', serviceType: 'appointment', priority: 'vip', status: 'waiting', createdAt: '2026-07-28T08:20:00Z', updatedAt: '2026-07-28T08:20:00Z', estimatedWaitMinutes: 5 },
  { id: 'qe-003', ticketNumber: 'Q-20260728-0003', branchId: 'br-001', patientName: 'خالد بن عبدالله الشمري', patientPhone: '0541112233', serviceType: 'walk-in', priority: 'emergency', status: 'waiting', createdAt: '2026-07-28T08:25:00Z', updatedAt: '2026-07-28T08:25:00Z', estimatedWaitMinutes: 2 },
  { id: 'qe-004', ticketNumber: 'Q-20260728-0004', branchId: 'br-001', patientName: 'نورة بنت سعد الدوسري', patientPhone: '0534445566', serviceType: 'walk-in', priority: 'normal', status: 'waiting', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:30:00Z', estimatedWaitMinutes: 15 },
  { id: 'qe-005', ticketNumber: 'Q-20260728-0005', branchId: 'br-001', patientName: 'عبدالرحمن بن فيصل المطيري', patientPhone: '0567890123', serviceType: 'home-visit', priority: 'priority', status: 'waiting', createdAt: '2026-07-28T08:35:00Z', updatedAt: '2026-07-28T08:35:00Z', estimatedWaitMinutes: 8 },
  { id: 'qe-006', ticketNumber: 'Q-20260728-0006', branchId: 'br-001', patientName: 'سارة بنت خالد العتيبي', patientPhone: '0512345678', serviceType: 'walk-in', priority: 'normal', status: 'serving', createdAt: '2026-07-28T08:00:00Z', updatedAt: '2026-07-28T08:40:00Z', startedServingAt: '2026-07-28T08:40:00Z', servicePoint: 'كاونتر 1' },
  { id: 'qe-007', ticketNumber: 'Q-20260728-0007', branchId: 'br-001', patientName: 'محمد بن أحمد السبيعي', patientPhone: '0523456789', serviceType: 'appointment', priority: 'normal', status: 'completed', createdAt: '2026-07-28T07:50:00Z', updatedAt: '2026-07-28T08:38:00Z', completedAt: '2026-07-28T08:38:00Z' },
  { id: 'qe-008', ticketNumber: 'Q-20260728-0008', branchId: 'br-001', patientName: 'هدى بنت عمر الغامدي', patientPhone: '0534567890', serviceType: 'walk-in', priority: 'normal', status: 'completed', createdAt: '2026-07-28T07:30:00Z', updatedAt: '2026-07-28T08:35:00Z', completedAt: '2026-07-28T08:35:00Z' },
  { id: 'qe-009', ticketNumber: 'Q-20260728-0009', branchId: 'br-001', patientName: 'يوسف بن سليمان الزهراني', patientPhone: '0545678901', serviceType: 'walk-in', priority: 'normal', status: 'cancelled', createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T08:00:00Z' },
  { id: 'qe-010', ticketNumber: 'Q-20260728-0010', branchId: 'br-001', patientName: 'رائد بن فهد الحربي', patientPhone: '0556789012', serviceType: 'walk-in', priority: 'normal', status: 'completed', createdAt: '2026-07-28T07:15:00Z', updatedAt: '2026-07-28T08:20:00Z', completedAt: '2026-07-28T08:20:00Z' },
  { id: 'qe-011', ticketNumber: 'Q-20260728-0011', branchId: 'br-001', patientName: 'لمياء بنت ناصر السبيعي', patientPhone: '0567890123', serviceType: 'consultation', priority: 'priority', status: 'completed', createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T08:10:00Z', completedAt: '2026-07-28T08:10:00Z' },
  { id: 'qe-012', ticketNumber: 'Q-20260728-0012', branchId: 'br-001', patientName: 'عمر بن خالد الفيصل', patientPhone: '0578901234', serviceType: 'walk-in', priority: 'normal', status: 'no-show', createdAt: '2026-07-28T06:45:00Z', updatedAt: '2026-07-28T07:30:00Z' },
];

const MOCK_SERVICE_POINTS: QueueServicePoint[] = [
  { id: 'sp-001', branchId: 'br-001', name: 'كاونتر 1', type: 'counter', status: 'active', currentQueueEntryId: 'qe-006', maxConcurrent: 1, averageServiceMinutes: 10, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T08:40:00Z' },
  { id: 'sp-002', branchId: 'br-001', name: 'كاونتر 2', type: 'counter', status: 'active', maxConcurrent: 1, averageServiceMinutes: 12, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
  { id: 'sp-003', branchId: 'br-001', name: 'كاونتر 3', type: 'counter', status: 'active', maxConcurrent: 1, averageServiceMinutes: 8, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
  { id: 'sp-004', branchId: 'br-001', name: 'صالة VIP', type: 'vip', status: 'active', maxConcurrent: 2, averageServiceMinutes: 15, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
  { id: 'sp-005', branchId: 'br-001', name: 'غرفة الطوارئ', type: 'emergency', status: 'maintenance', maxConcurrent: 1, averageServiceMinutes: 20, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
];

const MOCK_QUEUE_STATS: QueueStats = {
  totalWaiting: 5, totalServing: 1, totalCompletedToday: 6, totalNoShow: 1,
  averageWaitMinutes: 14, longestWaitMinutes: 35, estimatedNextWait: 8,
  byPriority: { emergency: 1, vip: 1, priority: 1, normal: 2 },
  byServiceType: { walkIn: 3, appointment: 1, homeVisit: 1, consultation: 0 },
  servicePoints: { total: 5, active: 4, busy: 1, idle: 3 },
  hourlyDistribution: [
    { hour: '07', count: 2 }, { hour: '08', count: 6 }, { hour: '09', count: 10 },
    { hour: '10', count: 14 }, { hour: '11', count: 12 }, { hour: '12', count: 5 },
    { hour: '13', count: 3 }, { hour: '14', count: 8 }, { hour: '15', count: 6 },
  ],
};

const QUEUE_HISTORY: { time: string; ticket: string; patient: string; servicePoint: string; duration: string; status: string }[] = [
  { time: '08:38', ticket: 'Q-0007', patient: 'محمد السبيعي', servicePoint: 'كاونتر 2', duration: '48 دقيقة', status: 'completed' },
  { time: '08:35', ticket: 'Q-0008', patient: 'هدى الغامدي', servicePoint: 'كاونتر 1', duration: '65 دقيقة', status: 'completed' },
  { time: '08:20', ticket: 'Q-0010', patient: 'رائد الحربي', servicePoint: 'كاونتر 1', duration: '65 دقيقة', status: 'completed' },
  { time: '08:10', ticket: 'Q-0011', patient: 'لمياء السبيعي', servicePoint: 'صالة VIP', duration: '70 دقيقة', status: 'completed' },
  { time: '07:30', ticket: 'Q-0012', patient: 'عمر الفيصل', servicePoint: '—', duration: '45 دقيقة', status: 'no-show' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  waiting: { color: 'bg-yellow-100 text-yellow-700', label: 'بانتظار' },
  serving: { color: 'bg-brand-100 text-brand-700', label: 'قيد الخدمة' },
  completed: { color: 'bg-green-100 text-green-700', label: 'مكتمل' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'ملغي' },
  'no-show': { color: 'bg-orange-100 text-orange-700', label: 'لم يحضر' },
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function QueueManagementPage() {
  const [activeTab, setActiveTab] = React.useState('queue');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedEntry, setSelectedEntry] = React.useState<QueueEntry | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);

  const filteredEntries = React.useMemo(() => {
    return MOCK_QUEUE_ENTRIES.filter((e) => {
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;
      const matchesSearch = !searchQuery || e.patientName.includes(searchQuery) || e.ticketNumber.includes(searchQuery);
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [statusFilter, priorityFilter, searchQuery]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_QUEUE_ENTRIES.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return counts;
  }, []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">إدارة الطابور</h1>
          <p className="text-sm text-surface-500 mt-1">إدارة قوائم الانتظار ونقاط الخدمة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            تصدير البيانات
          </Button>
          <Button variant="outline" size="sm" icon={<Settings className="w-4 h-4" />} onClick={() => setShowSettings(!showSettings)}>
            إعدادات
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            إضافة نقاط خدمة
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <QueueStatsBar stats={MOCK_QUEUE_STATS} />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-surface-900">إعدادات الطابور</h3>
                <button onClick={() => setShowSettings(false)} className="text-surface-400 hover:text-surface-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">هدف وقت الانتظار (دقيقة)</label>
                  <input type="number" defaultValue={20} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1"> تعزيز الأولوية (دقيقة)</label>
                  <input type="number" defaultValue={10} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">حد انتظار VIP (دقيقة)</label>
                  <input type="number" defaultValue={5} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-500" />
                    <span className="text-sm text-surface-600">تعيين تلقائي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-500" />
                    <span className="text-sm text-surface-600">إشعار صوتي</span>
                  </label>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">القائمة الحية</TabsTrigger>
          <TabsTrigger value="points">نقاط الخدمة</TabsTrigger>
          <TabsTrigger value="history">سجل اليوم</TabsTrigger>
          <TabsTrigger value="bulk">عمليات مجمعة</TabsTrigger>
        </TabsList>

        {/* Live Queue Tab */}
        <TabsContent value="queue" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <SearchInput placeholder="بحث بالاسم أو رقم التذكرة..." className="flex-1 w-full sm:w-auto" onSearch={setSearchQuery} />
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'waiting', label: 'بانتظار' },
                { key: 'serving', label: 'قيد الخدمة' },
                { key: 'completed', label: 'مكتمل' },
                { key: 'no-show', label: 'لم يحضر' },
                { key: 'cancelled', label: 'ملغي' },
              ].map((f) => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', statusFilter === f.key ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-600 hover:bg-surface-200')}>
                  {f.label}
                  {f.key !== 'all' && statusCounts[f.key] && <span className="mr-1 opacity-70">({statusCounts[f.key]})</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'emergency', label: 'طوارئ', icon: <Zap className="w-3 h-3" /> },
                { key: 'vip', label: 'VIP', icon: <Star className="w-3 h-3" /> },
                { key: 'priority', label: 'أولوية', icon: <AlertTriangle className="w-3 h-3" /> },
                { key: 'normal', label: 'عادي' },
              ].map((f) => (
                <button key={f.key} onClick={() => setPriorityFilter(f.key)} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', priorityFilter === f.key ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-600 hover:bg-surface-200')}>
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <Card padding="none">
            <div className="max-h-[500px] overflow-y-auto">
              <QueueBoard
                entries={filteredEntries}
                onCallNext={() => {}}
                onSelectEntry={setSelectedEntry}
                selectedEntryId={selectedEntry?.id}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Service Points Tab */}
        <TabsContent value="points" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_SERVICE_POINTS.map((sp) => (
              <ServicePointCard
                key={sp.id}
                point={sp}
                currentEntry={sp.currentQueueEntryId ? MOCK_QUEUE_ENTRIES.find((e) => e.id === sp.currentQueueEntryId) : undefined}
                onCallNext={() => {}}
              />
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6 space-y-4">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900">سجل الطابور - اليوم</h3>
                <p className="text-xs text-surface-500 mt-0.5">{QUEUE_HISTORY.length} عملية مسجلة</p>
              </div>
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>تصدير</Button>
            </div>
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th>الوقت</Th>
                  <Th>رقم التذكرة</Th>
                  <Th>المريض</Th>
                  <Th>نقطة الخدمة</Th>
                  <Th>المدة</Th>
                  <Th>الحالة</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {QUEUE_HISTORY.map((h, i) => (
                  <TableRow key={i} hoverable>
                    <Td className="text-sm font-mono">{h.time}</Td>
                    <Td className="text-sm font-mono font-medium text-brand-600">{h.ticket}</Td>
                    <Td className="text-sm font-semibold">{h.patient}</Td>
                    <Td className="text-sm text-surface-600">{h.servicePoint}</Td>
                    <Td className="text-sm text-surface-500">{h.duration}</Td>
                    <Td>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[h.status]?.color)}>
                        {STATUS_CONFIG[h.status]?.label}
                      </span>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-brand-600" />
                </div>
                <h4 className="font-bold text-surface-900">إنشاء مجمّع</h4>
                <p className="text-xs text-surface-500 mt-1">إضافة عدة مرضى للطابور دفعة واحدة</p>
              </div>
            </Card>
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-bold text-surface-900">إلغاء مجمّع</h4>
                <p className="text-xs text-surface-500 mt-1">إلغاء عدة تذاكر في وقت واحد</p>
              </div>
            </Card>
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-surface-900">إكمال مجمّع</h4>
                <p className="text-xs text-surface-500 mt-1">إكمال عدة خدمات في وقت واحد</p>
              </div>
            </Card>
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-info-100 flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="w-6 h-6 text-info-600" />
                </div>
                <h4 className="font-bold text-surface-900">تحويل مجمّع</h4>
                <p className="text-xs text-surface-500 mt-1">تحويل عدة مرضى إلى فرع آخر</p>
              </div>
            </Card>
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-surface-900">إعادة تعيين</h4>
                <p className="text-xs text-surface-500 mt-1">إعادة ترتيب الطابور بالكامل</p>
              </div>
            </Card>
            <Card hover className="cursor-pointer">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-bold text-surface-900">مسح المكتمل</h4>
                <p className="text-xs text-surface-500 mt-1">حذف المكتمل من القائمة</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
