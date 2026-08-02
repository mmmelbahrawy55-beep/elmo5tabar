'use client';

import { usePathname } from 'next/navigation';
import { Activity, Users, FileText, Calendar, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboard() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">لوحة التحكم</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">مرحباً بك في لوحة تحكم الطبيب</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'المرضى今日', value: '12', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Calendar, label: 'المواعيد', value: '5', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { icon: FileText, label: 'التقارير', value: '8', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: Clock, label: 'في الانتظار', value: '3', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map((item, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{item.value}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
