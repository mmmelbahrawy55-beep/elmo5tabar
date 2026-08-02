import { NextResponse } from 'next/server';

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const mockGoogleUser = {
  id: 'google-' + Math.random().toString(36).slice(2, 10),
  email: 'user@gmail.com',
  phone: '+201055555555',
  firstNameAr: 'مستخدم',
  lastNameAr: 'Google',
  firstNameEn: 'Google',
  lastNameEn: 'User',
  role: 'PATIENT',
  avatarUrl: null,
  twoFactorEnabled: false,
  status: 'ACTIVE',
  provider: 'google',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 },
      );
    }

    const user = {
      ...mockGoogleUser,
      id: 'google-' + Math.random().toString(36).slice(2, 10),
    };

    const accessToken = generateToken();
    const refreshToken = generateToken();

    return NextResponse.json({
      user,
      tokens: { accessToken, refreshToken },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
