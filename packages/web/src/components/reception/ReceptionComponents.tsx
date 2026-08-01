'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Phone, Clock, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, ArrowLeft, RefreshCw, Printer, Download, Filter, MoreHorizontal,
  Eye, Edit, Trash2, Plus, Minus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Stethoscope, Shield, MapPin, Building2, Home, Car, Star, Zap, Activity,
  FileText, CreditCard, Wallet, Clipboard, QrCode, Barcode, Copy, Share2,
  Calendar, CalendarDays, Timer, Bell, BellRing, Volume2, VolumeX,
  Monitor, Settings, Keyboard, X, Check, Loader2, UserCheck, UserX,
  Heart, Thermometer, Wind, Droplets, Gauge, Pill, Syringe, TestTube2,
  CircleDot, Radio, Wifi, WifiOff, Battery, BatteryCharging,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  QueueEntry, QueueServicePoint, QueueStats, QueuePriority, QueueStatus,
  WalkInRegistration, InsuranceVerification, BranchTransfer, HomeVisitRequest,
  EmergencyCase, PatientSearchResult, TicketData, VipTier,
} from '@/types/reception';

/* ──────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
   ────────────────────────────────────────────────────────────────────────────── */

const PRIORITY_CONFIG: Record<QueuePriority, { color: string; bg: string; border: string; icon: React.ReactNode; label: string; labelAr: string }> = {
  emergency: {
    color: 'text-danger-600',
    bg: 'bg-danger-50',
    border: 'border-danger-400',
    icon: <Zap className="w-4 h-4" />,
    label: 'Emergency',
    labelAr: 'طوارئ',
  },
  vip: {
    color: 'text-saffron-600',
    bg: 'bg-saffron-50',
    border: 'border-saffron-400',
    icon: <Star className="w-4 h-4" />,
    label: 'VIP',
    labelAr: 'كبار الشخصيات',
  },
  priority: {
    color: 'text-info-600',
    bg: 'bg-info-50',
    border: 'border-info-400',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Priority',
    labelAr: 'أولوية',
  },
  normal: {
    color: 'text-surface-500',
    bg: 'bg-surface-50',
    border: 'border-surface-200',
    icon: <Users className="w-4 h-4" />,
    label: 'Normal',
    labelAr: 'عادي',
  },
};

const STATUS_CONFIG: Record<QueueStatus, { color: string; bg: string; label: string; labelAr: string }> = {
  waiting:     { color: 'text-warning-600', bg: 'bg-warning-50',  label: 'Waiting',     labelAr: 'بانتظار' },
  serving:     { color: 'text-brand-600',   bg: 'bg-brand-50',    label: 'Serving',     labelAr: 'قيد الخدمة' },
  completed:   { color: 'text-success-600', bg: 'bg-success-50',  label: 'Completed',   labelAr: 'مكتمل' },
  'no-show':   { color: 'text-surface-400', bg: 'bg-surface-100', label: 'No Show',     labelAr: 'لم يحضر' },
  cancelled:   { color: 'text-danger-400',  bg: 'bg-danger-50',   label: 'Cancelled',   labelAr: 'ملغي' },
  transferred: { color: 'text-info-400',    bg: 'bg-info-50',     label: 'Transferred', labelAr: 'منقول' },
};

const SERVICE_TYPE_CONFIG: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
  'walk-in':      { label: 'Walk-in',      labelAr: 'حضور',       color: 'text-accent-600',  bg: 'bg-accent-50' },
  appointment:    { label: 'Appointment',   labelAr: 'موعد',      color: 'text-brand-600',   bg: 'bg-brand-50' },
  'home-visit':   { label: 'Home Visit',    labelAr: 'منزل',      color: 'text-info-600',    bg: 'bg-info-50' },
  consultation:   { label: 'Consultation',  labelAr: 'استشارة',   color: 'text-saffron-600', bg: 'bg-saffron-50' },
};

const VIP_TIER_CONFIG: Record<VipTier, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  silver:   { color: 'text-surface-400', bg: 'bg-surface-100', label: 'Silver',   icon: <Star className="w-3.5 h-3.5" /> },
  gold:     { color: 'text-saffron-500', bg: 'bg-saffron-50', label: 'Gold',     icon: <Star className="w-3.5 h-3.5" /> },
  platinum: { color: 'text-brand-400',   bg: 'bg-brand-50',   label: 'Platinum', icon: <Star className="w-3.5 h-3.5" /> },
  diamond:  { color: 'text-accent-500',  bg: 'bg-accent-50',  label: 'Diamond',  icon: <Star className="w-3.5 h-3.5" /> },
};

const SERVICE_POINT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; labelAr: string }> = {
  counter:       { icon: <Clipboard className="w-5 h-5" />,     label: 'Counter',       labelAr: 'كاونتر' },
  desk:          { icon: <Monitor className="w-5 h-5" />,       label: 'Desk',          labelAr: 'مكتب' },
  vip:           { icon: <Star className="w-5 h-5" />,          label: 'VIP Lounge',    labelAr: 'صالة كبار الشخصيات' },
  emergency:     { icon: <Heart className="w-5 h-5" />,         label: 'Emergency',     labelAr: 'طوارئ' },
  consultation:  { icon: <Stethoscope className="w-5 h-5" />,  label: 'Consultation',  labelAr: 'استشارة' },
};

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return '< 1 دقيقة';
  if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs} ساعة ${mins > 0 ? `${mins} دقيقة` : ''}`;
}

function getElapsedMinutes(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 60000;
}

/* ──────────────────────────────────────────────────────────────────────────────
   1. PriorityBadge
   ────────────────────────────────────────────────────────────────────────────── */

interface PriorityBadgeProps {
  priority: QueuePriority;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-caption gap-1',
    md: 'px-2 py-1 text-body-sm gap-1.5',
    lg: 'px-3 py-1.5 text-body gap-2',
  };

  return (
    <motion.span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        config.bg, config.color, config.border,
        sizeClasses[size],
        priority === 'emergency' && 'animate-pulse',
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      layout
    >
      {config.icon}
      <span className="hidden sm:inline">{config.labelAr}</span>
    </motion.span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   2. QueueTicketCard
   ────────────────────────────────────────────────────────────────────────────── */

interface QueueTicketCardProps {
  entry: QueueEntry;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export function QueueTicketCard({ entry, isSelected, onSelect, compact }: QueueTicketCardProps) {
  const priority = PRIORITY_CONFIG[entry.priority];
  const status = STATUS_CONFIG[entry.status];
  const serviceType = SERVICE_TYPE_CONFIG[entry.serviceType] || SERVICE_TYPE_CONFIG['walk-in'];
  const waitMinutes = entry.waitTimeMinutes ?? getElapsedMinutes(entry.createdAt);
  const isOverdue = entry.isOverdue || (entry.estimatedWaitMinutes != null && waitMinutes > entry.estimatedWaitMinutes * 1.5);

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
          isSelected
            ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-200'
            : 'bg-surface-0 border-surface-200 hover:bg-surface-50',
          isOverdue && 'border-danger-300 animate-pulse',
        )}
        onClick={onSelect}
      >
        <span className={cn('font-mono font-bold text-body-sm', priority.color)}>
          {entry.ticketNumber.split('-').pop()}
        </span>
        <span className="flex-1 text-body-sm text-surface-700 truncate">{entry.patientName}</span>
        <span className="text-caption text-surface-400">{Math.round(waitMinutes)}د</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative rounded-xl border bg-surface-0 shadow-sm cursor-pointer transition-all',
        isSelected
          ? 'border-brand-400 ring-2 ring-brand-100 shadow-md'
          : 'border-surface-200 hover:border-surface-300 hover:shadow',
        isOverdue && 'border-danger-400 ring-1 ring-danger-100',
      )}
      onClick={onSelect}
    >
      {isOverdue && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-danger-400 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-lg font-mono font-bold text-body-lg',
                priority.bg, priority.color,
              )}
            >
              {entry.ticketNumber.split('-').pop()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-surface-900 truncate">{entry.patientName}</p>
              {entry.patientPhone && (
                <p className="text-caption text-surface-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {entry.patientPhone}
                </p>
              )}
            </div>
          </div>
          <PriorityBadge priority={entry.priority} size="sm" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium', serviceType.bg, serviceType.color)}>
              {serviceType.labelAr}
            </span>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium', status.bg, status.color)}>
              {status.labelAr}
            </span>
          </div>
          <div className={cn('flex items-center gap-1 text-caption font-medium', isOverdue ? 'text-danger-500' : 'text-surface-400')}>
            <Clock className="w-3.5 h-3.5" />
            {formatWaitTime(waitMinutes)}
          </div>
        </div>

        {entry.servicePoint && (
          <p className="mt-2 text-caption text-surface-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {entry.servicePoint}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   3. QueueBoard
   ────────────────────────────────────────────────────────────────────────────── */

interface QueueBoardProps {
  entries: QueueEntry[];
  onCallNext: () => void;
  onSelectEntry: (entry: QueueEntry) => void;
  selectedEntryId?: string;
}

export function QueueBoard({ entries, onCallNext, onSelectEntry, selectedEntryId }: QueueBoardProps) {
  const [compact, setCompact] = useState(false);
  const [filterPriority, setFilterPriority] = useState<QueuePriority | 'all'>('all');

  const filteredEntries = useMemo(() => {
    const waiting = entries.filter((e) => e.status === 'waiting' || e.status === 'serving');
    const sorted = [...waiting].sort((a, b) => {
      const pOrder: Record<QueuePriority, number> = { emergency: 0, vip: 1, priority: 2, normal: 3 };
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    if (filterPriority === 'all') return sorted;
    return sorted.filter((e) => e.priority === filterPriority);
  }, [entries, filterPriority]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-surface-900 text-h5">قائمة الانتظار</h3>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-brand-500 text-white text-body-sm font-bold">
            {filteredEntries.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as QueuePriority | 'all')}
            className="text-body-sm border border-surface-200 rounded-lg px-2 py-1.5 bg-surface-0 text-surface-600 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none"
          >
            <option value="all">الكل</option>
            <option value="emergency">طوارئ</option>
            <option value="vip">VIP</option>
            <option value="priority">أولوية</option>
            <option value="normal">عادي</option>
          </select>
          <button
            onClick={() => setCompact(!compact)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            title={compact ? 'عرض كامل' : 'عرض مختصر'}
          >
            {compact ? <Eye className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCallNext}
            disabled={filteredEntries.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-body-sm text-white transition-colors',
              filteredEntries.length === 0
                ? 'bg-surface-300 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 shadow-brand',
            )}
          >
            <BellRing className="w-4 h-4" />
            استدعاء التالي
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-surface-400">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-body font-medium">لا يوجد مرضى في القائمة</p>
            <p className="text-caption">اضغط "استدعاء التالي" عند توفر مريض</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <QueueTicketCard
                key={entry.id}
                entry={entry}
                isSelected={entry.id === selectedEntryId}
                onSelect={() => onSelectEntry(entry)}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   4. ServicePointCard
   ────────────────────────────────────────────────────────────────────────────── */

interface ServicePointCardProps {
  point: QueueServicePoint;
  currentEntry?: QueueEntry;
  onCallNext: () => void;
}

export function ServicePointCard({ point, currentEntry, onCallNext }: ServicePointCardProps) {
  const spType = SERVICE_POINT_TYPE_CONFIG[point.type] || SERVICE_POINT_TYPE_CONFIG.counter;
  const isBusy = point.status === 'active' && !!currentEntry;
  const isAvailable = point.status === 'active' && !currentEntry;
  const isInactive = point.status !== 'active';

  const statusConfig = {
    active:   { dot: 'bg-success-400', ring: 'ring-success-100', label: 'نشط', labelEn: 'Active' },
    inactive: { dot: 'bg-surface-300', ring: 'ring-surface-100', label: 'غير نشط', labelEn: 'Inactive' },
    maintenance: { dot: 'bg-warning-400', ring: 'ring-warning-100', label: 'صيانة', labelEn: 'Maintenance' },
  };

  const st = statusConfig[point.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative rounded-xl border bg-surface-0 p-4 transition-all',
        isBusy && 'border-brand-300 shadow-md',
        isAvailable && 'border-success-200 hover:border-success-400',
        isInactive && 'border-surface-200 opacity-60',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            isBusy ? 'bg-brand-50 text-brand-600' : isAvailable ? 'bg-success-50 text-success-600' : 'bg-surface-100 text-surface-400',
          )}>
            {spType.icon}
          </div>
          <div>
            <p className="font-semibold text-surface-900">{point.name}</p>
            <p className="text-caption text-surface-400">{spType.labelAr}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-full', st.dot, isBusy && 'animate-pulse')} />
          <span className="text-caption text-surface-500">{st.label}</span>
        </div>
      </div>

      {isBusy && currentEntry && (
        <div className="mb-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-brand-500" />
            <span className="text-body-sm font-semibold text-brand-700">قيد الخدمة</span>
          </div>
          <p className="font-semibold text-surface-900">{currentEntry.patientName}</p>
          <p className="text-caption text-surface-400 font-mono">{currentEntry.ticketNumber}</p>
          {currentEntry.startedServingAt && (
            <p className="text-caption text-surface-400 mt-1">
              منذ {formatWaitTime(getElapsedMinutes(currentEntry.startedServingAt))}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-surface-100">
        <div className="text-caption text-surface-400">
          متوسط الوقت: {formatWaitTime(point.averageServiceMinutes)}
        </div>
        {isAvailable ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCallNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-body-sm font-semibold hover:bg-brand-600 shadow-sm transition-colors"
          >
            <BellRing className="w-3.5 h-3.5" />
            استدعاء
          </motion.button>
        ) : isBusy ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-body-sm font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            جاري الخدمة
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   5. QueueStatsBar
   ────────────────────────────────────────────────────────────────────────────── */

interface QueueStatsBarProps {
  stats: QueueStats;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let current = 0;
    const step = value / 40;
    const id = setInterval(() => {
      current += step;
      if (current >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(current));
    }, 25);
    return () => clearInterval(id);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString('ar-SA')}{suffix}</span>;
}

export function QueueStatsBar({ stats }: QueueStatsBarProps) {
  const totalPriority = stats.byPriority.emergency + stats.byPriority.vip + stats.byPriority.priority + stats.byPriority.normal;

  const metrics = [
    { label: 'بانتظار', value: stats.totalWaiting, icon: <Clock className="w-4 h-4" />, color: 'text-warning-500', bg: 'bg-warning-50' },
    { label: 'قيد الخدمة', value: stats.totalServing, icon: <Activity className="w-4 h-4" />, color: 'text-brand-500', bg: 'bg-brand-50' },
    { label: 'مكتمل اليوم', value: stats.totalCompletedToday, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success-500', bg: 'bg-success-50' },
    { label: 'متوسط الانتظار', value: stats.averageWaitMinutes, icon: <Timer className="w-4 h-4" />, color: 'text-info-500', bg: 'bg-info-50', suffix: 'د' },
    { label: 'أطول انتظار', value: stats.longestWaitMinutes, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-danger-500', bg: 'bg-danger-50', suffix: 'د' },
  ];

  return (
    <div className="bg-surface-0 rounded-xl border border-surface-200 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className={cn('flex items-center gap-3 p-3 rounded-lg', m.bg)}>
            <div className={cn('flex-shrink-0', m.color)}>{m.icon}</div>
            <div className="min-w-0">
              <p className="text-caption text-surface-400 truncate">{m.label}</p>
              <p className={cn('font-bold text-h4', m.color)}>
                <AnimatedCounter value={m.value} suffix={m.suffix} />
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-surface-100">
        <div className="flex-1 min-w-[200px]">
          <p className="text-caption text-surface-400 mb-1.5">توزيع الأولويات</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-surface-100">
            {totalPriority > 0 && (
              <>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.byPriority.emergency / totalPriority) * 100}%` }}
                  className="bg-danger-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.byPriority.vip / totalPriority) * 100}%` }}
                  className="bg-saffron-400"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.byPriority.priority / totalPriority) * 100}%` }}
                  className="bg-info-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.byPriority.normal / totalPriority) * 100}%` }}
                  className="bg-surface-300"
                />
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {([
              ['طوارئ', stats.byPriority.emergency, 'bg-danger-500'],
              ['VIP', stats.byPriority.vip, 'bg-saffron-400'],
              ['أولوية', stats.byPriority.priority, 'bg-info-500'],
              ['عادي', stats.byPriority.normal, 'bg-surface-300'],
            ] as const).map(([label, count, dotClass]) => (
              <span key={label} className="flex items-center gap-1.5 text-caption text-surface-500">
                <span className={cn('w-2 h-2 rounded-full', dotClass)} />
                {label}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-caption text-surface-400 mb-1.5">نقاط الخدمة</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-400" />
              <span className="text-body-sm text-surface-600">
                متاح: <span className="font-bold">{stats.servicePoints.idle}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-body-sm text-surface-600">
                مشغول: <span className="font-bold">{stats.servicePoints.busy}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-surface-300" />
              <span className="text-body-sm text-surface-600">
                غير نشط: <span className="font-bold">{stats.servicePoints.total - stats.servicePoints.active}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   6. PatientSearchPanel
   ────────────────────────────────────────────────────────────────────────────── */

interface PatientSearchPanelProps {
  onSelect: (patient: PatientSearchResult) => void;
  onClose: () => void;
}

export function PatientSearchPanel({ onSelect, onClose }: PatientSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const saved = typeof window !== 'undefined' ? localStorage.getItem('recentPatientSearches') : null;
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setSelectedIndex(-1);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    // Placeholder: in production this calls API
    setLoading(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
    }
    else if (e.key === 'Escape') { onClose(); }
  }, [results, selectedIndex, onSelect, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-start justify-center pt-24 px-4"
    >
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="relative w-full max-w-2xl bg-surface-0 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-200">
          <Search className="w-5 h-5 text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="بحث بالاسم، رقم الهاتف، أو الهوية الوطنية..."
            className="flex-1 text-body-lg bg-transparent outline-none placeholder:text-surface-300"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="text-surface-400 hover:text-surface-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-12 px-4">
              <UserX className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-body text-surface-500">لا توجد نتائج لـ "{query}"</p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors">
                <UserPlus className="w-4 h-4" />
                تسجيل مريض جديد
              </button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              {results.map((patient, idx) => {
                const vipConfig = patient.isVip && patient.vipTier ? VIP_TIER_CONFIG[patient.vipTier] : null;
                return (
                  <button
                    key={patient.id}
                    onClick={() => onSelect(patient)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors',
                      idx === selectedIndex ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-surface-50',
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                      {patient.firstNameAr?.charAt(0)}{patient.lastNameAr?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-surface-900 truncate">
                          {patient.firstNameAr} {patient.lastNameAr}
                        </p>
                        {vipConfig && (
                          <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-caption font-medium', vipConfig.bg, vipConfig.color)}>
                            {vipConfig.icon} {vipConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-caption text-surface-400 mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
                        {patient.lastVisit && <span>آخر زيارة: {new Date(patient.lastVisit).toLocaleDateString('ar-SA')}</span>}
                        <span>{patient.totalVisits} زيارة</span>
                      </div>
                    </div>
                    {patient.insuranceProvider && (
                      <div className="flex items-center gap-1 text-caption text-surface-400">
                        <Shield className="w-3 h-3" />
                        {patient.insuranceProvider}
                      </div>
                    )}
                    <ChevronLeft className="w-4 h-4 text-surface-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-caption text-surface-400 mb-2">عمليات البحث الأخيرة</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 text-body-sm text-surface-600 hover:bg-surface-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query.length < 2 && recentSearches.length === 0 && (
            <div className="text-center py-12 px-4">
              <Search className="w-10 h-10 text-surface-200 mx-auto mb-3" />
              <p className="text-body text-surface-400">ابدأ الكتابة للبحث عن مريض</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   7. WalkInForm
   ────────────────────────────────────────────────────────────────────────────── */

interface WalkInFormProps {
  onSubmit: (data: Partial<WalkInRegistration>) => void;
  onCancel: () => void;
  prefill?: Partial<WalkInRegistration>;
}

const COMMON_TESTS = [
  { id: 'cbc', label: 'صورة دم كاملة', labelEn: 'CBC' },
  { id: 'lipid', label: 'الدهون', labelEn: 'Lipid Profile' },
  { id: 'glucose', label: 'السكر', labelEn: 'Glucose' },
  { id: 'thyroid', label: 'الغدة الدرقية', labelEn: 'Thyroid' },
  { id: 'liver', label: 'وظائف الكبد', labelEn: 'Liver Function' },
  { id: 'kidney', label: 'وظائف الكلى', labelEn: 'Kidney Function' },
  { id: 'vitamin_d', label: 'فيتامين د', labelEn: 'Vitamin D' },
  { id: 'hba1c', label: 'السكر التراكمي', labelEn: 'HbA1c' },
  { id: 'cbc_diff', label: 'صورة دم تفصيلية', labelEn: 'CBC Diff' },
  { id: 'urine', label: 'تحليل بول', labelEn: 'Urinalysis' },
];

export function WalkInForm({ onSubmit, onCancel, prefill }: WalkInFormProps) {
  const [form, setForm] = useState({
    patientName: prefill?.patientName || '',
    patientPhone: prefill?.patientPhone || '',
    patientNationalId: prefill?.patientNationalId || '',
    requestedServices: prefill?.requestedServices || [] as string[],
    referralSource: prefill?.referralSource || 'walk-in' as WalkInRegistration['referralSource'],
    insuranceProvider: prefill?.insuranceProvider || '',
    insuranceNumber: prefill?.insuranceNumber || '',
    insuranceExpiry: prefill?.insuranceExpiry || '',
    notes: prefill?.notes || '',
    showInsurance: false,
  });

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      requestedServices: f.requestedServices.includes(id)
        ? f.requestedServices.filter((s) => s !== id)
        : [...f.requestedServices, id],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="bg-surface-0 rounded-2xl border border-surface-200 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h3 className="font-bold text-h5 text-surface-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-brand-500" />
          تسجيل حضور سريع
        </h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-surface-600 mb-1">اسم المريض *</label>
              <input
                type="text"
                value={form.patientName}
                onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                placeholder="الاسم الكامل"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-surface-600 mb-1">رقم الهاتف *</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
                <input
                  type="tel"
                  value={form.patientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                  className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                  placeholder="05XXXXXXXX"
                />
              </div>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-surface-600 mb-1">الرقم الوطني</label>
              <input
                type="text"
                value={form.patientNationalId}
                onChange={(e) => setForm((f) => ({ ...f, patientNationalId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                placeholder="الرقم الوطني"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-surface-600 mb-1">مصدر الإحالة</label>
              <select
                value={form.referralSource}
                onChange={(e) => setForm((f) => ({ ...f, referralSource: e.target.value as WalkInRegistration['referralSource'] }))}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body bg-surface-0 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
              >
                <option value="walk-in">حضور مباشر</option>
                <option value="online">اونلاين</option>
                <option value="doctor-referral">إحالة طبيب</option>
                <option value="corporate">شركات</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-surface-600 mb-2">الخدمات المطلوبة *</label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_TESTS.map((test) => (
                  <label
                    key={test.id}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-right',
                      form.requestedServices.includes(test.id)
                        ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                        : 'border-surface-200 hover:border-surface-300 bg-surface-0',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.requestedServices.includes(test.id)}
                      onChange={() => toggleService(test.id)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-200"
                    />
                    <span className="text-body-sm text-surface-700">{test.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setForm((f) => ({ ...f, showInsurance: !f.showInsurance }))}
              className="flex items-center gap-2 text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              <Shield className="w-4 h-4" />
              معلومات التأمين
              {form.showInsurance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {form.showInsurance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  <div>
                    <label className="block text-body-sm font-medium text-surface-600 mb-1">شركة التأمين</label>
                    <input
                      type="text"
                      value={form.insuranceProvider}
                      onChange={(e) => setForm((f) => ({ ...f, insuranceProvider: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                      placeholder="اسم شركة التأمين"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-surface-600 mb-1">رقم البوليصة</label>
                    <input
                      type="text"
                      value={form.insuranceNumber}
                      onChange={(e) => setForm((f) => ({ ...f, insuranceNumber: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-surface-600 mb-1">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={form.insuranceExpiry}
                      onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-body-sm font-medium text-surface-600 mb-1">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition resize-none"
            placeholder="أي ملاحظات إضافية..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-surface-200 text-body-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
        >
          إلغاء
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmit({
            patientName: form.patientName,
            patientPhone: form.patientPhone,
            patientNationalId: form.patientNationalId || undefined,
            requestedServices: form.requestedServices,
            referralSource: form.referralSource,
            insuranceProvider: form.insuranceProvider || undefined,
            insuranceNumber: form.insuranceNumber || undefined,
            insuranceExpiry: form.insuranceExpiry || undefined,
            notes: form.notes || undefined,
            isNewPatient: !prefill?.patientId,
          })}
          disabled={!form.patientName || !form.patientPhone || form.requestedServices.length === 0}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-body-sm text-white transition-colors',
            (!form.patientName || !form.patientPhone || form.requestedServices.length === 0)
              ? 'bg-surface-300 cursor-not-allowed'
              : 'bg-brand-500 hover:bg-brand-600 shadow-brand',
          )}
        >
          <Plus className="w-4 h-4" />
          تسجيل و إضافة للقائمة
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   8. InsuranceVerificationPanel
   ────────────────────────────────────────────────────────────────────────────── */

interface InsuranceVerificationPanelProps {
  verification: InsuranceVerification;
  onVerify: () => void;
  onReject: () => void;
}

const VERIFICATION_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pending:  { color: 'text-warning-600', bg: 'bg-warning-50', label: 'قيد التحقق', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
  verified: { color: 'text-success-600', bg: 'bg-success-50', label: 'تم التحقق', icon: <CheckCircle2 className="w-5 h-5" /> },
  rejected: { color: 'text-danger-600',  bg: 'bg-danger-50',  label: 'مرفوض',     icon: <XCircle className="w-5 h-5" /> },
  expired:  { color: 'text-surface-400', bg: 'bg-surface-100', label: 'منتهي الصلاحية', icon: <Clock className="w-5 h-5" /> },
  partial:  { color: 'text-saffron-600', bg: 'bg-saffron-50', label: 'تحقق جزئي', icon: <AlertTriangle className="w-5 h-5" /> },
};

export function InsuranceVerificationPanel({ verification, onVerify, onReject }: InsuranceVerificationPanelProps) {
  const statusCfg = VERIFICATION_STATUS_CONFIG[verification.verificationStatus];
  const coveragePercent = verification.coveragePercentage ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-0 rounded-xl border border-surface-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-200 bg-surface-50">
        <div className="w-10 h-10 rounded-lg bg-info-50 flex items-center justify-center">
          <Shield className="w-5 h-5 text-info-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-surface-900">{verification.insuranceProvider}</p>
          <p className="text-caption text-surface-400">{verification.insuranceNumber}</p>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium', statusCfg.bg, statusCfg.color)}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4 text-right">
          <div>
            <p className="text-caption text-surface-400">رقم التحقق</p>
            <p className="font-mono font-semibold text-surface-900">{verification.verificationNumber}</p>
          </div>
          {verification.insuranceExpiry && (
            <div>
              <p className="text-caption text-surface-400">تاريخ الانتهاء</p>
              <p className="text-body-sm text-surface-900">
                {new Date(verification.insuranceExpiry).toLocaleDateString('ar-SA')}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm text-surface-600">نسبة التغطية</span>
            <span className="font-bold text-body-lg text-brand-600">{coveragePercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coveragePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                coveragePercent >= 80 ? 'bg-success-500' : coveragePercent >= 50 ? 'bg-warning-500' : 'bg-danger-500',
              )}
            />
          </div>
        </div>

        {verification.coveredAmount != null && verification.totalAmount != null && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-50 text-right">
            <div>
              <p className="text-caption text-surface-400">المبلغ المشمول</p>
              <p className="font-bold text-success-600 text-body-lg">{verification.coveredAmount.toLocaleString('ar-SA')} ر.س</p>
            </div>
            <div>
              <p className="text-caption text-surface-400">المبلغ الإجمالي</p>
              <p className="font-bold text-surface-900 text-body-lg">{verification.totalAmount.toLocaleString('ar-SA')} ر.س</p>
            </div>
          </div>
        )}

        {verification.approvalCode && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success-50 border border-success-200">
            <CheckCircle2 className="w-4 h-4 text-success-600" />
            <span className="text-body-sm text-surface-600">كود الموافقة:</span>
            <span className="font-mono font-bold text-success-700">{verification.approvalCode}</span>
          </div>
        )}

        {verification.rejectionReason && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200">
            <XCircle className="w-4 h-4 text-danger-600" />
            <span className="text-body-sm text-danger-700">{verification.rejectionReason}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-200 bg-surface-50">
        {verification.verificationStatus === 'rejected' || verification.verificationStatus === 'expired' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onVerify}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white font-semibold text-body-sm hover:bg-brand-600 shadow-brand transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة التحقق
          </motion.button>
        ) : verification.verificationStatus === 'pending' ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger-200 text-danger-600 font-semibold text-body-sm hover:bg-danger-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              رفض
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onVerify}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success-500 text-white font-semibold text-body-sm hover:bg-success-600 shadow-success transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد التحقق
            </motion.button>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   9. TransferForm
   ────────────────────────────────────────────────────────────────────────────── */

interface TransferFormProps {
  branches: { id: string; name: string }[];
  onSubmit: (data: { toBranchId: string; reason: string; priority: 'normal' | 'urgent'; notes?: string }) => void;
  onCancel: () => void;
}

export function TransferForm({ branches, onSubmit, onCancel }: TransferFormProps) {
  const [form, setForm] = useState({
    toBranchId: '',
    reason: '',
    priority: 'normal' as 'normal' | 'urgent',
    notes: '',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="bg-surface-0 rounded-2xl border border-surface-200 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h3 className="font-bold text-h5 text-surface-900 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-info-500" />
          نقل إلى فرع آخر
        </h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">الفرع المصدر</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-50 border border-surface-200">
            <Building2 className="w-4 h-4 text-surface-400" />
            <span className="text-body-sm text-surface-500">الفرع الحالي</span>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">الفرع الهدف *</label>
          <select
            value={form.toBranchId}
            onChange={(e) => setForm((f) => ({ ...f, toBranchId: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body bg-surface-0 focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
          >
            <option value="">اختر الفرع...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">سبب النقل *</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition resize-none"
            placeholder="سبب النقل..."
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">الأولوية</label>
          <div className="flex gap-3">
            {(['normal', 'urgent'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-body-sm font-medium transition-all',
                  form.priority === p
                    ? p === 'urgent'
                      ? 'border-warning-400 bg-warning-50 text-warning-700 ring-1 ring-warning-200'
                      : 'border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                    : 'border-surface-200 text-surface-500 hover:bg-surface-50',
                )}
              >
                {p === 'urgent' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {p === 'urgent' ? 'عاجل' : 'عادي'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">ملاحظات</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
            placeholder="ملاحظات إضافية..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-surface-200 text-body-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
        >
          إلغاء
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmit({ toBranchId: form.toBranchId, reason: form.reason, priority: form.priority, notes: form.notes || undefined })}
          disabled={!form.toBranchId || !form.reason}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-body-sm text-white transition-colors',
            (!form.toBranchId || !form.reason)
              ? 'bg-surface-300 cursor-not-allowed'
              : 'bg-info-500 hover:bg-info-600',
          )}
        >
          <ArrowRight className="w-4 h-4" />
          بدء النقل
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   10. HomeVisitRequestForm
   ────────────────────────────────────────────────────────────────────────────── */

interface HomeVisitRequestFormProps {
  onSubmit: (data: Partial<HomeVisitRequest>) => void;
  onCancel: () => void;
}

export function HomeVisitRequestForm({ onSubmit, onCancel }: HomeVisitRequestFormProps) {
  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientAddress: '',
    patientCity: '',
    preferredDate: '',
    preferredTimeStart: '',
    preferredTimeEnd: '',
    priority: 'normal' as 'normal' | 'urgent' | 'vip',
    specialInstructions: '',
    accessNotes: '',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="bg-surface-0 rounded-2xl border border-surface-200 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h3 className="font-bold text-h5 text-surface-900 flex items-center gap-2">
          <Home className="w-5 h-5 text-accent-500" />
          طلب زيارة منزلية
        </h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">اسم المريض *</label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
              placeholder="اسم المريض"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">رقم الهاتف *</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input
                type="tel"
                value={form.patientPhone}
                onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
                placeholder="05XXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">العنوان *</label>
          <div className="relative">
            <MapPin className="absolute right-3 top-3 w-4 h-4 text-surface-300" />
            <input
              type="text"
              value={form.patientAddress}
              onChange={(e) => setForm((f) => ({ ...f, patientAddress: e.target.value }))}
              className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
              placeholder="العنوان التفصيلي"
            />
          </div>
          <div className="mt-2 w-full h-32 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-300">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-1" />
              <span className="text-caption">خريطة</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">التاريخ المفضل</label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">من الساعة</label>
            <input
              type="time"
              value={form.preferredTimeStart}
              onChange={(e) => setForm((f) => ({ ...f, preferredTimeStart: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">إلى الساعة</label>
            <input
              type="time"
              value={form.preferredTimeEnd}
              onChange={(e) => setForm((f) => ({ ...f, preferredTimeEnd: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">الأولوية</label>
          <div className="flex gap-2">
            {([
              { value: 'normal', label: 'عادي', icon: <Clock className="w-4 h-4" />, activeClass: 'border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-200' },
              { value: 'urgent', label: 'عاجل', icon: <AlertTriangle className="w-4 h-4" />, activeClass: 'border-warning-400 bg-warning-50 text-warning-700 ring-1 ring-warning-200' },
              { value: 'vip', label: 'VIP', icon: <Star className="w-4 h-4" />, activeClass: 'border-saffron-400 bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, priority: opt.value }))}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-body-sm font-medium transition-all',
                  form.priority === opt.value ? opt.activeClass : 'border-surface-200 text-surface-500 hover:bg-surface-50',
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">تعليمات خاصة</label>
            <textarea
              value={form.specialInstructions}
              onChange={(e) => setForm((f) => ({ ...f, specialInstructions: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition resize-none"
              placeholder="تعليمات خاصة..."
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">ملاحظات الوصول</label>
            <textarea
              value={form.accessNotes}
              onChange={(e) => setForm((f) => ({ ...f, accessNotes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition resize-none"
              placeholder="رقم البوابة، معالم قريبة..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-surface-200 text-body-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
        >
          إلغاء
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmit({
            patientName: form.patientName,
            patientPhone: form.patientPhone,
            patientAddress: form.patientAddress,
            patientCity: form.patientCity || undefined,
            preferredDate: form.preferredDate || undefined,
            preferredTimeStart: form.preferredTimeStart || undefined,
            preferredTimeEnd: form.preferredTimeEnd || undefined,
            priority: form.priority,
            specialInstructions: form.specialInstructions || undefined,
            accessNotes: form.accessNotes || undefined,
          })}
          disabled={!form.patientName || !form.patientPhone || !form.patientAddress}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-body-sm text-white transition-colors',
            (!form.patientName || !form.patientPhone || !form.patientAddress)
              ? 'bg-surface-300 cursor-not-allowed'
              : 'bg-accent-500 hover:bg-accent-600',
          )}
        >
          <Home className="w-4 h-4" />
          طلب زيارة منزلية
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   11. EmergencyRegistrationForm
   ────────────────────────────────────────────────────────────────────────────── */

interface EmergencyRegistrationFormProps {
  onSubmit: (data: Partial<EmergencyCase>) => void;
  onCancel: () => void;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-400', label: 'حرج', icon: <Heart className="w-5 h-5" /> },
  urgent:   { color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-400', label: 'عاجل', icon: <AlertTriangle className="w-5 h-5" /> },
  moderate: { color: 'text-saffron-600', bg: 'bg-saffron-50', border: 'border-saffron-400', label: 'متوسط', icon: <Activity className="w-5 h-5" /> },
};

export function EmergencyRegistrationForm({ onSubmit, onCancel }: EmergencyRegistrationFormProps) {
  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    severityLevel: 'urgent' as 'critical' | 'urgent' | 'moderate',
    symptoms: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    autoAssignDoctor: true,
  });

  const updateVital = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="bg-surface-0 rounded-2xl border-2 border-danger-200 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-danger-200 bg-danger-50">
        <h3 className="font-bold text-h5 text-danger-700 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          تسجيل طوارئ
        </h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-danger-400 hover:text-danger-600 hover:bg-danger-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">اسم المريض *</label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-danger-200 focus:border-danger-400 outline-none transition"
              placeholder="اسم المريض"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-surface-600 mb-1">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input
                type="tel"
                value={form.patientPhone}
                onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-danger-200 focus:border-danger-400 outline-none transition"
                placeholder="05XXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-2">مستوى الخطورة *</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setForm((f) => ({ ...f, severityLevel: key as typeof form.severityLevel }))}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                  form.severityLevel === key
                    ? `${cfg.border} ${cfg.bg} ${cfg.color} ring-2 ring-offset-1`
                    : 'border-surface-200 text-surface-500 hover:bg-surface-50',
                  key === 'critical' && form.severityLevel === 'critical' && 'animate-pulse',
                )}
              >
                {cfg.icon}
                <span className="font-semibold text-body-sm">{cfg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-1">الأعراض *</label>
          <textarea
            value={form.symptoms}
            onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-body focus:ring-2 focus:ring-danger-200 focus:border-danger-400 outline-none transition resize-none"
            placeholder="وصف الأعراض..."
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-surface-600 mb-2">القياسات الحيوية</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {([
              { field: 'bloodPressure', label: 'ضغط الدم', icon: <Droplets className="w-4 h-4" />, unit: 'mmHg', placeholder: '120/80' },
              { field: 'heartRate', label: 'معدل النبض', icon: <Heart className="w-4 h-4" />, unit: 'bpm', placeholder: '72' },
              { field: 'temperature', label: 'الحرارة', icon: <Thermometer className="w-4 h-4" />, unit: '°C', placeholder: '37.0' },
              { field: 'oxygenSaturation', label: 'التشبع بالأكسجين', icon: <Wind className="w-4 h-4" />, unit: '%', placeholder: '98' },
              { field: 'respiratoryRate', label: 'معدل التنفس', icon: <Activity className="w-4 h-4" />, unit: '/min', placeholder: '16' },
            ] as const).map((v) => (
              <div key={v.field} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1 text-surface-400">
                  {v.icon}
                  <span className="text-caption">{v.label}</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={(form as any)[v.field]}
                    onChange={(e) => updateVital(v.field, e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-surface-200 text-center text-body-sm font-mono focus:ring-2 focus:ring-danger-200 focus:border-danger-400 outline-none transition"
                    placeholder={v.placeholder}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-caption text-surface-300">{v.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoAssignDoctor}
            onChange={(e) => setForm((f) => ({ ...f, autoAssignDoctor: e.target.checked }))}
            className="w-4 h-4 rounded text-danger-500 focus:ring-danger-200"
          />
          <span className="text-body-sm text-surface-600">تعيين طبيب تلقائياً</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-danger-200 bg-danger-50">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-surface-200 text-body-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
        >
          إلغاء
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmit({
            patientName: form.patientName,
            severityLevel: form.severityLevel,
            symptoms: form.symptoms,
            vitals: {
              bloodPressure: form.bloodPressure || undefined,
              heartRate: form.heartRate ? Number(form.heartRate) : undefined,
              temperature: form.temperature ? Number(form.temperature) : undefined,
              oxygenSaturation: form.oxygenSaturation ? Number(form.oxygenSaturation) : undefined,
              respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
            },
          })}
          disabled={!form.patientName || !form.symptoms}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-body-sm text-white transition-colors',
            (!form.patientName || !form.symptoms)
              ? 'bg-surface-300 cursor-not-allowed'
              : 'bg-danger-500 hover:bg-danger-600 shadow-danger',
          )}
        >
          <Zap className="w-4 h-4" />
          تسجيل طوارئ
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   12. WaitTimeEstimate
   ────────────────────────────────────────────────────────────────────────────── */

interface WaitTimeEstimateProps {
  estimatedMinutes: number;
  position: number;
  priority: QueuePriority;
}

export function WaitTimeEstimate({ estimatedMinutes, position, priority }: WaitTimeEstimateProps) {
  const priorityCfg = PRIORITY_CONFIG[priority];
  const maxWait = 60;
  const progress = Math.min((estimatedMinutes / maxWait) * 100, 100);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface-0 rounded-xl border border-surface-200 p-5 text-center"
    >
      <div className="relative inline-flex items-center justify-center mb-3">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-100" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none"
            strokeWidth="6" strokeLinecap="round"
            className={cn(
              estimatedMinutes > 30 ? 'text-danger-500' : estimatedMinutes > 15 ? 'text-warning-500' : 'text-success-500',
            )}
            stroke="currentColor"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h2 font-bold text-surface-900">{estimatedMinutes}</span>
          <span className="text-caption text-surface-400">دقيقة</span>
        </div>
      </div>

      <PriorityBadge priority={priority} size="sm" />

      <div className="mt-3 space-y-1">
        <p className="text-body-sm text-surface-600">
          الترتيب: <span className="font-bold text-surface-900">#{position}</span> في القائمة
        </p>
        <p className="text-caption text-surface-400">
          أسرع من {(100 - Math.min(position * 5, 95))}% من المرضى
        </p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   13. QueueDisplayScreen - Full-screen waiting area display
   ────────────────────────────────────────────────────────────────────────────── */

interface QueueDisplayScreenProps {
  entries: QueueEntry[];
  calledEntry?: QueueEntry;
  branchName: string;
}

const ANNOUNCEMENTS = [
  'يرجى الحضور مع الهوية الوطنية أو سجل الأحوال المدنية',
  'نحترم وقتماً — شكراً لانتظاركم',
  'يمكنكم طلب فحص إضافي من خلال طبيبكم المعالج',
  'ال результатات متاحة خلال 24 ساعة عبر التطبيق',
  'للطلبات العاجلة يرجى التواصل مع الاستقبال',
];

export function QueueDisplayScreen({ entries, calledEntry, branchName }: QueueDisplayScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const waitingEntries = useMemo(
    () => entries.filter((e) => e.status === 'waiting').sort((a, b) => {
      const pOrder: Record<QueuePriority, number> = { emergency: 0, vip: 1, priority: 2, normal: 3 };
      return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
    }).slice(0, 5),
    [entries],
  );

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col select-none">
      <header className="flex items-center justify-between px-10 py-6 border-b border-surface-700/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-h3 font-bold">{branchName}</h1>
            <p className="text-body-sm text-surface-400">المختبر الشامل</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-h2 font-mono font-bold text-brand-400">
            {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-body-sm text-surface-400">
            {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="flex-1 flex">
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
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-4"
                >
                  <BellRing className="w-16 h-16 text-saffron-400 mx-auto" />
                </motion.div>
                <p className="text-body-lg text-surface-300 mb-2">الآن في الخدمة</p>
                <motion.p
                  className="text-display font-mono font-extrabold text-brand-400 mb-3"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {calledEntry.ticketNumber}
                </motion.p>
                <p className="text-h2 font-bold text-white">{calledEntry.patientName}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Clock className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                <p className="text-h3 text-surface-400">بانتظار المرضى接下来...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-96 border-l border-surface-700/50 p-6">
          <h2 className="text-h5 font-bold text-surface-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
           接下来 في الانتظار
          </h2>
          <div className="space-y-3">
            {waitingEntries.length === 0 ? (
              <p className="text-body-sm text-surface-500">لا يوجد مرضى في الانتظار</p>
            ) : (
              waitingEntries.map((entry, idx) => {
                const pCfg = PRIORITY_CONFIG[entry.priority];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-body-sm font-bold text-surface-300">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{entry.patientName}</p>
                      <p className="text-caption text-surface-400 font-mono">{entry.ticketNumber}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', pCfg.bg, pCfg.color)}>
                      {pCfg.labelAr}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-surface-700/50 px-10 py-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={announcementIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-body-sm text-surface-400"
          >
            {ANNOUNCEMENTS[announcementIdx]}
          </motion.p>
        </AnimatePresence>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   14. BarcodeGenerator
   ────────────────────────────────────────────────────────────────────────────── */

interface BarcodeGeneratorProps {
  entityType: string;
  entityId: string;
  onPrint: (config: { printerId: string; copies: number; paperSize: string }) => void;
}

export function BarcodeGenerator({ entityType, entityId, onPrint }: BarcodeGeneratorProps) {
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState('80mm');
  const [printerId, setPrinterId] = useState('');
  const qrUrl = useMemo(() => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${entityType}:${entityId}`)}`, [entityType, entityId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-0 rounded-xl border border-surface-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-200 bg-surface-50">
        <QrCode className="w-5 h-5 text-brand-500" />
        <h4 className="font-bold text-body text-surface-900">باركود / QR Code</h4>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 bg-surface-50 rounded-xl p-4 text-center border border-surface-200">
            <p className="text-caption text-surface-400 mb-2">باركود</p>
            <div className="flex items-center justify-center h-24 bg-white rounded-lg border border-surface-200">
              <div className="flex items-end gap-px h-16">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-surface-900"
                    style={{ width: Math.random() > 0.5 ? 2 : 1, height: `${50 + Math.random() * 50}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-caption text-surface-500 font-mono mt-2">{entityId}</p>
          </div>
          <div className="flex-1 bg-surface-50 rounded-xl p-4 text-center border border-surface-200">
            <p className="text-caption text-surface-400 mb-2">QR Code</p>
            <img src={qrUrl} alt="QR Code" className="w-24 h-24 mx-auto rounded-lg" />
            <p className="text-caption text-surface-500 font-mono mt-2">{entityType}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-caption text-surface-400 mb-1">الناشر</label>
            <select
              value={printerId}
              onChange={(e) => setPrinterId(e.target.value)}
              className="w-full px-2 py-2 rounded-lg border border-surface-200 text-body-sm bg-surface-0 focus:ring-2 focus:ring-brand-200 outline-none"
            >
              <option value="">اختر...</option>
              <option value="thermal-1">طابعة حرارية 1</option>
              <option value="thermal-2">طابعة حرارية 2</option>
              <option value="laser-1">طابعة ليزر</option>
            </select>
          </div>
          <div>
            <label className="block text-caption text-surface-400 mb-1">الحجم</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full px-2 py-2 rounded-lg border border-surface-200 text-body-sm bg-surface-0 focus:ring-2 focus:ring-brand-200 outline-none"
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
              <option value="a4">A4</option>
              <option value="label">ملصق</option>
            </select>
          </div>
          <div>
            <label className="block text-caption text-surface-400 mb-1">العدد</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-100 transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="flex-1 text-center font-bold text-body">{copies}</span>
              <button
                onClick={() => setCopies((c) => Math.min(10, c + 1))}
                className="p-1.5 rounded-lg border border-surface-200 hover:bg-surface-100 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-200 bg-surface-50">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 text-body-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors">
          <Download className="w-4 h-4" />
          تحميل PDF
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPrint({ printerId, copies, paperSize })}
          disabled={!printerId}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-body-sm text-white transition-colors',
            !printerId ? 'bg-surface-300 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 shadow-brand',
          )}
        >
          <Printer className="w-4 h-4" />
          طباعة
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   15. KeyboardShortcutsHelp
   ────────────────────────────────────────────────────────────────────────────── */

interface KeyboardShortcutsHelpProps {
  shortcuts: { id: string; key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; description: string; descriptionAr: string; action?: string; category: string }[];
  onClose: () => void;
}

const SHORTCUT_CATEGORIES: Record<string, { label: string; labelAr: string; icon: React.ReactNode }> = {
  queue:       { label: 'Queue',       labelAr: 'القائمة',       icon: <Users className="w-4 h-4" /> },
  'walk-in':   { label: 'Walk-in',     labelAr: 'الحضور',        icon: <UserPlus className="w-4 h-4" /> },
  search:      { label: 'Search',      labelAr: 'البحث',         icon: <Search className="w-4 h-4" /> },
  navigation:  { label: 'Navigation',  labelAr: 'التنقل',       icon: <ArrowRight className="w-4 h-4" /> },
  general:     { label: 'General',     labelAr: 'عام',           icon: <Settings className="w-4 h-4" /> },
};

export function KeyboardShortcutsHelp({ shortcuts, onClose }: KeyboardShortcutsHelpProps) {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const filtered = search
      ? shortcuts.filter((s) => s.descriptionAr.includes(search) || s.description.includes(search))
      : shortcuts;
    return filtered.reduce<Record<string, typeof shortcuts>>((acc, s) => {
      (acc[s.category] = acc[s.category] || []).push(s);
      return acc;
    }, {});
  }, [shortcuts, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-surface-0 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-200">
          <Keyboard className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-h5 text-surface-900 flex-1">اختصارات لوحة المفاتيح</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-surface-200 text-body-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition"
              placeholder="بحث..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {Object.entries(grouped).length === 0 ? (
            <p className="text-center text-surface-400 py-8">لا توجد نتائج</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => {
              const catConfig = SHORTCUT_CATEGORIES[cat] || SHORTCUT_CATEGORIES.general;
              return (
                <div key={cat}>
                  <h4 className="flex items-center gap-2 text-body-sm font-semibold text-surface-600 mb-2">
                    {catConfig.icon}
                    {catConfig.labelAr}
                  </h4>
                  <div className="space-y-1.5">
                    {items.map((shortcut) => (
                      <div key={shortcut.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50">
                        <span className="text-body-sm text-surface-700">{shortcut.descriptionAr}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.ctrlKey && (
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-100 border border-surface-200 text-caption font-mono text-surface-500">Ctrl</kbd>
                          )}
                          {shortcut.shiftKey && (
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-100 border border-surface-200 text-caption font-mono text-surface-500">Shift</kbd>
                          )}
                          {shortcut.altKey && (
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-100 border border-surface-200 text-caption font-mono text-surface-500">Alt</kbd>
                          )}
                          <kbd className="min-w-[28px] px-2 py-0.5 rounded bg-surface-100 border border-surface-200 text-caption font-mono text-surface-700 text-center">
                            {shortcut.key}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   16. ReceptionActivityFeed
   ────────────────────────────────────────────────────────────────────────────── */

interface ReceptionActivityFeedProps {
  activities: { action: string; user: string; details: string; time: string }[];
}

const ACTIVITY_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  'queue-call':      { icon: <BellRing className="w-4 h-4" />,  color: 'text-brand-500' },
  'queue-complete':  { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-success-500' },
  'queue-cancel':    { icon: <XCircle className="w-4 h-4" />,   color: 'text-danger-500' },
  'walk-in':         { icon: <UserPlus className="w-4 h-4" />,  color: 'text-accent-500' },
  'insurance':       { icon: <Shield className="w-4 h-4" />,    color: 'text-info-500' },
  'transfer':        { icon: <ArrowRight className="w-4 h-4" />, color: 'text-saffron-500' },
  'home-visit':      { icon: <Home className="w-4 h-4" />,      color: 'text-accent-600' },
  'emergency':       { icon: <Heart className="w-4 h-4" />,     color: 'text-danger-500' },
  'print':           { icon: <Printer className="w-4 h-4" />,   color: 'text-surface-400' },
  'default':         { icon: <Activity className="w-4 h-4" />,  color: 'text-surface-400' },
};

export function ReceptionActivityFeed({ activities }: ReceptionActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities.length]);

  return (
    <div className="bg-surface-0 rounded-xl border border-surface-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-200 bg-surface-50">
        <Activity className="w-4 h-4 text-brand-500" />
        <h4 className="font-bold text-body-sm text-surface-900">النشاط الأخير</h4>
      </div>

      <div ref={feedRef} className="max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-10">
            <Activity className="w-8 h-8 text-surface-200 mx-auto mb-2" />
            <p className="text-caption text-surface-400">لا يوجد نشاط بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            <AnimatePresence initial={false}>
              {activities.map((activity, idx) => {
                const iconConfig = ACTIVITY_ICON_MAP[activity.action] || ACTIVITY_ICON_MAP.default;
                return (
                  <motion.div
                    key={`${activity.time}-${idx}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <div className={cn('flex-shrink-0 mt-0.5', iconConfig.color)}>
                      {iconConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-surface-700">
                        <span className="font-semibold text-surface-900">{activity.user}</span>
                        {' — '}
                        {activity.details}
                      </p>
                      <p className="text-caption text-surface-400 mt-0.5">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
