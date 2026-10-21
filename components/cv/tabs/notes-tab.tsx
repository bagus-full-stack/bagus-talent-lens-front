'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, User, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CandidateCvDetail, CvInternalNote } from '@/types';

export interface NotesTabProps {
  candidate: CandidateCvDetail;
  onAddNote: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function NotesTab({ candidate, onAddNote, isSubmitting = false }: NotesTabProps) {
  const [noteContent, setNoteContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || isSubmitting) return;

    await onAddNote(noteContent.trim());
    setNoteContent('');
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout de note */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
      >
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="new-note-input" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <span>Ajouter une note d’évaluation interne</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            Traçabilité interne
          </span>
        </div>

        <textarea
          id="new-note-input"
          rows={3}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Synthèse de l’entretien, points forts techniques, disponibilité constatée…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Conformité CNIL : commentaires strictement professionnels</span>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!noteContent.trim() || isSubmitting}
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Enregistrer la note</span>
          </Button>
        </div>
      </form>

      {/* Liste des notes chronologiques */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Notes de l’équipe de recrutement ({candidate.notes.length})
        </h4>

        {candidate.notes.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Aucune note pour le moment. Rédigez la première appréciation d'évaluation ci-dessus.
          </div>
        ) : (
          <div className="space-y-3">
            {candidate.notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] dark:bg-indigo-950 dark:text-indigo-300">
                      {note.authorName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {note.authorName}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                        ({note.authorRole})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
