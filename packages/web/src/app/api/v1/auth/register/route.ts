import { NextResponse } from 'next/server';

const users: Record<string, any> = {};

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password, firstNameAr, lastNameAr } = body;

    if (!phone || !password) {
      return NextResponse.json({ message: 'رقم الهاتف وكلمة المرور مطلوبان' }, { status: 400 });
    }

    if (Object.values(users).find(u => u.phone === phone)) {
      return NextResponse.json({ message: 'رقم الهاتف مستخدم بالفعل' }, { status: 409 });
    }

    const userId = generateId();
    const user = {
      id: userId,
      email: '',
      phone,
      firstNameAr: firstNameAr || 'مستخدم',
      lastNameAr: lastNameAr || 'جديد',
      firstNameEn: '',
      lastNameEn: '',
      role: 'PATIENT',
      avatarUrl: null,
      twoFactorEnabled: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    users[phone] = { ...user, password };

    const accessToken = generateToken();
    const refreshToken = generateToken();

    return NextResponse.json({
      user,
      tokens: { accessToken, refreshToken },
    });
  } catch {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
