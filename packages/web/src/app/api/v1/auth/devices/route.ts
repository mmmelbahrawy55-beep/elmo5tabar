import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'dev-1',
      name: 'Chrome on Windows',
      type: 'desktop',
      os: 'Windows 11',
      browser: 'Chrome 120',
      lastSeen: '2026-08-02T10:30:00Z',
      createdAt: '2026-07-15T08:00:00Z',
      trusted: true,
    },
    {
      id: 'dev-2',
      name: 'Safari on iPhone',
      type: 'mobile',
      os: 'iOS 17.5',
      browser: 'Safari',
      lastSeen: '2026-08-02T09:15:00Z',
      createdAt: '2026-07-20T14:22:00Z',
      trusted: true,
    },
    {
      id: 'dev-3',
      name: 'Firefox on macOS',
      type: 'desktop',
      os: 'macOS Sonoma',
      browser: 'Firefox 121',
      lastSeen: '2026-08-01T22:45:00Z',
      createdAt: '2026-07-28T11:10:00Z',
      trusted: false,
    },
  ]);
}
