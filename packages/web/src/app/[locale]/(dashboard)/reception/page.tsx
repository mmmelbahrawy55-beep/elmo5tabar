'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Clock, CheckCircle2, AlertTriangle, Bell, BellRing,
  Shield, ArrowRightLeft, Home, Heart, Search, Volume2, VolumeX,
  Keyboard, Monitor, RefreshCw, Zap, Star, Activity, Stethoscope,
  Building2, Car, UserCheck, Timer, Eye, X,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput } from '@/design-system/forms/FormField';
import { cn } from '@/lib/utils';
import {
  QueueBoard,
  QueueStatsBar,
  ServicePointCard,
  PatientSearchPanel,
  WalkInForm,
  InsuranceVerificationPanel,
  TransferForm,
  HomeVisitRequestForm,
  EmergencyRegistrationForm,
  BarcodeGenerator,
  KeyboardShortcutsHelp,
  ReceptionActivityFeed,
} from '@/components/reception/ReceptionComponents';
import {
  useQueueStore,
  useReceptionStore,
  useReceptionUIStore,
} from '@/stores/reception';
import type {
  QueueEntry,
  QueueServicePoint,
  QueueStats,
  QueuePriority,
  WalkInRegistration,
  InsuranceVerification,
  BranchTransfer,
  HomeVisitRequest,
  EmergencyCase,
  PatientSearchResult,
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
  { id: 'qe-007', ticketNumber: 'Q-20260728-0007', branchId: 'br-001', patientName: 'محمد بن أحمد السبيعي', patientPhone: '0523456789', serviceType: 'appointment', priority: 'normal', status: 'serving', createdAt: '2026-07-28T07:50:00Z', updatedAt: '2026-07-28T08:38:00Z', startedServingAt: '2026-07-28T08:38:00Z', servicePoint: 'كاونتر 2' },
  { id: 'qe-008', ticketNumber: 'Q-20260728-0008', branchId: 'br-001', patientName: 'هدى بنت عمر الغامدي', patientPhone: '0534567890', serviceType: 'walk-in', priority: 'normal', status: 'completed', createdAt: '2026-07-28T07:30:00Z', updatedAt: '2026-07-28T08:35:00Z', completedAt: '2026-07-28T08:35:00Z' },
  { id: 'qe-009', ticketNumber: 'Q-20260728-0009', branchId: 'br-001', patientName: 'يوسف بن سليمان الزهراني', patientPhone: '0545678901', serviceType: 'walk-in', priority: 'normal', status: 'completed', createdAt: '2026-07-28T07:45:00Z', updatedAt: '2026-07-28T08:30:00Z', completedAt: '2026-07-28T08:30:00Z' },
  { id: 'qe-010', ticketNumber: 'Q-20260728-0010', branchId: 'br-001', patientName: 'رائد بن فهد الحربي', patientPhone: '0556789012', serviceType: 'walk-in', priority: 'normal', status: 'cancelled', createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T08:00:00Z' },
];

const MOCK_SERVICE_POINTS: QueueServicePoint[] = [
  { id: 'sp-001', branchId: 'br-001', name: 'كاونتر 1', type: 'counter', status: 'active', currentQueueEntryId: 'qe-006', maxConcurrent: 1, averageServiceMinutes: 10, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T08:40:00Z' },
  { id: 'sp-002', branchId: 'br-001', name: 'كاونتر 2', type: 'counter', status: 'active', currentQueueEntryId: 'qe-007', maxConcurrent: 1, averageServiceMinutes: 12, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T08:38:00Z' },
  { id: 'sp-003', branchId: 'br-001', name: 'كاونتر 3', type: 'counter', status: 'active', maxConcurrent: 1, averageServiceMinutes: 8, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
  { id: 'sp-004', branchId: 'br-001', name: 'صالة VIP', type: 'vip', status: 'active', maxConcurrent: 2, averageServiceMinutes: 15, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
  { id: 'sp-005', branchId: 'br-001', name: 'غرفة الطوارئ', type: 'emergency', status: 'inactive', maxConcurrent: 1, averageServiceMinutes: 20, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
];

const MOCK_QUEUE_STATS: QueueStats = {
  totalWaiting: 5,
  totalServing: 2,
  totalCompletedToday: 18,
  totalNoShow: 1,
  averageWaitMinutes: 14,
  longestWaitMinutes: 35,
  estimatedNextWait: 8,
  byPriority: { emergency: 1, vip: 1, priority: 1, normal: 2 },
  byServiceType: { walkIn: 3, appointment: 1, homeVisit: 1, consultation: 0 },
  servicePoints: { total: 5, active: 4, busy: 2, idle: 2 },
  hourlyDistribution: [
    { hour: '08', count: 5 }, { hour: '09', count: 8 }, { hour: '10', count: 12 },
    { hour: '11', count: 10 }, { hour: '12', count: 6 }, { hour: '13', count: 3 },
    { hour: '14', count: 9 }, { hour: '15', count: 7 }, { hour: '16', count: 4 },
  ],
};

const MOCK_VERIFICATIONS: InsuranceVerification[] = [
  { id: 'iv-001', verificationNumber: 'VER-20260728-001', branchId: 'br-001', patientId: 'p-001', insuranceProvider: 'التأمين الطبي الدولي', insuranceNumber: 'INS-789456', verificationStatus: 'verified', coveragePercentage: 80, coveredAmount: 400, totalAmount: 500, approvalCode: 'APR-20260728-5512', createdAt: '2026-07-28T08:10:00Z', updatedAt: '2026-07-28T08:12:00Z' },
  { id: 'iv-002', verificationNumber: 'VER-20260728-002', branchId: 'br-001', patientId: 'p-002', insuranceProvider: 'بوبا للتأمين', insuranceNumber: 'INS-321654', verificationStatus: 'pending', coveragePercentage: 70, createdAt: '2026-07-28T08:25:00Z', updatedAt: '2026-07-28T08:25:00Z' },
  { id: 'iv-003', verificationNumber: 'VER-20260728-003', branchId: 'br-001', patientId: 'p-003', insuranceProvider: 'ميدغلف', insuranceNumber: 'INS-987123', verificationStatus: 'rejected', rejectionReason: 'البوليصة منتهية الصلاحية', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:32:00Z' },
];

const MOCK_RECENT_WALKINS: WalkInRegistration[] = [
  { id: 'wk-001', registrationNumber: 'WK-20260728-001', branchId: 'br-001', isNewPatient: false, patientName: 'أحمد بن سعيد العتيبي', patientPhone: '0551234567', requestedServices: ['cbc', 'glucose'], referralSource: 'walk-in', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:15:00Z', updatedAt: '2026-07-28T08:15:00Z' },
  { id: 'wk-002', registrationNumber: 'WK-20260728-002', branchId: 'br-001', isNewPatient: true, patientName: 'نورة بنت سعد الدوسري', patientPhone: '0534445566', requestedServices: ['lipid', 'thyroid'], referralSource: 'doctor-referral', insuranceProvider: 'التأمين الطبي الدولي', insuranceNumber: 'INS-789456', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:30:00Z' },
  { id: 'wk-003', registrationNumber: 'WK-20260728-003', branchId: 'br-001', isNewPatient: false, patientName: 'سارة بنت خالد العتيبي', patientPhone: '0512345678', requestedServices: ['cbc', 'lipid', 'glucose', 'vitamin_d'], referralSource: 'online', registeredBy: 'سالم المطيري', createdAt: '2026-07-28T08:00:00Z', updatedAt: '2026-07-28T08:00:00Z' },
];

const MOCK_ACTIVITIES = [
  { action: 'queue-call', user: 'سالم المطيري', details: 'استدعاء المريض أحمد العتيبي - كاونتر 1', time: 'منذ 2 دقيقة' },
  { action: 'walk-in', user: 'سالم المطيري', details: 'تسجيل حضور جديد: نورة الدوسري', time: 'منذ 8 دقيقة' },
  { action: 'insurance', user: 'سالم المطيري', details: 'تحقق من التأمين: التأمين الطبي الدولي - موثق', time: 'منذ 12 دقيقة' },
  { action: 'queue-complete', user: 'ندى القحطاني', details: 'إكمال خدمة: هدى الغامدي', time: 'منذ 15 دقيقة' },
  { action: 'queue-call', user: 'سالم المطيري', details: 'استدعاء المريض سارة العتيبي - كاونتر 2', time: 'منذ 20 دقيقة' },
  { action: 'emergency', user: 'سالم المطيري', details: 'تسجيل حالة طوارئ: خالد الشمري - مستوى عاجل', time: 'منذ 25 دقيقة' },
  { action: 'home-visit', user: 'ندى القحطاني', details: 'طلب زيارة منزلية: عبدالرحمن المطيري', time: 'منذ 30 دقيقة' },
  { action: 'transfer', user: 'سالم المطيري', details: 'تحويل فرع: يوسف الزهراني إلى جدة', time: 'منذ 45 دقيقة' },
];

const MOCK_BRANCHES = [
  { id: 'br-001', name: 'الرياض الرئيسي' },
  { id: 'br-002', name: 'جدة' },
  { id: 'br-003', name: 'الدمام' },
  { id: 'br-004', name: 'مكة المكرمة' },
  { id: 'br-005', name: 'المدينة المنورة' },
];

/* ──────────────────────────────────────────────────────────────────────────────
   KEYBOARD SHORTCUT HOOK
   ────────────────────────────────────────────────────────────────────────────── */

function useReceptionKeyboardShortcuts(handlers: {
  onWalkIn: () => void;
  onSearch: () => void;
  onInsurance: () => void;
  onRefresh: () => void;
  onCallNext: () => void;
  onTransfer: () => void;
  onHomeVisit: () => void;
  onEmergency: () => void;
  onQueueDisplay: () => void;
  onKeyboardHelp: () => void;
  onCloseModal: () => void;
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (true) {
        case e.key === 'F2': e.preventDefault(); handlers.onWalkIn(); break;
        case e.key === 'F3': e.preventDefault(); handlers.onSearch(); break;
        case e.key === 'F4': e.preventDefault(); handlers.onInsurance(); break;
        case e.key === 'F5': e.preventDefault(); handlers.onRefresh(); break;
        case e.key === 'F7': e.preventDefault(); handlers.onCallNext(); break;
        case e.key === 'F8': e.preventDefault(); handlers.onTransfer(); break;
        case e.key === 'F9': e.preventDefault(); handlers.onHomeVisit(); break;
        case e.key === 'F10': e.preventDefault(); handlers.onEmergency(); break;
        case e.key === 'F12': e.preventDefault(); handlers.onKeyboardHelp(); break;
        case e.key === 'Escape': handlers.onCloseModal(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function ReceptionDashboardPage() {
  const [selectedBranch, setSelectedBranch] = React.useState('br-001');
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [activeTab, setActiveTab] = React.useState('walk-in');
  const [showQueueDisplay, setShowQueueDisplay] = React.useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);
  const [showPatientSearch, setShowPatientSearch] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [showWalkInForm, setShowWalkInForm] = React.useState(false);
  const [showTransferForm, setShowTransferForm] = React.useState(false);
  const [showHomeVisitForm, setShowHomeVisitForm] = React.useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = React.useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = React.useState(false);
  const [lastCalledEntry, setLastCalledEntry] = React.useState<QueueEntry | null>(null);

  const [queueEntries] = React.useState<QueueEntry[]>(MOCK_QUEUE_ENTRIES);
  const [servicePoints] = React.useState<QueueServicePoint[]>(MOCK_SERVICE_POINTS);
  const [queueStats] = React.useState<QueueStats>(MOCK_QUEUE_STATS);
  const [selectedEntry, setSelectedEntry] = React.useState<QueueEntry | null>(null);

  const branchName = MOCK_BRANCHES.find((b) => b.id === selectedBranch)?.name || 'الرياض الرئيسي';

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const poll = setInterval(() => {
      // In production: fetchQueue(), fetchStats(), fetchServicePoints()
    }, 5000);
    return () => clearInterval(poll);
  }, [selectedBranch]);

  const handleCallNext = React.useCallback(() => {
    const waiting = queueEntries
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => {
        const pOrder: Record<QueuePriority, number> = { emergency: 0, vip: 1, priority: 2, normal: 3 };
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    if (waiting.length > 0) {
      setLastCalledEntry(waiting[0]);
      if (soundEnabled) {
        try {
          const audio = new Audio('/sounds/ding.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch { /* silent */ }
      }
    }
  }, [queueEntries, soundEnabled]);

  const keyboardHandlers = React.useMemo(() => ({
    onWalkIn: () => setShowWalkInForm(true),
    onSearch: () => setShowPatientSearch(true),
    onInsurance: () => setActiveTab('insurance'),
    onRefresh: () => { /* fetchQueue() */ },
    onCallNext: handleCallNext,
    onTransfer: () => setShowTransferForm(true),
    onHomeVisit: () => setShowHomeVisitForm(true),
    onEmergency: () => setShowEmergencyForm(true),
    onQueueDisplay: () => setShowQueueDisplay(true),
    onKeyboardHelp: () => setShowKeyboardHelp(true),
    onCloseModal: () => {
      setShowWalkInForm(false);
      setShowTransferForm(false);
      setShowHomeVisitForm(false);
      setShowEmergencyForm(false);
      setShowBarcodeModal(false);
      setShowPatientSearch(false);
      setShowKeyboardHelp(false);
    },
  }), [handleCallNext]);

  useReceptionKeyboardShortcuts(keyboardHandlers);

  const quickStats = React.useMemo(() => ({
    waiting: queueEntries.filter((e) => e.status === 'waiting').length,
    serving: queueEntries.filter((e) => e.status === 'serving').length,
    completed: queueEntries.filter((e) => e.status === 'completed').length,
    walkIns: MOCK_RECENT_WALKINS.length,
    insuranceVerified: MOCK_VERIFICATIONS.filter((v) => v.verificationStatus === 'verified').length,
    transfers: 3,
    homeVisits: 2,
    avgWait: queueStats.averageWaitMinutes,
  }), [queueEntries, queueStats]);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* ─── Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">لوحة الاستقبال</h1>
            <p className="text-xs text-surface-500">المختبر الشامل — {branchName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-surface-200 text-sm bg-surface-0 text-surface-600 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none"
          >
            {MOCK_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 border border-surface-200">
            <Clock className="w-3.5 h-3.5 text-surface-400" />
            <span className="text-sm font-mono font-semibold text-surface-700">
              {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowQueueDisplay(!showQueueDisplay)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showQueueDisplay ? 'bg-brand-100 text-brand-600' : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100',
              )}
              title="عرض شاشة الطابور"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              title="اختصارات لوحة المفاتيح (F12)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                soundEnabled ? 'text-surface-400 hover:text-surface-600 hover:bg-surface-100' : 'text-red-400 hover:text-red-500 hover:bg-red-50',
              )}
              title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard title="بانتظار" value={quickStats.waiting} icon={<Clock className="h-5 w-5 text-warning-600" />} iconBg="bg-warning-50" />
        <StatCard title="قيد الخدمة" value={quickStats.serving} icon={<Activity className="h-5 w-5 text-brand-600" />} iconBg="bg-brand-50" />
        <StatCard title="مكتمل اليوم" value={quickStats.completed} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="متوسط الانتظار" value={`${quickStats.avgWait} د`} icon={<Timer className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="حضور مباشر" value={quickStats.walkIns} icon={<UserPlus className="h-5 w-5 text-purple-600" />} iconBg="bg-purple-50" />
        <StatCard title="تأمين موثق" value={quickStats.insuranceVerified} icon={<Shield className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard title="تحويلات" value={quickStats.transfers} icon={<ArrowRightLeft className="h-5 w-5 text-orange-600" />} iconBg="bg-orange-50" />
        <StatCard title="زيارات منزلية" value={quickStats.homeVisits} icon={<Home className="h-5 w-5 text-teal-600" />} iconBg="bg-teal-50" />
      </div>

      {/* ─── Main Content (3-column) ─── */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Column (40%) — Queue Board */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <Card padding="none" className="flex-1 min-h-[500px] max-h-[700px] flex flex-col overflow-hidden">
            <QueueBoard
              entries={queueEntries}
              onCallNext={handleCallNext}
              onSelectEntry={setSelectedEntry}
              selectedEntryId={selectedEntry?.id}
            />
          </Card>

          {/* Service Points Grid */}
          <Card>
            <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
              <h3 className="font-bold text-surface-900">نقاط الخدمة</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servicePoints.map((sp) => (
                <ServicePointCard
                  key={sp.id}
                  point={sp}
                  currentEntry={sp.currentQueueEntryId ? queueEntries.find((e) => e.id === sp.currentQueueEntryId) : undefined}
                  onCallNext={handleCallNext}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Center Column (35%) — Quick Actions */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4">
          <Card padding="none">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 pt-3 border-b border-surface-200">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="walk-in" className="text-xs gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    حضور
                  </TabsTrigger>
                  <TabsTrigger value="insurance" className="text-xs gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    تأمين
                  </TabsTrigger>
                  <TabsTrigger value="transfers" className="text-xs gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    تحويلات
                  </TabsTrigger>
                  <TabsTrigger value="home-visits" className="text-xs gap-1">
                    <Home className="w-3.5 h-3.5" />
                    منزلي
                  </TabsTrigger>
                  <TabsTrigger value="emergency" className="text-xs gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    طوارئ
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="walk-in" className="p-4 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowWalkInForm(true)}
                    className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-surface-300 hover:border-brand-400 hover:bg-brand-50 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
                      <UserPlus className="w-8 h-8 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">تسجيل حضور جديد</p>
                      <p className="text-xs text-surface-500 mt-1">F2</p>
                    </div>
                  </motion.div>
                </div>

                <div className="border-t border-surface-200 pt-4">
                  <h4 className="font-semibold text-sm text-surface-900 mb-3">آخر التسجيلات</h4>
                  <div className="space-y-2">
                    {MOCK_RECENT_WALKINS.map((wk) => (
                      <div key={wk.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {wk.patientName.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surface-900 truncate">{wk.patientName}</p>
                          <p className="text-xs text-surface-500">{wk.registrationNumber} • {wk.requestedServices.length} فحوصات</p>
                        </div>
                        <span className="text-xs text-surface-400">{new Date(wk.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insurance" className="p-4 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { /* open insurance modal */ }}
                    className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-surface-300 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">تحقق من التأمين</p>
                      <p className="text-xs text-surface-500 mt-1">F4</p>
                    </div>
                  </motion.div>
                </div>

                <div className="border-t border-surface-200 pt-4 space-y-3">
                  <h4 className="font-semibold text-sm text-surface-900">طلبات التحقق المعلقة</h4>
                  {MOCK_VERIFICATIONS.map((v) => (
                    <InsuranceVerificationPanel
                      key={v.id}
                      verification={v}
                      onVerify={() => { /* verify */ }}
                      onReject={() => { /* reject */ }}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="transfers" className="p-4 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTransferForm(true)}
                    className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-surface-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                      <ArrowRightLeft className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">تحويل إلى فرع آخر</p>
                      <p className="text-xs text-surface-500 mt-1">F8</p>
                    </div>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="home-visits" className="p-4 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHomeVisitForm(true)}
                    className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-surface-300 hover:border-teal-400 hover:bg-teal-50 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
                      <Home className="w-8 h-8 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">طلب زيارة منزلية</p>
                      <p className="text-xs text-surface-500 mt-1">F9</p>
                    </div>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="p-4 space-y-4">
                <div className="text-center py-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmergencyForm(true)}
                    className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-danger-300 hover:border-danger-500 hover:bg-danger-50 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center animate-pulse">
                      <Heart className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-danger-700">حالة طوارئ</p>
                      <p className="text-xs text-danger-500 mt-1">F10</p>
                    </div>
                  </motion.div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column (25%) — Patient Search & Activity Feed */}
        <div className="w-full lg:w-[25%] flex flex-col gap-4">
          <Card>
            <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
              <h3 className="font-bold text-surface-900">بحث عن مريض</h3>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input
                type="text"
                onFocus={() => setShowPatientSearch(true)}
                className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-sm bg-surface-50 focus:bg-surface-0 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition placeholder:text-surface-300"
                placeholder="بحث بالاسم أو الرقم... (F3)"
                readOnly
              />
            </div>
          </Card>

          <Card padding="none" className="flex-1 min-h-[300px] overflow-hidden">
            <ReceptionActivityFeed activities={MOCK_ACTIVITIES} />
          </Card>

          <Card>
            <div className="px-4 py-3 border-b border-surface-200 -mx-5 -mt-5 mb-4">
              <h3 className="font-bold text-surface-900">ملخص السرعة</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">معدل الخدمة/ساعة</span>
                <span className="font-bold text-surface-900">12 مريض</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">نسبة الإشغال</span>
                <span className="font-bold text-surface-900">65%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">الرضا المقدر</span>
                <span className="font-bold text-green-600">92%</span>
              </div>
              <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Mobile Tabs (hidden on desktop) ─── */}
      <div className="lg:hidden">
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="walk-in">حضور</TabsTrigger>
              <TabsTrigger value="insurance">تأمين</TabsTrigger>
              <TabsTrigger value="transfers">تحويل</TabsTrigger>
              <TabsTrigger value="home-visits">منزلي</TabsTrigger>
              <TabsTrigger value="emergency">طوارئ</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>

      {/* ─── Called Patient Notification ─── */}
      <AnimatePresence>
        {lastCalledEntry && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-brand-600 text-white shadow-2xl shadow-brand-600/30">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-brand-100">استدعاء المريض التالي</p>
                <p className="text-lg font-bold">{lastCalledEntry.patientName}</p>
                <p className="text-sm text-brand-200 font-mono">{lastCalledEntry.ticketNumber}</p>
              </div>
              <button
                onClick={() => setLastCalledEntry(null)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {showWalkInForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowWalkInForm(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <WalkInForm
                onSubmit={(data) => { console.log('Walk-in:', data); setShowWalkInForm(false); }}
                onCancel={() => setShowWalkInForm(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showTransferForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowTransferForm(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <TransferForm
                branches={MOCK_BRANCHES}
                onSubmit={(data) => { console.log('Transfer:', data); setShowTransferForm(false); }}
                onCancel={() => setShowTransferForm(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showHomeVisitForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowHomeVisitForm(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <HomeVisitRequestForm
                onSubmit={(data) => { console.log('Home visit:', data); setShowHomeVisitForm(false); }}
                onCancel={() => setShowHomeVisitForm(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showEmergencyForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowEmergencyForm(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <EmergencyRegistrationForm
                onSubmit={(data) => { console.log('Emergency:', data); setShowEmergencyForm(false); }}
                onCancel={() => setShowEmergencyForm(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showPatientSearch && (
          <PatientSearchPanel
            onSelect={(patient) => { console.log('Selected:', patient); setShowPatientSearch(false); }}
            onClose={() => setShowPatientSearch(false)}
          />
        )}

        {showKeyboardHelp && (
          <KeyboardShortcutsHelp
            shortcuts={[
              { id: 'walk-in', key: 'F2', description: 'New Walk-In', descriptionAr: 'تسجيل حضوري جديد', action: 'open-walk-in', category: 'walk-in' },
              { id: 'search', key: 'F3', description: 'Patient Search', descriptionAr: 'بحث عن مريض', action: 'open-search', category: 'search' },
              { id: 'insurance', key: 'F4', description: 'Insurance Verification', descriptionAr: 'تحقق من التأمين', action: 'open-insurance', category: 'walk-in' },
              { id: 'refresh', key: 'F5', description: 'Refresh Queue', descriptionAr: 'تحديث الطابور', action: 'refresh-queue', category: 'queue' },
              { id: 'call-next', key: 'F7', description: 'Call Next Patient', descriptionAr: 'استدعاء المريض التالي', action: 'call-next', category: 'queue' },
              { id: 'transfer', key: 'F8', description: 'New Transfer', descriptionAr: 'تحويل جديد', action: 'open-transfer', category: 'navigation' },
              { id: 'home-visit', key: 'F9', description: 'New Home Visit', descriptionAr: 'زيارة منزلية جديدة', action: 'open-home-visit', category: 'navigation' },
              { id: 'emergency', key: 'F10', description: 'New Emergency', descriptionAr: 'حالة طوارئ جديدة', action: 'open-emergency', category: 'navigation' },
              { id: 'keyboard-help', key: 'F12', description: 'Keyboard Shortcuts', descriptionAr: 'اختصارات لوحة المفاتيح', action: 'keyboard-help', category: 'general' },
              { id: 'escape', key: 'Escape', description: 'Close Modal', descriptionAr: 'إغلاق النافذة', action: 'close-modal', category: 'general' },
            ]}
            onClose={() => setShowKeyboardHelp(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
