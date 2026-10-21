import { NextRequest, NextResponse } from 'next/server';
import { cartographyStore } from '@/lib/cartographie/cartographie-service';

export async function POST(_req: NextRequest) {
  try {
    // Simulation d'un recalcul asynchrone (nouveaux CV placés sans déplacer les autres)
    const result = cartographyStore.recalculate();
    return NextResponse.json({
      success: true,
      lastCalculatedAt: result.lastCalculatedAt,
      message: 'Recalcul UMAP incrémental terminé. Positions stabilisées.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur recalcul' }, { status: 500 });
  }
}
