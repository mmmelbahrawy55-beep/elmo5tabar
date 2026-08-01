'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  TestTube2,
  DollarSign,
  Calendar,
  Building2,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Bell,
  FileText,
  BarChart3,
  PieChart,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, StatCard, GlassCard } from '@/design-system/layout/Card'
import { Badge } from '@/design-system/primitives/Badge'
import { Button } from '@/design-system/primitives/Button'
import { BarChart, DonutChart, DonutLegend, Sparkline, MetricRow } from '@/design-system/data/ChartCard'
import { ProgressBar } from '@/design-system/feedback/Progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs'
import { LoadingSpinner } from '@/design-system/feedback/Alert'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/utils'

const revenueData = [
  { label: 'يناير', value: 320000 },
  { label: 'فبراير', value: 380000 },
  { label: 'مارس', value: 350000 },
  { label: 'أبريل', value: 420000 },
  { label: 'مايو', value: 480000 },
  { label: 'يونيو', value: 450000 },
  { label: 'يوليو', value: 520000 },
  { label: 'أغسطس', value: 490000 },
  { label: 'سبتمبر', value: 560000 },
  { label: 'أكتوبر', value: 610000 },
  { label: 'نوفمبر', value: 580000 },
  { label: 'ديسمبر', value: 650000 },
]

const monthlyExpensesData = [
  { label: 'يناير', value: 210000 },
  { label: 'فبراير', value: 225000 },
  { label: 'مارس', value: 218000 },
  { label: 'أبريل', value: 240000 },
  { label: 'مايو', value: 265000 },
  { label: 'يونيو', value: 252000 },
  { label: 'يوليو', value: 280000 },
  { label: 'أغسطس', value: 271000 },
  { label: 'سبتمبر', value: 300000 },
  { label: 'أكتوبر', value: 310000 },
  { label: 'نوفمبر', value: 295000 },
  { label: 'ديسمبر', value: 330000 },
]

const orderStatusData = [
  { label: 'قيد المعالجة', value: 45, color: '#3b82f6' },
  { label: 'مكتملة', value: 120, color: '#22c55e' },
  { label: 'قيد الانتظار', value: 30, color: '#f59e0b' },
  { label: 'ملغاة', value: 8, color: '#ef4444' },
]

const orderTypeData = [
  { label: 'تحاليل دموية', value: 89, color: '#3b82f6' },
  { label: 'تحاليل بول', value: 42, color: '#8b5cf6' },
  { label: 'تحاليل وراثية', value: 24, color: '#ec4899' },
  { label: 'تحاليل هرمونية', value: 18, color: '#f59e0b' },
  { label: 'تحاليل أخرى', value: 30, color: '#64748b' },
]

const departmentData = [
  { label: 'الطب الباطني', value: 185000, maxValue: 200000, orders: 542, change: 12.3 },
  { label: 'الجراحة العامة', value: 156000, maxValue: 200000, orders: 387, change: 8.7 },
  { label: 'طب الأطفال', value: 134000, maxValue: 200000, orders: 312, change: 15.2 },
  { label: 'طب العيون', value: 112000, maxValue: 200000, orders: 278, change: -3.1 },
  { label: 'طب الأسنان', value: 98000, maxValue: 200000, orders: 245, change: 6.8 },
  { label: 'طب الجلدية', value: 87000, maxValue: 200000, orders: 198, change: 4.2 },
  { label: 'طب النساء', value: 76000, maxValue: 200000, orders: 176, change: 9.5 },
]

const branchPerformance = [
  { label: 'الفرع الرئيسي - الرياض', value: 92, color: '#22c55e', revenue: 285000, patients: 624 },
  { label: 'فرع جدة', value: 87, color: '#3b82f6', revenue: 198000, patients: 432 },
  { label: 'فرع الدمام', value: 78, color: '#f59e0b', revenue: 142000, patients: 318 },
  { label: 'فرع مكة المكرمة', value: 83, color: '#8b5cf6', revenue: 165000, patients: 356 },
]

const recentActivities = [
  { id: 1, icon: CheckCircle2, text: 'تم إكمال تقرير الفحص #4521 - مريض: خالد العتيبي', time: 'منذ 5 دقائق', color: 'text-green-500', bgColor: 'bg-green-500/10 dark:bg-green-500/10' },
  { id: 2, icon: Users, text: 'تسجيل مريض جديد - أحمد محمد العلي', time: 'منذ 12 دقيقة', color: 'text-blue-500', bgColor: 'bg-blue-500/10 dark:bg-blue-500/10' },
  { id: 3, icon: TestTube2, text: 'طلب فحص مخبري جديد #4522 - قسم الطب الباطني', time: 'منذ 18 دقيقة', color: 'text-purple-500', bgColor: 'bg-purple-500/10 dark:bg-purple-500/10' },
  { id: 4, icon: AlertCircle, text: 'تنبيه: مخزون منخفض للويد المخبري - رصيد متبقي: 15 وحدة', time: 'منذ 25 دقيقة', color: 'text-red-500', bgColor: 'bg-red-500/10 dark:bg-red-500/10' },
  { id: 5, icon: DollarSign, text: 'دفعة مستلمة - فرع الرياض: 12,500 ر.س', time: 'منذ 30 دقيقة', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/10' },
  { id: 6, icon: FileText, text: 'تم رفع تقرير الأداء الشهري لشهر ديسمبر', time: 'منذ 45 دقيقة', color: 'text-orange-500', bgColor: 'bg-orange-500/10 dark:bg-orange-500/10' },
  { id: 7, icon: Building2, text: 'تحديث إعدادات الفرع الرئيسي - الرياض', time: 'منذ ساعة', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/10' },
  { id: 8, icon: Activity, text: 'اكتمال صيانة جهاز التحليل الآلي - Cobas c311', time: 'منذ ساعة و 10 دقائق', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/10' },
  { id: 9, icon: CheckCircle2, text: 'اعتماد التقرير المالي الشهري من المدير المالي', time: 'منذ ساعة و 25 دقيقة', color: 'text-green-500', bgColor: 'bg-green-500/10 dark:bg-green-500/10' },
  { id: 10, icon: Bell, text: 'إشعار: اقتراب موعد صلاحية رخصة الفرع - فرع الدمام', time: 'منذ ساعتين', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/10' },
]

const todayAppointments = [
  { time: '08:00', patient: 'خالد العتيبي', type: 'فحص عام', doctor: 'د. محمد الأحمدي', status: 'مكتمل' },
  { time: '08:30', patient: 'سارة الحربي', type: 'استشارة', doctor: 'د. فاطمة العلي', status: 'مكتمل' },
  { time: '09:00', patient: 'محمد الشمري', type: 'تحاليل', doctor: 'د. عبدالرحمن السالم', status: 'مكتمل' },
  { time: '09:30', patient: 'نورة القحطاني', type: 'فحص شامل', doctor: 'د. محمد الأحمدي', status: 'قيد التنفيذ' },
  { time: '10:00', patient: 'عبدالله السبيعي', type: 'متابعة', doctor: 'د. سعد المالكي', status: 'قيد التنفيذ' },
  { time: '10:30', patient: 'فاطمة الزهراني', type: 'تحاليل', doctor: 'د. عبدالرحمن السالم', status: 'قادم' },
  { time: '11:00', patient: 'يوسف المطيري', type: 'فحص عام', doctor: 'د. فاطمة العلي', status: 'قادم' },
  { time: '11:30', patient: 'ريم الدوسري', type: 'استشارة', doctor: 'د. سعد المالكي', status: 'قادم' },
  { time: '12:00', patient: 'عمر الغامدي', type: 'تحاليل', doctor: 'د. عبدالرحمن السالم', status: 'قادم' },
  { time: '12:30', patient: 'هند العنزي', type: 'فحص شامل', doctor: 'د. محمد الأحمدي', status: 'قادم' },
  { time: '13:00', patient: 'سلمان الفارسي', type: 'متابعة', doctor: 'د. سعد المالكي', status: 'قادم' },
  { time: '13:30', patient: 'منال البلوي', type: 'تحاليل', doctor: 'د. عبدالرحمن السالم', status: 'قادم' },
  { time: '14:00', patient: 'طارق العيسى', type: 'فحص عام', doctor: 'د. فاطمة العلي', status: 'قادم' },
  { time: '14:30', patient: 'حنان الحمود', type: 'استشارة', doctor: 'د. محمد الأحمدي', status: 'قادم' },
  { time: '15:00', patient: 'سلطان الرشيدي', type: 'تحاليل', doctor: 'د. عبدالرحمن السالم', status: 'قادم' },
]

const quickActions = [
  { label: 'إدارة الطلبات', icon: TestTube2, href: '/admin/orders', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400', description: '42 طلب نشط' },
  { label: 'إدارة المرضى', icon: Users, href: '/admin/patients', color: 'bg-green-500/10 text-green-600 dark:bg-green-400/10 dark:text-green-400', description: '1,856 مسجل' },
  { label: 'التقارير المالية', icon: DollarSign, href: '/admin/finance', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400', description: '650 ألف ر.س' },
  { label: 'إدارة المواعيد', icon: Calendar, href: '/admin/appointments', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400', description: '15 موعد اليوم' },
  { label: 'إدارة الفروع', icon: Building2, href: '/admin/branches', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400', description: '6 فروع نشطة' },
  { label: 'التقارير الإدارية', icon: BarChart3, href: '/admin/reports', color: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400', description: 'تقارير شهرية' },
]

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/20">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                لوحة التحكم التنفيذية
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                نظرة شاملة على أداء المختبر والعمليات
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
          <Button variant="outline" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلبات"
          value={formatNumber(2483)}
          change={12.5}
          trend="up"
          icon={<TestTube2 className="h-5 w-5" />}
        />
        <StatCard
          title="إجمالي المرضى"
          value={formatNumber(1856)}
          change={8.3}
          trend="up"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="الإيرادات الشهرية"
          value={`${formatCurrency(650000)} ر.س`}
          change={15.2}
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="مواعيد اليوم"
          value={formatNumber(42)}
          change={-2.1}
          trend="down"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-yellow-500/10 p-2 dark:bg-yellow-400/10">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">طلبات قيد الانتظار</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(30)}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-400/10">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">تقارير مكتملة اليوم</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(128)}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-400/10">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">الفروع النشطة</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">6 / 6</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-purple-500/10 p-2 dark:bg-purple-400/10">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">الأطباء المتصلين</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">24 / 32</p>
          </div>
        </GlassCard>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            المالية
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Activity className="h-4 w-4" />
            العمليات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    اتجاه الإيرادات الشهرية
                  </CardTitle>
                  <Badge variant="secondary">آخر 12 شهر</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <BarChart data={revenueData} height={280} />
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">متوسط الشهري</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(484167)} ر.س
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">أعلى شهر</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(650000)} ر.س
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">النمو السنوي</p>
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">+18.7%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  حالة الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <DonutChart data={orderStatusData} size={180} />
                <DonutLegend data={orderStatusData} />
                <div className="w-full space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">إجمالي الطلبات</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(203)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">معدل الإنجاز</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">59.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">معدل الإلغاء</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">3.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  أعلى الأقسام إيراداً
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={dept.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {dept.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {formatCurrency(dept.value)} ر.س
                      </span>
                    </div>
                    <ProgressBar value={(dept.value / dept.maxValue) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  آخر النشاطات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-50 p-2 transition-colors hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <div className={cn('mt-0.5 rounded-md p-1.5', activity.bgColor)}>
                        <activity.icon className={cn('h-3.5 w-3.5', activity.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {activity.text}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  أداء الفروع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {branchPerformance.map((branch) => (
                  <div key={branch.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {branch.label}
                      </span>
                      <Badge
                        variant={branch.value >= 90 ? 'default' : branch.value >= 80 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {branch.value}%
                      </Badge>
                    </div>
                    <ProgressBar value={branch.value} color={branch.color} className="h-2" />
                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                      <span>{formatCurrency(branch.revenue)} ر.س</span>
                      <span>{formatNumber(branch.patients)} مريض</span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">متوسط الأداء العام</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">85%</span>
                  </div>
                  <ProgressBar value={85} className="mt-2 h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">إيرادات هذا الشهر</p>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(650000)} ر.س
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-3 w-3" />
                <span>+15.2% من الشهر السابق</span>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">المصروفات الشهرية</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(330000)} ر.س
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <ArrowUpRight className="h-3 w-3" />
                <span>+8.4% من الشهر السابق</span>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">صافي الربح</p>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(320000)} ر.س
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-3 w-3" />
                <span>هامش ربح 49.2%</span>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">المبالغ المستحقة</p>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(85000)} ر.س
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <ArrowDownRight className="h-3 w-3" />
                <span>23 فاتورة معلقة</span>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  الإيرادات vs المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={revenueData} height={240} />
                <div className="mt-3 grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">الإيرادات: {formatCurrency(5810000)} ر.س</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-orange-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">المصروفات: {formatCurrency(3196000)} ر.س</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  توزيع الإيرادات حسب القسم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {departmentData.slice(0, 5).map((dept) => (
                  <div key={dept.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{dept.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(dept.value)} ر.س
                        </span>
                        {dept.change > 0 ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                            <ArrowUpRight className="h-2.5 w-2.5" />
                            {dept.change}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400">
                            <ArrowDownRight className="h-2.5 w-2.5" />
                            {Math.abs(dept.change)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ProgressBar value={(dept.value / dept.maxValue) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube2 className="h-5 w-5 text-primary" />
                  أنواع الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <DonutChart data={orderTypeData} size={160} />
                <DonutLegend data={orderTypeData} />
                <div className="w-full border-t border-gray-100 pt-4 dark:border-gray-800">
                  <MetricRow
                    label="إجمالي الطلبات اليوم"
                    value={formatNumber(203)}
                    change={12.5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  مقارنة أداء الفروع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {branchPerformance.map((branch) => (
                  <div key={branch.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {branch.label}
                      </span>
                      <Badge
                        variant={branch.value >= 90 ? 'default' : branch.value >= 80 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {branch.value}%
                      </Badge>
                    </div>
                    <ProgressBar value={branch.value} color={branch.color} className="h-2.5" />
                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                      <span>{formatCurrency(branch.revenue)} ر.س إيرادات</span>
                      <span>{formatNumber(branch.patients)} مريض</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                مؤشرات الأداء الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">متوسط وقت الانتظار</p>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">12 دقيقة</p>
                  <Sparkline
                    data={[15, 14, 13, 16, 12, 11, 13, 10, 12, 11, 12, 12]}
                    className="mt-2 h-6 w-full"
                    color="#f59e0b"
                  />
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">معدل رضا المرضى</p>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">4.7 / 5</p>
                  <Sparkline
                    data={[4.2, 4.3, 4.4, 4.5, 4.4, 4.6, 4.5, 4.7, 4.6, 4.7, 4.7, 4.7]}
                    className="mt-2 h-6 w-full"
                    color="#22c55e"
                  />
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">دقة النتائج</p>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">99.2%</p>
                  <Sparkline
                    data={[98.5, 98.8, 99.0, 98.9, 99.1, 99.0, 99.2, 99.1, 99.2, 99.3, 99.2, 99.2]}
                    className="mt-2 h-6 w-full"
                    color="#3b82f6"
                  />
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">معدل إتمام الطلبات</p>
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">96.1%</p>
                  <Sparkline
                    data={[94, 95, 95.5, 94.8, 96, 95.2, 96.1, 95.8, 96.3, 96.0, 96.1, 96.1]}
                    className="mt-2 h-6 w-full"
                    color="#8b5cf6"
                  />
                </GlassCard>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                مواعيد اليوم
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">مكتمل</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">قيد التنفيذ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">قادم</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {todayAppointments.map((appt, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    appt.status === 'مكتمل' &&
                      'border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10',
                    appt.status === 'قيد التنفيذ' &&
                      'border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10',
                    appt.status === 'قادم' &&
                      'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/50'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{appt.time}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{appt.patient}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appt.type} - {appt.doctor}
                    </p>
                  </div>
                  <Badge
                    variant={
                      appt.status === 'مكتمل'
                        ? 'default'
                        : appt.status === 'قيد التنفيذ'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center transition-all hover:scale-[1.02] hover:shadow-md dark:border-gray-800',
                    'hover:border-primary/20 dark:hover:border-primary/20'
                  )}
                >
                  <div className={cn('rounded-xl p-2.5', action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{action.description}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <Sparkline
                  data={[45, 52, 38, 65, 48, 72, 58, 85, 62, 78, 92, 88]}
                  className="h-8 w-16"
                  color="#22c55e"
                />
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    أداء النظام اليوم
                  </p>
                  <p className="text-[10px] text-green-600 dark:text-green-400">ممتاز - 99.9% uptime</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkline
                  data={[120, 135, 128, 142, 138, 155, 148, 162, 158, 170, 165, 180]}
                  className="h-6 w-14"
                  color="#3b82f6"
                />
                <div>
                  <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                    حركة اليوم
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">{formatNumber(180)} زيارة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkline
                  data={[8, 12, 10, 15, 11, 18, 14, 20, 16, 22, 19, 24]}
                  className="h-6 w-14"
                  color="#8b5cf6"
                />
                <div>
                  <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                    طلبات عاجلة
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">{formatNumber(24)} طلب</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400">آخر تحديث: منذ 30 ثانية</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-600">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                نظام إدارة المختبر الطبي - الإصدار 2.4.1
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-600">
              <span>API: 45ms</span>
              <span>DB: 12ms</span>
              <span>التخزين المؤقت: 92.3%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
