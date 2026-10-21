import { NextRequest, NextResponse } from 'next/server';
import { pipelineStore } from '@/lib/pipeline/pipeline-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidacyId, targetStageId, expectedVersion, reason, unmaskReason, recruiterName } = body;

    if (!candidacyId || !targetStageId) {
      return NextResponse.json({ error: 'candidacyId et targetStageId requis' }, { status: 400 });
    }

    const result = pipelineStore.moveCandidacy({
      candidacyId,
      targetStageId,
      expectedVersion: typeof expectedVersion === 'number' ? expectedVersion : 1,
      reason,
      unmaskReason,
      recruiterName,
    });

    if (!result.success) {
      if (result.conflict) {
        return NextResponse.json(
          { conflict: true, error: result.error, candidacy: result.candidacy },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, candidacy: result.candidacy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur transition' }, { status: 500 });
  }
}
