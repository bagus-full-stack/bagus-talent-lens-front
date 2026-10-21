'use client';

import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/schemas/chatbot';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isLoading,
}: ConversationSidebarProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <aside
      data-testid="conversation-sidebar"
      className="w-72 md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col h-full shrink-0"
      aria-label="Historique des conversations"
    >
      {/* Bouton Nouvelle Conversation */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <Button
          onClick={onNew}
          className="w-full justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle conversation</span>
        </Button>
      </div>

      {/* Liste des conversations persistées serveur */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Chargement de l'historique...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="h-6 w-6 mx-auto opacity-30" />
            <p>Aucune conversation enregistrée</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const messageCount = conv.messages.length;

            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
                data-testid={`conv-item-${conv.id}`}
                className={cn(
                  'group relative w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer flex flex-col gap-1',
                  isActive
                    ? 'bg-white dark:bg-slate-800 shadow-xs border border-indigo-200 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                )}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-medium truncate flex-1">
                    <MessageSquare
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    title="Supprimer la conversation"
                    aria-label={`Supprimer ${conv.title}`}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5">
                  <span>{formatDate(conv.updatedAt)}</span>
                  <div className="flex items-center gap-1">
                    {conv.selectedFolderIds && conv.selectedFolderIds.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-4 font-mono font-normal"
                      >
                        {conv.selectedFolderIds.length} doss.
                      </Badge>
                    )}
                    <span>{messageCount} msg</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pied de sidebar */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
        <span>Persistance serveur garantie</span>
      </div>
    </aside>
  );
}
