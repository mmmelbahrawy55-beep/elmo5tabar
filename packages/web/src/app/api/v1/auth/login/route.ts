import { NextResponse } from 'next/server';

const users: Record<string, any> = {
  '+201012345678': {
    id: '1',
    email: 'admin@almokhtabar.com',
    phone: '+201012345678',
    firstNameAr: 'مدير',
    lastNameAr: 'النظام',
    firstNameEn: 'Admin',
    lastNameEn: 'User',
    role: 'SUPER_ADMIN',
    avatarUrl: null,
    twoFactorEnabled: false,
    password: 'Admin@123',
    status: 'ACTIVE',
  },
  '+201098765432': {
    id: '2',
    email: 'patient@example.com',
    phone: '+201098765432',
    firstNameAr: 'أحمد',
    lastNameAr: 'محمد',
    firstNameEn: 'Ahmed',
    lastNameEn: 'Mohammed',
    role: 'PATIENT',
    avatarUrl: null,
    twoFactorEnabled: false,
    password: 'Patient@123',
    status: 'ACTIVE',
  },
};

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'البيانات مطلوبة' }, { status: 400 });
    }

    const user = users[email];
    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'البيانات غير صحيحة' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'الحساب غير نشط' }, { status: 403 });
    }

    const { password: _, ...safeUser } = user;
    const accessToken = generateToken();
    const refreshToken = generateToken();

    return NextResponse.json({
      user: safeUser,
      tokens: { accessToken, refreshToken },
    });
  } catch {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
