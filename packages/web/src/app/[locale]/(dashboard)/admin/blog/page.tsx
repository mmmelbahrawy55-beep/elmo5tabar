'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import ExportButton from '@/components/admin/ExportButton';

type PostStatus = 'منشور' | 'مسودة' | 'في المراجعة' | 'مجدول';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  status: PostStatus;
  views: number;
  publishDate: string;
  excerpt: string;
  tags: string[];
  shares: number;
  comments: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
  description: string;
}

interface BlogComment {
  id: string;
  author: string;
  email: string;
  content: string;
  postTitle: string;
  date: string;
  status: 'قيد المراجعة' | 'موافق عليه' | 'سبام';
}

const mockPosts: BlogPost[] = [
  { id: '1', title: 'أهمية الفحوصات الطبية الدورية', slug: 'importance-of-regular-checkups', author: 'د. أحمد العلي', category: 'نصائح صحية', status: 'منشور', views: 12500, publishDate: '2024-06-25', excerpt: 'تعد الفحوصات الطبية الدورية من أهم العوامل التي تساعد في اكتشاف الأمراض مبكراً', tags: ['صحة', 'فحوصات', 'وقاية'], shares: 345, comments: 28 },
  { id: '2', title: 'كيفية اختيار التأمين الصحي المناسب', slug: 'choosing-right-health-insurance', author: 'سارة الحربي', category: 'تأمين', status: 'منشور', views: 9800, publishDate: '2024-06-22', excerpt: 'يعتبر اختيار التأمين الصحي المناسب قراراً مهماً يتطلب معرفة احتياجاتك', tags: ['تأمين', 'نصائح', 'مالية'], shares: 210, comments: 15 },
  { id: '3', title: 'التحاليل الطبية الشائعة ومعناها', slug: 'common-medical-tests', author: 'د. محمد خالد', category: 'معلومات طبية', status: 'منشور', views: 8700, publishDate: '2024-06-20', excerpt: 'تعرف على أهم التحاليل الطبية الشائعة وما الذي تكشف عنه نتائجها', tags: ['تحاليل', 'معلومات', 'طبية'], shares: 180, comments: 22 },
  { id: '4', title: 'نصائح للحفاظ على صحة القلب', slug: 'heart-health-tips', author: 'د. فهد العتيبي', category: 'نصائح صحية', status: 'منشور', views: 7600, publishDate: '2024-06-18', excerpt: 'القلب هو العضو الأهم في الجسم، إليك نصائح للحفاظ على صحته', tags: ['قلب', 'صحة', 'نصائح'], shares: 290, comments: 32 },
  { id: '5', title: 'الفروقات بين التأمين الطبي والتأمين الصحي', slug: 'medical-vs-health-insurance', author: 'ليلى الشمري', category: 'تأمين', status: 'في المراجعة', views: 0, publishDate: '2024-07-01', excerpt: 'كثير من الناس يخلط بين التأمين الطبي والتأمين الصحي، إليك الفروقات', tags: ['تأمين', 'معلومات'], shares: 0, comments: 0 },
  { id: '6', title: 'تحليل فيتامين د: لماذا هو مهم؟', slug: 'vitamin-d-test', author: 'د. أحمد العلي', category: 'معلومات طبية', status: 'منشور', views: 6500, publishDate: '2024-06-15', excerpt: 'يعد نقص فيتامين د من أكثر المشاكل الصحية شيوعاً في المملكة', tags: ['فيتامينات', 'تحاليل', 'صحة'], shares: 150, comments: 18 },
  { id: '7', title: 'دليل المريض الشامل للفحوصات', slug: 'patient-guide-checkups', author: 'سارة الحربي', category: 'أدلة', status: 'مسودة', views: 0, publishDate: '2024-07-05', excerpt: 'دليل شامل يتضمن جميع المعلومات التي تحتاجها قبل إجراء الفحوصات', tags: ['دليل', 'فحوصات'], shares: 0, comments: 0 },
  { id: '8', title: 'كيفية قراءة نتائج التحاليل الطبية', slug: 'reading-lab-results', author: 'د. محمد خالد', category: 'معلومات طبية', status: 'منشور', views: 11200, publishDate: '2024-06-10', excerpt: 'فهم نتائج التحاليل الطبية قد يكون صعباً، إليك دليل مبسط', tags: ['تحاليل', 'نتائج', 'معلومات'], shares: 275, comments: 25 },
  { id: '9', title: 'الوقاية من أمراض الصيف', slug: 'summer-disease-prevention', author: 'د. فهد العتيبي', category: 'نصائح صحية', status: 'مسودة', views: 0, publishDate: '2024-07-10', excerpt: 'مع ارتفاع درجات الحرارة يزداد خطر الإصابة بالعديد من الأمراض', tags: ['صيف', 'وقاية', 'صحة'], shares: 0, comments: 0 },
  { id: '10', title: 'أفضل Practices للحصول على نتائج دقيقة', slug: 'accurate-test-results', author: 'د. أحمد العلي', category: 'معلومات طبية', status: 'منشور', views: 5400, publishDate: '2024-06-05', excerpt: 'هل تعلم أن بعض العادات اليومية قد تؤثر على نتائج التحاليل؟', tags: ['تحاليل', 'نصائح', 'دقة'], shares: 120, comments: 12 },
];

const mockCategories: Category[] = [
  { id: '1', name: 'نصائح صحية', slug: 'health-tips', postsCount: 45, description: 'نصائح ومقالات مفيدة للحفاظ على الصحة' },
  { id: '2', name: 'معلومات طبية', slug: 'medical-info', postsCount: 38, description: 'معلومات علمية موثوقة عن الأمراض والتحاليل' },
  { id: '3', name: 'تأمين', slug: 'insurance', postsCount: 28, description: 'مقالات عن التأمين الصحي والطبي' },
  { id: '4', name: 'أدلة', slug: 'guides', postsCount: 15, description: 'أدلة شاملة للمرضى والمستخدمين' },
  { id: '5', name: 'أخبار', slug: 'news', postsCount: 20, description: 'آخر أخبار الشركة والخدمات' },
  { id: '6', name: 'uccess stories', slug: 'stories', postsCount: 10, description: 'قصص نجاح عملائنا' },
];

const mockComments: BlogComment[] = [
  { id: '1', author: 'خالد العنزي', email: 'khaled@email.com', content: 'مقال مفيد جداً، شكراً لكم على هذه المعلومات القيمة', postTitle: 'أهمية الفحوصات الطبية الدورية', date: '2024-06-28', status: 'قيد المراجعة' },
  { id: '2', author: 'نورة الشمري', email: 'noura@email.com', content: 'هل يمكن معرفة تكلفة التحاليل المذكورة في المقال؟', postTitle: 'التحاليل الطبية الشائعة ومعناها', date: '2024-06-27', status: 'قيد المراجعة' },
  { id: '3', author: 'عبدالله السبيعي', email: 'abdullah@email.com', content: 'محتوى رائع، أتمنى التوسع في موضوع التأمين', postTitle: 'كيفية اختيار التأمين الصحي المناسب', date: '2024-06-26', status: 'موافق عليه' },
  { id: '4', author: 'محمد الحارثي', email: 'mohammed@email.com', content: ' spam content here', postTitle: 'نصائح للحفاظ على صحة القلب', date: '2024-06-25', status: 'سبام' },
  { id: '5', author: 'ريم العتيبي', email: 'reem@email.com', content: 'شكراً على هذا الدليل الشامل، استفدت منه كثيراً', postTitle: 'كيفية قراءة نتائج التحاليل الطبية', date: '2024-06-24', status: 'موافق عليه' },
  { id: '6', author: 'فاطمة الزهراني', email: 'fatima@email.com', content: 'هل تتوفر هذه الخدمات في فرع جدة؟', postTitle: 'أهمية الفحوصات الطبية الدورية', date: '2024-06-23', status: 'قيد المراجعة' },
  { id: '7', author: 'سعود المطيري', email: 'saud@email.com', content: 'مقال ممتاز ومفيد للجميع', postTitle: 'تحليل فيتامين د: لماذا هو مهم؟', date: '2024-06-22', status: 'موافق عليه' },
];

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const stats = {
    totalPosts: 156,
    published: 128,
    drafts: 18,
    totalViews: 234000,
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'منشور': return 'success';
      case 'مسودة': return 'secondary';
      case 'في المراجعة': return 'warning';
      case 'مجدول': return 'info';
      default: return 'default';
    }
  };

  const getCommentStatusColor = (status: string) => {
    switch (status) {
      case 'موافق عليه': return 'success';
      case 'قيد المراجعة': return 'warning';
      case 'سبام': return 'destructive';
      default: return 'default';
    }
  };

  const filteredPosts = mockPosts.filter(p => {
    const matchesSearch = p.title.includes(searchQuery) || p.author.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const topPosts = [...mockPosts].sort((a, b) => b.views - a.views).slice(0, 5);
  const totalShares = mockPosts.reduce((acc, p) => acc + p.shares, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المدونة</h1>
          <p className="text-muted-foreground mt-1">إدارة مقالات المدونة والفئات والتعليقات</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button onClick={() => setShowCreateDialog(true)}>مقال جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المقالات" value={stats.totalPosts} icon="📝" />
        <StatCard title="منشورة" value={stats.published} icon="✅" />
        <StatCard title="مسودات" value={stats.drafts} icon="📋" />
        <StatCard title="إجمالي المشاهدات" value={`${(stats.totalViews / 1000).toFixed(0)}K`} icon="👁️" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">المقالات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="comments">التعليقات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>مقالات المدونة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchInput
                  placeholder="بحث في المقالات..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="flex-1"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background text-foreground"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="منشور">منشور</option>
                  <option value="مسودة">مسودة</option>
                  <option value="في المراجعة">في المراجعة</option>
                  <option value="مجدول">مجدول</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background text-foreground"
                >
                  <option value="all">جميع الفئات</option>
                  {mockCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العنوان</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكاتب</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الفئة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المشاهدات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المشاركات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التعليقات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">تاريخ النشر</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{post.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">/{post.slug}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{post.author}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{post.category}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(post.status)}>{post.status}</Badge>
                        </td>
                        <td className="py-3 px-4">{post.views.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4">{post.shares}</td>
                        <td className="py-3 px-4">{post.comments}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {formatDate(new Date(post.publishDate))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>فئات المدونة</CardTitle>
                <Button>إضافة فئة</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <Badge variant="outline">{category.postsCount} مقال</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      <div className="text-xs text-muted-foreground mb-4 font-mono">/{category.slug}</div>
                      <div className="flex justify-between items-center">
                        <ProgressBar value={(category.postsCount / 50) * 100} className="w-24" />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">تعديل</Button>
                          <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>إدارة التعليقات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div key={comment.id} className={cn(
                    'p-4 rounded-lg border',
                    comment.status === 'قيد المراجعة' && 'border-yellow-500/30 bg-yellow-500/5',
                    comment.status === 'موافق عليه' && 'border-green-500/30 bg-green-500/5',
                    comment.status === 'سبام' && 'border-red-500/30 bg-red-500/5',
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.email}</span>
                          <Badge variant={getCommentStatusColor(comment.status)}>{comment.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          على: {comment.postTitle} · {formatDate(new Date(comment.date))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{comment.content}</p>
                    <div className="flex items-center gap-2">
                      {comment.status !== 'موافق عليه' && (
                        <Button variant="outline" size="sm" className="text-green-600">موافقة</Button>
                      )}
                      {comment.status !== 'سبام' && (
                        <Button variant="outline" size="sm" className="text-yellow-600">سبام</Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أعلى المقالات مشاهدات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.map((post, idx) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">{post.author}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold">{post.views.toLocaleString('ar-SA')}</div>
                        <div className="text-xs text-muted-foreground">مشاهدة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أعلى المقالات مشاركات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...mockPosts].sort((a, b) => b.shares - a.shares).slice(0, 5).map((post, idx) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">{post.category}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold">{post.shares}</div>
                        <div className="text-xs text-muted-foreground">مشاركة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الملخص العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{stats.totalViews.toLocaleString('ar-SA')}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{totalShares}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المشاركات</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{mockComments.length}</p>
                    <p className="text-sm text-muted-foreground">إجمالي التعليقات</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-3xl font-bold">{mockCategories.length}</p>
                    <p className="text-sm text-muted-foreground">الفئات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المقالات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategories.sort((a, b) => b.postsCount - a.postsCount).map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-sm">{cat.postsCount} مقال</span>
                      </div>
                      <ProgressBar value={(cat.postsCount / 50) * 100} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogHeader>
          <DialogTitle>مقال جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات المقال">
            <FormGroup>
              <FormField label="العنوان" placeholder="عنوان المقال" />
              <FormField label="Slug" placeholder="article-slug" />
            </FormGroup>
            <FormGroup>
              <FormField label="المقتطف" placeholder="ملخص مختصر للمقال" />
            </FormGroup>
            <div className="space-y-2">
              <label className="text-sm font-medium">المحتوى</label>
              <textarea
                className="w-full min-h-[200px] p-3 rounded-lg border bg-background text-foreground resize-y"
                placeholder="اكتب محتوى المقال هنا..."
              />
            </div>
            <FormGroup>
              <FormField label="الفئة" placeholder="اختر الفئة" />
              <FormField label="الكاتب" placeholder="اسم الكاتب" />
            </FormGroup>
            <FormGroup>
              <FormField label="الوسوم" placeholder="فصل بفاصلة: صحة, نصائح" />
            </FormGroup>
            <FormGroup>
              <FormField label="الحالة" placeholder="اختر الحالة" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
          <Button variant="outline">حفظ كمسودة</Button>
          <Button onClick={() => setShowCreateDialog(false)}>نشر المقال</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
