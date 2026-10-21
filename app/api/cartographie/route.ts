import { NextRequest, NextResponse } from 'next/server';
import { cartographyStore } from '@/lib/cartographie/cartographie-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countParam = searchParams.get('count');
    const count = countParam ? Math.min(50000, Math.max(10, parseInt(countParam, 10))) : 1200;

    const data = cartographyStore.getData(count);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur cartographie' }, { status: 500 });
  }
}
