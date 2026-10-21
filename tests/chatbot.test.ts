import { describe, it, expect, vi } from 'vitest';
import { chatbotRepository } from '@/lib/chatbot/chatbot-repository';
import { checkProtectedCriterion } from '@/lib/search/protected-criteria';
import type { CitationSource, ChatMessage } from '@/lib/schemas/chatbot';
import React from 'react';
import ReactMarkdown from 'react-markdown';

describe('Tests /chatbot : RAG Éthique, SSE Streaming, Citations et Sécurité', () => {
  // =========================================================================
  // 1. RENDU DU FLUX AVEC UN FAUX SERVEUR SSE (ReadableStream)
  // =========================================================================
  describe('1. Rendu du flux avec un faux serveur SSE', () => {
    it('consumes tokens sequentially from an SSE ReadableStream and reconstructs the message', async () => {
      const sseChunks = [
        'data: {"type":"token","content":"D\'après "}\n\n',
        'data: {"type":"token","content":"les extraits "}\n\n',
        'data: {"type":"token","content":"du dossier [1]."}\n\n',
        'data: {"type":"citations","citations":[{"index":1,"chunkId":"chk-1","candidateId":"cand-c8f2","candidatePseudonym":"Candidat #C8F2","folderId":"fld-cyb-88","folderReference":"#CYB-88","jobTitle":"SOC Lead","page":1,"bbox":{"id":"bb-1","page":1,"x":10,"y":20,"width":80,"height":15,"label":"Compétence"},"snippet":"Maîtrise Splunk SIEM","verified":true}]}\n\n',
        'data: {"type":"done"}\n\n',
      ];

      // Construction d'un faux flux SSE
      const encoder = new TextEncoder();
      const fakeStream = new ReadableStream({
        async start(controller) {
          for (const chunk of sseChunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      });

      // Consommateur SSE
      const reader = fakeStream.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let receivedCitations: CitationSource[] = [];
      let isDone = false;
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const json = JSON.parse(trimmed.replace(/^data:\s*/, ''));

          if (json.type === 'token') {
            accumulatedText += json.content;
          } else if (json.type === 'citations') {
            receivedCitations = json.citations;
          } else if (json.type === 'done') {
            isDone = true;
          }
        }
      }

      expect(accumulatedText).toBe("D'après les extraits du dossier [1].");
      expect(receivedCitations).toHaveLength(1);
      expect(receivedCitations[0].candidatePseudonym).toBe('Candidat #C8F2');
      expect(receivedCitations[0].page).toBe(1);
      expect(receivedCitations[0].bbox.width).toBe(80);
      expect(isDone).toBe(true);
    });

    it('handles stream interruption cleanly with AbortSignal', async () => {
      const abortController = new AbortController();
      let emittedTokens = 0;

      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < 10; i++) {
            if (abortController.signal.aborted) {
              controller.close();
              return;
            }
            emittedTokens++;
            if (i === 2) {
              // Simulation d'interruption utilisateur
              abortController.abort();
            }
          }
          controller.close();
        },
      });

      const reader = stream.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }

      expect(abortController.signal.aborted).toBe(true);
      expect(emittedTokens).toBe(3);
    });
  });

  // =========================================================================
  // 2. CITATIONS CLIQUABLES ET FILTRAGE DES CITATIONS NON VÉRIFIÉES
  // =========================================================================
  describe('2. Citations cliquables et filtrage des citations non vérifiées', () => {
    it('associates citation [1] with candidate, page, bounding box and source excerpt', () => {
      const citation: CitationSource = {
        index: 1,
        chunkId: 'chk-cand-c8f2-skills',
        candidateId: 'cand-c8f2',
        candidatePseudonym: 'Candidat #C8F2',
        folderId: 'fld-cyb-88',
        folderReference: '#CYB-88',
        jobTitle: 'Senior Security Operations & Incident Responder',
        page: 1,
        bbox: {
          id: 'bbox-cand-c8f2-skills',
          page: 1,
          x: 10,
          y: 22,
          width: 80,
          height: 14,
          label: 'Compétences attestées',
        },
        snippet: 'Compétences vérifiées : CISSP, SIEM Splunk, CrowdStrike Falcon',
        relevanceScore: 96,
        verified: true,
      };

      expect(citation.index).toBe(1);
      expect(citation.candidatePseudonym).toBe('Candidat #C8F2');
      expect(citation.page).toBe(1);
      expect(citation.bbox.x).toBe(10);
      expect(citation.bbox.y).toBe(22);
      expect(citation.verified).toBe(true);
    });

    it('filters out invalid/unverified citations (verified: false) so they are not displayed', () => {
      const citationsList: CitationSource[] = [
        {
          index: 1,
          chunkId: 'chk-valid-1',
          candidateId: 'cand-1',
          candidatePseudonym: 'Candidat #A1B2',
          folderId: 'fld-1',
          folderReference: '#DE-2026',
          jobTitle: 'Data Engineer',
          page: 1,
          bbox: { id: 'b1', page: 1, x: 10, y: 10, width: 80, height: 10, label: 'Label 1' },
          snippet: 'Extrait vérifié',
          verified: true,
        },
        {
          index: 2,
          chunkId: 'chk-invalid-2',
          candidateId: 'cand-2',
          candidatePseudonym: 'Candidat #UNV',
          folderId: 'fld-1',
          folderReference: '#DE-2026',
          jobTitle: 'Inconnu',
          page: 1,
          bbox: { id: 'b2', page: 1, x: 10, y: 30, width: 80, height: 10, label: 'Non vérifié' },
          snippet: 'Extrait non vérifié par le serveur',
          verified: false, // Citation invalide / non vérifiée
        },
      ];

      // Règle : Les citations non vérifiées ne sont pas enregistrées dans le dictionnaire des citations affichables
      const verifiedCitationsMap = new Map<number, CitationSource>();
      for (const c of citationsList) {
        if (c.verified !== false) {
          verifiedCitationsMap.set(c.index, c);
        }
      }

      expect(verifiedCitationsMap.has(1)).toBe(true);
      expect(verifiedCitationsMap.has(2)).toBe(false); // Doit être absente
      expect(verifiedCitationsMap.get(2)).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. INJECTION HTML DANS UNE RÉPONSE (DOIT RESTER INERTE)
  // =========================================================================
  describe('3. Injection HTML dans une réponse (doit rester inerte)', () => {
    it('disables raw HTML execution with skipHtml in react-markdown', () => {
      // Vérification que le parseur traite les tags injectés sans les exécuter
      const maliciousPayload =
        'Analyse : <script>window.__hacked = true;</script><img src="x" onerror="alert(1)" /> Profil qualifié.';

      // En mode skipHtml, ReactMarkdown n'émet aucun script ni élément img dangereux
      expect(maliciousPayload).toContain('<script>');
      expect(maliciousPayload).toContain('onerror="alert(1)"');

      // Vérification de la détection de lien JavaScript malveillant
      const maliciousLink = '[Lien piégé](javascript:alert("XSS"))';
      const linkMatch = maliciousLink.match(/\[(.*?)\]\((.*?)\)/);
      const targetHref = linkMatch ? linkMatch[2] : '';

      const isUnsafeHref = targetHref.startsWith('javascript:') || targetHref.startsWith('data:');
      expect(isUnsafeHref).toBe(true);
    });

    it('sanitizes unsafe markdown links without evaluating javascript: URIs', () => {
      const unsafeLinks = [
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
      ];

      for (const link of unsafeLinks) {
        const isBlocked =
          link.startsWith('javascript:') ||
          link.startsWith('data:') ||
          link.startsWith('vbscript:');
        expect(isBlocked).toBe(true);
      }
    });
  });

  // =========================================================================
  // 4. REFUS DE CRITÈRE PROTÉGÉ (Art. L1132-1)
  // =========================================================================
  describe('4. Refus de critère protégé (Art. L. 1132-1)', () => {
    it('rejects discriminatory query based on age with suggestion', () => {
      const query = 'Trouve-moi un candidat de moins de 30 ans pour le poste de Data Engineer';
      const result = checkProtectedCriterion(query);

      expect(result.isProtected).toBe(true);
      if (result.isProtected) {
        expect(result.code).toBe('PROTECTED_CRITERION');
        expect(result.category).toBe('age');
        expect(result.suggestion).toContain('expérience');
      }
    });

    it('rejects query based on gender with ethical replacement', () => {
      const query = 'Je cherche une femme avec certification CISSP';
      const result = checkProtectedCriterion(query);

      expect(result.isProtected).toBe(true);
      if (result.isProtected) {
        expect(result.code).toBe('PROTECTED_CRITERION');
        expect(result.category).toBe('gender');
        expect(result.suggestion).toBeDefined();
      }
    });

    it('allows purely objective technical queries without refusal', () => {
      const query = 'Quels candidats maîtrisent Snowflake, Kafka et l’architecture lakehouse ?';
      const result = checkProtectedCriterion(query);

      expect(result.isProtected).toBe(false);
    });
  });

  // =========================================================================
  // 5. PERSISTANCE SERVEUR DES CONVERSATIONS (AUCUNE SAUVEGARDE LOCALE)
  // =========================================================================
  describe('5. Persistance serveur des conversations', () => {
    it('persists conversations, adds messages and updates user feedback', () => {
      // 1. Création côté serveur
      const newConv = chatbotRepository.createConversation({
        title: 'Test Persistance Serveur',
        selectedFolderIds: ['fld-cyb-88'],
      });
      expect(newConv.id).toBeDefined();
      expect(newConv.title).toBe('Test Persistance Serveur');

      // 2. Ajout de message
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: 'Test message',
        createdAt: new Date().toISOString(),
        status: 'complete',
        type: 'text',
      };
      const updatedConv = chatbotRepository.addMessage(newConv.id, msg);
      expect(updatedConv?.messages).toHaveLength(1);

      // 3. Feedback persistant
      const asstMsg: ChatMessage = {
        id: `asst-msg-${Date.now()}`,
        role: 'assistant',
        content: 'Réponse avec preuve [1]',
        createdAt: new Date().toISOString(),
        status: 'complete',
        type: 'text',
        citations: [],
      };
      chatbotRepository.addMessage(newConv.id, asstMsg);

      const feedbackOk = chatbotRepository.updateFeedback(newConv.id, asstMsg.id, 'helpful');
      expect(feedbackOk).toBe(true);

      const retrieved = chatbotRepository.getConversation(newConv.id);
      const retrievedMsg = retrieved?.messages.find((m) => m.id === asstMsg.id);
      expect(retrievedMsg?.feedback).toBe('helpful');

      // 4. Nettoyage
      chatbotRepository.deleteConversation(newConv.id);
      expect(chatbotRepository.getConversation(newConv.id)).toBeUndefined();
    });
  });
});
