'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

type MediaType = 'صورة' | 'فيديو' | 'مستند' | 'أخرى';

interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  dimensions?: string;
  uploadedBy: string;
  uploadDate: string;
  tags: string[];
  url: string;
  color: string;
}

const mockMedia: MediaFile[] = [
  { id: '1', name: 'banner-summer-2024.jpg', type: 'صورة', size: 2450000, dimensions: '1920x1080', uploadedBy: 'أحمد العلي', uploadDate: '2024-06-28', tags: ['بانر', 'صيف', 'ترويجي'], url: '#', color: 'bg-blue-500' },
  { id: '2', name: 'logo-main.png', type: 'صورة', size: 156000, dimensions: '512x512', uploadedBy: 'سارة الحربي', uploadDate: '2024-06-25', tags: ['شعار', 'هوية'], url: '#', color: 'bg-green-500' },
  { id: '3', name: 'lab-equipment.jpg', type: 'صورة', size: 3200000, dimensions: '2400x1600', uploadedBy: 'محمد خالد', uploadDate: '2024-06-24', tags: ['مختبر', 'معدات'], url: '#', color: 'bg-purple-500' },
  { id: '4', name: 'health-tips-video.mp4', type: 'فيديو', size: 45000000, dimensions: '1280x720', uploadedBy: 'فهد العتيبي', uploadDate: '2024-06-23', tags: ['فيديو', 'نصائح'], url: '#', color: 'bg-red-500' },
  { id: '5', name: 'insurance-brochure.pdf', type: 'مستند', size: 5600000, uploadedBy: 'ليلى الشمري', uploadDate: '2024-06-22', tags: ['بروشور', 'تأمين'], url: '#', color: 'bg-orange-500' },
  { id: '6', name: 'team-photo.jpg', type: 'صورة', size: 4100000, dimensions: '3000x2000', uploadedBy: 'أحمد العلي', uploadDate: '2024-06-21', tags: ['فريق', 'عمل'], url: '#', color: 'bg-teal-500' },
  { id: '7', name: 'promo-video-ramadan.mp4', type: 'فيديو', size: 67000000, dimensions: '1920x1080', uploadedBy: 'محمد خالد', uploadDate: '2024-06-20', tags: ['فيديو', 'رمضان', 'ترويجي'], url: '#', color: 'bg-pink-500' },
  { id: '8', name: 'test-results-template.pdf', type: 'مستند', size: 890000, uploadedBy: 'سارة الحربي', uploadDate: '2024-06-19', tags: ['قالب', 'نتائج'], url: '#', color: 'bg-yellow-500' },
  { id: '9', name: 'hero-image-homepage.jpg', type: 'صورة', size: 5200000, dimensions: '2560x1440', uploadedBy: 'أحمد العلي', uploadDate: '2024-06-18', tags: ['رئيسية', 'بطل'], url: '#', color: 'bg-indigo-500' },
  { id: '10', name: 'service-laboratory.jpg', type: 'صورة', size: 2800000, dimensions: '1600x900', uploadedBy: 'فهد العتيبي', uploadDate: '2024-06-17', tags: ['خدمة', 'مختبر'], url: '#', color: 'bg-cyan-500' },
  { id: '11', name: 'patient-guide.pdf', type: 'مستند', size: 3400000, uploadedBy: 'ليلى الشمري', uploadDate: '2024-06-16', tags: ['دليل', 'مرضى'], url: '#', color: 'bg-amber-500' },
  { id: '12', name: 'social-media-templates.zip', type: 'أخرى', size: 12000000, uploadedBy: 'سارة الحربي', uploadDate: '2024-06-15', tags: ['قالب', 'سوشيال'], url: '#', color: 'bg-gray-500' },
  { id: '13', name: 'clinic-interior.jpg', type: 'صورة', size: 3600000, dimensions: '2000x1333', uploadedBy: 'محمد خالد', uploadDate: '2024-06-14', tags: ['عيادة', 'داخلي'], url: '#', color: 'bg-emerald-500' },
  { id: '14', name: 'welcome-video.mp4', type: 'فيديو', size: 28000000, dimensions: '1920x1080', uploadedBy: 'فهد العتيبي', uploadDate: '2024-06-13', tags: ['فيديو', 'ترحيب'], url: '#', color: 'bg-rose-500' },
  { id: '15', name: 'price-list-2024.xlsx', type: 'مستند', size: 245000, uploadedBy: 'أحمد العلي', uploadDate: '2024-06-12', tags: ['قائمة أسعار'], url: '#', color: 'bg-violet-500' },
  { id: '16', name: 'social-cover.jpg', type: 'صورة', size: 1800000, dimensions: '1500x500', uploadedBy: 'سارة الحربي', uploadDate: '2024-06-11', tags: ['غلاف', 'سوشيال'], url: '#', color: 'bg-sky-500' },
];

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);

  const stats = {
    totalFiles: 1234,
    images: 890,
    videos: 123,
    documents: 221,
  };

  const storageUsed = 45.2;
  const storageTotal = 100;
  const storagePercentage = (storageUsed / storageTotal) * 100;

  const allTags = [...new Set(mockMedia.flatMap(f => f.tags))];

  const filteredMedia = mockMedia.filter(f => {
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'images' && f.type === 'صورة') ||
      (activeTab === 'videos' && f.type === 'فيديو') ||
      (activeTab === 'documents' && f.type === 'مستند') ||
      activeTab === 'upload';
    const matchesSearch = f.name.includes(searchQuery);
    const matchesTag = filterTag === 'all' || f.tags.includes(filterTag);
    return matchesTab && matchesSearch && matchesTag;
  });

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === filteredMedia.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredMedia.map(f => f.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'صورة': return '🖼️';
      case 'فيديو': return '🎬';
      case 'مستند': return '📄';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مكتبة الوسائط</h1>
          <p className="text-muted-foreground mt-1">إدارة الصور والفيديوهات والمستندات</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedFiles.length > 0 && (
            <Button variant="danger" onClick={() => setSelectedFiles([])}>
              حذف المحدد ({selectedFiles.length})
            </Button>
          )}
          <ExportButton />
          <Button onClick={() => setActiveTab('upload')}>رفع ملف</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الملفات" value={stats.totalFiles.toLocaleString('ar-SA')} icon="📁" />
        <StatCard title="الصور" value={stats.images.toLocaleString('ar-SA')} icon="🖼️" />
        <StatCard title="الفيديوهات" value={stats.videos.toLocaleString('ar-SA')} icon="🎬" />
        <StatCard title="المستندات" value={stats.documents.toLocaleString('ar-SA')} icon="📄" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">استخدام التخزين</span>
            <span className="text-sm font-medium">{storageUsed} GB / {storageTotal} GB</span>
          </div>
          <ProgressBar value={storagePercentage} className="w-full h-3" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{storagePercentage.toFixed(1)}% مستخدم</span>
            <span className="text-xs text-muted-foreground">{(storageTotal - storageUsed).toFixed(1)} GB متاح</span>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="images">الصور</TabsTrigger>
          <TabsTrigger value="videos">الفيديو</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
          <TabsTrigger value="upload">الرفع</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchInput
                  placeholder="بحث في الملفات..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="flex-1"
                />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background text-foreground"
                >
                  <option value="all">جميع الوسوم</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {selectedFiles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedFiles.length} محدد</span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>إلغاء التحديد</Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === filteredMedia.length && filteredMedia.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm text-muted-foreground">تحديد الكل</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMedia.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      'group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg',
                      selectedFiles.includes(file.id) ? 'border-primary' : 'border-transparent hover:border-muted'
                    )}
                    onClick={() => { setSelectedFile(file); setShowDetailPanel(true); }}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className={cn('aspect-square flex items-center justify-center text-white text-3xl', file.color)}>
                      {getMediaTypeIcon(file.type)}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur">
                        {file.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <SearchInput
                  placeholder="بحث في الصور..."
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  className="max-w-md"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mockMedia.filter(f => f.type === 'صورة').map((file) => (
                  <div
                    key={file.id}
                    className="group relative rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => { setSelectedFile(file); setShowDetailPanel(true); }}
                  >
                    <div className={cn('aspect-square flex items-center justify-center text-white text-4xl', file.color)}>
                      🖼️
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.dimensions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMedia.filter(f => f.type === 'فيديو').map((file) => (
                  <div
                    key={file.id}
                    className="group rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all border"
                    onClick={() => { setSelectedFile(file); setShowDetailPanel(true); }}
                  >
                    <div className={cn('aspect-video flex items-center justify-center text-white text-5xl', file.color)}>
                      🎬
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        <span className="text-xs text-muted-foreground">{file.dimensions}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {file.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {mockMedia.filter(f => f.type === 'مستند').map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedFile(file); setShowDetailPanel(true); }}
                  >
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl', file.color)}>
                      📄
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">{formatFileSize(file.size)} · {file.uploadedBy}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">{formatDate(new Date(file.uploadDate))}</div>
                      <div className="flex gap-1 mt-1">
                        {file.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">تحميل</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
              >
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-bold mb-2">اسحب الملفات هنا</h3>
                <p className="text-muted-foreground mb-4">أو انقر لاختيار الملفات</p>
                <p className="text-xs text-muted-foreground mb-6">
                  يُسمح بـ: JPG, PNG, GIF, MP4, PDF, DOCX, XLSX — الحد الأقصى 50 MB
                </p>
                <Button>اختيار ملفات</Button>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">الرفع الأخير</h4>
                <div className="space-y-2">
                  {mockMedia.slice(0, 3).map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className={cn('w-10 h-10 rounded flex items-center justify-center text-white text-sm', file.color)}>
                        {getMediaTypeIcon(file.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                      </div>
                      <Badge variant="success">تم الرفع</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showDetailPanel && selectedFile && (
        <div className="fixed inset-y-0 left-0 w-96 bg-background border-r shadow-xl z-50 overflow-y-auto" dir="rtl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">تفاصيل الملف</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailPanel(false)}>✕</Button>
            </div>

            <div className={cn('aspect-video rounded-lg flex items-center justify-center text-white text-6xl mb-6', selectedFile.color)}>
              {getMediaTypeIcon(selectedFile.type)}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">اسم الملف</label>
                <p className="font-medium">{selectedFile.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">النوع</label>
                <p className="font-medium">{selectedFile.type}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">الحجم</label>
                <p className="font-medium">{formatFileSize(selectedFile.size)}</p>
              </div>
              {selectedFile.dimensions && (
                <div>
                  <label className="text-sm text-muted-foreground">الأبعاد</label>
                  <p className="font-medium">{selectedFile.dimensions}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">رفعه</label>
                <p className="font-medium">{selectedFile.uploadedBy}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">تاريخ الرفع</label>
                <p className="font-medium">{formatDate(new Date(selectedFile.uploadDate))}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">الوسوم</label>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full">تحميل الملف</Button>
              <Button variant="outline" className="w-full">نسخ الرابط</Button>
              <Button variant="outline" className="w-full">تعديل الوسوم</Button>
              <Button variant="danger" className="w-full">حذف الملف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
