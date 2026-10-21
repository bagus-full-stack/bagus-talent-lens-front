import { NextRequest, NextResponse } from 'next/server';
import { chatbotRepository } from '@/lib/chatbot/chatbot-repository';
import { CreateConversationSchema } from '@/lib/schemas/chatbot';

export async function GET() {
  const conversations = chatbotRepository.getConversations();
  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const conv = chatbotRepository.createConversation({
      title: parsed.data.title,
      selectedFolderIds: parsed.data.selectedFolderIds,
    });

    if (parsed.data.initialMessage) {
      chatbotRepository.addMessage(conv.id, {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: parsed.data.initialMessage,
        createdAt: new Date().toISOString(),
        status: 'complete',
        type: 'text',
      });
    }

    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
