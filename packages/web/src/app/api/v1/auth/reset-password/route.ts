import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ message: 'الرمز وكلمة المرور الجديدة مطلوبان' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
