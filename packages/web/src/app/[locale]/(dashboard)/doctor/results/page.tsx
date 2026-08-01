'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { Alert } from '@/design-system/feedback/Alert';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog, LoadingSpinner } from '@/design-system/feedback/Alert';
import { Switch } from '@/design-system/primitives/Input';
import { cn, formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { resultsAdvancedApi, CriticalAlert, DoctorNote, NoteTemplate, AIExplanation, PatientInsight, ComparisonResult, TestTrend } from '@/lib/api/results-advanced';
import { patientApi, reportApi } from '@/lib/api';

interface PatientRecord {
  id: string;
  name: string;
  fileNumber: string;
  lastVisit: string;
  resultCount: number;
  hasCritical: boolean;
}

interface PendingResult {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId: string;
  testName: string;
  orderDate: string;
  priority: 'normal' | 'urgent';
  parameters: { name: string; value: string; unit: string; reference: string; flag?: string }[];
  reviewedBy?: string;
}

type DoctorTab = 'pending' | 'patients' | 'comparison' | 'notes';

export default function DoctorResultsPage() {
  const { locale } = useParams();
  const router = useRouter();
  const isRtl = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DoctorTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [stats, setStats] = useState({ pendingReview: 0, todayResults: 0, criticalAlerts: 0, totalPatients: 0 });

  const [selectedResult, setSelectedResult] = useState<PendingResult | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'public' | 'private'>('private');
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>([]);

  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientResults, setPatientResults] = useState<PendingResult[]>([]);
  const [patientInsights, setPatientInsights] = useState<PatientInsight[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([]);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, alertsRes, patientsRes] = await Promise.all([
        reportApi.list({ status: 'review', limit: 50 }).catch(() => ({ data: { data: [] } })),
        resultsAdvancedApi.getActiveAlerts().catch(() => null),
        patientApi.list({ limit: 20 }).catch(() => ({ data: { data: [] } })),
      ]);
      const rawPending = pendingRes.data?.data || [];
      setPendingResults(rawPending.map((r: any) => ({
        id: r.id,
        orderNumber: r.orderNumber || r.id,
        patientName: r.patientName || r.patient?.name || '',
        patientId: r.patientId || r.patient?.id || '',
        testName: r.testName || '',
        orderDate: r.orderDate || r.createdAt,
        priority: r.priority || 'normal',
        parameters: r.parameters || r.results || [],
      })));
      if (alertsRes) setAlerts(alertsRes.data?.data || []);
      const rawPatients = patientsRes.data?.data || [];
      setPatients(rawPatients.map((p: any) => ({
        id: p.id,
        name: p.firstNameAr + ' ' + p.lastNameAr,
        fileNumber: p.fileNumber || p.id,
        lastVisit: p.lastVisit || p.updatedAt || '',
        resultCount: p.resultCount || 0,
        hasCritical: p.hasCritical || false,
      })));
      setStats({
        pendingReview: rawPending.length,
        todayResults: rawPending.filter((r: any) => {
          const d = new Date(r.orderDate || r.createdAt);
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length,
        criticalAlerts: alertsRes?.data?.data?.length || 0,
        totalPatients: rawPatients.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!selectedResult) return;
    setIsProcessing(true);
    try {
      await reportApi.update(selectedResult.id, { status: 'approved' });
      setPendingResults(prev => prev.filter(r => r.id !== selectedResult.id));
      setShowApproveDialog(false);
      setSelectedResult(null);
      setStats(s => ({ ...s, pendingReview: s.pendingReview - 1 }));
    } catch (err: any) {
      alert(err.message || 'فشل اعتماد النتيجة');
    } finally { setIsProcessing(false); }
  };

  const handleReject = async () => {
    if (!selectedResult) return;
    setIsProcessing(true);
    try {
      await reportApi.update(selectedResult.id, { status: 'draft', rejectionReason: rejectReason });
      setPendingResults(prev => prev.filter(r => r.id !== selectedResult.id));
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedResult(null);
      setStats(s => ({ ...s, pendingReview: s.pendingReview - 1 }));
    } catch (err: any) {
      alert(err.message || 'فشل إعادة النتيجة');
    } finally { setIsProcessing(false); }
  };

  const handleAddNote = async () => {
    if (!selectedResult || !noteContent.trim()) return;
    try {
      await resultsAdvancedApi.addNote(selectedResult.id, { content: noteContent, visibility: noteVisibility });
      setNoteContent('');
      setShowNoteDialog(false);
      const notesRes = await resultsAdvancedApi.getNotes(selectedResult.id);
      setNotes(notesRes.data?.data || []);
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الملاحظة');
    }
  };

  const handleViewPatient = async (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setActiveTab('comparison');
    setLoading(true);
    try {
      const [resultsRes, insightsRes] = await Promise.all([
        reportApi.getPatientHistory(patient.id, { limit: 20 }),
        resultsAdvancedApi.getPatientInsights(patient.id).catch(() => null),
      ]);
      setPatientResults((resultsRes.data?.data || []).map((r: any) => ({
        id: r.id,
        orderNumber: r.orderNumber || r.id,
        patientName: r.patientName || '',
        patientId: r.patientId || '',
        testName: r.testName || '',
        orderDate: r.orderDate || r.createdAt,
        priority: r.priority || 'normal',
        parameters: r.parameters || r.results || [],
      })));
      if (insightsRes) setPatientInsights(insightsRes.data?.data || []);
      const compRes = await resultsAdvancedApi.getPatientComparison(patient.id).catch(() => null);
      if (compRes) setComparisonData(compRes.data?.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleViewDetail = async (result: PendingResult) => {
    setSelectedResult(result);
    setShowApproveDialog(true);
    setLoadingAi(true);
    try {
      const [expRes, notesRes, templatesRes] = await Promise.all([
        resultsAdvancedApi.getExplanation(result.id, locale as string).catch(() => null),
        resultsAdvancedApi.getNotes(result.id).catch(() => null),
        resultsAdvancedApi.getNoteTemplates().catch(() => null),
      ]);
      if (expRes) setAiExplanation(expRes.data?.data || null);
      if (notesRes) setNotes(notesRes.data?.data || []);
      if (templatesRes) setNoteTemplates(templatesRes.data?.data || []);
    } catch { /* ignore */ } finally { setLoadingAi(false); }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await resultsAdvancedApi.generatePdf(id);
      const url = res.data?.data?.url;
      if (url) window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'فشل تحميل PDF');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.includes(searchQuery) || p.fileNumber.includes(searchQuery)
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'مسودة' },
      review: { variant: 'warning', label: 'قيد المراجعة' },
      approved: { variant: 'success', label: 'معتمد' },
      published: { variant: 'info', label: 'منشور' },
    };
    const s = map[status] || { variant: 'secondary', label: status };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-100 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-surface-100 rounded-xl" />)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">لوحة النتائج</h1>
          <p className="mt-1 text-sm text-surface-500">مراجعة واعتماد نتائج التحاليل المخبرية</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <Alert variant="danger" title={`تنبيهات حرجة (${alerts.length})`}>
          <div className="space-y-2 mt-2">
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.patientName} — {a.testName}: {a.parameter} = {a.value}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-success-600 h-7 text-xs" onClick={() => resultsAdvancedApi.acknowledgeAlert(a.id).catch(() => {})}>تأكيد</Button>
                  <Button variant="ghost" size="sm" className="text-danger-600 h-7 text-xs" onClick={() => resultsAdvancedApi.escalateAlert(a.id).catch(() => {})}>تصعيد</Button>
                </div>
              </div>
            ))}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="قيد المراجعة" value={formatNumber(stats.pendingReview)} icon={
          <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
        } iconBg="bg-warning-50" />
        <StatCard title="نتائج اليوم" value={formatNumber(stats.todayResults)} icon={
          <svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
        } iconBg="bg-brand-50" />
        <StatCard title="تنبيهات حرجة" value={formatNumber(stats.criticalAlerts)} icon={
          <svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        } iconBg="bg-danger-50" />
        <StatCard title="إجمالي المرضى" value={formatNumber(stats.totalPatients)} icon={
          <svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
        } iconBg="bg-success-50" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DoctorTab)}>
        <TabsList>
          <TabsTrigger value="pending">المراجعات ({stats.pendingReview})</TabsTrigger>
          <TabsTrigger value="patients">المرضى</TabsTrigger>
          <TabsTrigger value="comparison">المقارنة</TabsTrigger>
          <TabsTrigger value="notes">ملاحظاتي</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingResults.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <svg className="h-12 w-12 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-sm text-surface-500">لا توجد نتائج في انتظار المراجعة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingResults.map(result => (
                <Card key={result.id} hover onClick={() => handleViewDetail(result)} className={result.priority === 'urgent' ? 'border-r-4 border-r-danger-500' : ''}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', result.priority === 'urgent' ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600')}>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-surface-900 truncate">{result.patientName}</p>
                        <p className="text-xs text-surface-500">{result.testName} — {result.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left hidden sm:block">
                        <p className="text-xs text-surface-500">{formatDate(result.orderDate)}</p>
                      </div>
                      {result.priority === 'urgent' && <Badge variant="danger">عاجل</Badge>}
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="success" size="sm" className="h-8" onClick={() => { setSelectedResult(result); setShowApproveDialog(true); }}>
                          اعتماد
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-danger-600" onClick={() => { setSelectedResult(result); setRejectReason(''); setShowRejectDialog(true); }}>
                          رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>بحث عن مريض</CardTitle>
                <SearchInput placeholder="اسم المريض أو رقم الملف..." value={searchQuery} onChange={(v) => setSearchQuery(v)} className="w-64" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-surface-400 text-sm">لا يوجد مرضى</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {filteredPatients.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => handleViewPatient(patient)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-600 font-medium text-sm">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900">{patient.name}</p>
                          <p className="text-xs text-surface-500">{patient.fileNumber} — {patient.resultCount} نتيجة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.hasCritical && <Badge variant="danger">حرج</Badge>}
                        <span className="text-xs text-surface-400">{patient.lastVisit ? formatDate(patient.lastVisit, 'short') : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientResults([]); setComparisonData([]); }}>
                    <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    عودة
                  </Button>
                  <h3 className="text-lg font-semibold text-surface-900">{selectedPatient.name}</h3>
                </div>
                <div className="flex gap-2">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm" />
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-100 rounded-xl" />)}
                </div>
              ) : patientInsights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {patientInsights.map(insight => (
                    <div key={insight.id} className={cn(
                      'rounded-xl border p-3',
                      insight.severity === 'high' ? 'border-danger-200 bg-danger-50' :
                      insight.severity === 'medium' ? 'border-warning-200 bg-warning-50' :
                      'border-info-200 bg-info-50'
                    )}>
                      <p className="text-xs font-medium text-surface-700">{insight.title}</p>
                      <p className="text-xs text-surface-500 mt-1">{insight.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {comparisonData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>مقارنة النتائج</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-200">
                            <th className="px-3 py-2 text-right text-surface-500">المعيار</th>
                            <th className="px-3 py-2 text-center text-surface-500">القيم</th>
                            <th className="px-3 py-2 text-center text-surface-500">الاتجاه</th>
                            <th className="px-3 py-2 text-left text-surface-500">التغير</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((c, i) => (
                            <tr key={i} className="border-b border-surface-100">
                              <td className="px-3 py-2 font-medium">{c.parameter}</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1 justify-center">
                                  {c.values.slice(-5).map((v, j) => (
                                    <span key={j} className={cn(
                                      'inline-block px-1.5 py-0.5 rounded text-xs font-mono',
                                      v.value > 100 ? 'bg-danger-50 text-danger-600' : 'bg-surface-100 text-surface-600'
                                    )}>{v.value}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'text-xs font-medium',
                                  c.trend === 'increasing' ? 'text-danger-600' :
                                  c.trend === 'decreasing' ? 'text-warning-600' :
                                  'text-success-600'
                                )}>
                                  {c.trend === 'increasing' ? '↑' : c.trend === 'decreasing' ? '↓' : '→'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-left text-surface-600 text-xs">{c.changePercent > 0 ? '+' : ''}{c.changePercent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {patientResults.map(result => (
                  <Card key={result.id} hover onClick={() => handleViewDetail(result)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-900">{result.testName}</p>
                        <p className="text-xs text-surface-500">{formatDate(result.orderDate)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadPdf(result.id); }}>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <svg className="h-12 w-12 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="mt-3 text-sm text-surface-500">اختر مريضاً من قائمة المرضى لعرض النتائج والمقارنات</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ملاحظاتي</CardTitle>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const res = await resultsAdvancedApi.getMyNotes();
                    setNotes(res.data?.data || []);
                  } catch { /* ignore */ }
                }}>
                  <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="py-12 text-center text-surface-400 text-sm">لا توجد ملاحظات</div>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="rounded-xl border border-surface-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-surface-900">{note.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-surface-400">{note.authorName}</span>
                            <Badge variant={note.visibility === 'public' ? 'info' : 'secondary'} className="text-[10px]">
                              {note.visibility === 'public' ? 'عام' : 'خاص'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-surface-400 shrink-0">{formatDateTime(note.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>اعتماد نتيجة التحليل</DialogTitle></DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-surface-50 rounded-xl p-4">
                <div><span className="text-surface-500">المريض: </span><span className="font-medium">{selectedResult.patientName}</span></div>
                <div><span className="text-surface-500">التحليل: </span><span className="font-medium">{selectedResult.testName}</span></div>
                <div><span className="text-surface-500">رقم الطلب: </span><span className="font-medium">{selectedResult.orderNumber}</span></div>
                <div><span className="text-surface-500">التاريخ: </span><span className="font-medium">{formatDate(selectedResult.orderDate)}</span></div>
              </div>

              {loadingAi ? (
                <div className="flex items-center justify-center py-4"><LoadingSpinner /><span className="mr-2 text-sm text-surface-500">جاري تحميل التحليل...</span></div>
              ) : aiExplanation ? (
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    <span className="text-xs font-semibold text-brand-700">تحليل AI</span>
                  </div>
                  <p className="text-sm text-brand-800">{aiExplanation.summary}</p>
                </div>
              ) : null}

              {selectedResult.parameters.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-surface-200">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-surface-500">المعيار</th>
                        <th className="px-4 py-2 text-center text-surface-500">القيمة</th>
                        <th className="px-4 py-2 text-right text-surface-500">الوحدة</th>
                        <th className="px-4 py-2 text-right text-surface-500">المدى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.parameters.map((p, i) => (
                        <tr key={i} className="border-t border-surface-100">
                          <td className="px-4 py-2 font-medium">{p.name}</td>
                          <td className={cn('px-4 py-2 text-center font-semibold', p.flag === 'H' ? 'text-danger-600' : p.flag === 'L' ? 'text-warning-600' : '')}>{p.value}</td>
                          <td className="px-4 py-2 text-surface-500">{p.unit}</td>
                          <td className="px-4 py-2 text-surface-500 font-mono text-xs">{p.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {notes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-surface-900">الملاحظات</h4>
                  {notes.map(note => (
                    <div key={note.id} className="rounded-lg bg-surface-50 p-3 text-sm">
                      <p>{note.content}</p>
                      <p className="text-xs text-surface-400 mt-1">{note.authorName} — {formatDateTime(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-surface-100">
                <Button variant="outline" size="sm" onClick={() => { setShowNoteDialog(true); }}>
                  <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  إضافة ملاحظة
                </Button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowApproveDialog(false)}>إلغاء</Button>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => { setShowApproveDialog(false); setShowRejectDialog(true); }}>إعادة</Button>
                  <Button variant="success" onClick={handleApprove} disabled={isProcessing}>
                    {isProcessing ? <LoadingSpinner className="h-4 w-4" /> : null}
                    اعتماد
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إعادة النتيجة للمراجعة</DialogTitle></DialogHeader>
          <FormField label="سبب الإعادة">
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm" placeholder="أدخل سبب الإعادة..." />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>إلغاء</Button>
            <Button variant="danger" onClick={handleReject} disabled={isProcessing || !rejectReason.trim()}>
              {isProcessing ? <LoadingSpinner className="h-4 w-4" /> : null}
              إعادة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>إضافة ملاحظة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {noteTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">قوالب الملاحظات</label>
                <div className="flex gap-2 flex-wrap">
                  {noteTemplates.map(t => (
                    <button key={t.id} onClick={() => setNoteContent(t.content)} className="text-xs rounded-lg border border-surface-200 px-2 py-1 hover:bg-surface-50 transition-colors">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4} className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm" placeholder="اكتب ملاحظتك..." />
            <div className="flex items-center gap-2">
              <Switch checked={noteVisibility === 'public'} onCheckedChange={(v) => setNoteVisibility(v ? 'public' : 'private')} />
              <span className="text-sm text-surface-600">{noteVisibility === 'public' ? 'عام (يراه المريض)' : 'خاص (للكادر الطبي فقط)'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>إلغاء</Button>
            <Button variant="primary" onClick={handleAddNote} disabled={!noteContent.trim()}>حفظ الملاحظة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
