import { NextRequest, NextResponse } from 'next/server';
import { chatbotRepository } from '@/lib/chatbot/chatbot-repository';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { messageId, feedback } = await req.json();
    if (!messageId || (feedback !== 'helpful' && feedback !== 'unhelpful' && feedback !== null)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const ok = chatbotRepository.updateFeedback(id, messageId, feedback);
    if (!ok) {
      return NextResponse.json({ error: 'Message ou conversation introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
