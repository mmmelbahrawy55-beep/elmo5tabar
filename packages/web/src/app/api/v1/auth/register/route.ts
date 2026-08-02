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
    const { email, password, phone, firstNameAr, lastNameAr, firstNameEn, lastNameEn } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    if (Object.values(users).find(u => u.email === email)) {
      return NextResponse.json({ message: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
    }

    const userId = generateId();
    const user = {
      id: userId,
      email,
      phone: phone || '',
      firstNameAr: firstNameAr || '',
      lastNameAr: lastNameAr || '',
      firstNameEn: firstNameEn || '',
      lastNameEn: lastNameEn || '',
      role: 'PATIENT',
      avatarUrl: null,
      twoFactorEnabled: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    users[email] = { ...user, password };

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
