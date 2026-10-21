import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const duplicated = shortlistStore.duplicateShortlist(id);
  if (!duplicated) {
    return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
  }
  return NextResponse.json({ shortlist: duplicated }, { status: 201 });
}
