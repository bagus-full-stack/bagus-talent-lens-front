import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shortlist = shortlistStore.getShortlist(id);
  if (!shortlist) {
    return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
  }
  return NextResponse.json({ shortlist });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = shortlistStore.updateShortlist(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
    }
    return NextResponse.json({ shortlist: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = shortlistStore.deleteShortlist(id);
  if (!success) {
    return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
