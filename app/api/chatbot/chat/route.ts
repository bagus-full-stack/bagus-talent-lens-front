import { NextRequest } from 'next/server';
import { chatbotRepository } from '@/lib/chatbot/chatbot-repository';
import { checkProtectedCriterion } from '@/lib/search/protected-criteria';
import type { CitationSource, ChatMessage } from '@/lib/schemas/chatbot';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message, folderIds = [], blindMode = true } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const convId =
      conversationId ||
      chatbotRepository.createConversation({
        title: message.slice(0, 35),
        selectedFolderIds: folderIds,
      }).id;

    // 1. Audit éthique de critère protégé (Art. L1132-1)
    const protectedAudit = checkProtectedCriterion(message);

    const encoder = new TextEncoder();

    if (protectedAudit.isProtected) {
      // Sauvegarde du message utilisateur
      const userMsg: ChatMessage = {
        id: `msg-usr-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'complete',
        type: 'text',
      };
      chatbotRepository.addMessage(convId, userMsg);

      // Sauvegarde du refus
      const refusalMsg: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: protectedAudit.message,
        createdAt: new Date().toISOString(),
        status: 'complete',
        type: 'refusal',
        refusalDetails: {
          code: 'PROTECTED_CRITERION',
          category: protectedAudit.category,
          categoryLabel: protectedAudit.categoryLabel,
          detectedSnippet: protectedAudit.detectedSnippet,
          legalNotice: protectedAudit.legalNotice,
          message: protectedAudit.message,
          suggestion: protectedAudit.suggestion,
        },
      };
      chatbotRepository.addMessage(convId, refusalMsg);

      const stream = new ReadableStream({
        start(controller) {
          const payload = JSON.stringify({
            type: 'refusal',
            refusal: refusalMsg.refusalDetails,
            messageId: refusalMsg.id,
            conversationId: convId,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // 2. Sauvegarde du message utilisateur
    const userMsg: ChatMessage = {
      id: `msg-usr-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'complete',
      type: 'text',
    };
    chatbotRepository.addMessage(convId, userMsg);

    // 3. Recherche de chunks RAG
    const chunks = chatbotRepository.searchChunks(message, folderIds);

    const stream = new ReadableStream({
      async start(controller) {
        if (req.signal.aborted) {
          controller.close();
          return;
        }

        // Cas : Aucun résultat sourcé
        if (chunks.length === 0) {
          const emptyText =
            "Aucun profil sourcé ne correspond précisément aux critères de votre requête dans les dossiers interrogés. Nous vous recommandons d'élargir les compétences demandées ou de sélectionner d'autres dossiers dans le sélecteur ci-dessus.";

          const emptyMsg: ChatMessage = {
            id: `msg-asst-${Date.now()}`,
            role: 'assistant',
            content: emptyText,
            createdAt: new Date().toISOString(),
            status: 'complete',
            type: 'empty_sources',
          };
          chatbotRepository.addMessage(convId, emptyMsg);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'empty_sources',
                text: emptyText,
                messageId: emptyMsg.id,
                conversationId: convId,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
          return;
        }

        // Cas normal : Génération avec citations
        const citations: CitationSource[] = chunks.map((chk, i) => ({
          index: i + 1,
          chunkId: chk.chunkId,
          candidateId: chk.candidateId,
          candidatePseudonym: chk.candidatePseudonym,
          folderId: chk.folderId,
          folderReference: chk.folderReference,
          jobTitle: chk.jobTitle,
          page: chk.page,
          bbox: chk.bbox,
          snippet: chk.snippet,
          relevanceScore: Math.max(70, 96 - i * 5),
          verified: true,
        }));

        // Construction du texte synthétique
        const intro = `D'après les extraits probants des dossiers interrogés, voici une analyse objective des profils correspondants :\n\n`;
        const profileBullets = chunks
          .map((chk, i) => {
            const cite = `[${i + 1}]`;
            return `• **${chk.candidatePseudonym}** (${chk.jobTitle}) ${cite} :\n  - Preuves : ${chk.snippet.slice(0, 160)}...\n  - Pertinence : Adéquation directe avec les exigences techniques relevées à la page ${chk.page}.`;
          })
          .join('\n\n');

        const outro = `\n\n*Rappel éthique : L'évaluation repose uniquement sur les éléments factuels attestés dans les CV sources. Aucune inférence sur critères personnels n'est effectuée.*`;

        const fullResponseText = intro + profileBullets + outro;

        // Préparation du message côté repository
        const asstMsgId = `msg-asst-${Date.now()}`;
        const asstMsg: ChatMessage = {
          id: asstMsgId,
          role: 'assistant',
          content: fullResponseText,
          createdAt: new Date().toISOString(),
          status: 'complete',
          type: 'text',
          citations,
        };

        // Streaming par tokens (mots / segments)
        const words = fullResponseText.split(/(\s+)/);
        let accumulated = '';

        for (let i = 0; i < words.length; i++) {
          if (req.signal.aborted) {
            // Marquage comme interrompu
            asstMsg.status = 'interrupted';
            asstMsg.content = accumulated;
            chatbotRepository.addMessage(convId, asstMsg);
            return;
          }

          const token = words[i];
          accumulated += token;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'token',
                content: token,
                messageId: asstMsgId,
                conversationId: convId,
              })}\n\n`
            )
          );

          // Petite temporisation pour simulation d'inférence fluide
          if (i % 2 === 0) {
            await new Promise((r) => setTimeout(r, 12));
          }
        }

        // Envoi des citations validées
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'citations',
              citations,
              messageId: asstMsgId,
              conversationId: convId,
            })}\n\n`
          )
        );

        // Clôture
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              messageId: asstMsgId,
              conversationId: convId,
            })}\n\n`
          )
        );

        chatbotRepository.addMessage(convId, asstMsg);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
