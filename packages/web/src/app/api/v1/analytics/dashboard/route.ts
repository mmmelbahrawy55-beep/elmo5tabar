import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      today: {
        orders: 3,
        appointments: 2,
        revenue: 1250,
      },
      completedReportsToday: 5,
      pending: {
        orders: 2,
      },
      recentOrders: [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: 'COMPLETED',
          total: 450,
          createdAt: new Date().toISOString(),
          collectionType: 'LAB',
          items: [
            { id: '1', labTest: { nameAr: 'تحليل دم شامل', nameEn: 'CBC', code: 'CBC01' }, price: 150 },
            { id: '2', labTest: { nameAr: 'سكر صائم', nameEn: 'Fasting Glucose', code: 'GLU01' }, price: 50 },
          ],
          reports: [{ id: 'r1', status: 'RELEASED' }],
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          status: 'PENDING',
          total: 350,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          collectionType: 'HOME',
          items: [
            { id: '3', labTest: { nameAr: 'وظائف كلى', nameEn: 'Kidney Function', code: 'KID01' }, price: 200 },
          ],
          reports: [],
        },
      ],
      upcomingAppointments: [
        {
          id: 'apt1',
          date: new Date(Date.now() + 86400000).toISOString(),
          time: '10:00',
          doctor: { nameAr: 'د. أحمد محمد', nameEn: 'Dr. Ahmed' },
          type: 'CHECKUP',
          status: 'CONFIRMED',
        },
      ],
      recentReports: [
        {
          id: 'rep1',
          title: 'تقرير تحاليل شاملة',
          date: new Date().toISOString(),
          status: 'RELEASED',
          type: 'LAB_REPORT',
        },
      ],
    },
  });
}
