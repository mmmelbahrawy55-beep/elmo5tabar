import { NextResponse } from 'next/server';

function generateToken() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function POST() {
  return NextResponse.json({
    tokens: { accessToken: generateToken(), refreshToken: generateToken() },
  });
}
