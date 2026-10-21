import { NextRequest, NextResponse } from 'next/server';
import { mockVerificationRepository } from '@/lib/mock/repositories/mock-verification-repository';
import { getServerCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const motif = searchParams.get('motif') as any || 'all';
    const folderId = searchParams.get('folderId') || 'all';
    const status = searchParams.get('status') as any || 'all';
    const dateRange = searchParams.get('dateRange') as any || 'all';
    const search = searchParams.get('search') || '';

    const result = await mockVerificationRepository.getItems({
      motif,
      folderId,
      status,
      dateRange,
      search,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du chargement des éléments à vérifier' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, fieldKey, action, correctedValue, reason, simulateError } = body;

    // Simulation délibérée d'erreur serveur pour tester le rollback optimiste TanStack Query
    if (simulateError) {
      return NextResponse.json(
        { error: 'Simulation d’erreur réseau / serveur (Code HTTP 500). Rollback optimiste déclenché.' },
        { status: 500 }
      );
    }

    const user = await getServerCurrentUser();
    const actor = { name: user?.name || 'Recruteur TalentLens' };

    // Cas 1 : Résolution de contenu suspect (exclude ou confirm_clean)
    if (action === 'exclude' || action === 'confirm_clean') {
      const result = await mockVerificationRepository.resolveSuspiciousContent(
        itemId,
        action,
        reason,
        actor
      );
      return NextResponse.json(result);
    }

    // Cas 2 : Action par champ (validate, correct, ignore)
    if (itemId && fieldKey && (action === 'validate' || action === 'correct' || action === 'ignore')) {
      const result = await mockVerificationRepository.updateDoubtfulField(
        itemId,
        fieldKey,
        action,
        correctedValue,
        actor
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la mise à jour' },
      { status: 400 }
    );
  }
}
