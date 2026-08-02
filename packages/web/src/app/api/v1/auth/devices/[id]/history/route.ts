import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'معرف الجهاز مطلوب' }, { status: 400 });
  }

  return NextResponse.json([
    {
      id: 'hist-1',
      action: 'login',
      ip: '192.168.1.100',
      location: 'الرياض، السعودية',
      timestamp: '2026-08-02T10:30:00Z',
    },
    {
      id: 'hist-2',
      action: 'password_change',
      ip: '192.168.1.100',
      location: 'الرياض، السعودية',
      timestamp: '2026-07-28T15:20:00Z',
    },
    {
      id: 'hist-3',
      action: 'login',
      ip: '192.168.1.100',
      location: 'الرياض، السعودية',
      timestamp: '2026-07-25T09:00:00Z',
    },
  ]);
}
