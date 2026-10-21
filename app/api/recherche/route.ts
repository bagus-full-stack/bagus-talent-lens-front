import { NextRequest, NextResponse } from 'next/server';
import { parseSearchFiltersFromParams } from '@/lib/search/search-params';
import { executeCandidateSearch } from '@/lib/search/search-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseSearchFiltersFromParams(searchParams);
    const pageSizeParam = searchParams.get('pageSize');
    const pageSize = pageSizeParam ? Math.max(1, Math.min(50, Number(pageSizeParam))) : 6;

    const result = executeCandidateSearch(filters, pageSize);

    // Si un critère protégé est détecté, renvoie une structure dédiée avec code PROTECTED_CRITERION
    if (result.protectedCriterion) {
      return NextResponse.json({
        code: 'PROTECTED_CRITERION',
        ...result.protectedCriterion,
        candidates: [],
        totalCount: 0,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du traitement de la recherche sémantique' },
      { status: 500 }
    );
  }
}
