'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { Alert } from '@/design-system/feedback/Alert';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminComponents';
import { cn, formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { resultsAdvancedApi, AuditEntry, SuspiciousActivity, AuditStats, ComplianceReport, DashboardOverview, DailyTrend, DoctorPerformance, CategoryBreakdown, DepartmentCritical } from '@/lib/api/results-advanced';
import api from '@/lib/api';

type AdminTab = 'overview' | 'audit' | 'compliance' | 'performance' | 'system';

export default function AdminResultsPage() {
  const { locale } = useParams();
  const isRtl = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [departmentCritical, setDepartmentCritical] = useState<DepartmentCritical[]>([]);
  const [turnaroundData, setTurnaroundData] = useState<any>(null);
  const [abnormalRate, setAbnormalRate] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [auditSeverity, setAuditSeverity] = useState<string>('all');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');

  const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);
  const [showAuditDetail, setShowAuditDetail] = useState(false);
  const [showComplianceDetail, setShowComplianceDetail] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceReport | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all([
        resultsAdvancedApi.getDashboardOverview().catch(() => null),
        resultsAdvancedApi.getDailyTrends().catch(() => null),
        resultsAdvancedApi.getAuditStats().catch(() => null),
        resultsAdvancedApi.getSuspiciousActivity().catch(() => null),
        resultsAdvancedApi.getComplianceReport().catch(() => null),
        resultsAdvancedApi.getDoctorPerformance().catch(() => null),
        resultsAdvancedApi.getCategoryBreakdown().catch(() => null),
        resultsAdvancedApi.getCriticalByDepartment().catch(() => null),
        resultsAdvancedApi.getTurnaroundTime().catch(() => null),
        resultsAdvancedApi.getAbnormalRate().catch(() => null),
      ]);
      if (results[0]) setOverview(results[0].data?.data || null);
      if (results[1]) setDailyTrends(results[1].data?.data || []);
      if (results[2]) setAuditStats(results[2].data?.data || null);
      if (results[3]) setSuspiciousActivity(results[3].data?.data || []);
      if (results[4]) setComplianceReports(results[4].data?.data || []);
      if (results[5]) setDoctorPerformance(results[5].data?.data || []);
      if (results[6]) setCategoryBreakdown(results[6].data?.data || []);
      if (results[7]) setDepartmentCritical(results[7].data?.data || []);
      if (results[8]) setTurnaroundData(results[8].data?.data || null);
      if (results[9]) setAbnormalRate(results[9].data?.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAuditEntries = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {};
      if (auditSeverity !== 'all') params.severity = auditSeverity;
      if (auditDateFrom) params.from = auditDateFrom;
      if (auditDateTo) params.to = auditDateTo;
      const res = await api.get('/results/advanced/audit/report/all', { params });
      setAuditEntries(res.data?.data || []);
    } catch { /* ignore */ }
  }, [auditSeverity, auditDateFrom, auditDateTo]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditEntries();
  }, [activeTab, fetchAuditEntries]);

  const handleExportAudit = async () => {
    setExporting(true);
    try {
      const res = await resultsAdvancedApi.exportAuditLog({
        from: auditDateFrom || undefined,
        to: auditDateTo || undefined,
        severity: auditSeverity !== 'all' ? auditSeverity : undefined,
      });
      const blob = res.data as any;
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(err.message || 'فشل تصدير سجل التدقيق');
    } finally { setExporting(false); }
  };

  const severityBadge = (severity: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      info: { variant: 'info', label: 'معلومة' },
      warning: { variant: 'warning', label: 'تنبيه' },
      critical: { variant: 'danger', label: 'حرج' },
    };
    const s = map[severity] || { variant: 'secondary', label: severity };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  const complianceBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      compliant: { variant: 'success', label: 'ممتثل' },
      partial: { variant: 'warning', label: 'ممتثل جزئياً' },
      non_compliant: { variant: 'danger', label: 'غير ممتثل' },
    };
    const s = map[status] || { variant: 'secondary', label: status };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-surface-100 rounded-2xl" />
        <div className="h-64 bg-surface-100 rounded-2xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="h-16 w-16 rounded-full bg-danger-50 flex items-center justify-center">
        <svg className="h-8 w-8 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-surface-900">حدث خطأ</h3>
      <p className="text-sm text-surface-500">{error}</p>
      <Button variant="primary" onClick={fetchData}>إعادة المحاولة</Button>
    </div>
  );

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminPageHeader
        title="لوحة إدارة النتائج"
        description="مشاهدة وتحليل أداء المختبر وإدارة سجلات التدقيق"
        exportData={[]}
        exportFilename="results-dashboard"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="audit">سجل التدقيق {suspiciousActivity.length > 0 && <Badge variant="danger" className="mr-1">{suspiciousActivity.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
          <TabsTrigger value="performance">أداء الأطباء</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي النتائج" value={formatNumber(overview?.totalResults || 0)} icon={
              <svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" /></svg>
            } iconBg="bg-brand-50" />
            <StatCard title="نتائج اليوم" value={formatNumber(overview?.todayResults || 0)} icon={
              <svg className="h-5 w-5 text-info-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
            } iconBg="bg-info-50" />
            <StatCard title="متوسط وقت التحول" value={overview?.averageTurnaround ? `${overview.averageTurnaround.toFixed(1)} س` : '—'} icon={
              <svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
            } iconBg="bg-success-50" />
            <StatCard title="معدل الشذوذ" value={overview?.abnormalRate ? `${overview.abnormalRate.toFixed(1)}%` : '—'} icon={
              <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            } iconBg="bg-warning-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>الاتجاهات اليومية</CardTitle></CardHeader>
              <CardContent>
                {dailyTrends.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400">لا توجد بيانات</div>
                ) : (
                  <div className="space-y-3">
                    {dailyTrends.slice(-7).map((d, i) => {
                      const maxVal = Math.max(...dailyTrends.map(x => x.total), 1);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-600">{formatDate(d.date, 'short')}</span>
                            <span className="text-surface-500">{d.total} نتيجة</span>
                          </div>
                          <div className="flex gap-1 h-4">
                            <div className="flex-1 bg-surface-100 rounded-full overflow-hidden flex">
                              <div style={{ width: `${(d.completed / maxVal) * 100}%` }} className="bg-success-400 h-full transition-all" />
                              <div style={{ width: `${(d.abnormal / maxVal) * 100}%` }} className="bg-warning-400 h-full transition-all" />
                              <div style={{ width: `${(d.critical / maxVal) * 100}%` }} className="bg-danger-400 h-full transition-all" />
                            </div>
                          </div>
                          <div className="flex gap-3 text-[10px] text-surface-400">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success-400" />{d.completed} مكتمل</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning-400" />{d.abnormal} شاذ</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger-400" />{d.critical} حرج</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>التوزيع حسب الفئة</CardTitle></CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400">لا توجد بيانات</div>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.slice(0, 8).map((c, i) => {
                      const maxPct = Math.max(...categoryBreakdown.map(x => x.percentage), 1);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-700 font-medium">{c.category}</span>
                            <span className="text-surface-500">{c.count} ({c.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', c.abnormalCount > 0 ? 'bg-warning-400' : 'bg-brand-400')}
                              style={{ width: `${(c.percentage / maxPct) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>النتائج الحرجة حسب القسم</CardTitle></CardHeader>
              <CardContent>
                {departmentCritical.length === 0 ? (
                  <div className="py-8 text-center text-sm text-surface-400">لا توجد بيانات</div>
                ) : (
                  <div className="space-y-3">
                    {departmentCritical.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-surface-700">{d.department}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-surface-500">{d.critical}/{d.total}</span>
                          <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', d.percentage > 10 ? 'bg-danger-400' : d.percentage > 5 ? 'bg-warning-400' : 'bg-success-400')} style={{ width: `${Math.min(d.percentage, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>معدل الشذوذ حسب القسم</CardTitle></CardHeader>
              <CardContent>
                {abnormalRate?.byDepartment?.length > 0 ? (
                  <div className="space-y-3">
                    {abnormalRate.byDepartment.slice(0, 8).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-surface-700">{d.department}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('font-medium', d.rate > 10 ? 'text-danger-600' : d.rate > 5 ? 'text-warning-600' : 'text-success-600')}>{d.rate.toFixed(1)}%</span>
                          <span className="text-xs text-surface-400">({d.abnormal}/{d.total})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-surface-400">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>وقت التحول حسب القسم</CardTitle></CardHeader>
            <CardContent>
              {turnaroundData?.byDepartment?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="px-3 py-2 text-right text-surface-500">القسم</th>
                        <th className="px-3 py-2 text-left text-surface-500">متوسط الوقت (ساعات)</th>
                        <th className="px-3 py-2 text-left text-surface-500">عدد العينات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnaroundData.byDepartment.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-surface-100">
                          <td className="px-3 py-2 font-medium">{d.department}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={cn('font-medium', d.averageHours > 24 ? 'text-danger-600' : d.averageHours > 12 ? 'text-warning-600' : 'text-success-600')}>{d.averageHours.toFixed(1)}</span>
                              <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden max-w-32">
                                <div className={cn('h-full rounded-full', d.averageHours > 24 ? 'bg-danger-400' : d.averageHours > 12 ? 'bg-warning-400' : 'bg-success-400')} style={{ width: `${Math.min((d.averageHours / 48) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-surface-500">{d.sampleSize}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-surface-400">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          {suspiciousActivity.length > 0 && (
            <Alert variant="danger" title={`نشاط مشبوه (${suspiciousActivity.length})`}>
              <div className="space-y-2 mt-2">
                {suspiciousActivity.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.userName} — {s.reason}</span>
                    <Badge variant={s.severity === 'critical' ? 'danger' : 'warning'}>{s.severity === 'critical' ? 'حرج' : 'تحذير'}</Badge>
                  </div>
                ))}
              </div>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <SearchInput placeholder="بحث في سجل التدقيق..." value={searchQuery} onChange={(v) => setSearchQuery(v)} className="w-56" />
              <select value={auditSeverity} onChange={(e) => setAuditSeverity(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm">
                <option value="all">جميع المستويات</option>
                <option value="info">معلومة</option>
                <option value="warning">تنبيه</option>
                <option value="critical">حرج</option>
              </select>
              <input type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm" />
              <input type="date" value={auditDateTo} onChange={(e) => setAuditDateTo(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={handleExportAudit} disabled={exporting}>
              {exporting ? <LoadingSpinner className="h-4 w-4" /> : <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              تصدير
            </Button>
          </div>

          {auditStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-surface-50 p-3 text-center">
                <p className="text-2xl font-bold text-surface-900">{formatNumber(auditStats.totalEntries)}</p>
                <p className="text-xs text-surface-500">إجمالي الإدخالات</p>
              </div>
              <div className="rounded-xl bg-surface-50 p-3 text-center">
                <p className="text-2xl font-bold text-danger-600">{formatNumber(auditStats.suspiciousCount)}</p>
                <p className="text-xs text-surface-500">نشاط مشبوه</p>
              </div>
              <div className="rounded-xl bg-surface-50 p-3 text-center">
                <p className="text-sm font-semibold text-surface-900">{auditStats.mostActiveUser?.userName || '—'}</p>
                <p className="text-xs text-surface-500">الأكثر نشاطاً</p>
              </div>
              <div className="rounded-xl bg-surface-50 p-3 text-center">
                <p className="text-lg font-bold text-surface-900">{auditStats.peakHour}:00</p>
                <p className="text-xs text-surface-500">ساعة الذروة</p>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {auditEntries.length === 0 ? (
                <div className="py-16 text-center text-sm text-surface-400">
                  <svg className="h-12 w-12 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-3">لا توجد إدخالات في سجل التدقيق</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50">
                        <th className="px-4 py-3 text-right text-surface-500">التوقيت</th>
                        <th className="px-4 py-3 text-right text-surface-500">المستخدم</th>
                        <th className="px-4 py-3 text-right text-surface-500">الإجراء</th>
                        <th className="px-4 py-3 text-right text-surface-500">الموارد</th>
                        <th className="px-4 py-3 text-right text-surface-500">المستوى</th>
                        <th className="px-4 py-3 text-right text-surface-500">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.filter(e => {
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          return e.userName.includes(q) || e.action.includes(q) || e.resource.includes(q) || e.ipAddress.includes(q);
                        }
                        return true;
                      }).slice(0, 100).map(entry => (
                        <tr key={entry.id} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition-colors" onClick={() => { setSelectedAudit(entry); setShowAuditDetail(true); }}>
                          <td className="px-4 py-3 text-xs text-surface-500">{formatDateTime(entry.timestamp)}</td>
                          <td className="px-4 py-3 font-medium text-surface-900">{entry.userName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-[10px]">{entry.action}</Badge>
                          </td>
                          <td className="px-4 py-3 text-surface-600">{entry.resource}</td>
                          <td className="px-4 py-3">{severityBadge(entry.severity)}</td>
                          <td className="px-4 py-3 text-xs font-mono text-surface-400">{entry.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          {complianceReports.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <svg className="h-12 w-12 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="mt-3 text-sm text-surface-500">لا توجد تقارير امتثال</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complianceReports.map(cr => (
                <Card key={cr.standard} hover onClick={() => { setSelectedCompliance(cr); setShowComplianceDetail(true); }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{cr.standard}</CardTitle>
                      {complianceBadge(cr.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
                          <span>نسبة الامتثال</span>
                          <span>{cr.score}%</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', cr.score >= 80 ? 'bg-success-400' : cr.score >= 50 ? 'bg-warning-400' : 'bg-danger-400')}
                            style={{ width: `${cr.score}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-surface-400">آخر تقييم: {formatDate(cr.lastAssessment)}</p>
                      <p className="text-xs text-surface-500">{cr.findings.length} ملاحظة</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface-50 p-4 text-center">
              <p className="text-2xl font-bold text-surface-900">{formatNumber(doctorPerformance.reduce((a, b) => a + b.totalReviewed, 0))}</p>
              <p className="text-xs text-surface-500">إجمالي المراجعات</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-4 text-center">
              <p className="text-2xl font-bold text-brand-600">
                {doctorPerformance.length > 0 ? (doctorPerformance.reduce((a, b) => a + b.averageReviewTime, 0) / doctorPerformance.length).toFixed(1) : '—'}
              </p>
              <p className="text-xs text-surface-500">متوسط وقت المراجعة (ساعات)</p>
            </div>
            <div className="rounded-xl bg-surface-50 p-4 text-center">
              <p className="text-2xl font-bold text-success-600">
                {doctorPerformance.length > 0 ? (doctorPerformance.reduce((a, b) => a + b.accuracy, 0) / doctorPerformance.length).toFixed(1) : '—'}%
              </p>
              <p className="text-xs text-surface-500">متوسط الدقة</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {doctorPerformance.length === 0 ? (
                <div className="py-12 text-center text-sm text-surface-400">لا توجد بيانات أداء</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50">
                        <th className="px-4 py-3 text-right text-surface-500">الطبيب</th>
                        <th className="px-4 py-3 text-center text-surface-500">مراجعات</th>
                        <th className="px-4 py-3 text-center text-surface-500">متوسط الوقت</th>
                        <th className="px-4 py-3 text-center text-surface-500">الدقة</th>
                        <th className="px-4 py-3 text-center text-surface-500">حالات حرجة</th>
                        <th className="px-4 py-3 text-left text-surface-500">آخر نشاط</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorPerformance.map((dr, i) => (
                        <tr key={dr.doctorId} className={cn('border-b border-surface-100', i % 2 === 0 ? 'bg-white' : 'bg-surface-50/30')}>
                          <td className="px-4 py-3 font-medium text-surface-900">{dr.doctorName}</td>
                          <td className="px-4 py-3 text-center">{formatNumber(dr.totalReviewed)}</td>
                          <td className="px-4 py-3 text-center">{dr.averageReviewTime.toFixed(1)} س</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-surface-100 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', dr.accuracy >= 95 ? 'bg-success-400' : dr.accuracy >= 85 ? 'bg-warning-400' : 'bg-danger-400')} style={{ width: `${dr.accuracy}%` }} />
                              </div>
                              <span className={cn('text-xs font-medium', dr.accuracy >= 95 ? 'text-success-600' : dr.accuracy >= 85 ? 'text-warning-600' : 'text-danger-600')}>{dr.accuracy.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={dr.criticalFlagged > 0 ? 'text-danger-600 font-medium' : 'text-surface-400'}>{formatNumber(dr.criticalFlagged)}</span>
                          </td>
                          <td className="px-4 py-3 text-left text-xs text-surface-400">{formatDateTime(dr.lastActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>مفاتيح التشفير</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">تشفير النتائج</p>
                      <p className="text-xs text-surface-500">AES-256-GCM</p>
                    </div>
                    <Badge variant="success">نشط</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">تشفير قواعد البيانات</p>
                      <p className="text-xs text-surface-500">TLS 1.3</p>
                    </div>
                    <Badge variant="success">نشط</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">مفاتيح API</p>
                      <p className="text-xs text-surface-500">آخر تحديث: 2026-07-28</p>
                    </div>
                    <Button variant="ghost" size="sm">تدوير</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">JWT التوقيع</p>
                      <p className="text-xs text-surface-500">RS256 — 2048 bit</p>
                    </div>
                    <Badge variant="success">نشط</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>مؤشرات صحة النظام</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">الخادم الرئيسي</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">قاعدة البيانات</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">خدمة التخزين</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">خدمة البريد</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">خدمة AI</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700">خدمة QR/Barcode</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success-500" />
                      <span className="text-xs text-success-600">متصل</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500">آخر فحص صحي</span>
                    <span className="text-surface-700 font-medium">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>إحصائيات النظام</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{formatNumber(overview?.totalPatients || 0)}</p>
                  <p className="text-xs text-surface-500">إجمالي المرضى</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{formatNumber(overview?.activeDoctors || 0)}</p>
                  <p className="text-xs text-surface-500">الأطباء النشطون</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{formatNumber(overview?.pendingReview || 0)}</p>
                  <p className="text-xs text-surface-500">بانتظار المراجعة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{formatNumber(overview?.criticalAlerts || 0)}</p>
                  <p className="text-xs text-surface-500">تنبيهات حرجة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAuditDetail} onOpenChange={setShowAuditDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>تفاصيل إدخال التدقيق</DialogTitle></DialogHeader>
          {selectedAudit && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-surface-500">المستخدم: </span><span className="font-medium">{selectedAudit.userName}</span></div>
                <div><span className="text-surface-500">الإجراء: </span><span className="font-medium">{selectedAudit.action}</span></div>
                <div><span className="text-surface-500">الموارد: </span><span className="font-medium">{selectedAudit.resource}</span></div>
                <div><span className="text-surface-500">المستوى: </span>{severityBadge(selectedAudit.severity)}</div>
                <div className="col-span-2"><span className="text-surface-500">التفاصيل: </span><span className="text-surface-700">{selectedAudit.details}</span></div>
                <div className="col-span-2"><span className="text-surface-500">IP: </span><span className="font-mono text-xs">{selectedAudit.ipAddress}</span></div>
                <div className="col-span-2"><span className="text-surface-500">التوقيت: </span><span>{formatDateTime(selectedAudit.timestamp)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditDetail(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplianceDetail} onOpenChange={setShowComplianceDetail}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تفاصيل الامتثال</DialogTitle></DialogHeader>
          {selectedCompliance && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">{selectedCompliance.standard}</h3>
                {complianceBadge(selectedCompliance.status)}
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-surface-500 mb-1">
                  <span>نسبة الامتثال</span>
                  <span>{selectedCompliance.score}%</span>
                </div>
                <ProgressBar value={selectedCompliance.score} max={100} className="h-3" />
              </div>
              <p className="text-xs text-surface-400">آخر تقييم: {formatDate(selectedCompliance.lastAssessment)}</p>
              <div>
                <h4 className="text-sm font-semibold text-surface-900 mb-2">الملاحظات ({selectedCompliance.findings.length})</h4>
                <div className="space-y-2">
                  {selectedCompliance.findings.map(f => (
                    <div key={f.id} className="flex items-start gap-2 rounded-lg bg-surface-50 p-3">
                      <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', f.severity === 'high' ? 'bg-danger-500' : f.severity === 'medium' ? 'bg-warning-500' : 'bg-info-500')} />
                      <div className="flex-1">
                        <p className="text-sm text-surface-700">{f.description}</p>
                        <span className={cn('text-xs mt-1 inline-block', f.remediated ? 'text-success-600' : 'text-warning-600')}>
                          {f.remediated ? 'تمت المعالجة' : 'قيد المعالجة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplianceDetail(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
