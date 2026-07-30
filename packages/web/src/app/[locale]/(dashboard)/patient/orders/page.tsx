'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Search, Filter, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  collectionType: string;
  items: Array<{
    id: string;
    labTest: { nameAr: string; nameEn: string; code: string };
    price: number;
  }>;
  reports: Array<{ id: string; status: string }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'قيد الانتظار', color: 'badge-warning', icon: Clock },
  CONFIRMED: { label: 'مؤكد', color: 'badge-info', icon: CheckCircle2 },
  SAMPLE_COLLECTED: { label: 'تم جمع العينة', color: 'badge-info', icon: CheckCircle2 },
  IN_PROGRESS: { label: 'قيد المعالجة', color: 'badge-info', icon: Clock },
  COMPLETED: { label: 'مكتمل', color: 'badge-success', icon: CheckCircle2 },
  CANCELLED: { label: 'ملغي', color: 'badge-danger', icon: AlertCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/orders?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">طلباتي</h1>
        <p className="page-subtitle">تتبع جميع طلبات التحاليل</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !statusFilter ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            الكل
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === key ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-20">
          <FileText className="h-16 w-16 mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-700">لا توجد طلبات</h3>
          <p className="text-sm text-surface-500 mt-2">لم تقم بأي طلب بعد</p>
          <Link href="/ar/patient/tests" className="mt-4 inline-flex btn-primary">
            اطلب تحليلاً الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="card p-6 animate-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      order.status === 'COMPLETED' ? 'bg-success-50' : 'bg-brand-50'
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${
                        order.status === 'COMPLETED' ? 'text-success-500' : 'text-brand-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-surface-900 font-mono">{order.orderNumber}</h3>
                        <span className={status.color}>{status.label}</span>
                      </div>
                      <p className="text-xs text-surface-500 mt-1">{formatDate(order.createdAt)}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.items.slice(0, 3).map((item) => (
                          <span key={item.id} className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded">
                            {item.labTest.nameAr}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs text-brand-500">+{order.items.length - 3} أكثر</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="text-lg font-bold text-surface-900">{order.total} ر.س</div>
                      <div className="text-xs text-surface-500">{order.items.length} تحاليل</div>
                    </div>
                    <Link
                      href={`/ar/patient/orders/${order.id}`}
                      className="btn-ghost text-brand-500"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {order.reports.length > 0 && (
                  <div className="mt-4 border-t border-surface-100 pt-4">
                    <div className="flex items-center gap-2 text-sm text-surface-600">
                      <FileText className="h-4 w-4" />
                      <span>{order.reports.length} تقرير متاح</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-ghost btn-sm disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-surface-600">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-ghost btn-sm disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
