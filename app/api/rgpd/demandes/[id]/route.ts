import { NextRequest, NextResponse } from 'next/server';
import { getDsrRepository } from '@/lib/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const repo = getDsrRepository() as any;
    const dsr = await repo.getById(decodedId);

    if (!dsr) {
      return NextResponse.json({ error: `Demande '${decodedId}' introuvable` }, { status: 404 });
    }

    return NextResponse.json({ dsr });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
