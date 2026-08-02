import { NextResponse } from 'next/server';

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function POST() {
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
    },
    tokens: { accessToken: generateToken(), refreshToken: generateToken() },
  });
}
