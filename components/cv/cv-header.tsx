'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  Shield,
  ShieldAlert,
  Download,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlindBadge } from '@/components/shared/blind-badge';
import { ConfidenceBadge } from '@/components/shared/badges-and-gauges';
import { PiiField } from '@/components/shared/pii-field';
import type { CandidateCvDetail } from '@/types';
import { cn } from '@/lib/utils';

export interface CvHeaderProps {
  candidate: CandidateCvDetail;
  onToggleShortlist: () => void;
  onChangePipelineStage: (stage: string) => void;
  onToggleRestriction: () => void;
  onDelete: () => void;
  onRequestUnmask: () => void;
  onExport: () => void;
  isActionPending?: boolean;
}

const PIPELINE_STAGES = [
  'Nouveau',
  'Présélection',
  'Entretien RH',
  'Entretien Client',
  'Offre',
  'Rejeté',
];

export function CvHeader({
  candidate,
  onToggleShortlist,
  onChangePipelineStage,
  onToggleRestriction,
  onDelete,
  onRequestUnmask,
  onExport,
  isActionPending = false,
}: CvHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);

  const displayName = candidate.isBlindMode
    ? candidate.pseudonym
    : `${candidate.nominative?.firstName} ${candidate.nominative?.lastName}`;

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Partie gauche : Identifiant, Titre, Badges */}
        <div className="space-y-2 min-w-0">
          {/* Ligne 1 : Nom/Identifiant + BlindBadge + Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PiiField
                value={displayName}
                fieldLabel="Identité candidat"
                mode="inline"
                isSensitive={true}
                className="font-mono text-lg font-bold tracking-tight text-indigo-950 dark:text-indigo-200"
              />
            </div>

            {/* Badge Mode Aveugle (clic pour lever avec motif Art. 30) */}
            <BlindBadge
              folder={candidate.folderReference}
              isActive={candidate.isBlindMode}
              compact
              onClick={candidate.isBlindMode ? onRequestUnmask : undefined}
            />

            {/* Badge Statut d'Extraction */}
            {candidate.extractionStatus === 'in_progress' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300">
                <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
                <span>Extraction en cours</span>
              </span>
            ) : candidate.extractionStatus === 'validated' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Extraction certifiée</span>
              </span>
            ) : (
              <ConfidenceBadge score={candidate.aiConfidence} showPercent={true} />
            )}

            {/* Badge Étape du Pipeline (interactif) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStageMenuOpen(!isStageMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
                title="Cliquer pour changer d'étape dans le pipeline de recrutement"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                <span>Étape : {candidate.pipelineStage}</span>
              </button>

              {isStageMenuOpen && (
                <div
                  className="absolute left-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 zoom-in-95"
                  onMouseLeave={() => setIsStageMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Déplacer vers :
                  </div>
                  {PIPELINE_STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      disabled={isActionPending}
                      onClick={() => {
                        onChangePipelineStage(stage);
                        setIsStageMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-1.5 text-xs text-left transition-colors',
                        stage === candidate.pipelineStage
                          ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                      )}
                    >
                      <span>{stage}</span>
                      {stage === candidate.pipelineStage && (
                        <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Badge Opposition RGPD si actif */}
            {candidate.isRestricted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
                <ShieldAlert className="h-3 w-3 text-rose-600" />
                <span>Opposition RGPD</span>
              </span>
            )}
          </div>

          {/* Ligne 2 : Titre professionnel & Dossier parent */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {candidate.currentTitle}
            </span>
            <span>·</span>
            <span>{candidate.location}</span>
            <span>·</span>
            <span>{candidate.yearsExperience} ans d'expérience</span>
            <span>·</span>
            <Link
              href={`/dossiers/${candidate.folderId}`}
              className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
            >
              Dossier {candidate.folderTitle} ({candidate.folderReference})
            </Link>
          </div>
        </div>

        {/* Partie droite : Boutons d'action et navigation */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Navigation Précédent / Suivant dans la liste d'origine */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
            {candidate.navigation.previousId ? (
              <Link
                href={`/cv/${candidate.navigation.previousId}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Candidat précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center text-slate-300 dark:text-slate-700">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}

            <span className="px-2 text-xs font-mono font-medium text-slate-500">
              {candidate.navigation.currentIndex + 1} / {candidate.navigation.totalInFolder}
            </span>

            {candidate.navigation.nextId ? (
              <Link
                href={`/cv/${candidate.navigation.nextId}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Candidat suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center text-slate-300 dark:text-slate-700">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>

          {/* Bouton Shortlist */}
          <Button
            size="sm"
            variant="outline"
            disabled={isActionPending}
            onClick={onToggleShortlist}
            className={cn(
              'h-9 gap-1.5 text-xs',
              candidate.isShortlisted
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                : 'text-slate-700 dark:text-slate-300',
            )}
          >
            <Bookmark
              className={cn(
                'h-3.5 w-3.5',
                candidate.isShortlisted ? 'fill-indigo-600 text-indigo-600' : 'text-slate-400',
              )}
            />
            <span>{candidate.isShortlisted ? 'Shortlisté' : 'Ajouter shortlist'}</span>
          </Button>

          {/* Bouton Dérogation / Lever le mode aveugle si actif */}
          {candidate.isBlindMode && (
            <Button
              size="sm"
              variant="outline"
              disabled={isActionPending}
              onClick={onRequestUnmask}
              className="h-9 gap-1.5 text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
            >
              <Shield className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <span>Lever mode aveugle</span>
            </Button>
          )}

          {/* Menu déroulant d'actions supplémentaires */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9 p-0"
              title="Actions avancées"
            >
              <MoreVertical className="h-4 w-4 text-slate-600" />
            </Button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50"
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onExport();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 text-left"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Exporter le dossier {candidate.isBlindMode ? '(Anonymisé)' : '(Nominatif)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleRestriction();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 text-left"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  <span>{candidate.isRestricted ? 'Lever la restriction RGPD' : 'Restreindre (Art. 21)'}</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Supprimer ce profil (DSR Purge)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
