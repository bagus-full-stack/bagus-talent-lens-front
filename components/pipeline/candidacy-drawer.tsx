'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  User,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileText,
  History,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import Link from 'next/link';
import type {
  PipelineCandidacy,
  PipelineStageConfig,
} from '@/lib/pipeline/pipeline-store';

interface CandidacyDrawerProps {
  candidacy: PipelineCandidacy | null;
  stages: PipelineStageConfig[];
  recruiters: { id: string; name: string }[];
  onClose: () => void;
  onUpdateStage: (candidacyId: string, targetStageId: string) => void;
  onUpdateRecruiter: (candidacyId: string, recruiterId: string) => void;
  onAddNote: (candidacyId: string, content: string) => Promise<void>;
}

export function CandidacyDrawer({
  candidacy,
  stages,
  recruiters,
  onClose,
  onUpdateStage,
  onUpdateRecruiter,
  onAddNote,
}: CandidacyDrawerProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!candidacy) return null;

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || isSubmittingNote) return;

    try {
      setIsSubmittingNote(true);
      await onAddNote(candidacy.id, newNoteContent.trim());
      setNewNoteContent('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <aside
      data-testid="candidacy-drawer"
      className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
      aria-label={`Détails de candidature pour ${candidacy.pseudonym}`}
    >
      {/* En-tête */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base font-mono text-slate-900 dark:text-slate-100">
            {candidacy.isBlind
              ? candidacy.pseudonym
              : candidacy.unmaskedFullName || candidacy.pseudonym}
          </span>
          <Badge variant="outline" className="text-xs">
            {candidacy.matchScore}%
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Rappel mode aveugle */}
        <BlindBadge folder={candidacy.isBlind ? 'Anonymat actif' : 'Identité démasquée'} compact />

        {/* Résumé du candidat */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {candidacy.currentTitle}
          </h2>
          <p className="text-slate-500">
            {candidacy.yearsExperience} ans d'expérience • {candidacy.topSkills.join(', ')}
          </p>
        </div>

        {/* Étape & Responsable modifiables */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Étape actuelle du pipeline
            </label>
            <select
              value={candidacy.stageId}
              onChange={(e) => onUpdateStage(candidacy.id, e.target.value)}
              data-testid="select-candidacy-stage"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              {stages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.name} ({stg.category})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Recruteur responsable assigné
            </label>
            <select
              value={candidacy.assignedRecruiterId}
              onChange={(e) => onUpdateRecruiter(candidacy.id, e.target.value)}
              data-testid="select-candidacy-recruiter"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Motif de rejet si présent */}
        {candidacy.rejectionReason && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-950 dark:text-rose-100 space-y-1">
            <span className="font-bold text-[10px] uppercase text-rose-700 dark:text-rose-400 block">
              Motif de refus consigné
            </span>
            <p className="text-xs">{candidacy.rejectionReason}</p>
          </div>
        )}

        {/* Section Notes internes */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              <span>Notes internes ({candidacy.notes.length})</span>
            </span>
          </div>

          {/* Avertissement permanent éthique sur les notes */}
          <div
            data-testid="ethical-notes-warning"
            className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Avertissement :</strong> Pas de données sensibles ni de jugement sur des critères protégés (Art. L1132-1 du Code du travail).
            </span>
          </div>

          {/* Formulaire d'ajout de note */}
          <form onSubmit={handleNoteSubmit} className="flex gap-2">
            <input
              type="text"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Ajouter une observation factuelle..."
              data-testid="input-new-note"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newNoteContent.trim() || isSubmittingNote}
              data-testid="btn-add-note"
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 text-xs"
            >
              <Send className="h-3 w-3" />
            </Button>
          </form>

          {/* Liste des notes horodatées */}
          <div className="space-y-2 max-h-40 overflow-y-auto pt-1">
            {candidacy.notes.map((note) => (
              <div
                key={note.id}
                className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {note.authorName} ({note.authorRole})
                  </span>
                  <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section Historique des transitions */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-indigo-500" />
            <span>Historique des transitions</span>
          </span>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {candidacy.history.map((item) => (
              <div
                key={item.id}
                className="text-[11px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/60 dark:border-slate-800 space-y-0.5"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {item.performedBy}
                  </span>
                  <span>{new Date(item.performedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  {item.unmasked ? '🔓 Levée de l’anonymat autorisée' : 'Déplacement d’étape'}
                  {item.reason && ` — Motif : « ${item.reason} »`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pied de tiroir : Lien vers la fiche */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
        <Link
          href={`/cv/${candidacy.candidateId}`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-xs transition-colors shadow-xs"
          data-testid="btn-open-full-cv"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Ouvrir la fiche complète du candidat</span>
        </Link>
      </div>
    </aside>
  );
}
