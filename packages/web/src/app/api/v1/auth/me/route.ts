import { NextResponse } from 'next/server';

export async function GET() {
  const demoUser = {
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
  };

  return NextResponse.json(demoUser);
}
