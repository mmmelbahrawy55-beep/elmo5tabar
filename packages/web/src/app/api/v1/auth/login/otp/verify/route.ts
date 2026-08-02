import { NextRequest, NextResponse } from 'next/server';

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ message: 'البريد الإلكتروني ورمز التحقق مطلوبان' }, { status: 400 });
    }

    if (code !== '123456') {
      return NextResponse.json({ message: 'رمز التحقق غير صحيح' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: '1',
        email: 'admin@almokhtabar.com',
        phone: '+966501234567',
        firstNameAr: 'مدير',
        lastNameAr: 'النظام',
        firstNameEn: 'Admin',
        lastNameEn: 'User',
        role: 'SUPER_ADMIN',
        avatarUrl: null,
        twoFactorEnabled: false,
        status: 'ACTIVE',
      },
      tokens: { accessToken: generateToken(), refreshToken: generateToken() },
    });
  } catch {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
