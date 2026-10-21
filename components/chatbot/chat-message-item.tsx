'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  Square,
  ThumbsUp,
  ThumbsDown,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage, CitationSource } from '@/lib/schemas/chatbot';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  onRegenerate?: () => void;
  onSelectCitation?: (citation: CitationSource) => void;
  onFeedback?: (messageId: string, feedback: 'helpful' | 'unhelpful') => void;
  onApplySuggestion?: (suggestion: string) => void;
}

export function ChatMessageItem({
  message,
  isStreaming = false,
  onStopStreaming,
  onRegenerate,
  onSelectCitation,
  onFeedback,
  onApplySuggestion,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<CitationSource | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isUser = message.role === 'user';
  const isRefusal = message.type === 'refusal' || !!message.refusalDetails;
  const isEmptySources = message.type === 'empty_sources';

  // Map of verified citations by index
  const verifiedCitationsMap = new Map<number, CitationSource>();
  if (message.citations && Array.isArray(message.citations)) {
    for (const c of message.citations) {
      if (c.verified !== false) {
        verifiedCitationsMap.set(c.index, c);
      }
    }
  }

  /**
   * Sécurisation des liens Markdown :
   * Refuse tout javascript:, data:, et impose target=_blank rel=noopener
   */
  const markdownComponents = {
    // Interdire les balises d'images externes arbitraires
    img: () => null,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      if (!href || href.startsWith('javascript:') || href.startsWith('data:')) {
        return <span>{children}</span>;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-800"
        >
          {children}
        </a>
      );
    },
    // Remplacement personnalisé des paragraphes ou textes contenant [n] pour des citations interactives
    p: ({ children }: { children?: React.ReactNode }) => {
      return (
        <p className="mb-2 last:mb-0 leading-relaxed text-xs">
          {renderTextWithCitations(children)}
        </p>
      );
    },
    li: ({ children }: { children?: React.ReactNode }) => {
      return (
        <li className="leading-relaxed text-xs mb-1">
          {renderTextWithCitations(children)}
        </li>
      );
    },
  };

  /**
   * Parse récursivement les fragments de texte pour transformer [n] en citation interactive cliquable
   */
  function renderTextWithCitations(children: React.ReactNode): React.ReactNode {
    if (typeof children === 'string') {
      const parts = children.split(/(\[\d+\])/g);
      return parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const indexNum = parseInt(match[1], 10);
          const citation = verifiedCitationsMap.get(indexNum);

          // Si la citation n'existe pas ou est non vérifiée par le serveur : NE PAS L'AFFICHER
          if (!citation) {
            return null;
          }

          return (
            <span
              key={i}
              className="relative inline-block"
              onMouseEnter={() => setHoveredCitation(citation)}
              onMouseLeave={() => setHoveredCitation(null)}
            >
              <button
                type="button"
                onClick={() => onSelectCitation && onSelectCitation(citation)}
                data-testid={`citation-${citation.index}`}
                className="inline-flex items-center justify-center px-1.5 py-0 mx-0.5 text-[10px] font-mono font-bold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-300 dark:border-indigo-700 cursor-pointer transition-colors shadow-2xs align-baseline"
                title={`Voir extrait source - ${citation.candidatePseudonym} (p.${citation.page})`}
                aria-label={`Citation [${citation.index}] - ${citation.candidatePseudonym}`}
              >
                [{citation.index}]
              </button>

              {/* Tooltip / popover d'aperçu au survol */}
              {hoveredCitation?.index === citation.index && (
                <span
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 w-64 p-2 bg-slate-900 text-white rounded-md shadow-xl text-[11px] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                >
                  <span className="font-bold text-indigo-300 block">
                    {citation.candidatePseudonym} ({citation.folderReference})
                  </span>
                  <span className="text-[10px] text-slate-300 block mb-1">
                    Page {citation.page} • Zone vérifiée
                  </span>
                  <span className="text-slate-200 italic line-clamp-2 block border-t border-slate-700 pt-1">
                    « {citation.snippet} »
                  </span>
                  <span className="text-[9px] text-indigo-400 font-sans block mt-1">
                    Cliquer pour ouvrir la boîte englobante (bbox)
                  </span>
                </span>
              )}
            </span>
          );
        }
        return part;
      });
    }

    if (Array.isArray(children)) {
      return children.map((c, i) => <React.Fragment key={i}>{renderTextWithCitations(c)}</React.Fragment>);
    }

    return children;
  }

  return (
    <div
      data-testid={`chat-message-${message.id}`}
      className={cn(
        'group flex gap-3 w-full py-2 transition-colors',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border shadow-2xs',
            isRefusal
              ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
          )}
        >
          {isRefusal ? <ShieldAlert className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      )}

      {/* Corps du message */}
      <div
        className={cn(
          'flex flex-col space-y-1.5 max-w-[85%] md:max-w-2xl',
          isUser && 'items-end'
        )}
      >
        {/* Bulle Utilisateur */}
        {isUser && (
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {/* Bulle Assistant : Cas REFUS CRITÈRE PROTÉGÉ */}
        {!isUser && isRefusal && (
          <div
            data-testid="refusal-card"
            className="rounded-xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-4 text-xs text-rose-950 dark:text-rose-100 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Demande bloquée : Critère protégé prohibé (Art. L. 1132-1)</span>
            </div>

            <p className="text-xs leading-relaxed text-rose-900 dark:text-rose-200">
              {message.refusalDetails?.message || message.content}
            </p>

            <div className="text-[11px] bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-semibold text-rose-700 dark:text-rose-400 block text-[10px] uppercase tracking-wide">
                Garde-fou légal
              </span>
              <p className="italic text-[10px]">
                {message.refusalDetails?.legalNotice ||
                  'Aucun candidat ne peut être écarté d’une procédure de recrutement en raison de son âge, sexe, situation familiale ou origine.'}
              </p>
            </div>

            {message.refusalDetails?.suggestion && onApplySuggestion && (
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-lg">
                <div className="text-[11px]">
                  <span className="font-medium text-rose-900 dark:text-rose-200">
                    Suggestion de reformulation objective :
                  </span>{' '}
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                    « {message.refusalDetails.suggestion} »
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplySuggestion(message.refusalDetails!.suggestion)}
                  className="bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 text-xs shrink-0 h-7 px-2.5 gap-1.5"
                >
                  <span>Appliquer</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Bulle Assistant : Cas AUCUN RÉSULTAT SOURCÉ */}
        {!isUser && isEmptySources && (
          <div
            data-testid="empty-sources-card"
            className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-950 dark:text-amber-100 shadow-2xs space-y-2"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Aucun résultat sourcé dans les dossiers</span>
            </div>
            <p className="leading-relaxed">{message.content}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Conseil : Vérifiez les dossiers sélectionnés dans le menu supérieur ou essayez des mots-clés de compétences plus larges (ex: AWS, Python, SOC, CISSP).
            </p>
          </div>
        )}

        {/* Bulle Assistant : Cas NORMAL / MARKDOWN */}
        {!isUser && !isRefusal && !isEmptySources && (
          <div
            data-testid="assistant-markdown-content"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-800 dark:text-slate-100 shadow-xs leading-relaxed"
          >
            {/* skipHtml={true} ensures injected HTML like <script> or <img onerror=...> is inert */}
            <ReactMarkdown skipHtml={true} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>

            {/* Indicateur de génération en cours */}
            {isStreaming && (
              <span
                data-testid="streaming-indicator"
                className="inline-block w-2 h-3.5 ml-1 bg-indigo-600 dark:bg-indigo-400 animate-pulse align-middle"
              />
            )}

            {/* Statut interrompu */}
            {message.status === 'interrupted' && (
              <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 italic flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                <Square className="h-3 w-3" />
                <span>Génération interrompue par l'utilisateur.</span>
              </div>
            )}
          </div>
        )}

        {/* Barre d'outils d'actions pour les réponses assistant */}
        {!isUser && !isRefusal && (
          <div className="flex items-center gap-1.5 pt-0.5 text-slate-400 text-xs">
            {/* Bouton Arrêter pendant le streaming */}
            {isStreaming && onStopStreaming && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStopStreaming}
                data-testid="btn-stop-streaming"
                className="h-6 px-2 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 gap-1"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Arrêter</span>
              </Button>
            )}

            {/* Bouton Régénérer */}
            {!isStreaming && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Régénérer cette réponse"
                data-testid="btn-regenerate"
                className="hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded transition-colors"
                aria-label="Régénérer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Bouton Copier */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copier le texte"
              data-testid="btn-copy"
              className="hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded transition-colors flex items-center gap-1"
              aria-label="Copier le message"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] text-emerald-600 font-medium">Copié !</span>
                </>
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Utile / Pas utile */}
            {onFeedback && (
              <div className="flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'helpful')}
                  title="Réponse utile"
                  data-testid="btn-feedback-helpful"
                  className={cn(
                    'p-1 rounded transition-colors',
                    message.feedback === 'helpful'
                      ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40'
                      : 'hover:text-emerald-600'
                  )}
                  aria-label="Utile"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'unhelpful')}
                  title="Réponse pas utile"
                  data-testid="btn-feedback-unhelpful"
                  className={cn(
                    'p-1 rounded transition-colors',
                    message.feedback === 'unhelpful'
                      ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                      : 'hover:text-rose-600'
                  )}
                  aria-label="Pas utile"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar Utilisateur */}
      {isUser && (
        <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
