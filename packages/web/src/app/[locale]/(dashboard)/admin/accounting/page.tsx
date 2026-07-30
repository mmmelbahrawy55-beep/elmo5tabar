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

const INVOICES_MOCK = [
  { id: 'INV-2026-001', client: 'شركة الأمل الطبية', amount: 45000, issuedDate: '2026-07-01', dueDate: '2026-07-31', status: 'paid' as const },
  { id: 'INV-2026-002', client: 'مجمع الشفاء الصحي', amount: 128000, issuedDate: '2026-07-05', dueDate: '2026-08-04', status: 'pending' as const },
  { id: 'INV-2026-003', client: 'مستشفى النور', amount: 67500, issuedDate: '2026-07-10', dueDate: '2026-07-25', status: 'overdue' as const },
  { id: 'INV-2026-004', client: 'عيادة السعادة', amount: 23000, issuedDate: '2026-07-12', dueDate: '2026-08-11', status: 'pending' as const },
  { id: 'INV-2026-005', client: 'مركز الشفاء التخصصي', amount: 89000, issuedDate: '2026-06-15', dueDate: '2026-07-15', status: 'overdue' as const },
  { id: 'INV-2026-006', client: 'مجمع ر₦ى الورود', amount: 56000, issuedDate: '2026-07-18', dueDate: '2026-08-17', status: 'paid' as const },
  { id: 'INV-2026-007', client: 'مستشفى الحياة', amount: 34200, issuedDate: '2026-07-20', dueDate: '2026-08-19', status: 'cancelled' as const },
  { id: 'INV-2026-008', client: ' مركز أرامكو الطبي', amount: 175000, issuedDate: '2026-07-22', dueDate: '2026-08-21', status: 'pending' as const },
]

const EXPENSES_MOCK = [
  { id: 1, category: 'الرواتب والأجور', budgeted: 500000, actual: 485000, department: 'الموارد البشرية' },
  { id: 2, category: 'الإيجارات', budgeted: 120000, actual: 120000, department: 'الإدارة' },
  { id: 3, category: 'التمديدات الطبية', budgeted: 80000, actual: 92000, department: 'الطوارئ' },
  { id: 4, category: 'الصيانة وال.repairs', budgeted: 45000, actual: 38000, department: 'ال ENGINEERING' },
  { id: 5, category: 'التسويق والإعلان', budgeted: 30000, actual: 27500, department: 'التسويق' },
  { id: 6, category: 'التدريب والتطوير', budgeted: 25000, actual: 22000, department: 'الموارد البشرية' },
  { id: 7, category: 'المواد الاستهلاكية', budgeted: 60000, actual: 58000, department: 'الصيدلية' },
  { id: 8, category: 'المرافق والخدمات', budgeted: 35000, actual: 33500, department: 'الخدمات العامة' },
]

const ACCOUNTS_MOCK = [
  { id: 'ACC-001', name: 'الحساب الجاري - الراجحي', type: 'أصول متداولة', balance: 2340000, currency: 'SAR' },
  { id: 'ACC-002', name: 'حساب الادخار - الأهلي', type: 'أصول متداولة', balance: 890000, currency: 'SAR' },
  { id: 'ACC-003', name: 'حساب المدفوعات المقدمة', type: 'أصول متداولة', balance: 156000, currency: 'SAR' },
  { id: 'ACC-004', name: 'حساب المدينين', type: 'أصول متداولة', balance: 423000, currency: 'SAR' },
  { id: 'ACC-005', name: 'حساب المعدات', type: 'أصول ثابتة', balance: 1850000, currency: 'SAR' },
  { id: 'ACC-006', name: 'حساب الدائن', type: 'خصوم', balance: -312000, currency: 'SAR' },
  { id: 'ACC-007', name: 'حساب القروض طويلة الأجل', type: 'خصوم', balance: -750000, currency: 'SAR' },
  { id: 'ACC-008', name: 'حساب رأس المال', type: 'حقوق الملكية', balance: -2500000, currency: 'SAR' },
]

const TRANSACTIONS_MOCK = [
  { id: 'TXN-001', date: '2026-07-28', account: 'الحساب الجاري - الراجحي', description: 'فواتير - شركة الأمل الطبية', debit: 45000, credit: 0 },
  { id: 'TXN-002', date: '2026-07-27', account: 'حساب الدائن', description: 'فواتير - شركة الأمل الطبية', debit: 0, credit: 45000 },
  { id: 'TXN-003', date: '2026-07-26', account: 'الحساب الجاري - الراجحي', description: 'دفع إيجار يوليو', debit: 0, credit: 120000 },
  { id: 'TXN-004', date: '2026-07-25', account: 'الحساب الجاري - الراجحي', description: 'إيداع - مجمع الشفاء', debit: 128000, credit: 0 },
  { id: 'TXN-005', date: '2026-07-24', account: 'حساب المدفوعات المقدمة', description: 'اشتراك برمجي سنوي', debit: 0, credit: 24000 },
  { id: 'TXN-006', date: '2026-07-23', account: 'الحساب الجاري - الراجحي', description: 'رواتب يوليو', debit: 0, credit: 485000 },
]

const BAR_CHART_DATA = [
  { label: 'يناير', value1: 720000, value2: 310000 },
  { label: 'فبراير', value1: 680000, value2: 295000 },
  { label: 'مارس', value1: 810000, value2: 330000 },
  { label: 'أبريل', value1: 760000, value2: 320000 },
  { label: 'مايو', value1: 830000, value2: 340000 },
  { label: 'يونيو', value1: 870000, value2: 335000 },
  { label: 'يوليو', value1: 892000, value2: 345000 },
]

const DONUT_DATA = [
  { label: 'صافي الربح', value: 547000, color: '#22c55e' },
  { label: 'المصروفات التشغيلية', value: 345000, color: '#ef4444' },
]

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

const STATUS_MAP: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }> = {
  paid: { label: 'مدفوعة', variant: 'success' },
  pending: { label: 'معلقة', variant: 'warning' },
  overdue: { label: 'متأخرة', variant: 'error' },
  cancelled: { label: 'ملغاة', variant: 'secondary' },
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [invoices, setInvoices] = useState(INVOICES_MOCK)
  const [expenses, setExpenses] = useState(EXPENSES_MOCK)
  const [accounts] = useState(ACCOUNTS_MOCK)
  const [transactions] = useState(TRANSACTIONS_MOCK)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [confirmProcessOpen, setConfirmProcessOpen] = useState(false)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  const [newInvoice, setNewInvoice] = useState({
    client: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
  })

  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    department: '',
    description: '',
    date: '',
  })

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices
    return invoices.filter(
      (inv) => inv.client.includes(searchQuery) || inv.id.includes(searchQuery)
    )
  }, [invoices, searchQuery])

  const invoiceTotal = useMemo(
    () => newInvoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [newInvoice.items]
  )

  const stats = [
    { title: 'الإيرادات الشهرية', value: formatCurrency(892000, 'SAR'), change: '+12.5%', changeType: 'positive' as const },
    { title: 'المصروفات الشهرية', value: formatCurrency(345000, 'SAR'), change: '+3.2%', changeType: 'negative' as const },
    { title: 'صافي الربح', value: formatCurrency(547000, 'SAR'), change: '+18.7%', changeType: 'positive' as const },
    { title: 'الفواتير المعلقة', value: '23', change: '-5', changeType: 'positive' as const },
  ]

  const addInvoiceItem = () => {
    setNewInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
    }))
  }

  const removeInvoiceItem = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const handleCreateInvoice = () => {
    const id = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`
    setInvoices((prev) => [
      {
        id,
        client: newInvoice.client,
        amount: invoiceTotal,
        issuedDate: new Date().toISOString().split('T')[0],
        dueDate: newInvoice.dueDate,
        status: 'pending' as const,
      },
      ...prev,
    ])
    setCreateInvoiceOpen(false)
    setNewInvoice({ client: '', dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] })
  }

  const handleAddExpense = () => {
    setExpenses((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        category: newExpense.category,
        budgeted: newExpense.amount,
        actual: newExpense.amount,
        department: newExpense.department,
      },
    ])
    setExpenseFormOpen(false)
    setNewExpense({ category: '', amount: 0, department: '', description: '', date: '' })
  }

  const totalAssets = accounts.filter((a) => a.type.includes('أصول')).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = accounts.filter((a) => a.type === 'خصوم').reduce((s, a) => s + Math.abs(a.balance), 0)
  const totalEquity = accounts.filter((a) => a.type === 'حقوق الملكية').reduce((s, a) => s + Math.abs(a.balance), 0)

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المحاسبة</h1>
          <p className="text-muted-foreground">إدارة الحسابات والفواتير والتقارير المالية</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Button variant="primary" onClick={() => setCreateInvoiceOpen(true)}>
            إنشاء فاتورة جديدة
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
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="accounts">الحسابات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>الإيرادات مقابل المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={BAR_CHART_DATA}
                  series={[
                    { key: 'value1', label: 'الإيرادات', color: '#22c55e' },
                    { key: 'value2', label: 'المصروفات', color: '#ef4444' },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>هامش الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={DONUT_DATA} size={220} />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">نسبة هامش الربح</span>
                    <span className="font-semibold text-green-500">61.3%</span>
                  </div>
                  <ProgressBar value={61.3} max={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المؤشرات المالية الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <MetricRow label="نسبة الربح الإجمالي" value="61.3%" trend="up" />
                  <MetricRow label="نسبة العائد على الأصول" value="23.5%" trend="up" />
                  <MetricRow label="معدل التحصيل" value="87.2%" trend="down" />
                  <MetricRow label="نسبة التدفق النقدي" value="158%" trend="up" />
                  <MetricRow label="الديون على الذمة" value={formatCurrency(423000, 'SAR')} trend="down" />
                  <MetricRow label="الاحتياطي النقدي" value={formatCurrency(3230000, 'SAR')} trend="up" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إدارة الفواتير</CardTitle>
              <div className="flex items-center gap-2">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="بحث بالعميل أو رقم الفاتورة..."
                />
                <Button variant="primary" onClick={() => setCreateInvoiceOpen(true)}>
                  فاتورة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-4 font-medium">رقم الفاتورة</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                      <th className="text-right py-3 px-4 font-medium">تاريخ الإصدار</th>
                      <th className="text-right py-3 px-4 font-medium">تاريخ الاستحقاق</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <>
                        <tr
                          key={inv.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                        >
                          <td className="py-3 px-4 font-mono text-xs">{inv.id}</td>
                          <td className="py-3 px-4 font-medium">{inv.client}</td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(inv.amount, 'SAR')}</td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.issuedDate)}</td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={STATUS_MAP[inv.status].variant}>
                              {STATUS_MAP[inv.status].label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">عرض</Button>
                              {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                <Button size="sm" variant="ghost">تعديل</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedInvoice === inv.id && (
                          <tr key={`${inv.id}-expanded`}>
                            <td colSpan={7} className="bg-muted/30 p-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">رقم الفاتورة:</span>
                                  <span className="mr-2 font-medium">{inv.id}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">العميل:</span>
                                  <span className="mr-2 font-medium">{inv.client}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">المبلغ بالضريبة:</span>
                                  <span className="mr-2 font-semibold">{formatCurrency(inv.amount * 1.15, 'SAR')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">ضريبة القيمة المضافة (15%):</span>
                                  <span className="mr-2">{formatCurrency(inv.amount * 0.15, 'SAR')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">الأيام المتبقية:</span>
                                  <span className="mr-2">{Math.max(0, Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / 86400000))} يوم</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">إرسال تذكير</Button>
                                  <Button size="sm" variant="outline">تصدير PDF</Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  إجمالي الفواتير: {formatCurrency(filteredInvoices.reduce((s, i) => s + i.amount, 0), 'SAR')}
                </span>
                <span className="text-sm text-muted-foreground">
                  عدد الفواتير: {filteredInvoices.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>فئات المصروفات</CardTitle>
                <Button variant="primary" onClick={() => setExpenseFormOpen(true)}>
                  إضافة مصروف
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-right py-3 px-4 font-medium">الفئة</th>
                        <th className="text-right py-3 px-4 font-medium">الميزانية</th>
                        <th className="text-right py-3 px-4 font-medium">الفعلي</th>
                        <th className="text-right py-3 px-4 font-medium">ال差距</th>
                        <th className="text-right py-3 px-4 font-medium">التقدم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp) => {
                        const diff = exp.budgeted - exp.actual
                        const percent = Math.round((exp.actual / exp.budgeted) * 100)
                        return (
                          <tr key={exp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium">{exp.category}</div>
                              <div className="text-xs text-muted-foreground">{exp.department}</div>
                            </td>
                            <td className="py-3 px-4">{formatCurrency(exp.budgeted, 'SAR')}</td>
                            <td className="py-3 px-4">{formatCurrency(exp.actual, 'SAR')}</td>
                            <td className="py-3 px-4">
                              <span className={cn('font-medium', diff >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {diff >= 0 ? '+' : ''}{formatCurrency(diff, 'SAR')}
                              </span>
                            </td>
                            <td className="py-3 px-4 w-40">
                              <div className="flex items-center gap-2">
                                <ProgressBar
                                  value={percent}
                                  max={100}
                                  className={cn('h-2 flex-1', percent > 100 ? 'bg-red-500/20' : 'bg-green-500/20')}
                                />
                                <span className={cn('text-xs font-medium', percent > 100 ? 'text-red-500' : 'text-muted-foreground')}>
                                  {percent}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td className="py-3 px-4">الإجمالي</td>
                        <td className="py-3 px-4">{formatCurrency(expenses.reduce((s, e) => s + e.budgeted, 0), 'SAR')}</td>
                        <td className="py-3 px-4">{formatCurrency(expenses.reduce((s, e) => s + e.actual, 0), 'SAR')}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'font-medium',
                            expenses.reduce((s, e) => s + e.budgeted - e.actual, 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {formatCurrency(expenses.reduce((s, e) => s + e.budgeted - e.actual, 0), 'SAR')}
                          </span>
                        </td>
                        <td className="py-3 px-4" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص المصروفات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <MetricRow label="إجمالي الميزانية" value={formatCurrency(expenses.reduce((s, e) => s + e.budgeted, 0), 'SAR')} />
                  <MetricRow label="إجمالي الفعلي" value={formatCurrency(expenses.reduce((s, e) => s + e.actual, 0), 'SAR')} />
                  <MetricRow label="نسبة التنفيذ" value={`${Math.round((expenses.reduce((s, e) => s + e.actual, 0) / expenses.reduce((s, e) => s + e.budgeted, 0)) * 100)}%`} />
                </div>
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3">أعلى الفئات إنفاقاً</h4>
                  {[...expenses]
                    .sort((a, b) => b.actual - a.actual)
                    .slice(0, 5)
                    .map((exp, i) => (
                      <div key={exp.id} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {i + 1}
                          </span>
                          <span>{exp.category}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(exp.actual, 'SAR')}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الدخل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">الإيرادات الإجمالية</span><span className="font-semibold">{formatCurrency(892000, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 border-t border-border pt-2"><span className="text-muted-foreground">تكلفة الإيرادات</span><span className="text-red-500">({formatCurrency(210000, 'SAR')})</span></div>
                  <div className="flex justify-between py-1"><span className="font-medium">الربح الإجمالي</span><span className="font-semibold">{formatCurrency(682000, 'SAR')}</span></div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between py-1"><span className="text-muted-foreground">المصروفات التشغيلية</span><span className="text-red-500">({formatCurrency(345000, 'SAR')})</span></div>
                    <div className="flex justify-between py-1 text-xs text-muted-foreground pr-4"><span>- الرواتب</span><span>{formatCurrency(185000, 'SAR')}</span></div>
                    <div className="flex justify-between py-1 text-xs text-muted-foreground pr-4"><span>- الإيجارات</span><span>{formatCurrency(120000, 'SAR')}</span></div>
                    <div className="flex justify-between py-1 text-xs text-muted-foreground pr-4"><span>- أخرى</span><span>{formatCurrency(40000, 'SAR')}</span></div>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-border font-bold">
                    <span>صافي الربح</span>
                    <span className="text-green-500">{formatCurrency(547000, 'SAR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الميزانية العمومية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <h4 className="font-medium text-muted-foreground">الأصول</h4>
                  <div className="flex justify-between py-1 pr-4"><span className="text-muted-foreground">الأصول المتداولة</span><span>{formatCurrency(totalAssets, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 pr-4"><span className="text-muted-foreground">الأصول الثابتة</span><span>{formatCurrency(1850000, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 font-medium border-b border-border pb-2"><span>إجمالي الأصول</span><span>{formatCurrency(totalAssets + 1850000, 'SAR')}</span></div>
                  <h4 className="font-medium text-muted-foreground pt-2">الخصوم وحقوق الملكية</h4>
                  <div className="flex justify-between py-1 pr-4"><span className="text-muted-foreground">الخصوم المتداولة</span><span>{formatCurrency(totalLiabilities * 0.6, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 pr-4"><span className="text-muted-foreground">الخصوم طويلة الأجل</span><span>{formatCurrency(totalLiabilities * 0.4, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 pr-4"><span className="text-muted-foreground">حقوق الملكية</span><span>{formatCurrency(totalEquity, 'SAR')}</span></div>
                  <div className="flex justify-between py-1 font-medium border-b border-border pb-2"><span>إجمالي الخصوم وحقوق الملكية</span><span>{formatCurrency(totalLiabilities + totalEquity, 'SAR')}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>حسابات زكاة و ضريبة القيمة المضافة (ZATCA)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">ضريبة القيمة المضافة</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">إجمالي المبيعات الخاضعة للضريبة</span><span>{formatCurrency(892000, 'SAR')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">نسبة الضريبة</span><span>15%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">ضريبة المبيعات</span><span>{formatCurrency(133800, 'SAR')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">ضريبة المشتريات</span><span>{formatCurrency(31500, 'SAR')}</span></div>
                      <div className="flex justify-between font-semibold border-t border-border pt-1"><span>الضريبة المستحقة</span><span className="text-red-500">{formatCurrency(102300, 'SAR')}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">زكاة</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الأصول المؤهلة</span><span>{formatCurrency(5230000, 'SAR')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">نسبة الزكاة (2.5%)</span><span>2.5%</span></div>
                      <div className="flex justify-between font-semibold border-t border-border pt-1"><span>مبلغ الزكاة المستحق</span><span className="text-red-500">{formatCurrency(130750, 'SAR')}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">الامتثال</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <span className="text-sm text-green-600 dark:text-green-400">فواتير إلكترونية معتمدة</span>
                        <Badge variant="success">متوافق</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <span className="text-sm text-green-600 dark:text-green-400">tarZaat منصة الفوترة</span>
                        <Badge variant="success">متوافق</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">مراجعة الضرائب Q3</span>
                        <Badge variant="warning">قريب</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أرصدة الحسابات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-right py-3 px-4 font-medium">رقم الحساب</th>
                        <th className="text-right py-3 px-4 font-medium">اسم الحساب</th>
                        <th className="text-right py-3 px-4 font-medium">النوع</th>
                        <th className="text-right py-3 px-4 font-medium">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <tr key={acc.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{acc.id}</td>
                          <td className="py-3 px-4 font-medium">{acc.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant={acc.type.includes('أصول') ? 'info' : acc.type === 'خصوم' ? 'error' : 'secondary'}>
                              {acc.type}
                            </Badge>
                          </td>
                          <td className={cn('py-3 px-4 font-semibold', acc.balance >= 0 ? 'text-green-500' : 'text-red-500')}>
                            {formatCurrency(Math.abs(acc.balance), 'SAR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td colSpan={3} className="py-3 px-4">الإجمالي</td>
                        <td className="py-3 px-4">{formatCurrency(accounts.reduce((s, a) => s + a.balance, 0), 'SAR')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سجل المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{txn.id}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">{txn.account}</p>
                      </div>
                      <div className="text-left">
                        {txn.debit > 0 && (
                          <span className="text-green-500 font-semibold text-sm block">+{formatCurrency(txn.debit, 'SAR')}</span>
                        )}
                        {txn.credit > 0 && (
                          <span className="text-red-500 font-semibold text-sm block">-{formatCurrency(txn.credit, 'SAR')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات الفاتورة">
            <FormGroup>
              <FormField
                label="اسم العميل"
                value={newInvoice.client}
                onChange={(v) => setNewInvoice((prev) => ({ ...prev, client: v }))}
                placeholder="أدخل اسم العميل"
              />
              <FormField
                label="تاريخ الاستحقاق"
                type="date"
                value={newInvoice.dueDate}
                onChange={(v) => setNewInvoice((prev) => ({ ...prev, dueDate: v }))}
              />
            </FormGroup>
          </FormSection>
          <FormSection title="بنود الفاتورة">
            <div className="space-y-3">
              {newInvoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <FormField
                      label={index === 0 ? 'البيان' : ''}
                      value={item.description}
                      onChange={(v) => updateInvoiceItem(index, 'description', v)}
                      placeholder="وصف البند"
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      label={index === 0 ? 'الكمية' : ''}
                      type="number"
                      value={String(item.quantity)}
                      onChange={(v) => updateInvoiceItem(index, 'quantity', Number(v))}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      label={index === 0 ? 'سعر الوحدة' : ''}
                      type="number"
                      value={String(item.unitPrice)}
                      onChange={(v) => updateInvoiceItem(index, 'unitPrice', Number(v))}
                    />
                  </div>
                  <div className="col-span-2">
                    {newInvoice.items.length > 1 && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeInvoiceItem(index)}>
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addInvoiceItem}>
                + إضافة بند
              </Button>
            </div>
            <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span>{formatCurrency(invoiceTotal, 'SAR')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span><span>{formatCurrency(invoiceTotal * 0.15, 'SAR')}</span></div>
              <div className="flex justify-between font-bold text-base"><span>الإجمالي</span><span>{formatCurrency(invoiceTotal * 1.15, 'SAR')}</span></div>
            </div>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setCreateInvoiceOpen(false)}>إلغاء</Button>
          <Button variant="primary" onClick={handleCreateInvoice} disabled={!newInvoice.client || invoiceTotal === 0}>
            إنشاء الفاتورة
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogHeader>
          <DialogTitle>إضافة مصروف جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormGroup>
            <FormField
              label="فئة المصروف"
              value={newExpense.category}
              onChange={(v) => setNewExpense((prev) => ({ ...prev, category: v }))}
              placeholder="مثال: الصيانة"
            />
            <FormField
              label="المبلغ (SAR)"
              type="number"
              value={String(newExpense.amount)}
              onChange={(v) => setNewExpense((prev) => ({ ...prev, amount: Number(v) }))}
            />
            <FormField
              label="القسم"
              value={newExpense.department}
              onChange={(v) => setNewExpense((prev) => ({ ...prev, department: v }))}
              placeholder="مثال: الهندسة"
            />
            <FormField
              label="الوصف"
              value={newExpense.description}
              onChange={(v) => setNewExpense((prev) => ({ ...prev, description: v }))}
              placeholder="وصف المصروف"
            />
            <FormField
              label="التاريخ"
              type="date"
              value={newExpense.date}
              onChange={(v) => setNewExpense((prev) => ({ ...prev, date: v }))}
            />
          </FormGroup>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setExpenseFormOpen(false)}>إلغاء</Button>
          <Button variant="primary" onClick={handleAddExpense} disabled={!newExpense.category || newExpense.amount === 0}>
            إضافة المصروف
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={confirmProcessOpen}
        onOpenChange={setConfirmProcessOpen}
        title="تأكيد المعالجة"
        message="هل أنت متأكد من معالجة جميع الفواتير المعلقة؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => setConfirmProcessOpen(false)}
        variant="warning"
      />
    </div>
  )
}
