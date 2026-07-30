'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/design-system/feedback/Alert';
import { LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { cn, formatDate } from '@/lib/utils';

interface ReceptionStaff {
  id: string;
  name: string;
  branch: string;
  serviceStatus: ' متاح' | 'مشغول' | 'في استراحة' | 'غير متصل';
  patientsServed: number;
  avgServiceTime: number;
  performanceRating: number;
  currentQueue: number;
  totalServedToday: number;
  satisfactionScore: number;
}

interface QueueItem {
  id: string;
  patientName: string;
  ticketNumber: string;
  arrivalTime: string;
  waitTime: number;
  status: 'في الانتظار' | 'قيد الخدمة' | 'مكتمل' | 'ملغي';
  serviceType: string;
  assignedTo: string;
}

const initialStaff: ReceptionStaff[] = [
  { id: 'R-001', name: 'أحمد الراشد', branch: 'الفرع الرئيسي', serviceStatus: ' مشغول', patientsServed: 15, avgServiceTime: 4.2, performanceRating: 92, currentQueue: 3, totalServedToday: 15, satisfactionScore: 4.7 },
  { id: 'R-002', name: 'سارة القحطاني', branch: 'الفرع الرئيسي', serviceStatus: ' متاح', patientsServed: 12, avgServiceTime: 3.8, performanceRating: 95, currentQueue: 0, totalServedToday: 12, satisfactionScore: 4.9 },
  { id: 'R-003', name: 'هند المطيري', branch: 'فرع الشمال', serviceStatus: 'مشغول', patientsServed: 18, avgServiceTime: 5.1, performanceRating: 88, currentQueue: 2, totalServedToday: 18, satisfactionScore: 4.5 },
  { id: 'R-004', name: 'خالد الشمري', branch: 'فرع الشمال', serviceStatus: 'في استراحة', patientsServed: 10, avgServiceTime: 4.0, performanceRating: 90, currentQueue: 0, totalServedToday: 10, satisfactionScore: 4.6 },
  { id: 'R-005', name: 'نورة الدوسري', branch: 'فرع الجنوب', serviceStatus: ' متاح', patientsServed: 14, avgServiceTime: 3.5, performanceRating: 96, currentQueue: 0, totalServedToday: 14, satisfactionScore: 4.8 },
  { id: 'R-006', name: 'عمر الحربي', branch: 'فرع الجنوب', serviceStatus: 'مشغول', patientsServed: 16, avgServiceTime: 4.8, performanceRating: 87, currentQueue: 4, totalServedToday: 16, satisfactionScore: 4.3 },
  { id: 'R-007', name: 'ريم الغامدي', branch: 'الفرع الرئيسي', serviceStatus: 'متاح', patientsServed: 11, avgServiceTime: 4.5, performanceRating: 91, currentQueue: 0, totalServedToday: 11, satisfactionScore: 4.7 },
  { id: 'R-008', name: 'ياسر العتيبي', branch: 'الفرع الرئيسي', serviceStatus: 'غير متصل', patientsServed: 0, avgServiceTime: 0, performanceRating: 0, currentQueue: 0, totalServedToday: 0, satisfactionScore: 0 },
];

const initialQueue: QueueItem[] = [
  { id: 'Q-001', patientName: 'محمد العلي', ticketNumber: 'T-1001', arrivalTime: '08:15', waitTime: 25, status: 'في الانتظار', serviceType: 'تسجيل دخول', assignedTo: '' },
  { id: 'Q-002', patientName: 'فاطمة خالد', ticketNumber: 'T-1002', arrivalTime: '08:22', waitTime: 18, status: 'قيد الخدمة', serviceType: 'تسجيل دخول', assignedTo: 'أحمد الراشد' },
  { id: 'Q-003', patientName: 'عبدالله سالم', ticketNumber: 'T-1003', arrivalTime: '08:30', waitTime: 10, status: 'في الانتظار', serviceType: 'دفع', assignedTo: '' },
  { id: 'Q-004', patientName: 'نورة عبدالعزيز', ticketNumber: 'T-1004', arrivalTime: '08:05', waitTime: 35, status: 'قيد الخدمة', serviceType: 'استشارة', assignedTo: 'هند المطيري' },
  { id: 'Q-005', patientName: 'خالد ياسر', ticketNumber: 'T-1005', arrivalTime: '08:35', waitTime: 5, status: 'في الانتظار', serviceType: 'تسجيل دخول', assignedTo: '' },
  { id: 'Q-006', patientName: 'سارة فهد', ticketNumber: 'T-1006', arrivalTime: '07:50', waitTime: 50, status: 'مكتمل', serviceType: 'تسجيل دخول', assignedTo: 'سارة القحطاني' },
  { id: 'Q-007', patientName: 'رائد ناصر', ticketNumber: 'T-1007', arrivalTime: '08:40', waitTime: 0, status: 'ملغي', serviceType: 'دفع', assignedTo: '' },
  { id: 'Q-008', patientName: 'مريم أحمد', ticketNumber: 'T-1008', arrivalTime: '08:42', waitTime: 0, status: 'في الانتظار', serviceType: 'تسجيل دخول', assignedTo: '' },
  { id: 'Q-009', patientName: 'عمر خالد', ticketNumber: 'T-1009', arrivalTime: '08:10', waitTime: 30, status: 'قيد الخدمة', serviceType: 'استشارة', assignedTo: 'نورة الدوسري' },
  { id: 'Q-010', patientName: 'هند سعيد', ticketNumber: 'T-1010', arrivalTime: '08:45', waitTime: 0, status: 'في الانتظار', serviceType: 'تسجيل دخول', assignedTo: '' },
];

const branchOptions = ['الكل', 'الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'];

export default function ReceptionPage() {
  const [staff, setStaff] = useState<ReceptionStaff[]>(initialStaff);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('performance');
  const [branchFilter, setBranchFilter] = useState('الكل');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueTime((t) => t + 1);
      setQueue((prev) =>
        prev.map((item) => {
          if (item.status === 'في الانتظار') {
            return { ...item, waitTime: item.waitTime + 1 };
          }
          return item;
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { title: 'موظفي الاستقبال النشطون', value: '18', change: '+2', trend: 'up' as const },
    { title: 'طلبات الانتظار', value: String(queue.filter((q) => q.status === 'في الانتظار').length), change: '+3', trend: 'up' as const },
    { title: 'متوسط وقت الخدمة', value: '4.5 دقيقة', change: '-0.3', trend: 'down' as const },
    { title: 'معدل الخدمة/ساعة', value: '42', change: '+5', trend: 'up' as const },
  ];

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch = s.name.includes(searchQuery);
      const matchesBranch = branchFilter === 'الكل' || s.branch === branchFilter;
      return matchesSearch && matchesBranch;
    });
  }, [staff, searchQuery, branchFilter]);

  const queueStats = useMemo(() => ({
    waiting: queue.filter((q) => q.status === 'في الانتظار').length,
    inService: queue.filter((q) => q.status === 'قيد الخدمة').length,
    completed: queue.filter((q) => q.status === 'مكتمل').length,
    cancelled: queue.filter((q) => q.status === 'ملغي').length,
    total: queue.length,
    avgWait: Math.round(queue.filter((q) => q.waitTime > 0).reduce((sum, q) => sum + q.waitTime, 0) / queue.filter((q) => q.waitTime > 0).length) || 0,
  }), [queue]);

  const performanceData = useMemo(() => {
    return [...filteredStaff].sort((a, b) => b.performanceRating - a.performanceRating);
  }, [filteredStaff]);

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الاستقبال</h1>
          <p className="mt-1 text-muted-foreground">مراقبة أداء الاستقبال و queue المرضى في الوقت الفعلي</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            const newTicket: QueueItem = {
              id: `Q-${String(queue.length + 1).padStart(3, '0')}`,
              patientName: 'مريض جديد',
              ticketNumber: `T-${1011 + queue.length}`,
              arrivalTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
              waitTime: 0,
              status: 'في الانتظار',
              serviceType: 'تسجيل دخول',
              assignedTo: '',
            };
            setQueue([...queue, newTicket]);
          }}>+ طلب جديد</Button>
          <Button variant="outline">📊 تصدير التقرير</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} trend={stat.trend} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">حالة الـ Queue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-foreground">في الانتظار</span>
              </div>
              <Badge variant="warning">{queueStats.waiting}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-foreground">قيد الخدمة</span>
              </div>
              <Badge variant="default">{queueStats.inService}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-foreground">مكتمل</span>
              </div>
              <Badge variant="success">{queueStats.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-foreground">ملغي</span>
              </div>
              <Badge variant="destructive">{queueStats.cancelled}</Badge>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">متوسط الانتظار:</span>
                <span className="font-medium text-foreground">{queueStats.avgWait} دقيقة</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الطلبات:</span>
                <span className="font-medium text-foreground">{queueStats.total}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">نسبة الإنجاز</span>
                <span className="text-foreground">{queueStats.total > 0 ? Math.round((queueStats.completed / queueStats.total) * 100) : 0}%</span>
              </div>
              <ProgressBar value={queueStats.total > 0 ? (queueStats.completed / queueStats.total) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ال_queue في الوقت الفعلي</CardTitle>
              <Badge variant="outline" className="animate-pulse">محدّث الآن</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">التذكرة</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">المريض</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">الخدمة</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">الوقت</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">الانتظار</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">الحالة</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} className={cn(
                      'border-b border-border transition-colors',
                      item.status === 'في الانتظار' && item.waitTime > 20 && 'bg-red-500/5',
                      item.status === 'قيد الخدمة' && 'bg-blue-500/5',
                      item.status === 'مكتمل' && 'bg-green-500/5',
                      item.status === 'ملغي' && 'bg-muted/30 opacity-60',
                    )}>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.ticketNumber}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{item.patientName}</td>
                      <td className="px-3 py-2 text-foreground">{item.serviceType}</td>
                      <td className="px-3 py-2 text-muted-foreground" dir="ltr">{item.arrivalTime}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          'font-medium',
                          item.waitTime > 30 ? 'text-red-500' : item.waitTime > 15 ? 'text-yellow-500' : 'text-foreground'
                        )}>
                          {item.waitTime} دقيقة
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            item.status === 'في الانتظار' ? 'warning' :
                            item.status === 'قيد الخدمة' ? 'default' :
                            item.status === 'مكتمل' ? 'success' : 'destructive'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.assignedTo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>أداء موظفي الاستقبال</CardTitle>
            <div className="flex gap-3">
              <SearchInput placeholder="بحث بالاسم..." value={searchQuery} onChange={setSearchQuery} className="w-64" />
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {branchOptions.map((b) => <option key={b} value={b}>الفرع: {b}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="performance">الأداء</TabsTrigger>
              <TabsTrigger value="schedule">جدول العمل</TabsTrigger>
              <TabsTrigger value="reports">التقارير</TabsTrigger>
            </TabsList>

            <TabsContent value="performance">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الموظف</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">الفرع</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">حالة الخدمة</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">عدد المرضى</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">وقت الخدمة المتوسط</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">تقييم الأداء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((member, index) => (
                      <tr key={member.id} className="border-b border-border transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
                        <td className="px-4 py-3 text-foreground">{member.branch}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              member.serviceStatus.includes('متاح') ? 'success' :
                              member.serviceStatus === 'مشغول' ? 'warning' :
                              member.serviceStatus === 'في استراحة' ? 'default' : 'destructive'
                            }
                          >
                            {member.serviceStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{member.totalServedToday}</div>
                          {member.currentQueue > 0 && (
                            <div className="text-xs text-yellow-500">+{member.currentQueue} في الانتظار</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'font-medium',
                            member.avgServiceTime <= 4 ? 'text-green-500' : member.avgServiceTime <= 5 ? 'text-yellow-500' : 'text-red-500'
                          )}>
                            {member.avgServiceTime} دقيقة
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={member.performanceRating} className="w-20" />
                            <span className="text-xs font-medium text-foreground">{member.performanceRating}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm">مقارنة الأداء حسب الفرع</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'].map((branch) => {
                        const branchStaff = filteredStaff.filter((s) => s.branch === branch);
                        const avgPerf = branchStaff.length > 0
                          ? Math.round(branchStaff.reduce((sum, s) => sum + s.performanceRating, 0) / branchStaff.length)
                          : 0;
                        const avgTime = branchStaff.length > 0
                          ? (branchStaff.reduce((sum, s) => sum + s.avgServiceTime, 0) / branchStaff.length).toFixed(1)
                          : '0';
                        return (
                          <div key={branch}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-foreground">{branch}</span>
                              <span className="text-muted-foreground">متوسط الأداء: {avgPerf}% | متوسط الوقت: {avgTime} دقيقة</span>
                            </div>
                            <ProgressBar value={avgPerf} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">توزيع حالات الخدمة</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['متاح', 'مشغول', 'في استراحة', 'غير متصل'].map((status) => {
                        const count = filteredStaff.filter((s) => s.serviceStatus.includes(status)).length;
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <Badge variant={
                              status === 'متاح' ? 'success' : status === 'مشغول' ? 'warning' : status === 'في استراحة' ? 'default' : 'destructive'
                            }>
                              {status}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-foreground">{count} موظف</span>
                              <span className="text-xs text-muted-foreground">{Math.round((count / filteredStaff.length) * 100)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {['الصباحي (06:00 - 14:00)', 'المسائي (14:00 - 22:00)', 'الليلي (22:00 - 06:00)'].map((shift, idx) => (
                  <Card key={shift}>
                    <CardHeader>
                      <CardTitle className="text-sm">{shift}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredStaff.filter((_, i) => (i + idx) % 3 === 0).map((member) => (
                          <div key={member.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <div className="font-medium text-foreground">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.branch}</div>
                            </div>
                            <Badge variant={member.serviceStatus.includes('متاح') ? 'success' : member.serviceStatus === 'مشغول' ? 'warning' : 'default'}>
                              {member.serviceStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle className="text-sm">إحصائيات اليوم</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">إجمالي المرضى:</span><span className="font-medium text-foreground">96</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">متوسط وقت الانتظار:</span><span className="font-medium text-foreground">4.5 دقيقة</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">نسبة الرضا:</span><span className="font-medium text-foreground">94.5%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">الطلبات الملغاة:</span><span className="font-medium text-foreground">3</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">ساعات العمل الإجمالية:</span><span className="font-medium text-foreground">144 ساعة</span></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">مقارنة بالأسبوع السابق</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المرضى:</span>
                      <span className="text-green-500">+12%</span>
                    </div>
                    <ProgressBar value={85} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">سرعة الخدمة:</span>
                      <span className="text-green-500">+8%</span>
                    </div>
                    <ProgressBar value={78} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رضا المرضى:</span>
                      <span className="text-green-500">+2%</span>
                    </div>
                    <ProgressBar value={94} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">ساعات الذروة</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'].map((time, i) => {
                      const load = [95, 72, 88, 65][i];
                      return (
                        <div key={time}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-foreground">{time}</span>
                            <span className="text-muted-foreground">{load}% حمولة</span>
                          </div>
                          <ProgressBar value={load} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">أنواع الخدمات</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { type: 'تسجيل دخول', count: 45, pct: 47 },
                      { type: 'دفع', count: 22, pct: 23 },
                      { type: 'استشارة', count: 18, pct: 19 },
                      { type: 'معلومات', count: 11, pct: 11 },
                    ].map((item) => (
                      <div key={item.type}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-foreground">{item.type}</span>
                          <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
                        </div>
                        <ProgressBar value={item.pct} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">أفضل الموظفين هذا الأسبوع</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceData.slice(0, 4).map((member, i) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'
                          )}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.totalServedToday} مريض | {member.satisfactionScore}⭐</div>
                          </div>
                          <span className="text-sm font-medium text-foreground">{member.performanceRating}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">تنبيهات الأداء</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm">
                      <span className="font-medium text-yellow-500">⚠️ تحذير:</span>
                      <span className="text-foreground mr-2">وقت الانتظار في الفرع الرئيسي يتجاوز 20 دقيقة</span>
                    </div>
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
                      <span className="font-medium text-red-500">🚨 تنبيه:</span>
                      <span className="text-foreground mr-2">ياسر العتيبي غير متصل منذ 2 ساعة</span>
                    </div>
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm">
                      <span className="font-medium text-green-500">✅ ملاحظة:</span>
                      <span className="text-foreground mr-2">سارة القحطاني حققت أعلى تقييم اليوم</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
