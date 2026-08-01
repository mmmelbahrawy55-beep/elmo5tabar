'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { Alert } from '@/design-system/feedback/Alert';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog, LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { cn, formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { resultsAdvancedApi } from '@/lib/api/results-advanced';
import { reportApi, orderApi } from '@/lib/api';

interface LabWorkItem {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId: string;
  testName: string;
  testCode: string;
  category: string;
  orderDate: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  priority: 'normal' | 'urgent';
  isCritical: boolean;
  hasAbnormal: boolean;
  parameters: { name: string; value: string; unit: string; reference: string; flag?: string; entered: boolean }[];
  barcode?: string;
  qrCode?: string;
  verificationToken?: string;
}

interface QcIndicator {
  id: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  timestamp: string;
}

type LabTab = 'queue' | 'draft' | 'review' | 'batch';

export default function LabResultsPage() {
  const { locale } = useParams();
  const isRtl = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LabTab>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  const [workItems, setWorkItems] = useState<LabWorkItem[]>([]);
  const [qcIndicators, setQcIndicators] = useState<QcIndicator[]>([]);
  const [stats, setStats] = useState({ todayEntries: 0, pendingReview: 0, turnaround: 0, totalToday: 0 });

  const [selectedItem, setSelectedItem] = useState<LabWorkItem | null>(null);
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [barcodeUrl, setBarcodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [bulkPdfLoading, setBulkPdfLoading] = useState(false);

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, qcRes] = await Promise.all([
        orderApi.list({ limit: 100, includeResults: true }).catch(() => ({ data: { data: [] } })),
        Promise.resolve([] as QcIndicator[]),
      ]);
      const rawItems = ordersRes.data?.data || [];
      const items: LabWorkItem[] = rawItems.map((r: any) => ({
        id: r.id,
        orderNumber: r.orderNumber || r.id,
        patientName: r.patientName || r.patient?.name || '',
        patientId: r.patientId || r.patient?.id || '',
        testName: r.testName || r.test?.nameAr || '',
        testCode: r.testCode || r.test?.code || '',
        category: r.category || r.test?.category || '',
        orderDate: r.orderDate || r.createdAt,
        status: r.status || 'draft',
        priority: r.priority || 'normal',
        isCritical: r.isCritical || false,
        hasAbnormal: r.hasAbnormal || false,
        parameters: (r.results || r.parameters || []).map((p: any) => ({
          name: p.name || p.parameter,
          value: p.value || '',
          unit: p.unit || '',
          reference: p.reference || '',
          flag: p.flag,
          entered: !!p.value,
        })),
        barcode: r.barcode,
        qrCode: r.qrCode,
        verificationToken: r.verificationToken,
      }));
      setWorkItems(items);
      setQcIndicators(qcRes);
      const today = new Date().toDateString();
      const todayItems = items.filter(i => new Date(i.orderDate).toDateString() === today);
      setStats({
        todayEntries: todayItems.filter(i => i.status === 'draft').length,
        pendingReview: items.filter(i => i.status === 'review').length,
        turnaround: 2.5,
        totalToday: todayItems.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveValues = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const params = selectedItem.parameters.map(p => ({
        name: p.name,
        value: editValues[p.name] || p.value,
        unit: p.unit,
      }));
      await reportApi.update(selectedItem.id, {
        parameters: params,
        status: 'review',
      });
      setWorkItems(prev => prev.map(w => w.id === selectedItem.id ? { ...w, parameters: w.parameters.map(p => ({ ...p, value: editValues[p.name] || p.value, entered: true })), status: 'review' } : w));
      setShowDataEntry(false);
      setSelectedItem(null);
      setStats(s => ({ ...s, todayEntries: s.todayEntries - 1, pendingReview: s.pendingReview + 1 }));
    } catch (err: any) {
      alert(err.message || 'فشل حفظ القيم');
    } finally { setIsProcessing(false); }
  };

  const handleBatchApprove = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(selectedIds.map(id => reportApi.update(id, { status: 'approved' })));
      setWorkItems(prev => prev.map(w => selectedIds.includes(w.id) ? { ...w, status: 'approved' } : w));
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || 'فشل اعتماد المجموعة');
    } finally { setIsProcessing(false); }
  };

  const handleBatchRelease = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(selectedIds.map(id => reportApi.update(id, { status: 'published' })));
      setWorkItems(prev => prev.map(w => selectedIds.includes(w.id) ? { ...w, status: 'published' } : w));
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || 'فشل نشر المجموعة');
    } finally { setIsProcessing(false); }
  };

  const handleGenerateQr = async (item: LabWorkItem) => {
    try {
      const res = await resultsAdvancedApi.getQrCode(item.id);
      setQrCodeUrl(res.data?.data?.qrCode || '');
      const tokenRes = await resultsAdvancedApi.createVerificationToken(item.id);
      setVerificationToken(tokenRes.data?.data?.token || '');
      setSelectedItem(item);
      setShowQrModal(true);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء QR');
    }
  };

  const handleGenerateBarcode = async (item: LabWorkItem) => {
    try {
      const res = await resultsAdvancedApi.getBarcode(item.id);
      setBarcodeUrl(res.data?.data?.barcode || '');
      setSelectedItem(item);
      setShowBarcodeModal(true);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الباركود');
    }
  };

  const handleUpload = async () => {
    if (!selectedItem || !uploadFile) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await resultsAdvancedApi.uploadAttachment(selectedItem.id, formData);
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err: any) {
      alert(err.message || 'فشل رفع المرفق');
    } finally { setIsProcessing(false); }
  };

  const handleGeneratePdf = async (id: string) => {
    try {
      const res = await resultsAdvancedApi.generatePdf(id);
      const url = res.data?.data?.url;
      if (url) window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء PDF');
    }
  };

  const handleBulkPdf = async () => {
    setBulkPdfLoading(true);
    try {
      await Promise.all(selectedIds.map(id => resultsAdvancedApi.generatePdf(id)));
      alert('تم إنشاء ملفات PDF');
    } catch {
      alert('فشل إنشاء ملفات PDF');
    } finally { setBulkPdfLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredItems();
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(w => w.id));
  };

  const getFilteredItems = () => {
    const statusMap: Record<LabTab, string[]> = {
      queue: ['draft'],
      draft: ['draft'],
      review: ['review'],
      batch: ['draft', 'review', 'approved'],
    };
    const statuses = statusMap[activeTab];
    return workItems.filter(w => {
      if (!statuses.includes(w.status)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return w.patientName.includes(q) || w.orderNumber.includes(q) || w.testName.includes(q);
      }
      return true;
    });
  };

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
      <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-surface-100 rounded-xl" />)}</div>
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

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">لوحة المختبر</h1>
          <p className="mt-1 text-sm text-surface-500">إدخال ومراجعة نتائج التحاليل المخبرية</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkPdf} disabled={bulkPdfLoading}>
                {bulkPdfLoading ? <LoadingSpinner className="h-4 w-4" /> : null}
                PDF للكل
              </Button>
              <Button variant="success" size="sm" onClick={handleBatchApprove} disabled={isProcessing}>
                اعتماد ({selectedIds.length})
              </Button>
              <Button variant="primary" size="sm" onClick={handleBatchRelease} disabled={isProcessing}>
                نشر ({selectedIds.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {qcIndicators.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {qcIndicators.map(qc => (
            <div key={qc.id} className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
              qc.status === 'pass' ? 'bg-success-50 text-success-700' :
              qc.status === 'fail' ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', qc.status === 'pass' ? 'bg-success-500' : qc.status === 'fail' ? 'bg-danger-500' : 'bg-warning-500')} />
              {qc.testName}: {qc.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="مدخلات اليوم" value={formatNumber(stats.todayEntries)} icon={
          <svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
        } iconBg="bg-brand-50" />
        <StatCard title="قيد المراجعة" value={formatNumber(stats.pendingReview)} icon={
          <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
        } iconBg="bg-warning-50" />
        <StatCard title="وقت المعالجة" value={`${stats.turnaround} س`} icon={
          <svg className="h-5 w-5 text-info-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
        } iconBg="bg-info-50" />
        <StatCard title="إجمالي اليوم" value={formatNumber(stats.totalToday)} icon={
          <svg className="h-5 w-5 text-success-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
        } iconBg="bg-success-50" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LabTab)}>
          <TabsList>
            <TabsTrigger value="queue">قائمة العمل ({workItems.filter(w => w.status === 'draft').length})</TabsTrigger>
            <TabsTrigger value="draft">مسودات ({workItems.filter(w => w.status === 'draft').length})</TabsTrigger>
            <TabsTrigger value="review">مراجعة ({workItems.filter(w => w.status === 'review').length})</TabsTrigger>
            <TabsTrigger value="batch">عمليات جماعية</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput placeholder="بحث..." value={searchQuery} onChange={(v) => setSearchQuery(v)} className="w-56" />
      </div>

      {['queue', 'draft', 'review', 'batch'].map(tab => (
        <TabsContent key={tab} value={tab}>
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <svg className="h-12 w-12 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-3 text-sm text-surface-500">لا توجد عناصر</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tab === 'batch' && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} onChange={toggleSelectAll} className="rounded border-surface-300" />
                      <span className="text-sm text-surface-600">تحديد الكل ({filteredItems.length})</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {filteredItems.map(item => (
                <Card key={item.id} className={cn(item.priority === 'urgent' ? 'border-r-4 border-r-danger-500' : '')}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {(tab === 'batch') && (
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded border-surface-300" />
                      )}
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        item.isCritical ? 'bg-danger-50 text-danger-600' :
                        item.hasAbnormal ? 'bg-warning-50 text-warning-600' :
                        'bg-surface-100 text-surface-500'
                      )}>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{item.patientName}</p>
                        <p className="text-xs text-surface-500">{item.testName} — {item.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.isCritical && <Badge variant="danger">حرج</Badge>}
                      {item.hasAbnormal && <Badge variant="warning">شاذ</Badge>}
                      <div className="hidden sm:block text-xs text-surface-400">{formatDate(item.orderDate, 'short')}</div>
                      {statusBadge(item.status)}
                      {tab !== 'batch' && (
                        <div className="flex gap-1">
                          {(item.status === 'draft') && (
                            <Button variant="primary" size="sm" className="h-8" onClick={() => {
                              setSelectedItem(item);
                              setEditValues(Object.fromEntries(item.parameters.filter(p => p.name).map(p => [p.name, p.value])));
                              setShowDataEntry(true);
                            }}>
                              إدخال
                            </Button>
                          )}
                          {item.status === 'review' && (
                            <Button variant="success" size="sm" className="h-8" onClick={async () => {
                              try { await reportApi.update(item.id, { status: 'approved' }); setWorkItems(prev => prev.map(w => w.id === item.id ? { ...w, status: 'approved' } : w)); } catch {}
                            }}>
                              اعتماد
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => handleGenerateQr(item)}>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => handleGenerateBarcode(item)}>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h2v14H4V5zm6 0h1v14h-1V5zm6 0h3v14h-3V5zM2 5h1v14H2V5zm16 0h1v14h-1V5z" /></svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => { setSelectedItem(item); setShowUploadModal(true); }}>
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => handleGeneratePdf(item.id)}>
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {item.parameters.filter(p => p.entered).length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {item.parameters.filter(p => p.entered).map((p, i) => (
                        <span key={i} className={cn(
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          p.flag === 'H' ? 'bg-danger-50 text-danger-600' :
                          p.flag === 'L' ? 'bg-warning-50 text-warning-600' :
                          'bg-success-50 text-success-600'
                        )}>
                          {p.name}: {p.value} {p.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      ))}

      <Dialog open={showDataEntry} onOpenChange={setShowDataEntry}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>إدخال نتائج {selectedItem?.testName}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="text-sm bg-surface-50 rounded-xl p-3">
                <p className="font-medium text-surface-900">{selectedItem.patientName}</p>
                <p className="text-xs text-surface-500">{selectedItem.orderNumber} — {formatDate(selectedItem.orderDate)}</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedItem.parameters.map(p => (
                  <FormField key={p.name} label={p.name} description={`الوحدة: ${p.unit} | المدى: ${p.reference}`}>
                    <input
                      type="text"
                      value={editValues[p.name] || ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                      className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm font-mono"
                      placeholder="أدخل القيمة"
                    />
                  </FormField>
                ))}
              </div>
              {selectedItem.parameters.some(p => {
                const val = parseFloat(editValues[p.name]);
                return !isNaN(val) && p.reference && val > parseFloat(p.reference.split('-')[1]);
              }) && (
                <Alert variant="danger" title="تنبيه: قيم خارج النطاق">
                  بعض القيم المدخلة خارج النطاق المرجعي
                </Alert>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDataEntry(false); setSelectedItem(null); }}>إلغاء</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSaveValues} disabled={isProcessing}>
                    {isProcessing ? <LoadingSpinner className="h-4 w-4" /> : null}
                    حفظ كمسودة
                  </Button>
                  <Button variant="success" onClick={handleSaveValues} disabled={isProcessing}>
                    حفظ وإرسال للمراجعة
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>رمز QR</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-4 gap-3">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400">جارٍ الإنشاء...</div>
            )}
            {verificationToken && (
              <p className="text-xs text-surface-500 font-mono">رمز التحقق: {verificationToken}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowQrModal(false); setQrCodeUrl(''); setVerificationToken(''); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBarcodeModal} onOpenChange={setShowBarcodeModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>الباركود</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-4 gap-3">
            {barcodeUrl ? (
              <img src={barcodeUrl} alt="Barcode" className="w-full h-24 rounded-xl" />
            ) : (
              <div className="w-full h-24 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400">جارٍ الإنشاء...</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBarcodeModal(false); setBarcodeUrl(''); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>رفع مرفق</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-500 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
              <svg className="h-10 w-10 mx-auto text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-surface-500">اختر ملفاً للرفع</p>
              <input id="file-upload" type="file" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            {uploadFile && (
              <div className="flex items-center gap-2 rounded-lg bg-surface-50 p-2 text-sm">
                <svg className="h-5 w-5 text-surface-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                <span className="text-surface-700">{uploadFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>إلغاء</Button>
            <Button variant="primary" onClick={handleUpload} disabled={!uploadFile || isProcessing}>
              {isProcessing ? <LoadingSpinner className="h-4 w-4" /> : null}
              رفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
