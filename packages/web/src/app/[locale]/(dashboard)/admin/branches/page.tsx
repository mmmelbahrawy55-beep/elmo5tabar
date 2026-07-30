'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALL_BRANCHES } from '@/data/branches';
import {
  Building2,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Star,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
  Globe,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'city' | 'type' | 'status' | 'capacity' | 'patients' | 'rating' | 'sync';
type SortDir = 'asc' | 'desc';

const TYPE_LABELS: Record<string, string> = {
  main: 'رئيسي',
  branch: 'فرع',
  specialty: 'تخصصي',
  express: 'سريع',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  maintenance: 'صيانة',
  closed: 'مغلق',
  'coming-soon': 'قادم',
};

const SYNC_LABELS: Record<string, string> = {
  synced: 'متزامن',
  syncing: 'جاري المزامنة',
  error: 'خطأ',
  offline: 'غير متصل',
};

const TYPE_COLORS: Record<string, string> = {
  main: 'bg-brand-100 text-brand-700',
  branch: 'bg-blue-100 text-blue-700',
  specialty: 'bg-purple-100 text-purple-700',
  express: 'bg-emerald-100 text-emerald-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
  'coming-soon': 'bg-purple-100 text-purple-700',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  maintenance: 'bg-yellow-500',
  closed: 'bg-red-500',
  'coming-soon': 'bg-purple-500',
};

const SYNC_DOT_COLORS: Record<string, string> = {
  synced: 'bg-emerald-500',
  syncing: 'bg-yellow-500 animate-pulse',
  error: 'bg-red-500',
  offline: 'bg-gray-400',
};

const ACTIVITY_LOG = [
  { id: 1, text: 'تم تحديث بيانات فرع الرياض الرئيسي', time: 'منذ 5 دقائق', color: 'bg-blue-500' },
  { id: 2, text: 'فرع جدة - الحمراء: مزامنة ناجحة', time: 'منذ 8 دقائق', color: 'bg-emerald-500' },
  { id: 3, text: 'تنبيه: فرع الصحافة - ازدحام مرتفع (70%)', time: 'منذ 12 دقيقة', color: 'bg-yellow-500' },
  { id: 4, text: 'تم إضافة خدمة جديدة لفرع الدمام', time: 'منذ 20 دقيقة', color: 'bg-blue-500' },
  { id: 5, text: 'فرع الجبيل: تحديث ساعات العمل', time: 'منذ 30 دقيقة', color: 'bg-purple-500' },
  { id: 6, text: 'فرع نيوم: تم تأكيد موعد الافتتاح', time: 'منذ 45 دقيقة', color: 'bg-emerald-500' },
  { id: 7, text: 'خطأ في مزامنة بيانات فرع تبوك', time: 'منذ ساعة', color: 'bg-red-500' },
  { id: 8, text: 'فرع الخبر: تحديث قائمة التحاليل', time: 'منذ ساعة', color: 'bg-blue-500' },
  { id: 9, text: 'تم اعتماد فرع المدينة المنورة - ISO 15189', time: 'منذ ساعتين', color: 'bg-emerald-500' },
  { id: 10, text: 'فرع النزهة: تحسين أداء النظام', time: 'منذ 3 ساعات', color: 'bg-purple-500' },
];

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'الاسم' },
  { key: 'city', label: 'المدينة' },
  { key: 'type', label: 'النوع' },
  { key: 'status', label: 'الحالة' },
  { key: 'capacity', label: 'السعة' },
  { key: 'patients', label: 'المرضى' },
  { key: 'rating', label: 'التقييم' },
  { key: 'sync', label: 'المزامنة' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function AdminBranchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const branches = ALL_BRANCHES;

  const totalPatients = useMemo(
    () => branches.reduce((sum, b) => sum + b.totalPatients, 0),
    [branches],
  );

  const avgRating = useMemo(() => {
    const rated = branches.filter((b) => b.rating > 0);
    return rated.length > 0
      ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
      : '0.0';
  }, [branches]);

  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active').length,
    [branches],
  );

  const maintenanceBranches = useMemo(
    () => branches.filter((b) => b.status === 'maintenance').length,
    [branches],
  );

  const comingSoonBranches = useMemo(
    () => branches.filter((b) => b.status === 'coming-soon').length,
    [branches],
  );

  const syncHealth = useMemo(() => {
    const synced = branches.filter((b) => b.syncStatus === 'synced').length;
    return branches.length > 0 ? Math.round((synced / branches.length) * 100) : 0;
  }, [branches]);

  const filteredBranches = useMemo(() => {
    let result = [...branches];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.nameAr.includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.address.city.includes(q) ||
          b.address.city.toLowerCase().includes(q) ||
          b.region.includes(q),
      );
    }

    if (filterType !== 'all') {
      result = result.filter((b) => b.type === filterType);
    }

    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.nameAr.localeCompare(b.nameAr, 'ar');
          break;
        case 'city':
          cmp = a.address.city.localeCompare(b.address.city, 'ar');
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'capacity':
          cmp = a.capacity.percentage - b.capacity.percentage;
          break;
        case 'patients':
          cmp = a.totalPatients - b.totalPatients;
          break;
        case 'rating':
          cmp = a.rating - b.rating;
          break;
        case 'sync':
          cmp = a.syncStatus.localeCompare(b.syncStatus);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [branches, searchQuery, sortKey, sortDir, filterType, filterStatus]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = { main: 0, branch: 0, specialty: 0, express: 0 };
    branches.forEach((b) => {
      counts[b.type] = (counts[b.type] || 0) + 1;
    });
    return counts;
  }, [branches]);

  const maxTypeCount = Math.max(...Object.values(typeDistribution), 1);

  const regionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach((b) => {
      counts[b.region] = (counts[b.region] || 0) + 1;
    });
    return counts;
  }, [branches]);

  const capacityAlertBranches = useMemo(
    () => branches.filter((b) => b.capacity.percentage > 80 && b.status === 'active'),
    [branches],
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">إدارة الفروع</h1>
            <p className="mt-1 text-sm text-gray-500">
              إدارة ومتابعة جميع فروع المختبر في المملكة العربية السعودية
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md">
            <Plus className="h-4 w-4" />
            إضافة فرع
          </button>
        </motion.div>

        {/* ─── Stats Overview ─── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                <Building2 className="h-5 w-5 text-brand-600" />
              </div>
              <span className="text-xs font-medium text-gray-400">إجمالي</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{branches.length}</div>
            <div className="mt-0.5 text-sm text-gray-500">إجمالي الفروع</div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-500">نشط</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{activeBranches}</div>
            <div className="mt-0.5 text-sm text-gray-500">الفروع النشطة</div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-yellow-500">صيانة</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{maintenanceBranches}</div>
            <div className="mt-0.5 text-sm text-gray-500">قيد الصيانة</div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-500">قريباً</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{comingSoonBranches}</div>
            <div className="mt-0.5 text-sm text-gray-500">قادم</div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-500">
                <TrendingUp className="inline h-3 w-3" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">
              {totalPatients.toLocaleString('ar-SA')}
            </div>
            <div className="mt-0.5 text-sm text-gray-500">إجمالي المرضى</div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-amber-500">متوسط</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{avgRating}</div>
            <div className="mt-0.5 text-sm text-gray-500">متوسط التقييم</div>
          </motion.div>
        </motion.div>

        {/* ─── Realtime Sync Panel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="h-5 w-5 text-brand-600" />
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">حالة المزامنة في الوقت الفعلي</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                صحة المزامنة:{' '}
                <span
                  className={cn(
                    'font-semibold',
                    syncHealth >= 90
                      ? 'text-emerald-600'
                      : syncHealth >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600',
                  )}
                >
                  {syncHealth}%
                </span>
              </span>
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition',
                  isSyncing
                    ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                    : 'bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                مزامنة الآن
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition',
                  branch.syncStatus === 'error'
                    ? 'border-red-200 bg-red-50/50'
                    : branch.syncStatus === 'syncing'
                      ? 'border-yellow-200 bg-yellow-50/50'
                      : branch.syncStatus === 'offline'
                        ? 'border-gray-200 bg-gray-50/50'
                        : 'border-gray-100 bg-white',
                )}
              >
                <div className="flex-shrink-0">
                  {branch.syncStatus === 'synced' ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : branch.syncStatus === 'syncing' ? (
                    <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
                  ) : branch.syncStatus === 'error' ? (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{branch.nameAr}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', SYNC_DOT_COLORS[branch.syncStatus])} />
                    <span className="text-xs text-gray-500">{SYNC_LABELS[branch.syncStatus]}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(branch.lastSynced).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Branch Management Table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900">قائمة الفروع</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث عن فرع..."
                  className="w-full rounded-xl border border-gray-200 py-2 pr-9 pl-3 text-sm transition placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-56"
                />
              </div>
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 py-2 pr-9 pl-8 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="main">رئيسي</option>
                  <option value="branch">فرع</option>
                  <option value="specialty">تخصصي</option>
                  <option value="express">سريع</option>
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 py-2 pr-3 pl-8 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">نشط</option>
                  <option value="maintenance">صيانة</option>
                  <option value="closed">مغلق</option>
                  <option value="coming-soon">قادم</option>
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {SORT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="cursor-pointer select-none whitespace-nowrap px-6 py-3 transition hover:text-brand-600"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key && (
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform',
                              sortDir === 'desc' && 'rotate-180',
                            )}
                          />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-6 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBranches.map((branch) => {
                  const capPct = branch.capacity.percentage;
                  const capColor =
                    capPct > 80
                      ? 'bg-red-500'
                      : capPct > 50
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500';

                  return (
                    <tr
                      key={branch.id}
                      className={cn(
                        'transition hover:bg-gray-50/80',
                        capPct > 80 && branch.status === 'active' && 'bg-red-50/30',
                      )}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Building2 className="h-4 w-4 text-brand-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{branch.nameAr}</div>
                            <span
                              className={cn(
                                'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                TYPE_COLORS[branch.type],
                              )}
                            >
                              {TYPE_LABELS[branch.type]}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {branch.address.city}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                            TYPE_COLORS[branch.type],
                          )}
                        >
                          {TYPE_LABELS[branch.type]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            STATUS_COLORS[branch.status],
                          )}
                        >
                          <span
                            className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[branch.status])}
                          />
                          {STATUS_LABELS[branch.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn('h-full rounded-full transition-all', capColor)}
                              style={{ width: `${capPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{capPct}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {branch.totalPatients.toLocaleString('ar-SA')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {branch.rating > 0 ? branch.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={cn('h-2.5 w-2.5 rounded-full inline-block', SYNC_DOT_COLORS[branch.syncStatus])} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-600">
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBranches.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                لا توجد نتائج مطابقة للبحث
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── Capacity Monitor ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">مراقب السعة</h2>
            {capacityAlertBranches.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {capacityAlertBranches.length} فرع فوق 80%
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {branches
              .filter((b) => b.status !== 'coming-soon')
              .map((branch) => {
                const pct = branch.capacity.percentage;
                const barColor =
                  pct > 80
                    ? 'from-red-500 to-red-400'
                    : pct > 50
                      ? 'from-yellow-500 to-yellow-400'
                      : 'from-emerald-500 to-emerald-400';

                return (
                  <div
                    key={branch.id}
                    className={cn(
                      'rounded-xl border p-4 transition',
                      pct > 80
                        ? 'border-red-200 bg-red-50/50 ring-1 ring-red-100'
                        : 'border-gray-100 bg-white',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {branch.nameAr}
                      </span>
                      {pct > 80 && (
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                      )}
                    </div>
                    <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r transition-all', barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        <span className="font-semibold text-gray-900">{branch.capacity.current}</span>
                        {' / '}
                        {branch.capacity.total}
                      </span>
                      <span>
                        في الانتظار:{' '}
                        <span className="font-semibold text-gray-900">
                          {branch.queueStatus.waiting}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ─── Branch Type Distribution ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-gray-900">توزيع الأنواع</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'main', color: 'from-brand-500 to-brand-400' },
                { key: 'branch', color: 'from-blue-500 to-blue-400' },
                { key: 'specialty', color: 'from-purple-500 to-purple-400' },
                { key: 'express', color: 'from-emerald-500 to-emerald-400' },
              ].map(({ key, color }) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{TYPE_LABELS[key]}</span>
                    <span className="text-gray-500">{typeDistribution[key]} فرع</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r transition-all', color)}
                      style={{
                        width: `${(typeDistribution[key] / maxTypeCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Regional Distribution ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-gray-900">التوزيع الجغرافي</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(regionDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([region, count]) => (
                  <div
                    key={region}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                        <MapPin className="h-4 w-4 text-brand-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{region}</span>
                    </div>
                    <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-bold text-brand-700">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* ─── Activity Log ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-gray-900">سجل النشاطات</h2>
            </div>
            <div className="space-y-0.5">
              {ACTIVITY_LOG.map((entry, idx) => (
                <div key={entry.id}>
                  <div className="flex items-start gap-3 py-2.5">
                    <div className="mt-1 flex-shrink-0">
                      <span className={cn('block h-2.5 w-2.5 rounded-full', entry.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700">{entry.text}</p>
                      <span className="mt-0.5 inline-block text-xs text-gray-400">{entry.time}</span>
                    </div>
                  </div>
                  {idx < ACTIVITY_LOG.length - 1 && (
                    <div className="mr-[4.5px] border-l-2 border-gray-100" style={{ height: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
