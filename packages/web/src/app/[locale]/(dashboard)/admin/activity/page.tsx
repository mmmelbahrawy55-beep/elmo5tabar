'use client';

import { useState, useMemo } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface Activity {
  id: string;
  timestamp: string;
  user: string;
  userAr: string;
  type: 'auth' | 'order' | 'report' | 'payment' | 'system';
  action: string;
  actionAr: string;
  description: string;
  icon: string;
  color: string;
  module: string;
  moduleAr: string;
}

const TYPE_CONFIG: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  auth: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: '🔐', label: 'مصادقة' },
  order: { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: '📋', label: 'طلبات' },
  report: { color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: '📊', label: 'تقارير' },
  payment: { color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '💰', label: 'مدفوعات' },
  system: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: '⚙️', label: 'نظام' },
};

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', timestamp: '2026-07-28T14:35:00', user: 'admin@elm.com', userAr: 'أحمد محمد', type: 'auth', action: 'LOGIN', actionAr: 'تسجيل دخول', description: 'تسجيل دخول ناجح من المتصفح', icon: '🔐', color: 'blue', module: 'auth', moduleAr: 'المصادقة' },
  { id: '2', timestamp: '2026-07-28T14:32:00', user: 'dr.sara@elm.com', userAr: 'د. سارة أحمد', type: 'order', action: 'CREATE', actionAr: 'إنشاء طلب', description: 'إنشاء طلب تحاليل جديد للمرض pat-4521', icon: '📋', color: 'green', module: 'orders', moduleAr: 'الطلبات' },
  { id: '3', timestamp: '2026-07-28T14:28:00', user: 'nurse.mona@elm.com', userAr: 'م. منى حسن', type: 'report', action: 'UPLOAD', actionAr: 'رفع تقرير', description: 'رفع تقرير قياس الضغط للمريض pat-3321', icon: '📊', color: 'purple', module: 'reports', moduleAr: 'التقارير' },
  { id: '4', timestamp: '2026-07-28T14:20:00', user: 'billing@elm.com', userAr: 'خالد علي', type: 'payment', action: 'RECEIVE', actionAr: 'استلام دفعة', description: 'استلام دفعة 2,500 ج.م من المريض pat-7788', icon: '💰', color: 'yellow', module: 'billing', moduleAr: 'الفواتير' },
  { id: '5', timestamp: '2026-07-28T14:15:00', user: 'system', userAr: 'النظام', type: 'system', action: 'BACKUP', actionAr: 'نسخ احتياطي', description: 'نسخ احتياطي تلقائي - 2.3GB', icon: '⚙️', color: 'red', module: 'system', moduleAr: 'النظام' },
  { id: '6', timestamp: '2026-07-28T14:10:00', user: 'dr.ali@elm.com', userAr: 'د. علي محمود', type: 'report', action: 'VERIFY', actionAr: 'تحقق من تقرير', description: 'التحقق من نتائج تحاليل المريض pat-2210', icon: '📊', color: 'purple', module: 'reports', moduleAr: 'التقارير' },
  { id: '7', timestamp: '2026-07-28T14:05:00', user: 'reception@elm.com', userAr: 'نورا سعيد', type: 'order', action: 'UPDATE', actionAr: 'تعديل طلب', description: 'تعديل موعد المريض pat-1122', icon: '📋', color: 'green', module: 'orders', moduleAr: 'الطلبات' },
  { id: '8', timestamp: '2026-07-28T14:00:00', user: 'lab@elm.com', userAr: 'محمد صابر', type: 'report', action: 'PUBLISH', actionAr: 'نشر تقرير', description: 'نشر نتائج التحاليل الدموية', icon: '📊', color: 'purple', module: 'reports', moduleAr: 'التقارير' },
  { id: '9', timestamp: '2026-07-28T13:50:00', user: 'admin@elm.com', userAr: 'أحمد محمد', type: 'auth', action: 'LOGOUT', actionAr: 'تسجيل خروج', description: 'تسجيل خروج من الجلسة', icon: '🔐', color: 'blue', module: 'auth', moduleAr: 'المصادقة' },
  { id: '10', timestamp: '2026-07-28T13:45:00', user: 'phlebo@elm.com', userAr: 'ياسمين خالد', type: 'order', action: 'COMPLETE', actionAr: 'إتمام طلب', description: 'إتمام أخذ عينة الدم للمريض pat-5566', icon: '📋', color: 'green', module: 'orders', moduleAr: 'الطلبات' },
  { id: '11', timestamp: '2026-07-28T13:40:00', user: 'billing@elm.com', userAr: 'خالد علي', type: 'payment', action: 'REFUND', actionAr: 'استرداد', description: 'استرداد 500 ج.م للمريض pat-9900', icon: '💰', color: 'yellow', module: 'billing', moduleAr: 'الفواتير' },
  { id: '12', timestamp: '2026-07-28T13:35:00', user: 'system', userAr: 'النظام', type: 'system', action: 'UPDATE', actionAr: 'تحديث نظام', description: 'تحديث النظام إلى الإصدار 3.2.1', icon: '⚙️', color: 'red', module: 'system', moduleAr: 'النظام' },
  { id: '13', timestamp: '2026-07-28T13:30:00', user: 'dr.sara@elm.com', userAr: 'د. سارة أحمد', type: 'auth', action: 'LOGIN', actionAr: 'تسجيل دخول', description: 'تسجيل دخول عبر تطبيق الجوال', icon: '🔐', color: 'blue', module: 'auth', moduleAr: 'المصادقة' },
  { id: '14', timestamp: '2026-07-28T13:25:00', user: 'nurse.mona@elm.com', userAr: 'م. منى حسن', type: 'order', action: 'CREATE', actionAr: 'إنشاء طلب', description: 'طلب فحص نبض للمريض pat-8877', icon: '📋', color: 'green', module: 'orders', moduleAr: 'الطلبات' },
  { id: '15', timestamp: '2026-07-28T13:20:00', user: 'lab@elm.com', userAr: 'محمد صابر', type: 'report', action: 'CREATE', actionAr: 'إنشاء تقرير', description: 'إنشاء تقرير تحليل بول جديد', icon: '📊', color: 'purple', module: 'reports', moduleAr: 'التقارير' },
];

const TOP_USERS = [
  { name: 'د. سارة أحمد', count: 89, percentage: 100 },
  { name: 'أحمد محمد', count: 76, percentage: 85 },
  { name: 'م. منى حسن', count: 65, percentage: 73 },
  { name: 'محمد صابر', count: 54, percentage: 61 },
  { name: 'نورا سعيد', count: 48, percentage: 54 },
  { name: 'خالد علي', count: 42, percentage: 47 },
  { name: 'د. علي محمود', count: 38, percentage: 43 },
  { name: 'ياسمين خالد', count: 31, percentage: 35 },
  { name: 'فاطمة حسن', count: 25, percentage: 28 },
  { name: 'عمر إبراهيم', count: 18, percentage: 20 },
];

const MODULE_STATS = [
  { name: 'المصادقة', nameAr: 'المصادقة', count: 342, percentage: 28, color: 'bg-blue-500' },
  { name: 'Orders', nameAr: 'الطلبات', count: 289, percentage: 24, color: 'bg-green-500' },
  { name: 'Reports', nameAr: 'التقارير', count: 256, percentage: 21, color: 'bg-purple-500' },
  { name: 'Billing', nameAr: 'الفواتير', count: 198, percentage: 16, color: 'bg-yellow-500' },
  { name: 'System', nameAr: 'النظام', count: 145, percentage: 11, color: 'bg-red-500' },
];

export default function ActivityPage() {
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [isCompact, setIsCompact] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = useMemo(() => {
    let result = [...activities];
    if (searchQuery) {
      result = result.filter(a =>
        a.userAr.includes(searchQuery) || a.actionAr.includes(searchQuery) || a.description.includes(searchQuery)
      );
    }
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }
    return result;
  }, [activities, searchQuery, filterType]);

  const stats = [
    { title: 'إجمالي الأنشطة', value: '123,456', icon: '📈', trend: 'up' as const },
    { title: 'نشاط اليوم', value: '567', icon: '📊', trend: 'up' as const },
    { title: 'مستخدمون نشطون', value: 34, icon: '👥', trend: 'up' as const },
    { title: 'متوسط النشاط/ساعة', value: 23, icon: '⏱️', trend: 'up' as const },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل النشاط</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">تتبع جميع الأنشطة في النظام</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={isCompact} onCheckedChange={setIsCompact} />
            <span className="text-sm text-gray-600 dark:text-gray-300">عرض مختصر</span>
          </label>
          <ExportButton data={filteredActivities} filename="activity-log" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">اليوم</TabsTrigger>
          <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
          <TabsTrigger value="month">هذا الشهر</TabsTrigger>
          <TabsTrigger value="byType">حسب النوع</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>سجل النشاط - اليوم</CardTitle>
                  <div className="flex items-center gap-3">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="بحث في النشاط..." />
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-700 dark:text-gray-300"
                    >
                      <option value="all">جميع الأنواع</option>
                      <option value="auth">مصادقة</option>
                      <option value="order">طلبات</option>
                      <option value="report">تقارير</option>
                      <option value="payment">مدفوعات</option>
                      <option value="system">نظام</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-1">
                      {filteredActivities.map(activity => {
                        const cfg = TYPE_CONFIG[activity.type];
                        return (
                          <div key={activity.id} className={cn('relative flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', isCompact && 'py-1.5')}>
                            <div className={cn('relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm', cfg.bgColor)}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{activity.userAr}</span>
                                <Badge className={cn('text-xs', cfg.bgColor, cfg.color)}>{cfg.label}</Badge>
                                <span className="text-xs text-gray-400">{activity.actionAr}</span>
                              </div>
                              {!isCompact && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                              )}
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                                {new Date(activity.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>أكثر المستخدمين نشاطاً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {TOP_USERS.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{user.count}</span>
                          </div>
                          <ProgressBar value={user.percentage} max={100} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>النشاط حسب الوحدة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MODULE_STATS.map((mod, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{mod.nameAr}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{mod.count} ({mod.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className={cn('h-2 rounded-full transition-all', mod.color)} style={{ width: `${mod.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MODULE_STATS.map((mod, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={cn('w-2.5 h-2.5 rounded-full', mod.color)} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{mod.nameAr}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>نشاط هذا الأسبوع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</div>
                    <div className={cn(
                      'rounded-lg p-3 text-center',
                      idx === 2 ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-gray-50 dark:bg-gray-800'
                    )}>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{[189, 234, 567, 0, 0, 0, 0][idx]}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">نشاط</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {filteredActivities.map(activity => {
                  const cfg = TYPE_CONFIG[activity.type];
                  return (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm', cfg.bgColor)}>{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{activity.userAr}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{activity.actionAr}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleDateString('ar-EG')} {new Date(activity.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>نشاط هذا الشهر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12,456</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">إجمالي الأنشطة</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">8,234</div>
                  <div className="text-sm text-green-700 dark:text-green-300">أنشطة ناجحة</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">23</div>
                  <div className="text-sm text-red-700 dark:text-red-300">أحداث حرجة</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">اليوم</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">النشاط</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">المصادقة</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">الطلبات</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">التقارير</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">المدفوعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[28, 27, 26, 25, 24, 23, 22, 21, 20, 19].map(day => (
                      <tr key={day} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">{`يوليو ${day}`}</td>
                        <td className="py-2 px-4 font-bold text-gray-900 dark:text-white">{Math.floor(Math.random() * 500 + 200)}</td>
                        <td className="py-2 px-4 text-blue-600 dark:text-blue-400">{Math.floor(Math.random() * 150 + 50)}</td>
                        <td className="py-2 px-4 text-green-600 dark:text-green-400">{Math.floor(Math.random() * 120 + 40)}</td>
                        <td className="py-2 px-4 text-purple-600 dark:text-purple-400">{Math.floor(Math.random() * 100 + 30)}</td>
                        <td className="py-2 px-4 text-yellow-600 dark:text-yellow-400">{Math.floor(Math.random() * 80 + 20)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byType">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const typeActivities = filteredActivities.filter(a => a.type === type);
              return (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', cfg.bgColor)}>{cfg.icon}</div>
                      <div>
                        <CardTitle className="text-base">{cfg.label}</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{typeActivities.length} نشاط</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {typeActivities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <span className="text-sm">{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{activity.actionAr}</p>
                            <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                            <span className="text-xs text-gray-400">
                              {new Date(activity.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {typeActivities.length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm">لا توجد أنشطة</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
