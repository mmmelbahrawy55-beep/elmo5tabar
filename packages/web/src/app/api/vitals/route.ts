import { NextRequest, NextResponse } from 'next/server';

interface VitalsPayload {
  name: string;
  value: number;
  rating: string;
  attribution?: Record<string, unknown>;
}

const vitalsBuffer: VitalsPayload[] = [];
const FLUSH_INTERVAL = 60_000;

export async function POST(request: NextRequest) {
  try {
    const data: VitalsPayload = await request.json();
    vitalsBuffer.push(data);

    // In production, flush to your analytics backend
    if (process.env.NODE_ENV === 'production' && vitalsBuffer.length >= 10) {
      const copy = [...vitalsBuffer];
      vitalsBuffer.length = 0;
      flushVitals(copy).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

async function flushVitals(metrics: VitalsPayload[]) {
  const endpoint = process.env.VITALS_BACKEND_URL;
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, timestamp: Date.now(), source: 'web-vitals' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Silently fail — vitals collection should never block the app
  }
}
