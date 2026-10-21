import { NextRequest, NextResponse } from 'next/server';
import { chatbotRepository } from '@/lib/chatbot/chatbot-repository';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = chatbotRepository.getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = chatbotRepository.updateConversation(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ conversation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = chatbotRepository.deleteConversation(id);
  if (!success) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
