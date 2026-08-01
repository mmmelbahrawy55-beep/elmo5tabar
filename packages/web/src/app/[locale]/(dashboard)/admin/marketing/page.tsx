'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

type CampaignStatus = 'نشطة' | 'معلقة' | 'منتهية' | 'مسودة';
type CampaignType = 'وسائل اجتماعي' | 'بريد إلكتروني' | 'رسائل نصية' | 'إعلانات جوجل' | 'واتساب';

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  reach: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  roi: number;
  isActive: boolean;
}

interface Channel {
  name: string;
  icon: string;
  campaigns: number;
  spend: number;
  reach: number;
  conversions: number;
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'حملة الصيف الصحية', type: 'وسائل اجتماعي', status: 'نشطة', budget: 25000, spent: 18000, reach: 125000, clicks: 8500, conversions: 340, startDate: '2024-06-01', endDate: '2024-08-31', roi: 3.2, isActive: true },
  { id: '2', name: 'عرض التحاليل الطبية', type: 'إعلانات جوجل', status: 'نشطة', budget: 20000, spent: 15000, reach: 89000, clicks: 6200, conversions: 280, startDate: '2024-06-15', endDate: '2024-07-31', roi: 2.8, isActive: true },
  { id: '3', name: 'توعية التأمين الصحي', type: 'بريد إلكتروني', status: 'نشطة', budget: 10000, spent: 7500, reach: 45000, clicks: 3200, conversions: 150, startDate: '2024-05-01', endDate: '2024-07-01', roi: 4.1, isActive: true },
  { id: '4', name: 'رمضانHealthPlus', type: 'واتساب', status: 'منتهية', budget: 15000, spent: 12000, reach: 67000, clicks: 4100, conversions: 210, startDate: '2024-03-01', endDate: '2024-04-01', roi: 3.5, isActive: false },
  { id: '5', name: 'حملة العودة للمدارس', type: 'وسائل اجتماعي', status: 'مسودة', budget: 12000, spent: 0, reach: 0, clicks: 0, conversions: 0, startDate: '2024-08-15', endDate: '2024-09-15', roi: 0, isActive: false },
  { id: '6', name: 'رسائل تهنئة العيد', type: 'رسائل نصية', status: 'نشطة', budget: 8000, spent: 5000, reach: 35000, clicks: 1800, conversions: 95, startDate: '2024-06-10', endDate: '2024-06-20', roi: 2.1, isActive: true },
  { id: '7', name: 'استبيان رضا العملاء', type: 'بريد إلكتروني', status: 'نشطة', budget: 5000, spent: 2000, reach: 22000, clicks: 1500, conversions: 60, startDate: '2024-06-01', endDate: '2024-07-31', roi: 5.2, isActive: true },
  { id: '8', name: 'عرض نهاية الأسبوع', type: 'واتساب', status: 'نشطة', budget: 5000, spent: 3500, reach: 18000, clicks: 2100, conversions: 85, startDate: '2024-06-01', endDate: '2024-12-31', roi: 2.9, isActive: true },
];

const mockChannels: Channel[] = [
  { name: 'وسائل اجتماعي', icon: '📱', campaigns: 3, spend: 25000, reach: 192000, conversions: 550 },
  { name: 'إعلانات جوجل', icon: '🔍', campaigns: 1, spend: 15000, reach: 89000, conversions: 280 },
  { name: 'بريد إلكتروني', icon: '📧', campaigns: 2, spend: 9500, reach: 67000, conversions: 210 },
  { name: 'رسائل نصية', icon: '💬', campaigns: 1, spend: 5000, reach: 35000, conversions: 95 },
  { name: 'واتساب', icon: '📲', campaigns: 2, spend: 15500, reach: 85000, conversions: 295 },
];

const audienceSegments = [
  { name: 'رجال 25-35', size: 45000, engagement: 4.2, conversions: 320 },
  { name: 'نساء 25-35', size: 38000, engagement: 5.1, conversions: 280 },
  { name: 'رجال 35-50', size: 32000, engagement: 3.8, conversions: 210 },
  { name: 'نساء 35-50', size: 28000, engagement: 4.5, conversions: 190 },
  { name: 'طلاب جامعيين', size: 22000, engagement: 6.2, conversions: 150 },
  { name: 'موظفون حكوميون', size: 18000, engagement: 3.5, conversions: 120 },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [campaigns, setCampaigns] = useState(mockCampaigns);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    activeCampaigns: 8,
    totalBudget: 120000,
    usedBudget: 67000,
    conversionRate: 3.2,
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'نشطة': return 'success';
      case 'معلقة': return 'warning';
      case 'منتهية': return 'default';
      case 'مسودة': return 'secondary';
      default: return 'default';
    }
  };

  const toggleCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive, status: c.isActive ? 'معلقة' : 'نشطة' } : c
    ));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التسويق</h1>
          <p className="text-muted-foreground mt-1">إدارة الحملات التسويقية والقنوات والاستهداف</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          <Button onClick={() => setShowCreateDialog(true)}>إنشاء حملة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="الحملات النشطة" value={stats.activeCampaigns} icon="📢" />
        <StatCard title="إجمالي الميزانية" value={formatCurrency(stats.totalBudget, 'SAR')} icon="💵" />
        <StatCard title="الميزانية المستخدمة" value={formatCurrency(stats.usedBudget, 'SAR')} icon="💸" />
        <StatCard title="معدل التحويل" value={`${stats.conversionRate}%`} icon="📈" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="channels">القنوات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="audience">الجمهور</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>الحملات التسويقية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchInput
                  placeholder="بحث في الحملات..."
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
                  <option value="نشطة">نشطة</option>
                  <option value="معلقة">معلقة</option>
                  <option value="منتهية">منتهية</option>
                  <option value="مسودة">مسودة</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-background text-foreground"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="وسائل اجتماعي">وسائل اجتماعي</option>
                  <option value="إعلانات جوجل">إعلانات جوجل</option>
                  <option value="بريد إلكتروني">بريد إلكتروني</option>
                  <option value="رسائل نصية">رسائل نصية</option>
                  <option value="واتساب">واتساب</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الميزانية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المُنفق</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الوصول</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النقرات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التحويلات</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">ROI</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التفعيل</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{campaign.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{campaign.type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(campaign.budget, 'SAR')}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{formatCurrency(campaign.spent, 'SAR')}</div>
                            <ProgressBar
                              value={(campaign.spent / campaign.budget) * 100}
                              className="w-20 mt-1"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">{campaign.reach.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4">{campaign.clicks.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-4 font-medium">{campaign.conversions}</td>
                        <td className="py-3 px-4">
                          <span className={cn('font-bold', campaign.roi >= 3 ? 'text-green-500' : campaign.roi >= 2 ? 'text-yellow-500' : 'text-red-500')}>
                            {campaign.roi}x
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Switch
                            checked={campaign.isActive}
                            onCheckedChange={() => toggleCampaign(campaign.id)}
                          />
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

        <TabsContent value="channels">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {mockChannels.map((channel) => (
                <Card key={channel.name} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{channel.icon}</div>
                    <h3 className="font-bold text-lg mb-2">{channel.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحملات</span>
                        <span className="font-medium">{channel.campaigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المصروف</span>
                        <span className="font-medium">{formatCurrency(channel.spend, 'SAR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الوصول</span>
                        <span className="font-medium">{channel.reach.toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التحويلات</span>
                        <span className="font-medium">{channel.conversions}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-1">معدل التحويل</p>
                      <span className="text-lg font-bold text-primary">
                        {((channel.conversions / channel.reach) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة القنوات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockChannels.map((channel) => (
                    <div key={channel.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-2xl w-10 text-center">{channel.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{channel.name}</span>
                          <span className="text-sm text-muted-foreground">{channel.reach.toLocaleString('ar-SA')} وصول</span>
                        </div>
                        <ProgressBar value={(channel.reach / 200000) * 100} className="w-full" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{formatCurrency(channel.spend, 'SAR')}</div>
                        <div className="text-xs text-muted-foreground">{channel.conversions} تحويل</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء الحملات - أعلى ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.sort((a, b) => b.roi - a.roi).slice(0, 5).map((campaign, idx) => (
                    <div key={campaign.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <span className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">{campaign.type}</div>
                      </div>
                      <div className="text-left">
                        <div className={cn('text-xl font-bold', campaign.roi >= 3 ? 'text-green-500' : 'text-yellow-500')}>
                          {campaign.roi}x
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التحويلات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockChannels.map((channel) => (
                    <div key={channel.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{channel.icon} {channel.name}</span>
                        <span className="text-sm">{channel.conversions}</span>
                      </div>
                      <ProgressBar value={(channel.conversions / 600) * 100} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الميزانية - المستخدمة مقابل المتبقية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">إجمالي الميزانية: {formatCurrency(stats.totalBudget, 'SAR')}</span>
                    <span className="text-sm font-medium">المتبقي: {formatCurrency(stats.totalBudget - stats.usedBudget, 'SAR')}</span>
                  </div>
                  <ProgressBar value={(stats.usedBudget / stats.totalBudget) * 100} className="w-full h-4" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                      <p className="text-sm text-muted-foreground">المستخدم</p>
                      <p className="text-xl font-bold text-green-500">{formatCurrency(stats.usedBudget, 'SAR')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                      <p className="text-sm text-muted-foreground">المتبقي</p>
                      <p className="text-xl font-bold text-blue-500">{formatCurrency(stats.totalBudget - stats.usedBudget, 'SAR')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الأداء الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'].map((month, idx) => (
                    <div key={month} className="flex items-center gap-4">
                      <span className="text-sm w-20 text-muted-foreground">{month}</span>
                      <div className="flex-1">
                        <ProgressBar value={40 + idx * 8} className="w-full" />
                      </div>
                      <span className="text-sm font-medium w-20 text-left">{formatCurrency(8000 + idx * 2500, 'SAR')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>شرائح الجمهور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">الشريحة</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحجم</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">معدل التفاعل</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">التحويلات</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">التكلفة لكل تحويل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audienceSegments.map((segment, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{segment.name}</td>
                          <td className="py-3 px-4">{segment.size.toLocaleString('ar-SA')}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <ProgressBar value={segment.engagement * 10} className="w-16" />
                              <span>{segment.engagement}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{segment.conversions}</td>
                          <td className="py-3 px-4">{formatCurrency(Math.round(stats.usedBudget / segment.conversions), 'SAR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>أعلى الشرائح تحويلاً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {audienceSegments.sort((a, b) => b.conversions - a.conversions).slice(0, 3).map((segment, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <span className="text-2xl font-bold text-primary w-8 text-center">#{idx + 1}</span>
                        <div className="flex-1">
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-sm text-muted-foreground">{segment.size.toLocaleString('ar-SA')} شخص</div>
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-bold">{segment.conversions}</div>
                          <div className="text-xs text-muted-foreground">تحويل</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معدلات التفاعل حسب الشريحة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {audienceSegments.sort((a, b) => b.engagement - a.engagement).map((segment, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{segment.name}</span>
                          <span className="text-sm">{segment.engagement}%</span>
                        </div>
                        <ProgressBar value={segment.engagement * 10} className="w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogHeader>
          <DialogTitle>إنشاء حملة جديدة</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <FormSection title="بيانات الحملة">
            <FormGroup>
              <FormField label="اسم الحملة" placeholder="أدخل اسم الحملة" />
              <FormField label="نوع الحملة" placeholder="اختر النوع" />
            </FormGroup>
            <FormGroup>
              <FormField label="الميزانية (SAR)" placeholder="0" type="number" />
              <FormField label="نسبة الميزانية الإعلانية (%)" placeholder="100" type="number" />
            </FormGroup>
            <FormGroup>
              <FormField label="تاريخ البدء" type="date" />
              <FormField label="تاريخ الانتهاء" type="date" />
            </FormGroup>
            <FormGroup>
              <FormField label="الهدف" placeholder="مثل: زيادة التحويلات" />
            </FormGroup>
          </FormSection>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
          <Button onClick={() => setShowCreateDialog(false)}>إنشاء الحملة</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
