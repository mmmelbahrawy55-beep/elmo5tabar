import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    codes: [
      'a1b2-c3d4-e5f6',
      'g7h8-i9j0-k1l2',
      'm3n4-o5p6-q7r8',
      's9t0-u1v2-w3x4',
      'y5z6-a7b8-c9d0',
      'e1f2-g3h4-i5j6',
      'k7l8-m9n0-o1p2',
      'q3r4-s5t6-u7v8',
      'w9x0-y1z2-a3b4',
      'c5d6-e7f8-g9h0',
    ],
  });
}
