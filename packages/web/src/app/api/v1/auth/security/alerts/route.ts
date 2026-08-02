import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'alert-1',
      type: 'login_from_new_device',
      title: 'تسجيل دخول من جهاز جديد',
      description: 'تم تسجيل الدخول من جهاز جديد في الرياض، السعودية',
      severity: 'warning',
      timestamp: '2026-08-02T10:30:00Z',
      resolved: false,
    },
    {
      id: 'alert-2',
      type: 'password_changed',
      title: 'تم تغيير كلمة المرور',
      description: 'تم تغيير كلمة المرور بنجاح',
      severity: 'info',
      timestamp: '2026-07-28T15:20:00Z',
      resolved: true,
    },
    {
      id: 'alert-3',
      type: 'suspicious_activity',
      title: 'نشاط مشبوه',
      description: 'تم اكتشاف محاولات دخول متعددة فاشلة',
      severity: 'critical',
      timestamp: '2026-07-25T03:45:00Z',
      resolved: true,
    },
  ]);
}
