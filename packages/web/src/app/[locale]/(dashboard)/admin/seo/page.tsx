'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { ProgressBar } from '@/design-system/feedback/Progress';
import ExportButton from '@/components/admin/ExportButton';

interface PageAnalysis {
  url: string;
  title: string;
  score: number;
  issues: number;
  traffic: number;
  lastCrawl: string;
  status: 'جيد' | 'يحتاج تحسين' | 'سيء';
}

interface Keyword {
  keyword: string;
  position: number;
  previousPosition: number;
  volume: number;
  difficulty: number;
  traffic: number;
  url: string;
}

interface Backlink {
  source: string;
  domain: string;
  anchor: string;
  type: 'داخلي' | 'خارجي';
  authority: number;
  status: 'نشط' | 'مفقود';
  discoveredDate: string;
}

interface AuditCheck {
  category: string;
  check: string;
  status: 'نجح' | 'فشل' | 'تحذير';
  impact: 'عالي' | 'متوسط' | 'منخفض';
}

const mockPages: PageAnalysis[] = [
  { url: '/home', title: 'الرئيسية - صحتك أولاً', score: 92, issues: 1, traffic: 15200, lastCrawl: '2024-06-28', status: 'جيد' },
  { url: '/services/laboratory', title: 'خدمات المختبر - صحتك أولاً', score: 85, issues: 2, traffic: 8900, lastCrawl: '2024-06-27', status: 'جيد' },
  { url: '/services/insurance', title: 'التأمين الصحي - صحتك أولاً', score: 78, issues: 4, traffic: 6700, lastCrawl: '2024-06-26', status: 'يحتاج تحسين' },
  { url: '/about', title: 'من نحن - صحتك أولاً', score: 88, issues: 1, traffic: 4500, lastCrawl: '2024-06-28', status: 'جيد' },
  { url: '/blog/health-tips', title: 'نصائح صحية - المدونة', score: 72, issues: 6, traffic: 3200, lastCrawl: '2024-06-25', status: 'يحتاج تحسين' },
  { url: '/contact', title: 'تواصل معنا - صحتك أولاً', score: 90, issues: 0, traffic: 2800, lastCrawl: '2024-06-28', status: 'جيد' },
  { url: '/packages', title: 'الباقات - صحتك أولاً', score: 65, issues: 8, traffic: 2100, lastCrawl: '2024-06-20', status: 'سيء' },
  { url: '/faq', title: 'الأسئلة الشائعة - صحتك أولاً', score: 82, issues: 3, traffic: 1900, lastCrawl: '2024-06-27', status: 'يحتاج تحسين' },
];

const mockKeywords: Keyword[] = [
  { keyword: 'تحاليل طبية', position: 1, previousPosition: 3, volume: 12000, difficulty: 65, traffic: 4800, url: '/services/laboratory' },
  { keyword: 'تأمين صحي', position: 3, previousPosition: 5, volume: 9500, difficulty: 72, traffic: 2850, url: '/services/insurance' },
  { keyword: 'فحوصات طبية', position: 2, previousPosition: 2, volume: 8200, difficulty: 58, traffic: 3280, url: '/services/laboratory' },
  { keyword: 'مختبر طبي', position: 5, previousPosition: 8, volume: 7800, difficulty: 55, traffic: 1560, url: '/services/laboratory' },
  { keyword: 'صحة عامة', position: 4, previousPosition: 6, volume: 6500, difficulty: 48, traffic: 1950, url: '/blog/health-tips' },
  { keyword: 'باقات صحية', position: 8, previousPosition: 12, volume: 5200, difficulty: 42, traffic: 624, url: '/packages' },
  { keyword: 'تحليل سكر', position: 1, previousPosition: 1, volume: 4800, difficulty: 35, traffic: 2400, url: '/services/laboratory' },
  { keyword: 'فيتامين د', position: 6, previousPosition: 9, volume: 4200, difficulty: 38, traffic: 504, url: '/blog/health-tips' },
  { keyword: 'كشف طبي شامل', position: 2, previousPosition: 4, volume: 3800, difficulty: 52, traffic: 1520, url: '/packages' },
  { keyword: 'تأمين طبي', position: 7, previousPosition: 10, volume: 3500, difficulty: 68, traffic: 455, url: '/services/insurance' },
  { keyword: 'نتائج تحاليل', position: 1, previousPosition: 2, volume: 3200, difficulty: 30, traffic: 1600, url: '/services/laboratory' },
  { keyword: 'أفضل مختبر', position: 3, previousPosition: 7, volume: 2800, difficulty: 45, traffic: 840, url: '/services/laboratory' },
];

const mockBacklinks: Backlink[] = [
  { source: 'الجزيرة نت', domain: 'aljazeera.net', anchor: 'خدمات صحية موثوقة', type: 'خارجي', authority: 85, status: 'نشط', discoveredDate: '2024-05-15' },
  { source: 'صحيفة عكاظ', domain: 'okaz.com.sa', anchor: 'تحاليل طبية', type: 'خارجي', authority: 78, status: 'نشط', discoveredDate: '2024-04-20' },
  { source: 'موقع وزارة الصحة', domain: 'moh.gov.sa', anchor: 'مختبر معتمد', type: 'خارجي', authority: 92, status: 'نشط', discoveredDate: '2024-03-10' },
  { source: 'تويتر', domain: 'twitter.com', anchor: 'صحتك أولاً', type: 'خارجي', authority: 95, status: 'نشط', discoveredDate: '2024-06-01' },
  { source: 'المدونة الداخلية', domain: 'sahatko.sa', anchor: 'نصائح صحية', type: 'داخلي', authority: 0, status: 'نشط', discoveredDate: '2024-06-15' },
  { source: 'لينكد إن', domain: 'linkedin.com', anchor: 'شركة صحتك أولاً', type: 'خارجي', authority: 98, status: 'نشط', discoveredDate: '2024-02-28' },
  { source: 'مواقع طبية', domain: 'medicalsites.com', anchor: 'تحاليل موثوقة', type: 'خارجي', authority: 62, status: 'مفقود', discoveredDate: '2024-01-15' },
];

const mockAuditChecks: AuditCheck[] = [
  { category: 'الفني', check: 'سرعة تحميل الصفحة', status: 'نجح', impact: 'عالي' },
  { category: 'الفني', check: 'التوافق مع الجوال', status: 'نجح', impact: 'عالي' },
  { category: 'الفني', check: 'شهادة SSL', status: 'نجح', impact: 'عالي' },
  { category: 'الفني', check: 'خريطة الموقع XML', status: 'نجح', impact: 'متوسط' },
  { category: 'الفني', check: 'ملف robots.txt', status: 'نجح', impact: 'متوسط' },
  { category: 'المحتوى', check: 'وصف Meta لكل صفحة', status: 'فشل', impact: 'عالي' },
  { category: 'المحتوى', check: 'عناوين H1 فريدة', status: 'فشل', impact: 'عالي' },
  { category: 'المحتوى', check: 'النصوص البديلة للصور', status: 'تحذير', impact: 'متوسط' },
  { category: 'المحتوى', check: 'طول المحتوى المقبول', status: 'نجح', impact: 'متوسط' },
  { category: 'الروابط', check: 'الروابط المكسورة', status: 'فشل', impact: 'عالي' },
  { category: 'الروابط', check: 'الروابط الداخلية', status: 'نجح', impact: 'متوسط' },
  { category: 'الروابط', check: 'نسبة الروابط الخارجية', status: 'نجح', impact: 'منخفض' },
  { category: 'التجربة', check: 'Core Web Vitals', status: 'تحذير', impact: 'عالي' },
  { category: 'التجربة', check: 'الهيكل HTML', status: 'نجح', impact: 'متوسط' },
  { category: 'التجربة', check: 'البيانات المنسقة', status: 'تحذير', impact: 'منخفض' },
];

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditResults] = useState(mockAuditChecks);

  const stats = {
    overallScore: 78,
    optimizedPages: 45,
    criticalIssues: 3,
    firstPageKeywords: 12,
  };

  const totalChecks = auditResults.length;
  const passedChecks = auditResults.filter(c => c.status === 'نجح').length;
  const failedChecks = auditResults.filter(c => c.status === 'فشل').length;
  const warningChecks = auditResults.filter(c => c.status === 'تحذير').length;

  const filteredPages = mockPages.filter(p =>
    p.title.includes(searchQuery) || p.url.includes(searchQuery)
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تحسين محركات البحث</h1>
          <p className="text-muted-foreground mt-1">مراقبة وتحسين أداء SEO للموقع</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button>تشغيل فحص جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="درجة SEO الكلية" value={`${stats.overallScore}/100`} icon="📊" />
        <StatCard title="صفحات مُحسّنة" value={stats.optimizedPages} icon="📄" />
        <StatCard title="مشاكل حرجة" value={stats.criticalIssues} icon="⚠️" />
        <StatCard title="كلمات في الصفحة الأولى" value={stats.firstPageKeywords} icon="🏆" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="pages">الصفحات</TabsTrigger>
          <TabsTrigger value="keywords">الكلمات المفتاحية</TabsTrigger>
          <TabsTrigger value="backlinks">الروابط</TabsTrigger>
          <TabsTrigger value="audit">الفحص</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>درجة SEO العامة</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10"
                      strokeDasharray={`${(stats.overallScore / 100) * 314} 314`}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-primary">{stats.overallScore}</span>
                    <span className="text-sm text-muted-foreground">من 100</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 w-full">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{passedChecks}</p>
                    <p className="text-xs text-muted-foreground">نجح</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{failedChecks}</p>
                    <p className="text-xs text-muted-foreground">فشل</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{warningChecks}</p>
                    <p className="text-xs text-muted-foreground">تحذير</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أهم المشاكل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditResults.filter(c => c.status === 'فشل').map((check, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
                      <span className="text-red-500 text-xl">✗</span>
                      <div className="flex-1">
                        <div className="font-medium">{check.check}</div>
                        <div className="text-xs text-muted-foreground">{check.category}</div>
                      </div>
                      <Badge variant={check.impact === 'عالي' ? 'destructive' : 'secondary'}>
                        {check.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أعلى الكلمات أداءً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockKeywords.slice(0, 5).map((kw, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground w-8">#{kw.position}</span>
                      <div className="flex-1">
                        <div className="font-medium">{kw.keyword}</div>
                        <div className="text-xs text-muted-foreground">{kw.volume.toLocaleString('ar-SA')} بحث/شهر</div>
                      </div>
                      <div className="text-left">
                        <span className={cn('text-sm font-bold', kw.position < kw.previousPosition ? 'text-green-500' : kw.position > kw.previousPosition ? 'text-red-500' : 'text-muted-foreground')}>
                          {kw.position < kw.previousPosition ? '↑' : kw.position > kw.previousPosition ? '↓' : '—'}
                          {kw.position !== kw.previousPosition && ` ${Math.abs(kw.position - kw.previousPosition)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الروابط الخلفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-2xl font-bold">{mockBacklinks.filter(b => b.status === 'نشط').length}</p>
                      <p className="text-xs text-muted-foreground">روابط نشطة</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-2xl font-bold">{mockBacklinks.filter(b => b.status === 'مفقود').length}</p>
                      <p className="text-xs text-muted-foreground">روابط مفقودة</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {mockBacklinks.filter(b => b.status === 'نشط').slice(0, 4).map((bl, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{bl.source}</div>
                          <div className="text-xs text-muted-foreground">{bl.anchor}</div>
                        </div>
                        <Badge variant="outline">DA {bl.authority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الصفحات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <SearchInput
                  placeholder="بحث في الصفحات..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="max-w-md"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الرابط</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العنوان</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الدرجة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المشاكل</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الزيارات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">آخر فحص</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page.url} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">{page.url}</td>
                        <td className="py-3 px-4 font-medium max-w-xs truncate">{page.title}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={page.score}
                              className="w-16"
                            />
                            <span className={cn('font-bold', page.score >= 80 ? 'text-green-500' : page.score >= 60 ? 'text-yellow-500' : 'text-red-500')}>
                              {page.score}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={page.issues > 5 ? 'destructive' : page.issues > 2 ? 'warning' : 'secondary'}>
                            {page.issues}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{page.traffic.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(new Date(page.lastCrawl))}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            page.status === 'جيد' ? 'success' :
                            page.status === 'يحتاج تحسين' ? 'warning' : 'destructive'
                          }>
                            {page.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">تحسين</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>الكلمات المفتاحية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <SearchInput
                  placeholder="بحث في الكلمات المفتاحية..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="max-w-md"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكلمة المفتاحية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المركز</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">حجم البحث</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الصعوبة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الزيارات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الصفحة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockKeywords.filter(kw =>
                      kw.keyword.includes(searchQuery)
                    ).map((kw, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{kw.keyword}</td>
                        <td className="py-3 px-4">
                          <span className={cn('text-lg font-bold', kw.position <= 3 ? 'text-green-500' : kw.position <= 10 ? 'text-yellow-500' : 'text-muted-foreground')}>
                            #{kw.position}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('font-medium', kw.position < kw.previousPosition ? 'text-green-500' : kw.position > kw.previousPosition ? 'text-red-500' : 'text-muted-foreground')}>
                            {kw.position < kw.previousPosition ? '↑' : kw.position > kw.previousPosition ? '↓' : '—'}
                            {kw.position !== kw.previousPosition && ` ${Math.abs(kw.position - kw.previousPosition)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">{kw.volume.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={kw.difficulty} className="w-16" />
                            <span className="text-xs">{kw.difficulty}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{kw.traffic.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4 text-xs font-mono">{kw.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlinks">
          <Card>
            <CardHeader>
              <CardTitle>الروابط الخلفية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المصدر</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النطاق</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النص الرابط</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الصلاحية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">تاريخ الاكتشاف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBacklinks.map((bl, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{bl.source}</td>
                        <td className="py-3 px-4 font-mono text-xs">{bl.domain}</td>
                        <td className="py-3 px-4">{bl.anchor}</td>
                        <td className="py-3 px-4">
                          <Badge variant={bl.type === 'داخلي' ? 'secondary' : 'outline'}>{bl.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={bl.authority >= 80 ? 'success' : bl.authority >= 60 ? 'warning' : 'secondary'}>
                            DA {bl.authority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={bl.status === 'نشط' ? 'success' : 'destructive'}>{bl.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(new Date(bl.discoveredDate))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>فحص الموقع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <p className="text-3xl font-bold text-green-500">{passedChecks}</p>
                  <p className="text-sm text-muted-foreground">نجح</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                  <p className="text-3xl font-bold text-red-500">{failedChecks}</p>
                  <p className="text-sm text-muted-foreground">فشل</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                  <p className="text-3xl font-bold text-yellow-500">{warningChecks}</p>
                  <p className="text-sm text-muted-foreground">تحذير</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-3xl font-bold">{totalChecks}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الفحوصات</p>
                </div>
              </div>

              <div className="space-y-6">
                {['الفني', 'المحتوى', 'الروابط', 'التجربة'].map((category) => (
                  <div key={category}>
                    <h3 className="font-bold text-lg mb-3">{category}</h3>
                    <div className="space-y-2">
                      {auditResults.filter(c => c.category === category).map((check, idx) => (
                        <div key={idx} className={cn(
                          'flex items-center gap-3 p-3 rounded-lg',
                          check.status === 'نجح' && 'bg-green-500/5',
                          check.status === 'فشل' && 'bg-red-500/5',
                          check.status === 'تحذير' && 'bg-yellow-500/5',
                        )}>
                          <span className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                            check.status === 'نجح' && 'bg-green-500 text-white',
                            check.status === 'فشل' && 'bg-red-500 text-white',
                            check.status === 'تحذير' && 'bg-yellow-500 text-white',
                          )}>
                            {check.status === 'نجح' ? '✓' : check.status === 'فشل' ? '✗' : '!'}
                          </span>
                          <div className="flex-1">
                            <span className="font-medium">{check.check}</span>
                          </div>
                          <Badge variant={
                            check.impact === 'عالي' ? 'destructive' :
                            check.impact === 'متوسط' ? 'warning' : 'secondary'
                          }>
                            {check.impact}
                          </Badge>
                          <Badge variant={
                            check.status === 'نجح' ? 'success' :
                            check.status === 'فشل' ? 'destructive' : 'warning'
                          }>
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
