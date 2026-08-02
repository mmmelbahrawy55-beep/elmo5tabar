import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'sess-1',
      device: 'Chrome 120 on Windows 11',
      ip: '192.168.1.100',
      location: 'الرياض، السعودية',
      lastActive: '2026-08-02T10:30:00Z',
      createdAt: '2026-08-01T08:00:00Z',
      current: true,
    },
    {
      id: 'sess-2',
      device: 'Safari on iPhone 15',
      ip: '10.0.0.55',
      location: 'جدة، السعودية',
      lastActive: '2026-08-02T09:15:00Z',
      createdAt: '2026-07-30T14:22:00Z',
      current: false,
    },
    {
      id: 'sess-3',
      device: 'Firefox on macOS',
      ip: '172.16.0.200',
      location: 'الدمام، السعودية',
      lastActive: '2026-08-01T22:45:00Z',
      createdAt: '2026-07-28T11:10:00Z',
      current: false,
    },
  ]);
}
