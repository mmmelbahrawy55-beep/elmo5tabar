'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput } from '@/design-system/forms/FormField';
import { Alert } from '@/design-system/feedback/Alert';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, LoadingSpinner } from '@/design-system/feedback/Alert';
import { cn, formatDate, formatDateTime, generateQrUrl } from '@/lib/utils';
import { resultsAdvancedApi, CriticalAlert, AIExplanation, TimelineEvent, ShareLink, Attachment, PatientInsight } from '@/lib/api/results-advanced';
import { reportApi } from '@/lib/api';

interface PatientResult {
  id: string;
  orderNumber: string;
  testName: string;
  testCategory: string;
  orderDate: string;
  completedDate: string | null;
  status: 'draft' | 'review' | 'approved' | 'published';
  doctorName: string;
  branchName: string;
  isAbnormal: boolean;
  isCritical: boolean;
  parameters: { name: string; value: string; unit: string; reference: string; flag?: string }[];
}

type ViewMode = 'list' | 'timeline' | 'comparison';

export default function PatientResultsPage() {
  const { locale } = useParams();
  const isRtl = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [insights, setInsights] = useState<PatientInsight[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<PatientResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState('7');

  const patientId = 'current'; // In real app, get from auth context

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, alertsRes, insightsRes, timelineRes] = await Promise.all([
        reportApi.list({ patientId, limit: 50 }),
        resultsAdvancedApi.getActiveAlerts({ patientId }).catch(() => null),
        resultsAdvancedApi.getPatientInsights(patientId).catch(() => null),
        resultsAdvancedApi.getPatientTimeline(patientId).catch(() => null),
      ]);
      setResults((res.data?.data || []).map((r: any) => ({
        id: r.id,
        orderNumber: r.orderNumber || r.id,
        testName: r.testName || r.test_name || '',
        testCategory: r.testCategory || r.category || '',
        orderDate: r.orderDate || r.createdAt,
        completedDate: r.completedDate || null,
        status: r.status || 'published',
        doctorName: r.doctorName || r.doctor?.name || '',
        branchName: r.branchName || '',
        isAbnormal: r.isAbnormal || false,
        isCritical: r.isCritical || false,
        parameters: r.parameters || r.results || [],
      })));
      if (alertsRes) setAlerts(alertsRes.data?.data || []);
      if (insightsRes) setInsights(insightsRes.data?.data || []);
      if (timelineRes) setTimeline(timelineRes.data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredResults = results.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.testName.toLowerCase().includes(q) && !r.orderNumber.toLowerCase().includes(q) && !r.doctorName.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (dateFilter && r.orderDate.split('T')[0] !== dateFilter) return false;
    return true;
  });

  const handleViewDetail = async (result: PatientResult) => {
    setSelectedResult(result);
    setShowDetail(true);
    setLoadingAi(true);
    try {
      const expRes = await resultsAdvancedApi.getExplanation(result.id, locale as string);
      setAiExplanation(expRes.data?.data || null);
    } catch { setAiExplanation(null); }
    setLoadingAi(false);
    try {
      const attRes = await resultsAdvancedApi.getAttachments(result.id);
      setAttachments(attRes.data?.data || []);
    } catch { setAttachments([]); }
  };

  const handleDownloadPdf = async (id: string) => {
    setGeneratingPdf(id);
    try {
      const genRes = await resultsAdvancedApi.generatePdf(id);
      const pdfUrl = genRes.data?.data?.url;
      if (pdfUrl) window.open(pdfUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'فشل تحميل PDF');
    } finally { setGeneratingPdf(null); }
  };

  const handleCreateShareLink = async () => {
    if (!selectedResult) return;
    setCreatingShare(true);
    try {
      const res = await resultsAdvancedApi.createShareLink({
        reportIds: [selectedResult.id],
        password: sharePassword || undefined,
        expiresInDays: parseInt(shareExpiry),
      });
      setShareLink(res.data?.data || null);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء رابط المشاركة');
    } finally { setCreatingShare(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'مسودة' },
      review: { variant: 'warning', label: 'قيد المراجعة' },
      approved: { variant: 'info', label: 'معتمد' },
      published: { variant: 'success', label: 'منشور' },
    };
    const s = map[status] || { variant: 'secondary', label: status };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 bg-surface-100 rounded-xl" />
      ))}
    </div>
  );

  if (loading) return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="h-8 w-64 bg-surface-100 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-100 rounded-2xl animate-pulse" />)}
      </div>
      {renderSkeleton()}
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
      <div>
        <h1 className="text-2xl font-bold text-surface-900">نتائج التحاليل</h1>
        <p className="mt-1 text-sm text-surface-500">عرض نتائج الفحوصات المخبرية مع التحليلات والمخططات</p>
      </div>

      {alerts.length > 0 && (
        <Alert variant="danger" title={`تنبيهات حرجة (${alerts.length})`} closable>
          <div className="space-y-2 mt-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.testName}: {a.parameter} = {a.value} ({a.reference})</span>
                <Badge variant="danger">{a.severity === 'critical' ? 'حرج' : 'مرتفع'}</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي النتائج" value={results.length} icon={
          <svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
        } iconBg="bg-brand-50" />
        <StatCard title="نتائج غير طبيعية" value={results.filter(r => r.isAbnormal).length} icon={
          <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        } iconBg="bg-warning-50" />
        <StatCard title="نتائج حرجة" value={results.filter(r => r.isCritical).length} icon={
          <svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
        } iconBg="bg-danger-50" />
        <StatCard title="آخر فحص" value={results.length > 0 ? formatDate(results[0].orderDate, 'short') : '-'} icon={
          <svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        } iconBg="bg-success-50" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list">
              <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              القائمة
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
              الخط الزمني
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h7a1 1 0 100-2H3zm0 4a1 1 0 100 2h4a1 1 0 100-2H3z" /></svg>
              المقارنة
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput placeholder="بحث في النتائج..." value={searchQuery} onChange={(v) => setSearchQuery(v)} className="w-56" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm">
            <option value="all">جميع الحالات</option>
            <option value="published">منشور</option>
            <option value="approved">معتمد</option>
            <option value="review">قيد المراجعة</option>
            <option value="draft">مسودة</option>
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm" />
        </div>
      </div>

      <TabsContent value="list">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-3 text-surface-400">
                <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">لا توجد نتائج مطابقة</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredResults.map(result => (
              <Card key={result.id} hover onClick={() => handleViewDetail(result)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', result.isCritical ? 'bg-danger-50 text-danger-600' : result.isAbnormal ? 'bg-warning-50 text-warning-600' : 'bg-success-50 text-success-600')}>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-surface-900 truncate">{result.testName}</p>
                      <p className="text-xs text-surface-500">{result.orderNumber} — {result.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left hidden sm:block">
                      <p className="text-xs text-surface-500">{formatDate(result.orderDate, 'short')}</p>
                      <p className="text-xs text-surface-400">{result.testCategory}</p>
                    </div>
                    {statusBadge(result.status)}
                    {result.isCritical && <Badge variant="danger">حرج</Badge>}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadPdf(result.id); }} disabled={generatingPdf === result.id}>
                      {generatingPdf === result.id ? <LoadingSpinner className="h-4 w-4" /> : (
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="timeline">
        <Card>
          <CardHeader><CardTitle>الخط الزمني للنتائج</CardTitle></CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="py-12 text-center text-surface-400 text-sm">لا توجد أحداث في الخط الزمني</div>
            ) : (
              <div className="relative">
                <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-surface-200" />
                <div className="space-y-6">
                  {timeline.map(event => (
                    <div key={event.id} className="relative pr-10">
                      <div className={cn(
                        'absolute right-2.5 w-3 h-3 rounded-full border-2 border-white mt-1.5',
                        event.type === 'critical_alert' ? 'bg-danger-500' :
                        event.type.includes('published') || event.type.includes('verified') ? 'bg-success-500' :
                        'bg-brand-500'
                      )} />
                      <div className="bg-surface-50 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-surface-900">{event.description}</p>
                          <span className="text-xs text-surface-400 shrink-0">{formatDateTime(event.timestamp)}</span>
                        </div>
                        <p className="text-xs text-surface-500 mt-1">{event.userName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="comparison">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-surface-400">
              <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">اختر نتيجة لعرض المقارنة مع النتائج السابقة</p>
              <Button variant="outline" size="sm" onClick={() => {
                if (filteredResults.length >= 2) {
                  const first = filteredResults[0];
                  const second = filteredResults[1];
                  resultsAdvancedApi.verifyByToken('').catch(() => {});
                }
              }}>
                مقارنة آخر نتيجتين
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تحليلات ذكية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map(insight => (
                <div key={insight.id} className={cn(
                  'rounded-xl border p-3',
                  insight.severity === 'high' ? 'border-danger-200 bg-danger-50' :
                  insight.severity === 'medium' ? 'border-warning-200 bg-warning-50' :
                  'border-info-200 bg-info-50'
                )}>
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      'mt-0.5 h-2 w-2 rounded-full shrink-0',
                      insight.severity === 'high' ? 'bg-danger-500' :
                      insight.severity === 'medium' ? 'bg-warning-500' : 'bg-info-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{insight.title}</p>
                      <p className="text-xs text-surface-600 mt-0.5">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResult?.testName}</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-surface-50 rounded-xl p-4">
                <div><span className="text-surface-500">رقم الطلب: </span><span className="font-medium">{selectedResult.orderNumber}</span></div>
                <div><span className="text-surface-500">التاريخ: </span><span className="font-medium">{formatDate(selectedResult.orderDate)}</span></div>
                <div><span className="text-surface-500">الطبيب: </span><span className="font-medium">{selectedResult.doctorName}</span></div>
                <div><span className="text-surface-500">الفرع: </span><span className="font-medium">{selectedResult.branchName}</span></div>
                <div><span className="text-surface-500">الحالة: </span>{statusBadge(selectedResult.status)}</div>
              </div>

              {selectedResult.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-surface-900 mb-2">نتائج الفحص</h4>
                  <div className="overflow-x-auto rounded-xl border border-surface-200">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-surface-500">المعيار</th>
                          <th className="px-4 py-2 text-center text-surface-500">القيمة</th>
                          <th className="px-4 py-2 text-right text-surface-500">الوحدة</th>
                          <th className="px-4 py-2 text-right text-surface-500">المدى المرجعي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.parameters.map((p, i) => (
                          <tr key={i} className="border-t border-surface-100">
                            <td className="px-4 py-2 font-medium">{p.name}</td>
                            <td className={cn('px-4 py-2 text-center font-semibold', p.flag === 'H' ? 'text-danger-600' : p.flag === 'L' ? 'text-warning-600' : '')}>
                              {p.value}
                            </td>
                            <td className="px-4 py-2 text-surface-500">{p.unit}</td>
                            <td className="px-4 py-2 text-surface-500 font-mono text-xs">{p.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {loadingAi ? (
                <div className="flex items-center justify-center py-6">
                  <LoadingSpinner />
                  <span className="mr-2 text-sm text-surface-500">جاري تحميل التحليل الذكي...</span>
                </div>
              ) : aiExplanation ? (
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <h4 className="text-sm font-semibold text-brand-900">تحليل بالذكاء الاصطناعي</h4>
                  </div>
                  <p className="text-sm text-brand-800">{aiExplanation.summary}</p>
                  {aiExplanation.findings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-brand-700 mb-1">النتائج:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {aiExplanation.findings.map((f, i) => <li key={i} className="text-xs text-brand-700">{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiExplanation.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-brand-700 mb-1">التوصيات:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {aiExplanation.recommendations.map((r, i) => <li key={i} className="text-xs text-brand-700">{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-surface-900 mb-2">المرفقات</h4>
                  <div className="flex gap-2 flex-wrap">
                    {attachments.map(att => (
                      <button key={att.id} onClick={() => { setSelectedAttachment(att); setShowAttachmentViewer(true); }}
                        className="flex items-center gap-2 rounded-lg border border-surface-200 p-2 hover:bg-surface-50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center">
                          {att.fileType.startsWith('image/') ? (
                            <img src={att.url} alt={att.fileName} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <svg className="h-5 w-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-surface-600 truncate max-w-24">{att.fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-surface-100">
                <Button variant="primary" size="sm" onClick={() => handleDownloadPdf(selectedResult.id)} disabled={generatingPdf === selectedResult.id}>
                  {generatingPdf === selectedResult.id ? <LoadingSpinner className="h-4 w-4" /> : (
                    <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  )}
                  تحميل PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
                  <svg className="h-4 w-4 ms-1" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                  مشاركة
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  resultsAdvancedApi.getQrCode(selectedResult.id).then(res => {
                    const url = res.data?.data?.qrCode;
                    if (url) window.open(url, '_blank');
                  }).catch(() => {});
                }}>
                  <svg className="h-4 w-4 ms-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  QR
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDetail(false); setAiExplanation(null); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>مشاركة التقرير</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {shareLink ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-success-50 border border-success-200 p-3">
                  <p className="text-sm font-medium text-success-800">تم إنشاء رابط المشاركة</p>
                </div>
                <div className="flex items-center gap-2">
                  <input readOnly value={`${window.location.origin}/shared/${shareLink.token}`} className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm bg-surface-50" />
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/shared/${shareLink.token}`);
                  }}>نسخ</Button>
                </div>
                {shareLink.password && <p className="text-xs text-surface-500">كلمة المرور: {shareLink.password}</p>}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">صلاحية الرابط (أيام)</label>
                    <select value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm">
                      <option value="1">يوم واحد</option>
                      <option value="3">3 أيام</option>
                      <option value="7">7 أيام</option>
                      <option value="30">30 يوم</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">كلمة مرور (اختياري)</label>
                    <input type="text" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="أدخل كلمة مرور" className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm" />
                  </div>
                </div>
                <Button variant="primary" className="w-full" onClick={handleCreateShareLink} disabled={creatingShare}>
                  {creatingShare ? <LoadingSpinner className="h-4 w-4" /> : null}
                  إنشاء رابط المشاركة
                </Button>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowShareModal(false); setShareLink(null); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttachmentViewer} onOpenChange={setShowAttachmentViewer}>
        {selectedAttachment && (
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedAttachment.fileName}</DialogTitle></DialogHeader>
          {selectedAttachment.fileType.startsWith('image/') ? (
            <img src={selectedAttachment.url} alt={selectedAttachment.fileName} className="w-full rounded-xl" />
          ) : (
            <div className="flex flex-col items-center py-12 gap-3">
              <svg className="h-16 w-16 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-surface-500">لا يمكن عرض هذا النوع من الملفات</p>
              <Button variant="outline" size="sm" onClick={() => window.open(selectedAttachment.url, '_blank')}>فتح الملف</Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttachmentViewer(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
