import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { candidateIds } = await req.json();
    if (!Array.isArray(candidateIds)) {
      return NextResponse.json({ error: 'candidateIds requis' }, { status: 400 });
    }

    const updated = shortlistStore.addCandidates(id, candidateIds);
    if (!updated) {
      return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shortlist: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur ajout' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { candidateId } = await req.json();
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId requis' }, { status: 400 });
    }

    const updated = shortlistStore.removeCandidate(id, candidateId);
    if (!updated) {
      return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shortlist: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur suppression' }, { status: 500 });
  }
}
