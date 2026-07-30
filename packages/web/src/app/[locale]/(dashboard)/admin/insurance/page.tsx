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

const PROVIDERS_MOCK = [
  { id: 'PRV-001', name: 'شركة بوبا العربية', patients: 3420, claims: 1250, approvalRate: 89.2, avgProcessingDays: 4.5, active: true },
  { id: 'PRV-002', name: 'التأمين التعاوني', patients: 2890, claims: 980, approvalRate: 85.7, avgProcessingDays: 5.2, active: true },
  { id: 'PRV-003', name: 'شركة معاد', patients: 2150, claims: 756, approvalRate: 91.3, avgProcessingDays: 3.8, active: true },
  { id: 'PRV-004', name: 'الgbt التأمين', patients: 1780, claims: 623, approvalRate: 82.4, avgProcessingDays: 6.1, active: true },
  { id: 'PRV-005', name: 'شركة أسيج', patients: 1540, claims: 534, approvalRate: 88.9, avgProcessingDays: 4.0, active: true },
  { id: 'PRV-006', name: 'الصحة الدولية', patients: 1230, claims: 445, approvalRate: 90.1, avgProcessingDays: 3.5, active: true },
  { id: 'PRV-007', name: 'الخليج للتأمين', patients: 980, claims: 312, approvalRate: 86.5, avgProcessingDays: 5.5, active: true },
  { id: 'PRV-008', name: 'نيوم للتأمين', patients: 870, claims: 278, approvalRate: 92.8, avgProcessingDays: 2.9, active: true },
  { id: 'PRV-009', name: 'شركة بلدية', patients: 650, claims: 198, approvalRate: 84.3, avgProcessingDays: 5.8, active: true },
  { id: 'PRV-010', name: 'أخرى', patients: 1200, claims: 410, approvalRate: 87.0, avgProcessingDays: 4.8, active: true },
  { id: 'PRV-011', name: 'روјان التأمين', patients: 430, claims: 145, approvalRate: 88.2, avgProcessingDays: 4.2, active: true },
  { id: 'PRV-012', name: 'المتحدة للتأمين', patients: 380, claims: 120, approvalRate: 83.5, avgProcessingDays: 6.5, active: true },
]

const CLAIMS_MOCK = [
  { id: 'CLM-2026-001', patientName: 'عبدالله بن سعد المطيري', provider: 'شركة بوبا العربية', amount: 12500, submitDate: '2026-07-25', status: 'pending' as const, serviceType: 'عمليات جراحية' },
  { id: 'CLM-2026-002', patientName: 'فاطمة بنت أحمد الزهراني', provider: 'التأمين التعاوني', amount: 3400, submitDate: '2026-07-24', status: 'approved' as const, serviceType: 'عيادة خارجية' },
  { id: 'CLM-2026-003', patientName: 'محمد بن خالد العتيبي', provider: 'شركة معاد', amount: 8900, submitDate: '2026-07-23', status: 'approved' as const, serviceType: 'أشعة تشخيصية' },
  { id: 'CLM-2026-004', patientName: 'نورة بنت عبدالرحمن السبيعي', provider: 'الgbt التأمين', amount: 15600, submitDate: '2026-07-22', status: 'rejected' as const, serviceType: 'عمليات جراحية' },
  { id: 'CLM-2026-005', patientName: 'خالد بن فهد الدوسري', provider: 'شركة أسيج', amount: 2100, submitDate: '2026-07-21', status: 'pending' as const, serviceType: 'صيدلية' },
  { id: 'CLM-2026-006', patientName: 'سارة بنت محمد الشمري', provider: 'الصحة الدولية', amount: 6700, submitDate: '2026-07-20', status: 'processing' as const, serviceType: 'تحاليل مخبرية' },
  { id: 'CLM-2026-007', patientName: 'ياسر بن عبدالله العنزي', provider: 'نيوم للتأمين', amount: 22000, submitDate: '2026-07-19', status: 'approved' as const, serviceType: 'إقامة في المستشفى' },
  { id: 'CLM-2026-008', patientName: 'منال بنت خالد المطيري', provider: 'شركة بوبا العربية', amount: 4500, submitDate: '2026-07-18', status: 'approved' as const, serviceType: 'عيادة خارجية' },
  { id: 'CLM-2026-009', patientName: 'أحمد بن ناصر القحطاني', provider: 'الخليج للتأمين', amount: 18200, submitDate: '2026-07-17', status: 'pending' as const, serviceType: 'عمليات جراحية' },
  { id: 'CLM-2026-010', patientName: 'ريم بنت سعد الحربي', provider: 'التأمين التعاوني', amount: 1850, submitDate: '2026-07-16', status: 'approved' as const, serviceType: 'عيادة أسنان' },
]

const CONTRACTS_MOCK = [
  { id: 'CTR-001', provider: 'شركة بوبا العربية', type: 'شامل', startDate: '2026-01-01', endDate: '2026-12-31', totalValue: 4500000, employeesCovered: 3420, renewDate: '2026-11-15', status: 'active' as const },
  { id: 'CTR-002', provider: 'التأمين التعاوني', type: 'أساسي', startDate: '2026-01-01', endDate: '2026-12-31', totalValue: 3200000, employeesCovered: 2890, renewDate: '2026-11-01', status: 'active' as const },
  { id: 'CTR-003', provider: 'شركة معاد', type: 'شامل', startDate: '2026-03-01', endDate: '2027-02-28', totalValue: 2800000, employeesCovered: 2150, renewDate: '2027-01-15', status: 'active' as const },
  { id: 'CTR-004', provider: 'الgbt التأمين', type: 'أساسي', startDate: '2026-01-01', endDate: '2026-12-31', totalValue: 1800000, employeesCovered: 1780, renewDate: '2026-10-15', status: 'active' as const },
  { id: 'CTR-005', provider: 'نيوم للتأمين', type: 'شامل', startDate: '2025-07-01', endDate: '2026-06-30', totalValue: 1200000, employeesCovered: 870, renewDate: '2026-05-01', status: 'expired' as const },
  { id: 'CTR-006', provider: 'شركة أسيج', type: 'متوسط', startDate: '2026-06-01', endDate: '2027-05-31', totalValue: 2100000, employeesCovered: 1540, renewDate: '2027-04-15', status: 'active' as const },
]

type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'processing'
type ContractStatus = 'active' | 'expired' | 'pending'

const CLAIM_STATUS_MAP: Record<ClaimStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'قيد المراجعة', variant: 'warning' },
  approved: { label: 'معتمدة', variant: 'success' },
  rejected: { label: 'مرفوضة', variant: 'error' },
  processing: { label: 'قيد المعالجة', variant: 'info' },
}

interface CoverageResult {
  found: boolean
  patientName?: string
  provider?: string
  planType?: string
  coverageDetails?: {
    medical: number
    dental: number
    optical: number
    pharmacy: number
    surgical: number
  }
  deductible?: number
  maxLimit?: number
  usedAmount?: number
  policyNumber?: string
  expiryDate?: string
}

const COVERAGE_DATABASE: Record<string, CoverageResult> = {
  '12345': {
    found: true,
    patientName: 'عبدالله بن سعد المطيري',
    provider: 'شركة بوبا العربية',
    planType: 'شامل',
    coverageDetails: { medical: 100, dental: 80, optical: 70, pharmacy: 90, surgical: 100 },
    deductible: 200,
    maxLimit: 500000,
    usedAmount: 45200,
    policyNumber: 'BUPA-2026-3420',
    expiryDate: '2026-12-31',
  },
  '67890': {
    found: true,
    patientName: 'فاطمة بنت أحمد الزهراني',
    provider: 'التأمين التعاوني',
    planType: 'أساسي',
    coverageDetails: { medical: 80, dental: 50, optical: 40, pharmacy: 70, surgical: 85 },
    deductible: 500,
    maxLimit: 250000,
    usedAmount: 89000,
    policyNumber: 'TAW-2026-2890',
    expiryDate: '2026-12-31',
  },
}

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState('providers')
  const [searchQuery, setSearchQuery] = useState('')
  const [providers] = useState(PROVIDERS_MOCK)
  const [claims, setClaims] = useState(CLAIMS_MOCK)
  const [contracts] = useState(CONTRACTS_MOCK)
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [createClaimOpen, setCreateClaimOpen] = useState(false)
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)

  const [verificationForm, setVerificationForm] = useState({ patientId: '', insuranceId: '' })
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [newClaim, setNewClaim] = useState({
    patientName: '',
    provider: '',
    amount: 0,
    serviceType: '',
    description: '',
  })

  const filteredClaims = useMemo(() => {
    let result = claims
    if (searchQuery) {
      result = result.filter(
        (c) => c.patientName.includes(searchQuery) || c.id.includes(searchQuery) || c.provider.includes(searchQuery)
      )
    }
    if (selectedProvider !== 'all') {
      result = result.filter((c) => c.provider === selectedProvider)
    }
    return result
  }, [claims, searchQuery, selectedProvider])

  const stats = [
    { title: 'مزودو التأمين النشطون', value: '12', change: '+1', changeType: 'positive' as const },
    { title: 'مطالبات قيد المراجعة', value: '89', change: '-12', changeType: 'positive' as const },
    { title: 'معدل الموافقة', value: '87.3%', change: '+2.1%', changeType: 'positive' as const },
    { title: 'إجمالي المطالبات الشهرية', value: formatCurrency(234000, 'SAR'), change: '+8.5%', changeType: 'negative' as const },
  ]

  const handleVerifyCoverage = () => {
    setVerifying(true)
    setCoverageResult(null)
    setTimeout(() => {
      const result = COVERAGE_DATABASE[verificationForm.patientId]
      if (result) {
        setCoverageResult(result)
      } else {
        setCoverageResult({
          found: false,
        })
      }
      setVerifying(false)
    }, 1500)
  }

  const handleCreateClaim = () => {
    const id = `CLM-2026-${String(claims.length + 1).padStart(3, '0')}`
    setClaims((prev) => [
      {
        id,
        patientName: newClaim.patientName,
        provider: newClaim.provider,
        amount: newClaim.amount,
        submitDate: new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        serviceType: newClaim.serviceType,
      },
      ...prev,
    ])
    setCreateClaimOpen(false)
    setNewClaim({ patientName: '', provider: '', amount: 0, serviceType: '', description: '' })
  }

  const totalClaimAmount = claims.reduce((s, c) => s + c.amount, 0)
  const approvedClaims = claims.filter((c) => c.status === 'approved')
  const pendingClaims = claims.filter((c) => c.status === 'pending')
  const processingClaims = claims.filter((c) => c.status === 'processing')

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التأمين</h1>
          <p className="text-muted-foreground">إدارة مزودي التأمين والمطالبات والتغطية</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Button variant="primary" onClick={() => setCreateClaimOpen(true)}>
            مطالبة جديدة
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
          <TabsTrigger value="providers">المزودون</TabsTrigger>
          <TabsTrigger value="claims">المطالبات</TabsTrigger>
          <TabsTrigger value="coverage">التحقق من التغطية</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="contracts">العقود</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{provider.id}</p>
                    </div>
                    <Badge variant={provider.active ? 'success' : 'secondary'}>
                      {provider.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-muted-foreground text-xs">المرضى</p>
                      <p className="text-lg font-bold">{formatNumber(provider.patients)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-muted-foreground text-xs">المطالبات</p>
                      <p className="text-lg font-bold">{formatNumber(provider.claims)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-muted-foreground text-xs">معدل الموافقة</p>
                      <p className={cn('text-lg font-bold', provider.approvalRate >= 90 ? 'text-green-500' : provider.approvalRate >= 85 ? 'text-yellow-500' : 'text-red-500')}>
                        {provider.approvalRate}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-muted-foreground text-xs">متوسط المعالجة</p>
                      <p className="text-lg font-bold">{provider.avgProcessingDays} يوم</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <ProgressBar value={provider.approvalRate} max={100} className="h-2" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">نسبة الموافقة</span>
                      <span className="text-xs font-medium">{provider.approvalRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>المطالبات التأمينية</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <option value="all">جميع المزودين</option>
                  {[...new Set(claims.map((c) => c.provider))].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="بحث بالاسم أو رقم المطالبة..."
                />
                <Button variant="primary" onClick={() => setCreateClaimOpen(true)}>
                  مطالبة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">إجمالي المطالبات</p>
                  <p className="text-lg font-bold">{formatCurrency(totalClaimAmount, 'SAR')}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">معتمدة</p>
                  <p className="text-lg font-bold text-green-500">{approvedClaims.length}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                  <p className="text-lg font-bold text-yellow-500">{pendingClaims.length}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">قيد المعالجة</p>
                  <p className="text-lg font-bold text-blue-500">{processingClaims.length}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-4 font-medium">رقم المطالبة</th>
                      <th className="text-right py-3 px-4 font-medium">المريض</th>
                      <th className="text-right py-3 px-4 font-medium">مزود التأمين</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                      <th className="text-right py-3 px-4 font-medium">نوع الخدمة</th>
                      <th className="text-right py-3 px-4 font-medium">تاريخ التقديم</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <>
                        <tr
                          key={claim.id}
                          className={cn(
                            'border-b border-border hover:bg-muted/50 transition-colors cursor-pointer',
                            expandedClaim === claim.id && 'bg-muted/30'
                          )}
                          onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                        >
                          <td className="py-3 px-4 font-mono text-xs">{claim.id}</td>
                          <td className="py-3 px-4 font-medium">{claim.patientName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="info">{claim.provider}</Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(claim.amount, 'SAR')}</td>
                          <td className="py-3 px-4 text-muted-foreground">{claim.serviceType}</td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(claim.submitDate)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={CLAIM_STATUS_MAP[claim.status].variant}>
                              {CLAIM_STATUS_MAP[claim.status].label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">عرض</Button>
                              {claim.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" className="text-green-500">اعتماد</Button>
                                  <Button size="sm" variant="ghost" className="text-red-500">رفض</Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedClaim === claim.id && (
                          <tr key={`${claim.id}-expanded`}>
                            <td colSpan={8} className="bg-muted/30 p-4">
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">المريض:</span>
                                  <span className="mr-2 font-medium">{claim.patientName}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">المزود:</span>
                                  <span className="mr-2">{claim.provider}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">نوع الخدمة:</span>
                                  <span className="mr-2">{claim.serviceType}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">المبلغ المطلوب:</span>
                                  <span className="mr-2 font-bold">{formatCurrency(claim.amount, 'SAR')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">المبلغ المعتمد:</span>
                                  <span className="mr-2 font-bold text-green-500">
                                    {claim.status === 'approved' ? formatCurrency(claim.amount * 0.85, 'SAR') : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">شهادة المريض:</span>
                                  <span className="mr-2">{Math.round(claim.amount * 0.15)} SAR</span>
                                </div>
                                <div className="col-span-2 flex gap-2">
                                  <Button size="sm" variant="outline">تفاصيل الخدمة</Button>
                                  <Button size="sm" variant="outline">إرفاق مستندات</Button>
                                  <Button size="sm" variant="outline">سجل المحادثات</Button>
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
                  إجمالي المبالغ: {formatCurrency(filteredClaims.reduce((s, c) => s + c.amount, 0), 'SAR')}
                </span>
                <span className="text-sm text-muted-foreground">
                  عدد المطالبات: {filteredClaims.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>التحقق من التغطية التأمينية</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSection title="بيانات التحقق">
                  <FormGroup>
                    <FormField
                      label="رقم المريض (الهوية)"
                      value={verificationForm.patientId}
                      onChange={(v) => setVerificationForm((prev) => ({ ...prev, patientId: v }))}
                      placeholder="أدخل رقم هوية المريض"
                    />
                    <FormField
                      label="رقم بوليصة التأمين"
                      value={verificationForm.insuranceId}
                      onChange={(v) => setVerificationForm((prev) => ({ ...prev, insuranceId: v }))}
                      placeholder="أدخل رقم البوليصة"
                    />
                  </FormGroup>
                </FormSection>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={handleVerifyCoverage}
                  disabled={!verificationForm.patientId || verifying}
                >
                  {verifying ? 'جاري التحقق...' : 'التحقق من التغطية'}
                </Button>
              </CardContent>
            </Card>

            {coverageResult && (
              <Card>
                <CardHeader>
                  <CardTitle>نتيجة التحقق</CardTitle>
                </CardHeader>
                <CardContent>
                  {!coverageResult.found ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✕</span>
                      </div>
                      <h3 className="font-bold text-lg text-red-500">لم يتم العثور على التغطية</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        لا توجد بيانات تأمينية لهذا المريض. يرجى التحقق من الرقم والمحاولة مرة أخرى.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                          ✓
                        </div>
                        <div>
                          <h3 className="font-bold">{coverageResult.patientName}</h3>
                          <p className="text-sm text-muted-foreground">{coverageResult.provider} - {coverageResult.planType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-muted-foreground text-xs">رقم البوليصة</span>
                          <p className="font-mono text-xs mt-1">{coverageResult.policyNumber}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-muted-foreground text-xs">تاريخ الانتهاء</span>
                          <p className="font-medium mt-1">{formatDate(coverageResult.expiryDate!)}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-muted-foreground text-xs">الeductible</span>
                          <p className="font-medium mt-1">{formatCurrency(coverageResult.deductible!, 'SAR')}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-muted-foreground text-xs">الحد الأقصى</span>
                          <p className="font-medium mt-1">{formatCurrency(coverageResult.maxLimit!, 'SAR')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-3">نسب التغطية</h4>
                        <div className="space-y-2">
                          {Object.entries(coverageResult.coverageDetails!).map(([key, value]) => {
                            const labels: Record<string, string> = {
                              medical: 'الخدمات الطبية',
                              dental: 'الأسنان',
                              optical: 'العيون',
                              pharmacy: 'الصيدلية',
                              surgical: 'الجراحات',
                            }
                            return (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground w-24">{labels[key]}</span>
                                <ProgressBar value={value} max={100} className="h-2 flex-1" />
                                <span className="text-sm font-medium w-10 text-left">{value}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">استهلاك الحد الأقصى</h4>
                        <ProgressBar
                          value={coverageResult.usedAmount!}
                          max={coverageResult.maxLimit!}
                          className="h-3"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>المستخدم: {formatCurrency(coverageResult.usedAmount!, 'SAR')}</span>
                          <span>المتبقي: {formatCurrency(coverageResult.maxLimit! - coverageResult.usedAmount!, 'SAR')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="primary" className="flex-1">إنشاء مطالبة</Button>
                        <Button size="sm" variant="outline" className="flex-1">طباعة التقرير</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المطالبات حسب المزود</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[...new Set(claims.map((c) => c.provider))].slice(0, 6).map((provider) => ({
                    label: provider.length > 12 ? provider.slice(0, 12) + '...' : provider,
                    value1: claims.filter((c) => c.provider === provider).reduce((s, c) => s + c.amount, 0),
                    value2: claims.filter((c) => c.provider === provider).length,
                  }))}
                  series={[
                    { key: 'value1', label: 'المبلغ (SAR)', color: '#3b82f6' },
                  ]}
                  height={280}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدلات الموافقة</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={[
                    { label: 'معتمدة', value: claims.filter((c) => c.status === 'approved').length, color: '#22c55e' },
                    { label: 'قيد المراجعة', value: claims.filter((c) => c.status === 'pending').length, color: '#f59e0b' },
                    { label: 'مرفوضة', value: claims.filter((c) => c.status === 'rejected').length, color: '#ef4444' },
                    { label: 'قيد المعالجة', value: claims.filter((c) => c.status === 'processing').length, color: '#3b82f6' },
                  ]}
                  size={220}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نسبة الموافقة</span>
                    <span className="font-bold text-green-500">
                      {((claims.filter((c) => c.status === 'approved').length / claims.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نسبة الرفض</span>
                    <span className="font-bold text-red-500">
                      {((claims.filter((c) => c.status === 'rejected').length / claims.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>الإيرادات من التأمين</CardTitle>
                <ExportButton />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <MetricRow label="إجمالي المطالبات" value={formatCurrency(totalClaimAmount, 'SAR')} />
                    <MetricRow label="المطالبات المعتمدة" value={formatCurrency(approvedClaims.reduce((s, c) => s + c.amount, 0), 'SAR')} trend="up" />
                    <MetricRow label="المطالبات المرفوضة" value={formatCurrency(claims.filter((c) => c.status === 'rejected').reduce((s, c) => s + c.amount, 0), 'SAR')} trend="down" />
                  </div>
                  <div className="space-y-3">
                    <MetricRow label="متوسط المطالبة" value={formatCurrency(Math.round(totalClaimAmount / claims.length), 'SAR')} />
                    <MetricRow label="أكبر مطالبة" value={formatCurrency(Math.max(...claims.map((c) => c.amount)), 'SAR')} />
                    <MetricRow label="أصغر مطالبة" value={formatCurrency(Math.min(...claims.map((c) => c.amount)), 'SAR')} />
                  </div>
                  <div className="space-y-3">
                    <MetricRow label="معدل المعالجة اليومي" value={`${(claims.length / 28).toFixed(1)} مطالبة`} />
                    <MetricRow label="وقت المعالجة المتوسط" value="4.2 يوم" />
                    <MetricRow label="المرضى المؤمنين" value={formatNumber(providers.reduce((s, p) => s + p.patients, 0))} />
                  </div>
                  <div className="space-y-3">
                    <MetricRow label="قيمة العقود السنوية" value={formatCurrency(contracts.reduce((s, c) => s + c.totalValue, 0), 'SAR')} />
                    <MetricRow label="الإيراد لكل مريض" value={formatCurrency(Math.round(totalClaimAmount / providers.reduce((s, p) => s + p.patients, 0)), 'SAR')} />
                    <MetricRow label="نسبة التكلفة للإيراد" value="24.8%" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>العقود التأمينية</CardTitle>
              <Button variant="primary">عقد جديد</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-4 font-medium">رقم العقد</th>
                      <th className="text-right py-3 px-4 font-medium">المزود</th>
                      <th className="text-right py-3 px-4 font-medium">النوع</th>
                      <th className="text-right py-3 px-4 font-medium">تاريخ البداية</th>
                      <th className="text-right py-3 px-4 font-medium">تاريخ النهاية</th>
                      <th className="text-right py-3 px-4 font-medium">القيمة</th>
                      <th className="text-right py-3 px-4 font-medium">الموظفون</th>
                      <th className="text-right py-3 px-4 font-medium">تجديد</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => {
                      const daysToRenew = Math.ceil((new Date(contract.renewDate).getTime() - Date.now()) / 86400000)
                      const isExpiringSoon = daysToRenew <= 60 && daysToRenew > 0
                      return (
                        <tr key={contract.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{contract.id}</td>
                          <td className="py-3 px-4 font-medium">{contract.provider}</td>
                          <td className="py-3 px-4">
                            <Badge variant={contract.type === 'شامل' ? 'info' : contract.type === 'متوسط' ? 'warning' : 'secondary'}>
                              {contract.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(contract.startDate)}</td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(contract.endDate)}</td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(contract.totalValue, 'SAR')}</td>
                          <td className="py-3 px-4">{formatNumber(contract.employeesCovered)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-xs',
                                contract.status === 'expired' ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-muted-foreground'
                              )}>
                                {contract.status === 'expired' ? 'منتهي' : `${daysToRenew} يوم`}
                              </span>
                              {isExpiringSoon && <Badge variant="warning">قريب</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={contract.status === 'active' ? 'success' : contract.status === 'expired' ? 'error' : 'warning'}>
                              {contract.status === 'active' ? 'نشط' : contract.status === 'expired' ? 'منتهي' : 'قيد الانتظار'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={5} className="py-3 px-4">الإجمالي</td>
                      <td className="py-3 px-4">{formatCurrency(contracts.reduce((s, c) => s + c.totalValue, 0), 'SAR')}</td>
                      <td className="py-3 px-4">{formatNumber(contracts.reduce((s, c) => s + c.employeesCovered, 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>ملخص العقود</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricRow label="العقود النشطة" value={String(contracts.filter((c) => c.status === 'active').length)} trend="up" />
                <MetricRow label="العقود المنتهية" value={String(contracts.filter((c) => c.status === 'expired').length)} />
                <MetricRow label="إجمالي القيمة" value={formatCurrency(contracts.reduce((s, c) => s + c.totalValue, 0), 'SAR')} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>التجديدات القادمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contracts
                  .filter((c) => c.status === 'active')
                  .sort((a, b) => new Date(a.renewDate).getTime() - new Date(b.renewDate).getTime())
                  .slice(0, 4)
                  .map((contract) => {
                    const days = Math.ceil((new Date(contract.renewDate).getTime() - Date.now()) / 86400000)
                    return (
                      <div key={contract.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <div>
                          <p className="font-medium">{contract.provider}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(contract.renewDate)}</p>
                        </div>
                        <Badge variant={days <= 30 ? 'error' : days <= 60 ? 'warning' : 'info'}>
                          {days} يوم
                        </Badge>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>توزيع التغطية</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={contracts.map((c, i) => ({
                    label: c.provider,
                    value: c.employeesCovered,
                    color: ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'][i % 6],
                  }))}
                  size={180}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createClaimOpen} onOpenChange={setCreateClaimOpen}>
        <DialogHeader>
          <DialogTitle>إنشاء مطالبة تأمينية جديدة</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات المطالبة">
            <FormGroup>
              <FormField
                label="اسم المريض"
                value={newClaim.patientName}
                onChange={(v) => setNewClaim((prev) => ({ ...prev, patientName: v }))}
                placeholder="أدخل اسم المريض"
              />
              <FormField
                label="مزود التأمين"
                value={newClaim.provider}
                onChange={(v) => setNewClaim((prev) => ({ ...prev, provider: v }))}
                placeholder="اختر مزود التأمين"
              />
              <FormField
                label="نوع الخدمة"
                value={newClaim.serviceType}
                onChange={(v) => setNewClaim((prev) => ({ ...prev, serviceType: v }))}
                placeholder="مثال: عيادة خارجية"
              />
              <FormField
                label="المبلغ (SAR)"
                type="number"
                value={String(newClaim.amount)}
                onChange={(v) => setNewClaim((prev) => ({ ...prev, amount: Number(v) }))}
              />
              <FormField
                label="الوصف"
                value={newClaim.description}
                onChange={(v) => setNewClaim((prev) => ({ ...prev, description: v }))}
                placeholder="وصف الخدمة الطبية"
              />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setCreateClaimOpen(false)}>إلغاء</Button>
          <Button
            variant="primary"
            onClick={handleCreateClaim}
            disabled={!newClaim.patientName || !newClaim.provider || newClaim.amount === 0}
          >
            إنشاء المطالبة
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
