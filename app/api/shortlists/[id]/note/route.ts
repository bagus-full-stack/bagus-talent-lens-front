import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { candidateId, note } = await req.json();
    if (!candidateId || typeof note !== 'string') {
      return NextResponse.json({ error: 'candidateId et note requis' }, { status: 400 });
    }

    const ok = shortlistStore.updateCandidateNote(id, candidateId, note);
    if (!ok) {
      return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidateId, note });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur note' }, { status: 500 });
  }
}
