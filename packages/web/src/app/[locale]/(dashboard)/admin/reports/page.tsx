'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import ExportButton from '@/components/admin/ExportButton';

interface Report {
  id: string;
  reportNumber: string;
  patientName: string;
  patientId: string;
  doctor: string;
  department: string;
  branch: string;
  testCount: number;
  tests: string[];
  status: 'completed' | 'pending' | 'published' | 'archived';
  createdAt: string;
  publishedAt: string | null;
  summary: string;
}

const mockReports: Report[] = [
  {
    id: '1', reportNumber: 'RPT-2026-001', patientName: 'أحمد محمد العلي', patientId: 'P-1001',
    doctor: 'د. سعيد الراشد', department: 'الباطنية', branch: 'الفرع الرئيسي',
    testCount: 5, tests: ['صورة الدم الكاملة', 'السكر التراكمي', 'بروفايل الدهون', 'وظائف الكلى', 'وظائف الكبد'],
    status: 'published', createdAt: '2026-07-25', publishedAt: '2026-07-26',
    summary: 'تشخيص: ارتفاع ضغط الدم، علاج دوائي مستمر',
  },
  {
    id: '2', reportNumber: 'RPT-2026-002', patientName: 'فاطمة عبدالله الخطيب', patientId: 'P-1002',
    doctor: 'د. خالد المنصور', department: 'القلب', branch: 'الفرع الرئيسي',
    testCount: 3, tests: ['بروفايل الدهون', 'معادلة الدم', 'صورة الدم الكاملة'],
    status: 'pending', createdAt: '2026-07-28', publishedAt: null,
    summary: 'متابعة: اضطراب نظم القلب',
  },
  {
    id: '3', reportNumber: 'RPT-2026-003', patientName: 'محمد سالم الدوسري', patientId: 'P-1003',
    doctor: 'د. نورة الشمري', department: 'الغدد الصماء', branch: 'فرع الرياض',
    testCount: 4, tests: ['السكر التراكمي', 'وظائف الكلى', 'صورة الدم الكاملة', 'فيتامين د'],
    status: 'completed', createdAt: '2026-07-24', publishedAt: '2026-07-25',
    summary: 'تشخيص: سكري من النوع الثاني، تعديل جرع الأنسولين',
  },
  {
    id: '4', reportNumber: 'RPT-2026-004', patientName: 'سارة خالد العتيبي', patientId: 'P-1004',
    doctor: 'د. سعيد الراشد', department: 'الكلى', branch: 'فرع جدة',
    testCount: 6, tests: ['وظائف الكلى', 'صورة الدم الكاملة', 'تحليل البول', 'البوتاسيوم', 'الصوديوم', 'الكلوريد'],
    status: 'published', createdAt: '2026-07-22', publishedAt: '2026-07-23',
    summary: 'تشخيص: قصور كلوي مزمن المرحلة الثالثة',
  },
  {
    id: '5', reportNumber: 'RPT-2026-005', patientName: 'عبدالرحمن ناصر القحطاني', patientId: 'P-1005',
    doctor: 'د. نورة الشمري', department: 'الغدد الصماء', branch: 'الفرع الرئيسي',
    testCount: 2, tests: ['وظائف الغدة الدرقية', 'السكري التراكمي'],
    status: 'archived', createdAt: '2026-07-20', publishedAt: '2026-07-21',
    summary: 'تشخيص: قصور الدرقية، استمرار العلاج',
  },
  {
    id: '6', reportNumber: 'RPT-2026-006', patientName: 'هند ماجد الحربي', patientId: 'P-1006',
    doctor: 'د. علي الزهراني', department: 'النسائية', branch: 'فرع الرياض',
    testCount: 3, tests: ['تحليل البول', 'صورة الدم الكاملة', 'الحديد والferitin'],
    status: 'pending', createdAt: '2026-07-28', publishedAt: null,
    summary: 'متابعة: فقر الدم أثناء الحمل',
  },
  {
    id: '7', reportNumber: 'RPT-2026-007', patientName: 'يوسف عبدالعزيز المطيري', patientId: 'P-1007',
    doctor: 'د. خالد المنصور', department: 'القلب', branch: 'فرع جدة',
    testCount: 4, tests: ['بروفايل الدهون', 'معادلة الدم', 'صورة الدم الكاملة', 'البروتين التفاعلي'],
    status: 'completed', createdAt: '2026-07-23', publishedAt: '2026-07-24',
    summary: 'تشخيص: التهاب عضلة القلب',
  },
  {
    id: '8', reportNumber: 'RPT-2026-008', patientName: 'نورة سعيد الغامدي', patientId: 'P-1008',
    doctor: 'د. علي الزهراني', department: 'الطوارئ', branch: 'الفرع الرئيسي',
    testCount: 2, tests: ['صورة الدم الكاملة', 'معادلة الدم'],
    status: 'published', createdAt: '2026-07-27', publishedAt: '2026-07-27',
    summary: 'حالة طوارئ: نزيف نشط',
  },
];

export default function ReportsManagementPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const [reports] = useState<Report[]>(mockReports);

  const doctors = [...new Set(reports.map(r => r.doctor))];
  const departments = [...new Set(reports.map(r => r.department))];
  const branches = [...new Set(reports.map(r => r.branch))];

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.patientName.includes(searchQuery) || r.reportNumber.includes(searchQuery);
    const matchesDoctor = doctorFilter === 'all' || r.doctor === doctorFilter;
    const matchesDepartment = departmentFilter === 'all' || r.department === departmentFilter;
    const matchesBranch = branchFilter === 'all' || r.branch === branchFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesTab =
      activeTab === 'all' ? true :
      activeTab === 'byDepartment' ? true :
      activeTab === 'byDoctor' ? true :
      activeTab === 'byBranch' ? true : true;
    return matchesSearch && matchesDoctor && matchesDepartment && matchesBranch && matchesStatus;
  });

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setShowPreviewDialog(true);
  };

  const handleBulkPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      alert(`جاري طباعة ${selectedIds.length} تقارير...`);
    }, 2000);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) setSelectedIds([]);
    else setSelectedIds(filteredReports.map(r => r.id));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">مكتمل</Badge>;
      case 'pending': return <Badge variant="warning">قيد الانتظار</Badge>;
      case 'published': return <Badge variant="info">منشور</Badge>;
      case 'archived': return <Badge variant="secondary">مؤرشف</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const reportsByDepartment = departments.map(dept => ({
    department: dept,
    count: reports.filter(r => r.department === dept).length,
  }));

  const reportsByDoctor = doctors.map(doc => ({
    doctor: doc,
    count: reports.filter(r => r.doctor === doc).length,
  }));

  const reportsByBranch = branches.map(br => ({
    branch: br,
    count: reports.filter(r => r.branch === br).length,
  }));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
          <p className="text-muted-foreground mt-1">إدارة وتوزيع تقارير التحاليل المخبرية</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={reports} filename="reports-export" />
          {selectedIds.length > 0 && (
            <Button onClick={handleBulkPrint}>
              {isPrinting ? <LoadingSpinner /> : `طباعة المحدد (${selectedIds.length})`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي التقارير" value={formatNumber(8934)} icon="📊" change={{ value: 18, isPositive: true }} />
        <StatCard title="تقارير اليوم" value="124" icon="📋" change={{ value: 8, isPositive: true }} />
        <StatCard title="قيد النشر" value="45" icon="⏳" change={{ value: 12, isPositive: false }} />
        <StatCard title="تقارير متأخرة" value="8" icon="⚠️" change={{ value: 2, isPositive: false }} className="border-r-2 border-r-danger" />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput placeholder="بحث بالاسم أو رقم التقرير..." value={searchQuery} onChange={setSearchQuery} className="w-72" />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الأطباء</option>
          {doctors.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الأقسام</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الفروع</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الحالات</option>
          <option value="completed">مكتمل</option>
          <option value="pending">قيد الانتظار</option>
          <option value="published">منشور</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الإجمالي</TabsTrigger>
          <TabsTrigger value="byDepartment">حسب القسم</TabsTrigger>
          <TabsTrigger value="byDoctor">حسب الطبيب</TabsTrigger>
          <TabsTrigger value="byBranch">حسب الفرع</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.length === filteredReports.length && filteredReports.length > 0} onChange={toggleSelectAll} className="rounded border-border" />
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">رقم التقرير</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">المريض</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الطبيب</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">القسم</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">عدد التحاليل</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.includes(report.id)} onChange={() => toggleSelect(report.id)} className="rounded border-border" />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{report.reportNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{report.patientName}</div>
                          <div className="text-xs text-muted-foreground">{report.patientId}</div>
                        </td>
                        <td className="px-4 py-3">{report.doctor}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{report.department}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary">{report.testCount} تحاليل</Badge>
                        </td>
                        <td className="px-4 py-3">{statusBadge(report.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(report.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handlePreview(report)}>معاينة</Button>
                            <Button variant="ghost" size="sm">طباعة</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReports.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">لا توجد تقارير مطابقة</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byDepartment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportsByDepartment.sort((a, b) => b.count - a.count).map(item => (
              <Card key={item.department} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setDepartmentFilter(item.department); setActiveTab('all'); }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{item.department}</h3>
                    <Badge variant="secondary">{item.count} تقرير</Badge>
                  </div>
                  <ProgressBar value={item.count} max={Math.max(...reportsByDepartment.map(d => d.count))} size="sm" />
                  <p className="text-sm text-muted-foreground mt-2">{Math.round((item.count / reports.length) * 100)}% من إجمالي التقارير</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="byDoctor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportsByDoctor.sort((a, b) => b.count - a.count).map(item => (
              <Card key={item.doctor} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setDoctorFilter(item.doctor); setActiveTab('all'); }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {item.doctor.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.doctor}</h3>
                        <p className="text-sm text-muted-foreground">{item.count} تقرير</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-primary">{item.count}</div>
                      <div className="text-xs text-muted-foreground">تقرير</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="byBranch">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportsByBranch.sort((a, b) => b.count - a.count).map(item => (
              <Card key={item.branch} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setBranchFilter(item.branch); setActiveTab('all'); }}>
                <CardContent className="p-5 text-center">
                  <div className="text-3xl mb-2">🏥</div>
                  <h3 className="font-semibold text-lg">{item.branch}</h3>
                  <div className="text-3xl font-bold text-primary my-3">{item.count}</div>
                  <p className="text-sm text-muted-foreground">تقرير</p>
                  <ProgressBar value={item.count} max={Math.max(...reportsByBranch.map(b => b.count))} size="sm" className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showPreviewDialog && selectedReport && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>معاينة التقرير - {selectedReport.reportNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">تقرير التحاليل المخبرية</h3>
                  {statusBadge(selectedReport.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">رقم التقرير</p>
                    <p className="font-medium font-mono">{selectedReport.reportNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">المريض</p>
                    <p className="font-medium">{selectedReport.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">رقم المريض</p>
                    <p className="font-medium">{selectedReport.patientId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">الطبيب المعالج</p>
                    <p className="font-medium">{selectedReport.doctor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">القسم</p>
                    <p className="font-medium">{selectedReport.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">الفرع</p>
                    <p className="font-medium">{selectedReport.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-medium">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">تاريخ النشر</p>
                    <p className="font-medium">{selectedReport.publishedAt ? formatDate(selectedReport.publishedAt) : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">عدد التحاليل</p>
                    <p className="font-medium">{selectedReport.testCount}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">التحاليل المشمولة:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.tests.map((test, i) => (
                    <Badge key={i} variant="outline">{test}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">الملخص:</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{selectedReport.summary}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>إغلاق</Button>
              <Button variant="outline">طباعة</Button>
              <Button>تحميل PDF</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
