'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  TestTube2,
  Calendar,
  CreditCard,
  Activity,
  Clock,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';

interface DashboardData {
  today: { orders: number; appointments: number; revenue: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: Array<{ labTest: { nameAr: string } }>;
  }>;
  recentReports: Array<{
    id: string;
    reportNumber: string;
    status: string;
    createdAt: string;
  }>;
  upcomingAppointments: Array<{
    id: string;
    scheduledAt: string;
    branch: { nameAr: string };
    status: string;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  SAMPLE_COLLECTED: 'badge-info',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  RELEASED: 'badge-success',
  DRAFT: 'badge-neutral',
  UNDER_REVIEW: 'badge-warning',
  SCHEDULED: 'badge-info',
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  SAMPLE_COLLECTED: 'تم جمع العينة',
  IN_PROGRESS: 'قيد المعالجة',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  RELEASED: 'منشور',
  DRAFT: 'مسودة',
  UNDER_REVIEW: 'قيد المراجعة',
  SCHEDULED: 'مجدول',
};

export default function PatientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">مرحباً بعودتك!</h1>
        <p className="page-subtitle">إليك ملخص نشاطك الصحي اليوم</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <FileText className="h-6 w-6 text-brand-500" />
            </div>
            <span className="stat-change stat-change-up">
              <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-4 stat-value">{data?.today?.orders || 0}</div>
          <div className="stat-label">طلبات جديدة</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50">
              <Activity className="h-6 w-6 text-accent-500" />
            </div>
          </div>
          <div className="mt-4 stat-value">{data?.today?.appointments || 0}</div>
          <div className="stat-label">مواعيد اليوم</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-500" />
            </div>
          </div>
          <div className="mt-4 stat-value">{data?.completedReportsToday || 0}</div>
          <div className="stat-label">تقارير جاهزة</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-saffron-50">
              <AlertCircle className="h-6 w-6 text-saffron-500" />
            </div>
          </div>
          <div className="mt-4 stat-value">{data?.pending?.orders || 0}</div>
          <div className="stat-label">في الانتظار</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-900">الطلبات الأخيرة</h2>
            <Link href="/ar/patient/orders" className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {data?.recentOrders?.length === 0 && (
              <div className="text-center py-12 text-surface-400">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">لا توجد طلبات بعد</p>
                <Link href="/ar/patient/tests" className="mt-3 inline-flex btn-primary btn-sm">
                  اطلب تحليلاً الآن
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-900">المواعيد القادمة</h2>
            <Link href="/ar/patient/appointments" className="text-sm font-medium text-brand-500 hover:text-brand-600">
              إدارة
            </Link>
          </div>
          <div className="space-y-4">
            {data?.upcomingAppointments?.length === 0 && (
              <div className="text-center py-8 text-surface-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">لا توجد مواعيد قادمة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-900">التقارير الأخيرة</h2>
          <Link href="/ar/patient/reports" className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        {data?.recentReports?.length === 0 && (
          <div className="text-center py-8 text-surface-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا توجد تقارير بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
