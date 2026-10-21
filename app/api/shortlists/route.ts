import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';
import { CreateShortlistInputSchema } from '@/lib/schemas/shortlist';

export async function GET() {
  const list = shortlistStore.getShortlists();
  return NextResponse.json({ shortlists: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateShortlistInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const created = shortlistStore.createShortlist(parsed.data);
    return NextResponse.json({ shortlist: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur création shortlist' }, { status: 500 });
  }
}
