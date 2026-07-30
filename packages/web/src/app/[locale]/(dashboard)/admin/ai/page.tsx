'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { Button } from '@/design-system/primitives/Button';
import { Badge } from '@/design-system/primitives/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { LoadingSpinner } from '@/design-system/feedback/Alert';
import { formatNumber } from '@/lib/utils';
import { aiApi } from '@/lib/api/ai';

export default function AdminAIPage() {
  const { locale } = useParams();
  const isRtl = locale === 'ar';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, prov] = await Promise.all([
        aiApi.getDashboard(30),
        aiApi.getProviders(),
      ]);
      setDashboard(dash);
      setProviders(prov);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI analytics');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {isRtl ? 'إدارة المساعد الذكي' : 'AI Assistant Management'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isRtl ? 'تحليلات الأداء وإعدادات مزود الخدمة' : 'Performance analytics and provider settings'}
          </p>
        </div>
        <Badge className={providers?.active === 'OPENAI' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
          {providers?.active || 'N/A'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</TabsTrigger>
          <TabsTrigger value="providers">{isRtl ? 'مزودي الخدمة' : 'Providers'}</TabsTrigger>
          <TabsTrigger value="knowledge">{isRtl ? 'قاعدة المعرفة' : 'Knowledge Base'}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {dashboard && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'إجمالي المحادثات' : 'Total Conversations'}</div>
                    <div className="text-2xl font-bold text-gray-800">{formatNumber(dashboard.totalConversations)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'إجمالي الرسائل' : 'Total Messages'}</div>
                    <div className="text-2xl font-bold text-gray-800">{formatNumber(dashboard.totalMessages)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'المستخدمون الفريدون' : 'Unique Users'}</div>
                    <div className="text-2xl font-bold text-gray-800">{formatNumber(dashboard.uniqueUsers)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'متوسط زمن الاستجابة' : 'Avg Latency'}</div>
                    <div className="text-2xl font-bold text-gray-800">{dashboard.avgLatencyMs}ms</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'رموز الإدخال' : 'Input Tokens'}</div>
                    <div className="text-2xl font-bold text-gray-800">{formatNumber(dashboard.totalTokensIn)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'رموز الإخراج' : 'Output Tokens'}</div>
                    <div className="text-2xl font-bold text-gray-800">{formatNumber(dashboard.totalTokensOut)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'التكلفة التقديرية' : 'Est. Cost'}</div>
                    <div className="text-2xl font-bold text-gray-800">${dashboard.estimatedCost}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{isRtl ? 'معدل الرضا' : 'Satisfaction'}</div>
                    <div className="text-2xl font-bold text-green-600">{dashboard.satisfactionRate}%</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>{isRtl ? 'الاستفسارات الأكثر شيوعاً' : 'Top Queries'}</CardTitle></CardHeader>
                  <CardContent>
                    {dashboard.topQueries?.length > 0 ? (
                      <div className="space-y-2">
                        {dashboard.topQueries.slice(0, 8).map((q: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-700 truncate flex-1">{q.query}</span>
                            <Badge className="bg-blue-100 text-blue-700 ml-2">{q.count}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm py-4 text-center">{isRtl ? 'لا توجد بيانات' : 'No data'}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>{isRtl ? 'توزيع مزودي الخدمة' : 'Provider Breakdown'}</CardTitle></CardHeader>
                  <CardContent>
                    {dashboard.providerBreakdown?.length > 0 ? (
                      <div className="space-y-3">
                        {dashboard.providerBreakdown.map((p: any, i: number) => {
                          const total = dashboard.providerBreakdown.reduce((s: number, x: any) => s + x.count, 0);
                          const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{p.provider}</span>
                                <span className="text-gray-500">{p.count} ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm py-4 text-center">{isRtl ? 'لا توجد بيانات' : 'No data'}</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? 'مزودي خدمة الذكاء الاصطناعي' : 'AI Service Providers'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{isRtl ? 'المزود النشط حالياً' : 'Currently Active'}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {isRtl ? 'جميع الاستفسارات تُوجّه إلى هذا المزود' : 'All queries route to this provider'}
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1.5 bg-blue-100 text-blue-700">
                    {providers?.active}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {providers?.providers?.map((p: string) => {
                    const isActive = p === providers.active;
                    return (
                      <div key={p} className={`p-4 rounded-xl border-2 transition-all ${
                        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{p}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {isActive
                                ? (isRtl ? 'نشط حالياً' : 'Currently Active')
                                : (isRtl ? 'اضغط للتفعيل' : 'Click to activate')}
                            </div>
                          </div>
                          {isActive && (
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          )}
                        </div>
                        {!isActive && (
                          <button onClick={async () => {
                            await aiApi.switchProvider(p);
                            loadData();
                          }}
                            className="mt-3 w-full py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            {isRtl ? 'تفعيل' : 'Activate'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? 'قاعدة المعرفة الطبية' : 'Medical Knowledge Base'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <p className="text-sm">{isRtl ? 'سيتم إضافة إدارة قاعدة المعرفة قريباً' : 'Knowledge base management coming soon'}</p>
                <Button className="mt-4" variant="outline" onClick={() => window.open('/admin/knowledge-base', '_self')}>
                  {isRtl ? 'الذهاب إلى قاعدة المعرفة' : 'Go to Knowledge Base'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
