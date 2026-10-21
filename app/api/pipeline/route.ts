import { NextRequest, NextResponse } from 'next/server';
import { pipelineStore, RECRUITERS } from '@/lib/pipeline/pipeline-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') || undefined;

    const stages = pipelineStore.getStages();
    const candidacies = pipelineStore.getCandidacies(folderId);

    return NextResponse.json({
      stages,
      candidacies,
      recruiters: RECRUITERS,
      totalCount: candidacies.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur pipeline' }, { status: 500 });
  }
}
