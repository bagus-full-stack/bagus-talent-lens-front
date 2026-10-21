import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { orderedCandidateIds } = await req.json();
    if (!Array.isArray(orderedCandidateIds)) {
      return NextResponse.json({ error: 'orderedCandidateIds doit être un tableau' }, { status: 400 });
    }

    const updated = shortlistStore.reorderCandidates(id, orderedCandidateIds);
    if (!updated) {
      return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shortlist: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur réordonnancement' }, { status: 500 });
  }
}
