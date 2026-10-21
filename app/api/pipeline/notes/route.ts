import { NextRequest, NextResponse } from 'next/server';
import { pipelineStore } from '@/lib/pipeline/pipeline-store';

export async function POST(req: NextRequest) {
  try {
    const { candidacyId, content, authorName } = await req.json();
    if (!candidacyId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Contenu de note requis' }, { status: 400 });
    }

    const ok = pipelineStore.addNote(candidacyId, content, authorName);
    if (!ok) {
      return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });
    }

    const candidacy = pipelineStore.getCandidacy(candidacyId);
    return NextResponse.json({ success: true, candidacy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur note' }, { status: 500 });
  }
}
