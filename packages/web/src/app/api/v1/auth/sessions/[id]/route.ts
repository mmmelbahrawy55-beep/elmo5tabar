import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'معرف الجلسة مطلوب' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
