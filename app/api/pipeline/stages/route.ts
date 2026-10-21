import { NextRequest, NextResponse } from 'next/server';
import { pipelineStore } from '@/lib/pipeline/pipeline-store';

export async function POST(req: NextRequest) {
  try {
    const { stages } = await req.json();
    if (!Array.isArray(stages)) {
      return NextResponse.json({ error: 'Liste des étapes invalide' }, { status: 400 });
    }

    const updated = pipelineStore.updateStages(stages);
    return NextResponse.json({ success: true, stages: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur configuration étapes' }, { status: 500 });
  }
}
