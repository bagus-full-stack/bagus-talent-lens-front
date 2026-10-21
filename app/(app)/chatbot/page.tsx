'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Square,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlindBadge } from '@/components/shared/blind-badge';
import { ConversationSidebar } from '@/components/chatbot/conversation-sidebar';
import { SourcesPanel } from '@/components/chatbot/sources-panel';
import { ChatMessageItem } from '@/components/chatbot/chat-message-item';
import { FolderSelector } from '@/components/chatbot/folder-selector';
import { StarterPrompts } from '@/components/chatbot/starter-prompts';
import type { Conversation, ChatMessage, CitationSource } from '@/lib/schemas/chatbot';

export default function ChatbotPage() {
  // État des conversations persistées côté serveur
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // État du chat actif
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Panneau des sources à droite
  const [selectedSource, setSelectedSource] = useState<CitationSource | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Contrôles mobiles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Abort controller pour l'annulation de streaming
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Chargement des conversations depuis le serveur
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/chatbot/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0 && !activeConvId) {
          setActiveConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Scroll automatique vers le bas lors de l'arrivée de nouveaux messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isStreaming]);

  // Création d'une nouvelle conversation
  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/chatbot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nouvelle conversation',
          selectedFolderIds: activeConversation?.selectedFolderIds || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConvId(data.conversation.id);
        setSelectedSource(null);
        setIsSourcesOpen(false);
      }
    } catch (err) {
      console.error('Erreur création conversation:', err);
    }
  };

  // Suppression d'une conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConvId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            setActiveConvId(remaining[0].id);
          } else {
            handleNewConversation();
          }
        }
      }
    } catch (err) {
      console.error('Erreur suppression conversation:', err);
    }
  };

  // Mise à jour des dossiers interrogés pour la conversation active
  const handleFolderChange = async (folderIds: string[]) => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/chatbot/conversations/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFolderIds: folderIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? data.conversation : c))
        );
      }
    } catch (err) {
      console.error('Erreur mise à jour dossiers:', err);
    }
  };

  // Envoi d'un message avec consommation du flux SSE
  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;
    setStreamError(null);

    const userText = textToSend.trim();
    setInput('');

    // Créer une conversation si aucune n'est active
    let targetConvId = activeConvId;
    if (!targetConvId) {
      try {
        const res = await fetch('/api/chatbot/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: userText.slice(0, 35),
            selectedFolderIds: [],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          targetConvId = data.conversation.id;
          setActiveConvId(targetConvId);
          setConversations((prev) => [data.conversation, ...prev]);
        }
      } catch (err) {
        setStreamError('Impossible de démarrer la conversation.');
        return;
      }
    }

    const currentConv = conversations.find((c) => c.id === targetConvId);
    const selectedFolderIds = currentConv?.selectedFolderIds || [];

    // Message utilisateur optimiste
    const optimisticUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
      status: 'complete',
      type: 'text',
    };

    // Message assistant temporaire pour le streaming
    const tempAsstId = `asst-stream-${Date.now()}`;
    const optimisticAsstMsg: ChatMessage = {
      id: tempAsstId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'streaming',
      type: 'text',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            messages: [...c.messages, optimisticUserMsg, optimisticAsstMsg],
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          message: userText,
          folderIds: selectedFolderIds,
          blindMode: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Flux indisponible');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const eventData = JSON.parse(jsonStr);

            if (eventData.type === 'refusal') {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempAsstId
                          ? {
                              ...m,
                              id: eventData.messageId || m.id,
                              type: 'refusal',
                              content: eventData.refusal.message,
                              refusalDetails: eventData.refusal,
                              status: 'complete',
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (eventData.type === 'empty_sources') {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempAsstId
                          ? {
                              ...m,
                              id: eventData.messageId || m.id,
                              type: 'empty_sources',
                              content: eventData.text,
                              status: 'complete',
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (eventData.type === 'token') {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempAsstId
                          ? {
                              ...m,
                              content: m.content + eventData.content,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (eventData.type === 'citations') {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempAsstId
                          ? {
                              ...m,
                              citations: eventData.citations,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            } else if (eventData.type === 'done') {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === tempAsstId
                          ? {
                              ...m,
                              status: 'complete',
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            }
          } catch (e) {
            console.error('Erreur parsing SSE chunk:', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Interruption voulue par l'utilisateur
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempAsstId
                    ? {
                        ...m,
                        status: 'interrupted',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      } else {
        console.error('Erreur flux de chat:', err);
        setStreamError('Une interruption du flux est survenue. Vous pouvez régénérer la réponse.');
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempAsstId
                    ? {
                        ...m,
                        status: 'error',
                        content: m.content || 'Erreur lors de la réception du flux.',
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Arrêt du streaming par l'utilisateur
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Régénération de la dernière réponse
  const handleRegenerate = (lastUserMsgText: string) => {
    sendMessage(lastUserMsgText);
  };

  // Sélection d'une citation pour affichage dans le panneau droit
  const handleSelectCitation = (citation: CitationSource) => {
    setSelectedSource(citation);
    setIsSourcesOpen(true);
  };

  // Envoi du feedback persistant sur un message
  const handleFeedback = async (messageId: string, feedback: 'helpful' | 'unhelpful') => {
    if (!activeConvId) return;
    try {
      const res = await fetch(`/api/chatbot/conversations/${activeConvId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, feedback } : m
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Erreur feedback:', err);
    }
  };

  const messages = activeConversation?.messages || [];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] w-full overflow-hidden bg-white dark:bg-slate-950 border rounded-lg border-slate-200 dark:border-slate-800 shadow-xs">
      {/* 1. Colonne Gauche : Liste des conversations */}
      <div className="hidden md:flex h-full">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => {
            setActiveConvId(id);
            setSelectedSource(null);
          }}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          isLoading={isLoadingHistory}
        />
      </div>

      {/* 2. Colonne Centrale : Conversation principale */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 dark:bg-slate-950/40">
        {/* En-tête de conversation */}
        <header className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeConversation?.title || 'Copilote IA RH Éthique'}
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                RAG connecté aux CV avec traçabilité des preuves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sélecteur de dossiers interrogés */}
            <FolderSelector
              selectedFolderIds={activeConversation?.selectedFolderIds || []}
              onChange={handleFolderChange}
            />

            {/* Rappel Mode aveugle actif */}
            <BlindBadge folder="Actif" compact />
          </div>
        </header>

        {/* Message d'avertissement permanent éthique et légal */}
        <div
          data-testid="permanent-ai-disclaimer"
          className="bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/50 px-4 py-1.5 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">
              L'IA peut se tromper. Vérifiez dans les CV sources.
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 hidden sm:inline">
            Mode aveugle actif : aucune donnée personnelle visible
          </span>
        </div>

        {/* Bannière d'erreur de flux avec bouton de reprise */}
        {streamError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-4 py-2 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{streamError}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                if (lastUser) sendMessage(lastUser.content);
              }}
              className="h-7 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Réessayer
            </Button>
          </div>
        )}

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <StarterPrompts onSelectPrompt={(prompt) => sendMessage(prompt)} />
          ) : (
            messages.map((msg, idx) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.status === 'streaming'}
                onStopStreaming={handleStopStreaming}
                onRegenerate={() => {
                  // Trouve le message utilisateur qui a précédé
                  const prevUserMsg = messages
                    .slice(0, idx)
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (prevUserMsg) {
                    handleRegenerate(prevUserMsg.content);
                  }
                }}
                onSelectCitation={handleSelectCitation}
                onFeedback={handleFeedback}
                onApplySuggestion={(suggestion) => sendMessage(suggestion)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre d'entrée de message */}
        <footer className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur les compétences, diplômes ou demandez une comparaison..."
              disabled={isStreaming}
              data-testid="chat-input"
              className="text-xs h-10 bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 focus-visible:ring-indigo-500"
            />

            {isStreaming ? (
              <Button
                type="button"
                onClick={handleStopStreaming}
                data-testid="btn-main-stop"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 px-4 h-10 text-xs shrink-0"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Arrêter</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                data-testid="btn-chat-send"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 px-4 h-10 text-xs shrink-0 font-medium shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Envoyer</span>
              </Button>
            )}
          </form>
        </footer>
      </main>

      {/* 3. Colonne Droite : Panneau Sources & Preuves */}
      <SourcesPanel
        source={selectedSource}
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />
    </div>
  );
}
