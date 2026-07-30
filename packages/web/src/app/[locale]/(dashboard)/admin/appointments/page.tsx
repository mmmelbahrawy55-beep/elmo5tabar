'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  RefreshCw,
  MapPin,
  Phone,
} from 'lucide-react';
import { Card, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput } from '@/design-system/forms/FormField';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  Th,
  Td,
} from '@/design-system/layout/Table';
import { cn, formatDate, getStatusLabel } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_APPOINTMENTS = [
  { id: 'APT-001', patient: 'أحمد بن سعيد العتيبي', phone: '0551234567', service: 'فحص دوري', branch: 'الرياض الرئيسي', doctor: 'د. سارة الأحمد', date: '2026-07-28', time: '09:00', status: 'confirmed', payment: 'paid', amount: 350 },
  { id: 'APT-002', patient: 'فاطمة بنت محمد القحطاني', phone: '0559876543', service: 'فحص شامل', branch: 'جدة', doctor: 'د. محمد الراشد', date: '2026-07-28', time: '10:30', status: 'in-progress', payment: 'paid', amount: 520 },
  { id: 'APT-003', patient: 'خالد بن عبدالله الشمري', phone: '0541112233', service: 'HbA1c + كوليسترول', branch: 'الرياض الرئيسي', doctor: 'د. فاطمة الزهراء', date: '2026-07-28', time: '11:00', status: 'checked-in', payment: 'paid', amount: 175 },
  { id: 'APT-004', patient: 'نورة بنت سعد الدوسري', phone: '0534445566', service: 'فيتامين د + B12', branch: 'الدمام', doctor: 'د. سارة الأحمد', date: '2026-07-28', time: '14:00', status: 'pending', payment: 'pending', amount: 215 },
  { id: 'APT-005', patient: 'عبدالرحمن بن فيصل المطيري', phone: '0567890123', service: 'زيارة منزلية - CBC', branch: 'الرياض الشمالي', doctor: 'د. نورا الحربي', date: '2026-07-28', time: '15:30', status: 'pending', payment: 'paid', amount: 195 },
  { id: 'APT-006', patient: 'سارة بنت خالد العتيبي', phone: '0512345678', service: 'تحليل شامل', branch: 'جدة', doctor: 'د. محمد الراشد', date: '2026-07-29', time: '08:30', status: 'confirmed', payment: 'paid', amount: 480 },
  { id: 'APT-007', patient: 'محمد بن أحمد السبيعي', phone: '0523456789', service: 'وظائف كلى', branch: 'الرياض الرئيسي', doctor: 'د. فاطمة الزهراء', date: '2026-07-29', time: '09:15', status: 'confirmed', payment: 'paid', amount: 60 },
  { id: 'APT-008', patient: 'هدى بنت عمر الغامدي', phone: '0534567890', service: 'TSH + T4', branch: 'مكة المكرمة', doctor: 'د. نورا الحربي', date: '2026-07-27', time: '10:00', status: 'completed', payment: 'paid', amount: 135 },
  { id: 'APT-009', patient: 'يوسف بن سليمان الزهراني', phone: '0545678901', service: 'فحص دوري', branch: 'الدمام', doctor: 'د. سارة الأحمد', date: '2026-07-27', time: '13:00', status: 'completed', payment: 'paid', amount: 290 },
  { id: 'APT-010', patient: 'رائد بن فهد الحربي', phone: '0556789012', service: 'استشارة طبية', branch: 'الرياض الرئيسي', doctor: 'د. فاطمة الزهراء', date: '2026-07-27', time: '11:30', status: 'no-show', payment: 'refunded', amount: 200 },
  { id: 'APT-011', patient: 'لمياء بنت ناصر السبيعي', phone: '0567890123', service: 'حديد + فيتامين د', branch: 'جدة', doctor: 'د. محمد الراشد', date: '2026-07-26', time: '09:00', status: 'cancelled', payment: 'refunded', amount: 180 },
  { id: 'APT-012', patient: 'عمر بن خالد الفيصل', phone: '0578901234', service: 'فحص شامل + CRP', branch: 'الرياض الرئيسي', doctor: 'د. نورا الحربي', date: '2026-07-26', time: '14:30', status: 'completed', payment: 'paid', amount: 625 },
  { id: 'APT-013', patient: 'منال بنت عبدالعزيز الأحمدي', phone: '0589012345', service: ' CBC + ESR', branch: 'الدمام', doctor: 'د. سارة الأحمد', date: '2026-07-30', time: '08:00', status: 'confirmed', payment: 'paid', amount: 75 },
  { id: 'APT-014', patient: 'تركي بن سعود العنزي', phone: '0590123456', service: 'lipid profile', branch: 'المدينة المنورة', doctor: 'د. فاطمة الزهراء', date: '2026-07-30', time: '10:00', status: 'pending', payment: 'pending', amount: 80 },
  { id: 'APT-015', patient: 'أريج بنت محمد القرني', phone: '0501234567', service: 'HbA1c', branch: 'الرياض الرئيسي', doctor: 'د. نورا الحربي', date: '2026-07-30', time: '11:00', status: 'confirmed', payment: 'paid', amount: 75 },
];

const MOCK_STATS = {
  total: 156,
  totalChange: +12.5,
  confirmed: 89,
  confirmedChange: +8.2,
  completed: 42,
  completedChange: +15.3,
  noShow: 8,
  noShowChange: -22.1,
  cancelled: 12,
  cancelledChange: -5.7,
  revenue: 48750,
  revenueChange: +18.4,
  avgWaitTime: '18 دقيقة',
  avgWaitChange: -3.2,
  utilization: 78,
  utilizationChange: +5.1,
};

const MOCK_HOUR_DATA = [
  { hour: '08:00', count: 12 },
  { hour: '09:00', count: 18 },
  { hour: '10:00', count: 22 },
  { hour: '11:00', count: 15 },
  { hour: '12:00', count: 8 },
  { hour: '13:00', count: 5 },
  { hour: '14:00', count: 14 },
  { hour: '15:00', count: 19 },
  { hour: '16:00', count: 16 },
  { hour: '17:00', count: 10 },
];

const MOCK_BRANCH_DATA = [
  { name: 'الرياض الرئيسي', count: 52, utilization: 85 },
  { name: 'جدة', count: 38, utilization: 76 },
  { name: 'الدمام', count: 28, utilization: 70 },
  { name: 'مكة المكرمة', count: 18, utilization: 65 },
  { name: 'المدينة المنورة', count: 12, utilization: 58 },
  { name: 'الرياض الشمالي', count: 8, utilization: 42 },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'قيد الانتظار' },
  confirmed: { color: 'bg-blue-100 text-blue-700', label: 'مؤكد' },
  'checked-in': { color: 'bg-indigo-100 text-indigo-700', label: 'تم تسجيل الوصول' },
  'in-progress': { color: 'bg-brand-100 text-brand-700', label: 'قيد التنفيذ' },
  completed: { color: 'bg-green-100 text-green-700', label: 'مكتمل' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'ملغي' },
  'no-show': { color: 'bg-orange-100 text-orange-700', label: 'لم يحضر' },
};

const PAYMENT_CONFIG: Record<string, { color: string; label: string }> = {
  paid: { color: 'bg-green-100 text-green-700', label: 'مدفوع' },
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'معلق' },
  refunded: { color: 'bg-gray-100 text-gray-700', label: 'مسترجع' },
  partial: { color: 'bg-orange-100 text-orange-700', label: 'جزئي' },
};

// ---------------------------------------------------------------------------
// Mini Bar Chart (pure CSS)
// ---------------------------------------------------------------------------
function MiniBarChart({ data, maxVal }: { data: typeof MOCK_HOUR_DATA; maxVal: number }) {
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col items-center justify-end h-32">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / maxVal) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.05 * data.indexOf(d) }}
              className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400 min-h-[2px]"
            />
          </div>
          <span className="text-[10px] text-surface-500 whitespace-nowrap">{d.hour.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Bar Row
// ---------------------------------------------------------------------------
function HorizontalBarRow({ label, count, max, utilization }: { label: string; count: number; max: number; utilization: number }) {
  const pct = (count / max) * 100;
  const utilColor = utilization >= 80 ? 'text-green-600' : utilization >= 60 ? 'text-yellow-600' : 'text-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-surface-700 w-32 truncate">{label}</span>
      <div className="flex-1 h-3 bg-surface-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className={cn(
            'h-full rounded-full',
            utilization >= 80 ? 'bg-green-500' : utilization >= 60 ? 'bg-yellow-500' : 'bg-red-400',
          )}
        />
      </div>
      <span className="text-sm font-semibold text-surface-900 w-8 text-left">{count}</span>
      <span className={cn('text-xs font-medium w-14 text-left', utilColor)}>{utilization}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminAppointmentsPage() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredAppointments = React.useMemo(() => {
    return MOCK_APPOINTMENTS.filter((apt) => {
      const matchesSearch =
        !searchQuery ||
        apt.patient.includes(searchQuery) ||
        apt.id.includes(searchQuery) ||
        apt.service.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_APPOINTMENTS.forEach((apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    });
    return counts;
  }, []);

  const maxHourCount = Math.max(...MOCK_HOUR_DATA.map((d) => d.count));
  const maxBranchCount = Math.max(...MOCK_BRANCH_DATA.map((d) => d.count));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">إدارة المواعيد</h1>
          <p className="text-sm text-surface-500 mt-1">مراقبة وإدارة جميع المواعيد عبر الفروع</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            تصدير التقرير
          </Button>
          <Button variant="primary" size="sm" icon={<Calendar className="w-4 h-4" />}>
            موعد جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="إجمالي المواعيد"
          value={MOCK_STATS.total}
          change={MOCK_STATS.totalChange}
          icon={<Calendar className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-50"
        />
        <StatCard
          title="مؤكدة"
          value={MOCK_STATS.confirmed}
          change={MOCK_STATS.confirmedChange}
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="مكتملة"
          value={MOCK_STATS.completed}
          change={MOCK_STATS.completedChange}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          title="لم يحضر"
          value={MOCK_STATS.noShow}
          change={MOCK_STATS.noShowChange}
          icon={<XCircle className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50"
          changeType="negative"
        />
        <StatCard
          title="الإيرادات"
          value={`${MOCK_STATS.revenue.toLocaleString()} ر.س`}
          change={MOCK_STATS.revenueChange}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
        />
        <StatCard
          title="معدل الإشغال"
          value={`${MOCK_STATS.utilization}%`}
          change={MOCK_STATS.utilizationChange}
          icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="appointments">المواعيد</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="no-shows">لم يحضروا</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">التوزيع حسب الساعة</h3>
                <p className="text-xs text-surface-500 mt-0.5">مواعيد اليوم</p>
              </div>
              <div className="p-5">
                <MiniBarChart data={MOCK_HOUR_DATA} maxVal={maxHourCount} />
              </div>
            </Card>

            {/* Branch Performance */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">أداء الفروع</h3>
                <p className="text-xs text-surface-500 mt-0.5">عدد المواعيد ومعدل الإشغال</p>
              </div>
              <div className="p-5 space-y-3">
                {MOCK_BRANCH_DATA.map((b) => (
                  <HorizontalBarRow key={b.name} label={b.name} count={b.count} max={maxBranchCount} utilization={b.utilization} />
                ))}
              </div>
            </Card>
          </div>

          {/* Today's Upcoming */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900">مواعيد اليوم القادمة</h3>
                <p className="text-xs text-surface-500 mt-0.5">{MOCK_APPOINTMENTS.filter((a) => a.date === '2026-07-28' && a.status !== 'completed').length} موعد متبقي</p>
              </div>
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </div>
            <div className="divide-y divide-surface-100">
              {MOCK_APPOINTMENTS.filter((a) => a.date === '2026-07-28' && a.status !== 'completed').map((apt) => (
                <div key={apt.id} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                  <div className="w-12 text-center">
                    <p className="text-sm font-bold text-brand-600">{apt.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{apt.patient}</p>
                    <p className="text-xs text-surface-500">{apt.service} • {apt.branch}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[apt.status]?.color)}>
                      {STATUS_CONFIG[apt.status]?.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-surface-700">{apt.amount} ر.س</div>
                  <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ─── Appointments Tab ─── */}
        <TabsContent value="appointments" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <SearchInput
              placeholder="بحث بالاسم، رقم الموعد، أو نوع الخدمة..."
              className="flex-1 w-full sm:w-auto"
              onSearch={setSearchQuery}
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'confirmed', label: 'مؤكدة' },
                { key: 'pending', label: 'قيد الانتظار' },
                { key: 'in-progress', label: 'قيد التنفيذ' },
                { key: 'completed', label: 'مكتملة' },
                { key: 'no-show', label: 'لم يحضر' },
                { key: 'cancelled', label: 'ملغاة' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    statusFilter === f.key
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
                  )}
                >
                  {f.label}
                  {f.key !== 'all' && statusCounts[f.key] && (
                    <span className="mr-1 opacity-70">({statusCounts[f.key]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <Card padding="none">
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th>رقم الموعد</Th>
                  <Th>المريض</Th>
                  <Th>الخدمة</Th>
                  <Th>الفرع</Th>
                  <Th>التاريخ والوقت</Th>
                  <Th>الحالة</Th>
                  <Th>الدفع</Th>
                  <Th>المبلغ</Th>
                  <Th>إجراءات</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow key={apt.id} hoverable>
                    <Td className="font-mono text-xs font-medium text-brand-600">{apt.id}</Td>
                    <Td>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{apt.patient}</p>
                        <p className="text-xs text-surface-500">{apt.phone}</p>
                      </div>
                    </Td>
                    <Td className="text-sm">{apt.service}</Td>
                    <Td>
                      <span className="flex items-center gap-1 text-sm text-surface-600">
                        <MapPin className="w-3 h-3" />
                        {apt.branch}
                      </span>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-sm">{formatDate(apt.date)}</p>
                        <p className="text-xs text-surface-500">{apt.time}</p>
                      </div>
                    </Td>
                    <Td>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[apt.status]?.color)}>
                        {STATUS_CONFIG[apt.status]?.label}
                      </span>
                    </Td>
                    <Td>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', PAYMENT_CONFIG[apt.payment]?.color)}>
                        {PAYMENT_CONFIG[apt.payment]?.label}
                      </span>
                    </Td>
                    <Td className="text-sm font-semibold text-surface-900">{apt.amount} ر.س</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors" title="عرض التفاصيل">
                          <Eye className="w-4 h-4 text-surface-400" />
                        </button>
                        {apt.status === 'confirmed' && (
                          <button className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="تأكيد الوصول">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="إلغاء">
                            <Ban className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredAppointments.length === 0 && (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">لا توجد مواعيد تطابق البحث</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ─── Analytics Tab ─── */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Distribution */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">توزيع الخدمات</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'تحليل مخبري', count: 68, pct: 43.6, color: 'bg-brand-500' },
                  { label: 'باقة فحص', count: 34, pct: 21.8, color: 'bg-green-500' },
                  { label: 'زيارة منزلية', count: 22, pct: 14.1, color: 'bg-purple-500' },
                  { label: 'استشارة طبية', count: 18, pct: 11.5, color: 'bg-yellow-500' },
                  { label: 'خدمات الشركات', count: 14, pct: 9.0, color: 'bg-red-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', s.color)} />
                    <span className="text-sm text-surface-700 flex-1">{s.label}</span>
                    <span className="text-sm font-semibold text-surface-900">{s.count}</span>
                    <span className="text-xs text-surface-500 w-12 text-left">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Methods */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">طرق الدفع</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'فيزا / ماستركارد', count: 58, pct: 37.2, color: 'bg-blue-500' },
                  { label: 'أبل باي / جوجل باي', count: 35, pct: 22.4, color: 'bg-gray-800' },
                  { label: 'نقدي', count: 28, pct: 17.9, color: 'bg-green-500' },
                  { label: 'تأمين طبي', count: 22, pct: 14.1, color: 'bg-purple-500' },
                  { label: 'المحفظة الإلكترونية', count: 13, pct: 8.3, color: 'bg-yellow-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', s.color)} />
                    <span className="text-sm text-surface-700 flex-1">{s.label}</span>
                    <span className="text-sm font-semibold text-surface-900">{s.count}</span>
                    <span className="text-xs text-surface-500 w-12 text-left">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cancellation Reasons */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-900">أسباب الإلغاء</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'تغيير الموعد', count: 5, color: 'bg-yellow-500' },
                  { label: 'ظروف شخصية', count: 3, color: 'bg-orange-500' },
                  { label: ' illness', count: 2, color: 'bg-red-500' },
                  { label: 'وجدت موعد آخر', count: 1, color: 'bg-gray-500' },
                  { label: 'أخرى', count: 1, color: 'bg-surface-300' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', s.color)} />
                    <span className="text-sm text-surface-700 flex-1">{s.label}</span>
                    <span className="text-sm font-semibold text-surface-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Weekly Trend */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">اتجاه المواعيد الأسبوعي</h3>
              <p className="text-xs text-surface-500 mt-0.5">آخر 7 أيام</p>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 h-48">
                {[
                  { day: 'السبت', count: 22 },
                  { day: 'الأحد', count: 28 },
                  { day: 'الاثنين', count: 32 },
                  { day: 'الثلاثاء', count: 26 },
                  { day: 'الأربعاء', count: 30 },
                  { day: 'الخميس', count: 18 },
                ].map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-surface-700">{d.count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / 35) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 min-h-[4px]"
                    />
                    <span className="text-[11px] text-surface-500">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ─── No-Shows Tab ─── */}
        <TabsContent value="no-shows" className="mt-6 space-y-6">
          <Card>
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900">المرضى الذين لم يحضروا</h3>
                <p className="text-xs text-surface-500 mt-0.5">آخر 30 يوم - {MOCK_STATS.noShow} حالة</p>
              </div>
              <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />}>تحديث</Button>
            </div>
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th>المريض</Th>
                  <Th>الموعد</Th>
                  <Th>الخدمة</Th>
                  <Th>الفرع</Th>
                  <Th>إجراءات</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_APPOINTMENTS.filter((a) => a.status === 'no-show').map((apt) => (
                  <TableRow key={apt.id} hoverable>
                    <Td>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{apt.patient}</p>
                        <p className="text-xs text-surface-500">{apt.phone}</p>
                      </div>
                    </Td>
                    <Td>
                      <div>
                        <p className="text-sm">{formatDate(apt.date)}</p>
                        <p className="text-xs text-surface-500">{apt.time}</p>
                      </div>
                    </Td>
                    <Td className="text-sm">{apt.service}</Td>
                    <Td className="text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.branch}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>اتصال</Button>
                        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>إعادة جدولة</Button>
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* No-Show Insights */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">تحليل عدم الحضور</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium">نسبة عدم الحضور</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">5.1%</p>
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -2.3% عن الشهر السابق
                </p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">خسائر تقريبية</p>
                <p className="text-2xl font-bold text-red-700 mt-1">200 ر.س</p>
                <p className="text-xs text-red-500 mt-1">قيمة المواعيد التي لم يحضر لها</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">أكثر يوم</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">الخميس</p>
                <p className="text-xs text-blue-500 mt-1">60% من حالات عدم الحضور</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
