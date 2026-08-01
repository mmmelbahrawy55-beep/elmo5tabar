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
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

type PageStatus = 'منشور' | 'مسودة' | 'في المراجعة' | 'مجدول';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  author: string;
  lastModified: string;
  template: string;
  isHomepage: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  pagesCount: number;
  isDefault: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  url: string;
  children: NavigationItem[];
  isActive: boolean;
  order: number;
}

const mockPages: CMSPage[] = [
  { id: '1', title: 'الرئيسية', slug: '/', status: 'منشور', author: 'أحمد العلي', lastModified: '2024-06-28', template: 'صفحة رئيسية', isHomepage: true },
  { id: '2', title: 'من نحن', slug: '/about', status: 'منشور', author: 'سارة الحربي', lastModified: '2024-06-27', template: 'صفحة ثابتة', isHomepage: false },
  { id: '3', title: 'خدماتنا', slug: '/services', status: 'منشور', author: 'محمد خالد', lastModified: '2024-06-26', template: 'صفحة خدمات', isHomepage: false },
  { id: '4', title: 'المدونة', slug: '/blog', status: 'منشور', author: 'فهد العتيبي', lastModified: '2024-06-25', template: 'قائمة مدونة', isHomepage: false },
  { id: '5', title: 'تواصل معنا', slug: '/contact', status: 'منشور', author: 'أحمد العلي', lastModified: '2024-06-24', template: 'صفحة اتصال', isHomepage: false },
  { id: '6', title: 'الأسئلة الشائعة', slug: '/faq', status: 'منشور', author: 'ليلى الشمري', lastModified: '2024-06-23', template: 'صفحة أسئلة', isHomepage: false },
  { id: '7', title: 'سياسة الخصوصية', slug: '/privacy', status: 'منشور', author: 'سارة الحربي', lastModified: '2024-06-22', template: 'صفحة ثابتة', isHomepage: false },
  { id: '8', title: 'الشروط والأحكام', slug: '/terms', status: 'منشور', author: 'سارة الحربي', lastModified: '2024-06-21', template: 'صفحة ثابتة', isHomepage: false },
  { id: '9', title: 'الباقات الجديدة', slug: '/new-packages', status: 'مسودة', author: 'محمد خالد', lastModified: '2024-06-28', template: 'صفحة خدمات', isHomepage: false },
  { id: '10', title: '关于我们', slug: '/about-cn', status: 'مسودة', author: 'أحمد العلي', lastModified: '2024-06-27', template: 'صفحة ثابتة', isHomepage: false },
  { id: '11', title: 'عرض الصيف', slug: '/summer-offer', status: 'في المراجعة', author: 'فهد العتيبي', lastModified: '2024-06-28', template: 'صفحة عروض', isHomepage: false },
  { id: '12', title: 'دليل المستخدم', slug: '/user-guide', status: 'مسودة', author: 'ليلى الشمري', lastModified: '2024-06-26', template: 'صفحة ثابتة', isHomepage: false },
];

const mockTemplates: Template[] = [
  { id: '1', name: 'صفحة رئيسية', description: 'قالب الصفحة الرئيسية مع الأقسام المتعددة', pagesCount: 1, isDefault: true },
  { id: '2', name: 'صفحة ثابتة', description: 'قالب محتوى ثابت مع محرر نصوص', pagesCount: 5, isDefault: false },
  { id: '3', name: 'صفحة خدمات', description: 'عرض الخدمات مع التفاصيل والأسعار', pagesCount: 2, isDefault: false },
  { id: '4', name: 'قائمة مدونة', description: 'قائمة المقالات مع التصفية والبحث', pagesCount: 1, isDefault: false },
  { id: '5', name: 'صفحة اتصال', description: 'نموذج اتصال مع خريطة ومعلومات', pagesCount: 1, isDefault: false },
  { id: '6', name: 'صفحة أسئلة', description: 'أسئلة شائعة بتنسيق Accordion', pagesCount: 1, isDefault: false },
  { id: '7', name: 'صفحة عروض', description: 'عرض ترويجي مع تفاصيل العرض', pagesCount: 1, isDefault: false },
];

const mockNavigation: NavigationItem[] = [
  {
    id: '1', label: 'الرئيسية', url: '/', order: 1, isActive: true,
    children: [],
  },
  {
    id: '2', label: 'خدماتنا', url: '/services', order: 2, isActive: true,
    children: [
      { id: '2-1', label: 'التحاليل الطبية', url: '/services/laboratory', order: 1, isActive: true, children: [] },
      { id: '2-2', label: 'التأمين الصحي', url: '/services/insurance', order: 2, isActive: true, children: [] },
      { id: '2-3', label: 'الفحوصات الشاملة', url: '/services/checkups', order: 3, isActive: true, children: [] },
    ],
  },
  {
    id: '3', label: 'المدونة', url: '/blog', order: 3, isActive: true,
    children: [],
  },
  {
    id: '4', label: 'الباقات', url: '/packages', order: 4, isActive: true,
    children: [],
  },
  {
    id: '5', label: 'من نحن', url: '/about', order: 5, isActive: true,
    children: [],
  },
  {
    id: '6', label: 'تواصل معنا', url: '/contact', order: 6, isActive: true,
    children: [],
  },
  {
    id: '7', label: 'الأسئلة الشائعة', url: '/faq', order: 7, isActive: true,
    children: [],
  },
];

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState('pages');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const stats = {
    totalPages: 48,
    published: 36,
    drafts: 8,
    lastUpdate: 'اليوم',
  };

  const getStatusColor = (status: PageStatus) => {
    switch (status) {
      case 'منشور': return 'success';
      case 'مسودة': return 'secondary';
      case 'في المراجعة': return 'warning';
      case 'مجدول': return 'info';
      default: return 'default';
    }
  };

  const filteredPages = mockPages.filter(p => {
    const matchesSearch = p.title.includes(searchQuery) || p.slug.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openPageEditor = (page: CMSPage | null) => {
    setEditingPage(page);
    setShowPageDialog(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المحتوى</h1>
          <p className="text-muted-foreground mt-1">إدارة صفحات الموقع والقوالب والتنقلات</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button onClick={() => openPageEditor(null)}>صفحة جديدة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="صفحات المحتوى" value={stats.totalPages} icon="📄" />
        <StatCard title="صفحات منشورة" value={stats.published} icon="✅" />
        <StatCard title="مسودات" value={stats.drafts} icon="📝" />
        <StatCard title="آخر تحديث" value={stats.lastUpdate} icon="🕐" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pages">الصفحات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="navigation">التنقلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>صفحات المحتوى</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchInput
                  placeholder="بحث في الصفحات..."
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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العنوان</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Slug</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المؤلف</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">آخر تعديل</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">القالب</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {page.isHomepage && <Badge variant="info">الرئيسية</Badge>}
                            <span className="font-medium">{page.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{page.slug}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(page.status)}>{page.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{page.author}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(new Date(page.lastModified))}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{page.template}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openPageEditor(page)}>تعديل</Button>
                            {!page.isHomepage && (
                              <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                            )}
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

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>القوالب</CardTitle>
                <Button onClick={() => setShowTemplateDialog(true)}>قالب جديد</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">{template.name}</h3>
                        {template.isDefault && <Badge variant="info">افتراضي</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{template.pagesCount} صفحة</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">معاينة</Button>
                          <Button size="sm">تعديل</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة التنقل</CardTitle>
                <Button>إضافة عنصر</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockNavigation.map((item) => (
                  <div key={item.id}>
                    <div className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      'hover:bg-muted/50 transition-colors'
                    )}>
                      <span className="text-muted-foreground cursor-move">⋮⋮</span>
                      <Switch checked={item.isActive} onCheckedChange={() => {}} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.url}</div>
                      </div>
                      <Badge variant="outline">الترتيب: {item.order}</Badge>
                      <Button variant="ghost" size="sm">تعديل</Button>
                      <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                    </div>
                    {item.children.length > 0 && (
                      <div className="mr-8 space-y-2 mt-2">
                        {item.children.map((child) => (
                          <div key={child.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <span className="text-muted-foreground cursor-move">⋮⋮</span>
                            <Switch checked={child.isActive} onCheckedChange={() => {}} />
                            <div className="flex-1">
                              <div className="font-medium">{child.label}</div>
                              <div className="text-xs text-muted-foreground font-mono">{child.url}</div>
                            </div>
                            <Badge variant="outline">الترتيب: {child.order}</Badge>
                            <Button variant="ghost" size="sm">تعديل</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">حذف</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الموقع العامة</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSection title="المعلومات الأساسية">
                  <FormGroup>
                    <FormField label="اسم الموقع" placeholder="صحتك أولاً" />
                    <FormField label="الوصف المختصر" placeholder="منصة صحية متكاملة" />
                  </FormGroup>
                  <FormGroup>
                    <FormField label="البريد الإلكتروني" placeholder="info@sahatko.sa" type="email" />
                    <FormField label="رقم الهاتف" placeholder="+966XXXXXXXXX" />
                  </FormGroup>
                  <FormGroup>
                    <FormField label="العنوان" placeholder="الرياض، المملكة العربية السعودية" />
                  </FormGroup>
                </FormSection>
                <div className="mt-4 flex justify-end">
                  <Button>حفظ الإعدادات</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات SEO الافتراضية</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSection title="البيانات الوصفية">
                  <FormGroup>
                    <FormField label="عنوان الموقع الافتراضي" placeholder="صحتك أولاً - خدمات صحية متكاملة" />
                  </FormGroup>
                  <FormGroup>
                    <FormField label="الوصف Meta الافتراضي" placeholder="منصة صحية شاملة..." />
                  </FormGroup>
                  <FormGroup>
                    <FormField label="الكلمات المفتاحية" placeholder="صحة، تحاليل، تأمين" />
                  </FormGroup>
                </FormSection>
                <div className="mt-4 flex justify-end">
                  <Button>حفظ الإعدادات</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
        <DialogHeader>
          <DialogTitle>{editingPage ? `تعديل: ${editingPage.title}` : 'صفحة جديدة'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات الصفحة">
            <FormGroup>
              <FormField label="العنوان" placeholder="عنوان الصفحة" defaultValue={editingPage?.title || ''} />
              <FormField label="Slug" placeholder="/page-slug" defaultValue={editingPage?.slug || ''} />
            </FormGroup>
            <FormGroup>
              <FormField label="القالب" placeholder="اختر القالب" defaultValue={editingPage?.template || ''} />
            </FormGroup>
          </FormSection>
          <FormSection title="المحتوى">
            <div className="space-y-2">
              <label className="text-sm font-medium">محتوى الصفحة</label>
              <textarea
                className="w-full min-h-[200px] p-3 rounded-lg border bg-background text-foreground resize-y"
                placeholder="اكتب محتوى الصفحة هنا..."
                defaultValue=""
              />
            </div>
          </FormSection>
          <FormSection title="إعدادات SEO">
            <FormGroup>
              <FormField label="عنوان Meta" placeholder="عنوان محرك البحث" />
              <FormField label="وصف Meta" placeholder="وصف محرك البحث" />
            </FormGroup>
          </FormSection>
          <FormSection title="النشر">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={true} onCheckedChange={() => {}} />
                <span className="text-sm">منشور</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={false} onCheckedChange={() => {}} />
                <span className="text-sm">مجدول</span>
              </div>
            </div>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPageDialog(false)}>إلغاء</Button>
          <Button variant="outline">حفظ كمسودة</Button>
          <Button onClick={() => setShowPageDialog(false)}>نشر الصفحة</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogHeader>
          <DialogTitle>قالب جديد</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات القالب">
            <FormGroup>
              <FormField label="اسم القالب" placeholder="اسم القالب" />
            </FormGroup>
            <FormGroup>
              <FormField label="الوصف" placeholder="وصف مختصر للقالب" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowTemplateDialog(false)}>إنشاء القالب</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
