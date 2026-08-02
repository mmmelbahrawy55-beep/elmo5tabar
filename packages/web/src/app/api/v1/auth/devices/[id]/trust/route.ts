import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'معرف الجهاز مطلوب' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { trusted } = body;

    if (typeof trusted !== 'boolean') {
      return NextResponse.json({ message: 'قيمة الثقة مطلوبة' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
