'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard, GlassCard } from '@/design-system/layout/Card';
import { Badge, Avatar, AvatarGroup } from '@/design-system/primitives/Badge';
import { Alert } from '@/design-system/feedback/Alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { Table, TableHeader, TableBody, TableRow, Th, Td, type Column } from '@/design-system/layout/Table';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Button } from '@/design-system/primitives/Button';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { BarChart, DonutChart, DonutLegend, ChartCard, Sparkline } from '@/design-system/data/ChartCard';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';

// Mock data
const mockResults = [
  { id: '1', testName: 'Complete Blood Count (CBC)', category: 'Hematology', date: '2026-07-25', status: 'completed', doctor: 'Dr. Sarah Al-Ahmad', critical: false },
  { id: '2', testName: 'Lipid Profile', category: 'Chemistry', date: '2026-07-20', status: 'completed', doctor: 'Dr. Mohammed Al-Rashid', critical: false },
  { id: '3', testName: 'Thyroid Function (TSH)', category: 'Endocrinology', date: '2026-07-18', status: 'completed', doctor: 'Dr. Fatima Al-Zahra', critical: true },
  { id: '4', testName: 'Liver Function Panel', category: 'Chemistry', date: '2026-07-15', status: 'completed', doctor: 'Dr. Sarah Al-Ahmad', critical: false },
  { id: '5', testName: 'HbA1c (Glycated Hemoglobin)', category: 'Endocrinology', date: '2026-07-10', status: 'completed', doctor: 'Dr. Fatima Al-Zahra', critical: false },
];

const mockReportDetail = {
  id: 'RPT-2026-001',
  testName: 'Complete Blood Count (CBC)',
  date: '2026-07-25',
  doctor: 'Dr. Sarah Al-Ahmad',
  branch: 'Main Branch - Riyadh',
  status: 'completed',
  items: [
    { name: 'White Blood Cells (WBC)', value: '7.5', unit: 'K/µL', range: '4.5-11.0', status: 'normal' },
    { name: 'Red Blood Cells (RBC)', value: '5.2', unit: 'M/µL', range: '4.5-5.9', status: 'normal' },
    { name: 'Hemoglobin (HGB)', value: '14.8', unit: 'g/dL', range: '13.5-17.5', status: 'normal' },
    { name: 'Hematocrit (HCT)', value: '44.2', unit: '%', range: '38.3-48.6', status: 'normal' },
    { name: 'Platelet Count (PLT)', value: '180', unit: 'K/µL', range: '150-400', status: 'normal' },
    { name: 'Mean Corpuscular Volume (MCV)', value: '85.0', unit: 'fL', range: '80.0-100.0', status: 'normal' },
    { name: 'Neutrophils', value: '60', unit: '%', range: '40-70', status: 'normal' },
    { name: 'Lymphocytes', value: '30', unit: '%', range: '20-45', status: 'normal' },
  ],
};

const mockInsights = [
  { type: 'info', title: 'نتيجة طبيعية', description: 'جميع قيم CBC ضمن المعدل الطبيعي. لا حاجة للقلق.' },
  { type: 'warning', title: 'تتبع)', description: 'تم رصد تحسن في عدد الكريات البيضاء مقارنة بالشهر الماضي (7.5 → 6.8).' },
  { type: 'success', title: 'تحسين مستمر', description: 'مستوى الهيموجلوبين مستقر منذ آخر فحص.' },
];

export default function ReportsPage() {
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null);

  if (selectedReport) {
    return <ReportDetail reportId={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">التقارير الطبية</h1>
          <p className="mt-1 text-sm text-surface-500">عرض وتحميل نتائج الفحوصات المخبرية</p>
        </div>
        <Button variant="outline" icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v3zm4-8H5v1h8V5zm-2 4H7v1h6V9z" clipRule="evenodd" /></svg>}>
          تصدير الكل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي التقارير" value="12" change={8} changeLabel="هذا الشهر" icon={<svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>} iconBg="bg-brand-50" />
        <StatCard title="تحت المراجعة" value="2" icon={<svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} iconBg="bg-warning-50" />
        <StatCard title="نتائج حرجة" value="1" icon={<svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>} iconBg="bg-danger-50" />
        <StatCard title="آخر فحص" value="25 Jul" icon={<svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} iconBg="bg-success-50" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" count={12}>الكل</TabsTrigger>
            <TabsTrigger value="recent">الأحدث</TabsTrigger>
            <TabsTrigger value="critical">الحرجة</TabsTrigger>
            <TabsTrigger value="shared">المشتركة</TabsTrigger>
          </TabsList>
          <SearchInput placeholder="بحث في التقارير..." className="w-72" onSearch={() => {}} />
        </div>

        <TabsContent value="all">
          <Card padding="none">
            <Table hoverable>
              <TableHeader>
                <TableRow>
                  <Th sortable>التقرير</Th>
                  <Th sortable>الفئة</Th>
                  <Th sortable>التاريخ</Th>
                  <Th>الطبيب</Th>
                  <Th>الحالة</Th>
                  <Th>إجراءات</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResults.map((report) => (
                  <TableRow key={report.id} hoverable className="cursor-pointer" onClick={() => setSelectedReport(report.id)}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                          <svg className="h-4 w-4 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900">{report.testName}</p>
                          <p className="text-xs text-surface-500">#{report.id}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge variant="secondary">{report.category}</Badge></Td>
                    <Td className="text-sm">{formatDate(report.date)}</Td>
                    <Td className="text-sm">{report.doctor}</Td>
                    <Td>
                      {report.critical ? (
                        <Badge variant="danger" dot>حرج</Badge>
                      ) : (
                        <Badge variant="success" dot>طبيعي</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v3zm4-8H5v1h8V5zm-2 4H7v1h6V9z" clipRule="evenodd" /></svg>
                        </Button>
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportDetail({ reportId, onBack }: { reportId: string; onBack: () => void }) {
  const report = mockReportDetail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="rounded-xl p-2 hover:bg-surface-100 transition-colors">
          <svg className="h-5 w-5 text-surface-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{report.testName}</h1>
          <p className="mt-1 text-sm text-surface-500">تقرير رقم #{report.id} — {formatDate(report.date)}</p>
        </div>
      </div>

      {/* AI Insights */}
      <Alert variant="info" title="تحليل بالذكاء الاصطناعي" icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}>
        <div className="space-y-2 mt-2">
          {mockInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                insight.type === 'info' ? 'bg-info-500' :
                insight.type === 'warning' ? 'bg-warning-500' : 'bg-success-500'
              }`} />
              <div>
                <span className="text-xs font-semibold">{insight.title}:</span>
                <span className="text-xs mr-1">{insight.description}</span>
              </div>
            </div>
          ))}
        </div>
      </Alert>

      {/* Results Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="text-base font-semibold text-surface-900">نتائج الفحص</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <Th>المعايرة</Th>
              <Th align="center">القيمة</Th>
              <Th>الوحدة</Th>
              <Th>المعدل الطبيعي</Th>
              <Th align="center">الحالة</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.items.map((item, i) => (
              <TableRow key={i}>
                <Td className="font-medium text-surface-900">{item.name}</Td>
                <Td align="center" className="font-semibold text-surface-900">{item.value}</Td>
                <Td className="text-surface-500">{item.unit}</Td>
                <Td className="text-surface-500 font-mono text-xs">{item.range}</Td>
                <Td align="center">
                  <Badge variant={item.status === 'normal' ? 'success' : item.status === 'high' ? 'warning' : 'danger'} dot>
                    {item.status === 'normal' ? 'طبيعي' : item.status === 'high' ? 'مرتفع' : 'منخفض'}
                  </Badge>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="primary" icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v3zm4-8H5v1h8V5zm-2 4H7v1h6V9z" clipRule="evenodd" /></svg>}>
          تحميل PDF
        </Button>
        <Button variant="outline">مشاركة مع الطبيب</Button>
      </div>
    </div>
  );
}
