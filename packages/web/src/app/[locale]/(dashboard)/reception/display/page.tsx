'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing, Clock, Users, Stethoscope, Star, Zap, AlertTriangle,
  Volume2, VolumeX, Maximize, Minimize,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QueueEntry, QueuePriority } from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ────────────────────────────────────────────────────────────────────────────── */

const MOCK_QUEUE_ENTRIES: QueueEntry[] = [
  { id: 'qe-001', ticketNumber: 'Q-20260728-0001', branchId: 'br-001', patientName: 'أحمد بن سعيد العتيبي', serviceType: 'walk-in', priority: 'normal', status: 'waiting', createdAt: '2026-07-28T08:15:00Z', updatedAt: '2026-07-28T08:15:00Z' },
  { id: 'qe-002', ticketNumber: 'Q-20260728-0002', branchId: 'br-001', patientName: 'فاطمة بنت محمد القحطاني', serviceType: 'appointment', priority: 'vip', status: 'waiting', createdAt: '2026-07-28T08:20:00Z', updatedAt: '2026-07-28T08:20:00Z' },
  { id: 'qe-003', ticketNumber: 'Q-20260728-0003', branchId: 'br-001', patientName: 'خالد بن عبدالله الشمري', serviceType: 'walk-in', priority: 'emergency', status: 'waiting', createdAt: '2026-07-28T08:25:00Z', updatedAt: '2026-07-28T08:25:00Z' },
  { id: 'qe-004', ticketNumber: 'Q-20260728-0004', branchId: 'br-001', patientName: 'نورة بنت سعد الدوسري', serviceType: 'walk-in', priority: 'normal', status: 'waiting', createdAt: '2026-07-28T08:30:00Z', updatedAt: '2026-07-28T08:30:00Z' },
  { id: 'qe-005', ticketNumber: 'Q-20260728-0005', branchId: 'br-001', patientName: 'عبدالرحمن بن فيصل المطيري', serviceType: 'home-visit', priority: 'priority', status: 'waiting', createdAt: '2026-07-28T08:35:00Z', updatedAt: '2026-07-28T08:35:00Z' },
  { id: 'qe-006', ticketNumber: 'Q-20260728-0006', branchId: 'br-001', patientName: 'سارة بنت خالد العتيبي', serviceType: 'walk-in', priority: 'normal', status: 'waiting', createdAt: '2026-07-28T08:40:00Z', updatedAt: '2026-07-28T08:40:00Z' },
];

const ANNOUNCEMENTS = [
  'يرجى الحضور مع الهوية الوطنية أو سجل الأحوال المدنية',
  'نحترم وقتماً — شكراً لانتظاركم',
  'النتائج متاحة خلال 24 ساعة عبر تطبيق المختبر الشامل',
  'للطلبات العاجلة يرجى التواصل مع الاستقبال',
  'يمكنكم استلام نتائجكم من الفرع أو عبر التطبيق الإلكتروني',
];

const PRIORITY_CONFIG: Record<QueuePriority, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  emergency: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', label: 'طوارئ', icon: <Zap className="w-4 h-4" /> },
  vip: { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', label: 'VIP', icon: <Star className="w-4 h-4" /> },
  priority: { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', label: 'أولوية', icon: <AlertTriangle className="w-4 h-4" /> },
  normal: { color: 'text-surface-400', bg: 'bg-surface-500/20 border-surface-500/40', label: 'عادي', icon: <Users className="w-4 h-4" /> },
};

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────────────────────── */

export default function QueueDisplayPage() {
  const [calledEntry, setCalledEntry] = React.useState<QueueEntry | null>(null);
  const [animationPhase, setAnimationPhase] = React.useState<'idle' | 'calling' | 'showing'>('idle');
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [announcementIdx, setAnnouncementIdx] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const waitingEntries = React.useMemo(
    () => MOCK_QUEUE_ENTRIES
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => {
        const pOrder: Record<QueuePriority, number> = { emergency: 0, vip: 1, priority: 2, normal: 3 };
        return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
      })
      .slice(0, 5),
    [],
  );

  const handleCallNext = React.useCallback(() => {
    if (waitingEntries.length === 0) return;
    const next = waitingEntries[0];
    setCalledEntry(next);
    setAnimationPhase('calling');
    try {
      const audio = new Audio('/sounds/ding.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch { /* silent */ }
    setTimeout(() => setAnimationPhase('showing'), 1500);
  }, [waitingEntries]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); handleCallNext(); }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCallNext]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">
      {/* Controls bar (hidden in display) */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCallNext}
            disabled={waitingEntries.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors',
              waitingEntries.length === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 text-white',
            )}
          >
            <BellRing className="w-4 h-4" />
            استدعاء التالي
          </button>
          <span className="text-xs text-gray-500">المفتاح: مسافة = استدعاء | Esc = خروج</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">المختبر الشامل</h1>
            <p className="text-gray-400">الرياض الرئيسي</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-4xl font-mono font-bold text-brand-400">
            {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Center — Now Serving */}
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <AnimatePresence mode="wait">
            {calledEntry ? (
              <motion.div
                key={calledEntry.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto">
                    <BellRing className="w-10 h-10 text-amber-400" />
                  </div>
                </motion.div>

                <p className="text-xl text-gray-400 mb-3">الآن في الخدمة</p>

                <motion.p
                  className="text-8xl font-mono font-extrabold text-brand-400 mb-4 tracking-wider"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {calledEntry.ticketNumber.split('-').pop()}
                </motion.p>

                <p className="text-3xl font-bold text-white mb-3">{calledEntry.patientName}</p>

                {(() => {
                  const pCfg = PRIORITY_CONFIG[calledEntry.priority];
                  return (
                    <span className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold', pCfg.bg, pCfg.color)}>
                      {pCfg.icon}
                      {pCfg.label}
                    </span>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <Clock className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                <p className="text-4xl text-gray-600 font-bold">بانتظار المرضى</p>
                <p className="text-lg text-gray-700 mt-2">اضغط مسافة لاستدعاء المريض التالي</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar — Next 5 */}
        <div className="w-96 border-l border-gray-800 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-300 mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            التالي في الانتظار
          </h2>
          <div className="space-y-3 flex-1">
            {waitingEntries.length === 0 ? (
              <p className="text-gray-600 text-center py-8">لا يوجد مرضى في الانتظار</p>
            ) : (
              waitingEntries.map((entry, idx) => {
                const pCfg = PRIORITY_CONFIG[entry.priority];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-800"
                  >
                    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{entry.patientName}</p>
                      <p className="text-sm text-gray-500 font-mono">{entry.ticketNumber}</p>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', pCfg.bg, pCfg.color)}>
                      {pCfg.label}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">بانتظار</span>
              <span className="font-bold text-amber-400">{waitingEntries.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">وقت الانتظار المقدر</span>
              <span className="font-bold text-brand-400">~12 دقيقة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Announcement */}
      <footer className="border-t border-gray-800 px-10 py-4 bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.p
            key={announcementIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-gray-500"
          >
            {ANNOUNCEMENTS[announcementIdx]}
          </motion.p>
        </AnimatePresence>
      </footer>
    </div>
  );
}
