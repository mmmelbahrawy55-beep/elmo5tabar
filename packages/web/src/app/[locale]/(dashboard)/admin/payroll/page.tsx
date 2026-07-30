'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card'
import { Badge } from '@/design-system/primitives/Badge'
import { Button } from '@/design-system/primitives/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs'
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog } from '@/design-system/feedback/Alert'
import { ProgressBar } from '@/design-system/feedback/Progress'
import { Switch } from '@/design-system/primitives/Input'
import { BarChart, DonutChart, MetricRow } from '@/design-system/data/ChartCard'
import ExportButton from '@/components/admin/ExportButton'

const EMPLOYEES_MOCK = [
  { id: 'EMP-001', name: 'أحمد بن محمد العلي', department: 'الطوارئ', baseSalary: 12000, allowances: 3500, deductions: 1800, status: 'processed' as const, bankAccount: 'SA4420000001234567890' },
  { id: 'EMP-002', name: 'فاطمة بنت عبدالله الخالدي', department: 'التمريض', baseSalary: 9500, allowances: 2800, deductions: 1425, status: 'processed' as const, bankAccount: 'SA4420000009876543210' },
  { id: 'EMP-003', name: 'خالد بن سعد الحربي', department: 'الصيدلية', baseSalary: 11000, allowances: 3200, deductions: 1650, status: 'pending' as const, bankAccount: 'SA4420000005555555555' },
  { id: 'EMP-004', name: 'نورة بنت عبدالرحمن السبيعي', department: 'ال administration', baseSalary: 8500, allowances: 2100, deductions: 1275, status: 'pending' as const, bankAccount: 'SA4420000001111111111' },
  { id: 'EMP-005', name: 'محمد بن فهد الدوسري', department: 'الطوارئ', baseSalary: 15000, allowances: 4500, deductions: 2250, status: 'processed' as const, bankAccount: 'SA4420000002222222222' },
  { id: 'EMP-006', name: 'سارة بنت أحمد الشمري', department: 'التمريض', baseSalary: 8000, allowances: 2400, deductions: 1200, status: 'processed' as const, bankAccount: 'SA4420000003333333333' },
  { id: 'EMP-007', name: 'عبدالعزيز بن ناصر القحطاني', department: 'المختبر', baseSalary: 10000, allowances: 3000, deductions: 1500, status: 'pending' as const, bankAccount: 'SA4420000004444444444' },
  { id: 'EMP-008', name: 'منال بنت خالد المطيري', department: 'التمريض', baseSalary: 7500, allowances: 2200, deductions: 1125, status: 'processed' as const, bankAccount: 'SA4420000006666666666' },
  { id: 'EMP-009', name: 'ياسر بن عبدالله العنزي', department: 'الطب البشري', baseSalary: 18000, allowances: 5400, deductions: 2700, status: 'processed' as const, bankAccount: 'SA4420000007777777777' },
  { id: 'EMP-010', name: 'ريما بنت محمد الزهراني', department: 'الادارة', baseSalary: 9000, allowances: 2700, deductions: 1350, status: 'processed' as const, bankAccount: 'SA4420000008888888888' },
]

const HISTORY_MOCK = [
  { month: 'يناير 2026', totalGross: 1180000, totalDeductions: 185000, totalNet: 995000, employees: 242, processed: true },
  { month: 'فبراير 2026', totalGross: 1195000, totalDeductions: 188000, totalNet: 1007000, employees: 243, processed: true },
  { month: 'مارس 2026', totalGross: 1210000, totalDeductions: 190000, totalNet: 1020000, employees: 243, processed: true },
  { month: 'أبريل 2026', totalGross: 1220000, totalDeductions: 192000, totalNet: 1028000, employees: 244, processed: true },
  { month: 'مايو 2026', totalGross: 1230000, totalDeductions: 194000, totalNet: 1036000, employees: 244, processed: true },
  { month: 'يونيو 2026', totalGross: 1240000, totalDeductions: 196000, totalNet: 1044000, employees: 245, processed: true },
  { month: 'يوليو 2026', totalGross: 1245000, totalDeductions: 198000, totalNet: 1047000, employees: 245, processed: false },
]

const BONUSES_MOCK = [
  { id: 'BON-001', employeeName: 'أحمد بن محمد العلي', type: 'performance', amount: 5000, period: 'Q2 2026', status: 'approved' as const },
  { id: 'BON-002', employeeName: 'محمد بن فهد الدوسري', type: 'overtime', amount: 3200, period: 'يوليو 2026', status: 'approved' as const },
  { id: 'BON-003', employeeName: 'فاطمة بنت عبدالله الخالدي', type: 'holiday', amount: 2000, period: 'عيد الفطر', status: 'approved' as const },
  { id: 'BON-004', employeeName: 'ياسر بن عبدالله العنزي', type: 'performance', amount: 8000, period: 'Q2 2026', status: 'pending' as const },
  { id: 'BON-005', employeeName: 'سارة بنت أحمد الشمري', type: 'overtime', amount: 1800, period: 'يوليو 2026', status: 'pending' as const },
]

const DEDUCTIONS_MOCK = [
  { id: 'DED-001', employeeName: 'نورة بنت عبدالرحمن السبيعي', type: 'late_arrivals', amount: 600, details: '8 تأخرات - يوليو 2026', period: 'يوليو 2026' },
  { id: 'DED-002', employeeName: 'عبدالعزيز بن ناصر القحطاني', type: 'absence', amount: 1500, details: '3 أيام غياب - يوليو 2026', period: 'يوليو 2026' },
  { id: 'DED-003', employeeName: 'خالد بن سعد الحربي', type: 'loan', amount: 2500, details: 'قرض شخصي - القسط 5 من 12', period: 'يوليو 2026' },
  { id: 'DED-004', employeeName: 'منال بنت خالد المطيري', type: 'late_arrivals', amount: 300, details: '4 تأخرات - يوليو 2026', period: 'يوليو 2026' },
]

const BONUS_TYPES: Record<string, string> = {
  performance: 'أداء',
  holiday: 'عطلة رسمية',
  overtime: 'عمل إضافي',
}

const DEDUCTION_TYPES: Record<string, string> = {
  late_arrivals: 'تأخرات',
  absence: 'غياب',
  loan: 'قروض',
}

const DEPARTMENTS_DATA = [
  { name: 'الطوارئ', employees: 42, totalSalary: 345000, avgSalary: 8214 },
  { name: 'التمريض', employees: 68, totalSalary: 425000, avgSalary: 6250 },
  { name: 'الصيدلية', employees: 18, totalSalary: 156000, avgSalary: 8667 },
  { name: 'المختبر', employees: 15, totalSalary: 112000, avgSalary: 7467 },
  { name: 'الطبي البشري', employees: 22, totalSalary: 198000, avgSalary: 9000 },
  { name: 'الادارة', employees: 35, totalSalary: 109000, avgSalary: 3114 },
]

type PayrollStatus = 'processed' | 'pending'
type BonusStatus = 'approved' | 'pending'

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('current')
  const [searchQuery, setSearchQuery] = useState('')
  const [employees, setEmployees] = useState(EMPLOYEES_MOCK)
  const [history] = useState(HISTORY_MOCK)
  const [bonuses] = useState(BONUSES_MOCK)
  const [deductions] = useState(DEDUCTIONS_MOCK)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [processConfirmOpen, setProcessConfirmOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')

  const filteredEmployees = useMemo(() => {
    let result = employees
    if (searchQuery) {
      result = result.filter(
        (emp) => emp.name.includes(searchQuery) || emp.department.includes(searchQuery) || emp.id.includes(searchQuery)
      )
    }
    if (selectedDepartment !== 'all') {
      result = result.filter((emp) => emp.department === selectedDepartment)
    }
    return result
  }, [employees, searchQuery, selectedDepartment])

  const currentMonthTotals = useMemo(() => {
    const totalGross = employees.reduce((s, e) => s + e.baseSalary + e.allowances, 0)
    const totalDeductions = employees.reduce((s, e) => s + e.deductions, 0)
    const totalNet = totalGross - totalDeductions
    return { totalGross, totalDeductions, totalNet }
  }, [employees])

  const stats = [
    { title: 'إجمالي الرواتب الشهرية', value: formatCurrency(1245000, 'SAR'), change: '+2.4%', changeType: 'positive' as const },
    { title: 'عدد الموظفين', value: '245', change: '+3', changeType: 'positive' as const },
    { title: 'متوسط الراتب', value: formatCurrency(5081, 'SAR'), change: '+1.1%', changeType: 'positive' as const },
    { title: 'الرواتب قيد المعالجة', value: '12', change: '-3', changeType: 'positive' as const },
  ]

  const handleProcessPayroll = () => {
    setProcessing(true)
    setTimeout(() => {
      setEmployees((prev) => prev.map((e) => ({ ...e, status: 'processed' as const })))
      setProcessing(false)
      setProcessConfirmOpen(false)
    }, 2000)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الرواتب</h1>
          <p className="text-muted-foreground">إدارة رواتب الموظفين والمكافآت والخصومات</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Button
            variant="primary"
            onClick={() => setProcessConfirmOpen(true)}
            disabled={employees.every((e) => e.status === 'processed')}
          >
            {processing ? 'جاري المعالجة...' : 'معالجة الرواتب'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">الشهر الحالي</TabsTrigger>
          <TabsTrigger value="history">السجل التاريخي</TabsTrigger>
          <TabsTrigger value="bonuses">المكافآت</TabsTrigger>
          <TabsTrigger value="deductions">الخصومات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي Brut</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(currentMonthTotals.totalGross, 'SAR')}</p>
                  <Badge variant="info" className="mt-2">10 موظفين معروضين</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                  <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(currentMonthTotals.totalDeductions, 'SAR')}</p>
                  <Badge variant="error" className="mt-2">{Math.round((currentMonthTotals.totalDeductions / currentMonthTotals.totalGross) * 100)}% من الإجمالي</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي صافي الرواتب</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">{formatCurrency(currentMonthTotals.totalNet, 'SAR')}</p>
                  <Badge variant="success" className="mt-2">جاهز للتحويل</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>رواتب يوليو 2026</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">جميع الأقسام</option>
                  {[...new Set(employees.map((e) => e.department))].map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="بحث بالاسم أو القسم..."
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-4 font-medium">الاسم</th>
                      <th className="text-right py-3 px-4 font-medium">القسم</th>
                      <th className="text-right py-3 px-4 font-medium">الراتب الأساسي</th>
                      <th className="text-right py-3 px-4 font-medium">البدلات</th>
                      <th className="text-right py-3 px-4 font-medium">الخصومات</th>
                      <th className="text-right py-3 px-4 font-medium">صافي الراتب</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const netSalary = emp.baseSalary + emp.allowances - emp.deductions
                      return (
                        <>
                          <tr
                            key={emp.id}
                            className={cn(
                              'border-b border-border hover:bg-muted/50 transition-colors cursor-pointer',
                              expandedRow === emp.id && 'bg-muted/30'
                            )}
                            onClick={() => setExpandedRow(expandedRow === emp.id ? null : emp.id)}
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{emp.id}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="info">{emp.department}</Badge>
                            </td>
                            <td className="py-3 px-4">{formatCurrency(emp.baseSalary, 'SAR')}</td>
                            <td className="py-3 px-4 text-green-500">{formatCurrency(emp.allowances, 'SAR')}</td>
                            <td className="py-3 px-4 text-red-500">{formatCurrency(emp.deductions, 'SAR')}</td>
                            <td className="py-3 px-4 font-bold">{formatCurrency(netSalary, 'SAR')}</td>
                            <td className="py-3 px-4">
                              <Badge variant={emp.status === 'processed' ? 'success' : 'warning'}>
                                {emp.status === 'processed' ? 'تمت المعالجة' : 'قيد الانتظار'}
                              </Badge>
                            </td>
                          </tr>
                          {expandedRow === emp.id && (
                            <tr key={`${emp.id}-expanded`}>
                              <td colSpan={7} className="bg-muted/30 p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground text-xs">الراتب الأساسي</span>
                                    <p className="font-semibold">{formatCurrency(emp.baseSalary, 'SAR')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">بدل سكن</span>
                                    <p className="font-medium">{formatCurrency(Math.round(emp.allowances * 0.4), 'SAR')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">بدل نقل</span>
                                    <p className="font-medium">{formatCurrency(Math.round(emp.allowances * 0.3), 'SAR')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">بدل طبي</span>
                                    <p className="font-medium">{formatCurrency(Math.round(emp.allowances * 0.3), 'SAR')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">التأمين الاجتماعي (GOSI)</span>
                                    <p className="text-red-500">({formatCurrency(Math.round(emp.baseSalary * 0.115), 'SAR')})</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">ضريبة الدخل</span>
                                    <p className="text-red-500">({formatCurrency(emp.deductions - Math.round(emp.baseSalary * 0.115), 'SAR')})</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs">رقم الحساب البنكي</span>
                                    <p className="font-mono text-xs">{emp.bankAccount}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-xs"> slip الراتب</span>
                                    <Button size="sm" variant="outline" className="mt-1">تصدير Slip</Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>سجل الرواتب الشهري</CardTitle>
              <ExportButton />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-4 font-medium">الشهر</th>
                      <th className="text-right py-3 px-4 font-medium">عدد الموظفين</th>
                      <th className="text-right py-3 px-4 font-medium">إجمالي Brut</th>
                      <th className="text-right py-3 px-4 font-medium">إجمالي الخصومات</th>
                      <th className="text-right py-3 px-4 font-medium">إجمالي صافي</th>
                      <th className="text-right py-3 px-4 font-medium">التغيير الشهري</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, i) => {
                      const prevRecord = history[i + 1]
                      const change = prevRecord ? ((record.totalNet - prevRecord.totalNet) / prevRecord.totalNet * 100) : 0
                      return (
                        <tr key={record.month} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{record.month}</td>
                          <td className="py-3 px-4">{record.employees}</td>
                          <td className="py-3 px-4">{formatCurrency(record.totalGross, 'SAR')}</td>
                          <td className="py-3 px-4 text-red-500">{formatCurrency(record.totalDeductions, 'SAR')}</td>
                          <td className="py-3 px-4 font-bold">{formatCurrency(record.totalNet, 'SAR')}</td>
                          <td className="py-3 px-4">
                            {prevRecord && (
                              <span className={cn('font-medium', change >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={record.processed ? 'success' : 'warning'}>
                              {record.processed ? 'تمت المعالجة' : 'قيد المعالجة'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>مقارنة الرواتب الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={history.slice().reverse().map((r) => ({
                  label: r.month.split(' ')[0],
                  value1: r.totalGross,
                  value2: r.totalNet,
                }))}
                series={[
                  { key: 'value1', label: 'إجمالي Brut', color: '#3b82f6' },
                  { key: 'value2', label: 'صافي الرواتب', color: '#22c55e' },
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المكافآت</CardTitle>
                <Button variant="primary">إضافة مكافأة</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-right py-3 px-4 font-medium">رقم</th>
                        <th className="text-right py-3 px-4 font-medium">الموظف</th>
                        <th className="text-right py-3 px-4 font-medium">النوع</th>
                        <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                        <th className="text-right py-3 px-4 font-medium">الفترة</th>
                        <th className="text-right py-3 px-4 font-medium">الحالة</th>
                        <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonuses.map((bonus) => (
                        <tr key={bonus.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{bonus.id}</td>
                          <td className="py-3 px-4 font-medium">{bonus.employeeName}</td>
                          <td className="py-3 px-4">
                            <Badge variant={bonus.type === 'performance' ? 'info' : bonus.type === 'overtime' ? 'warning' : 'success'}>
                              {BONUS_TYPES[bonus.type]}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-500">{formatCurrency(bonus.amount, 'SAR')}</td>
                          <td className="py-3 px-4 text-muted-foreground">{bonus.period}</td>
                          <td className="py-3 px-4">
                            <Badge variant={bonus.status === 'approved' ? 'success' : 'warning'}>
                              {bonus.status === 'approved' ? 'معتمدة' : 'قيد الاعتماد'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {bonus.status === 'pending' && (
                              <Button size="sm" variant="ghost">اعتماد</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص المكافآت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MetricRow label="إجمالي المكافآت المعتمدة" value={formatCurrency(bonuses.filter((b) => b.status === 'approved').reduce((s, b) => s + b.amount, 0), 'SAR')} trend="up" />
                <MetricRow label="المكافآت قيد الاعتماد" value={formatCurrency(bonuses.filter((b) => b.status === 'pending').reduce((s, b) => s + b.amount, 0), 'SAR')} />
                <MetricRow label="عدد المكافآت" value={String(bonuses.length)} />
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3">حسب النوع</h4>
                  {Object.entries(BONUS_TYPES).map(([key, label]) => {
                    const total = bonuses.filter((b) => b.type === key).reduce((s, b) => s + b.amount, 0)
                    return (
                      <div key={key} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{formatCurrency(total, 'SAR')}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deductions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>الخصومات</CardTitle>
                <Button variant="primary">إضافة خصم</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-right py-3 px-4 font-medium">رقم</th>
                        <th className="text-right py-3 px-4 font-medium">الموظف</th>
                        <th className="text-right py-3 px-4 font-medium">النوع</th>
                        <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                        <th className="text-right py-3 px-4 font-medium">التفاصيل</th>
                        <th className="text-right py-3 px-4 font-medium">الفترة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.map((ded) => (
                        <tr key={ded.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{ded.id}</td>
                          <td className="py-3 px-4 font-medium">{ded.employeeName}</td>
                          <td className="py-3 px-4">
                            <Badge variant={ded.type === 'late_arrivals' ? 'warning' : ded.type === 'absence' ? 'error' : 'info'}>
                              {DEDUCTION_TYPES[ded.type]}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-red-500">{formatCurrency(ded.amount, 'SAR')}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{ded.details}</td>
                          <td className="py-3 px-4 text-muted-foreground">{ded.period}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td colSpan={3} className="py-3 px-4">الإجمالي</td>
                        <td className="py-3 px-4 text-red-500">{formatCurrency(deductions.reduce((s, d) => s + d.amount, 0), 'SAR')}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الخصومات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(DEDUCTION_TYPES).map(([key, label]) => {
                  const total = deductions.filter((d) => d.type === key).reduce((s, d) => s + d.amount, 0)
                  const count = deductions.filter((d) => d.type === key).length
                  return (
                    <div key={key} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{label}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <p className="text-lg font-bold text-red-500 mt-1">{formatCurrency(total, 'SAR')}</p>
                    </div>
                  )
                })}
                <div className="pt-4 border-t border-border">
                  <ProgressBar
                    value={deductions.reduce((s, d) => s + d.amount, 0)}
                    max={currentMonthTotals.totalGross}
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    نسبة الخصومات من إجمالي الرواتب: {((deductions.reduce((s, d) => s + d.amount, 0) / currentMonthTotals.totalGross) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>التوزيع حسب القسم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEPARTMENTS_DATA.map((dept) => (
                    <div key={dept.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-muted-foreground mr-2">({dept.employees} موظف)</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(dept.totalSalary, 'SAR')}</span>
                      </div>
                      <ProgressBar
                        value={dept.totalSalary}
                        max={Math.max(...DEPARTMENTS_DATA.map((d) => d.totalSalary))}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل التكاليف</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={DEPARTMENTS_DATA.map((dept, i) => ({
                    label: dept.name,
                    value: dept.totalSalary,
                    color: ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'][i],
                  }))}
                  size={220}
                />
                <div className="mt-6 space-y-3">
                  <MetricRow label="متوسط تكلفة الموظف" value={formatCurrency(Math.round(1245000 / 245), 'SAR')} />
                  <MetricRow label="إجمالي التكاليف الشهرية" value={formatCurrency(1245000, 'SAR')} />
                  <MetricRow label="تكاليف المكافآت" value={formatCurrency(bonuses.reduce((s, b) => s + b.amount, 0), 'SAR')} />
                  <MetricRow label="تكاليف الخصومات" value={formatCurrency(deductions.reduce((s, d) => s + d.amount, 0), 'SAR')} trend="down" />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>مقارنة الأقسام - متوسط الرواتب</CardTitle>
                <ExportButton />
              </CardHeader>
              <CardContent>
                <BarChart
                  data={DEPARTMENTS_DATA.map((dept) => ({
                    label: dept.name,
                    value1: dept.avgSalary,
                    value2: Math.round(1245000 / 245),
                  }))}
                  series={[
                    { key: 'value1', label: 'متوسط القسم', color: '#3b82f6' },
                    { key: 'value2', label: 'المتوسط العام', color: '#94a3b8' },
                  ]}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={processConfirmOpen}
        onOpenChange={setProcessConfirmOpen}
        title="معالجة رواتب يوليو 2026"
        message={`هل أنت متأكد من معالجة رواتب ${employees.filter((e) => e.status === 'pending').length} موظف قيد الانتظار؟ صافي الإجمالي: ${formatCurrency(currentMonthTotals.totalNet, 'SAR')}. لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleProcessPayroll}
        variant="warning"
      />
    </div>
  )
}
