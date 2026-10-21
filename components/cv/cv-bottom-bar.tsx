'use client';

import React from 'react';
import {
  Save,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CandidateCvDetail } from '@/types';
import { cn } from '@/lib/utils';

export interface CvBottomBarProps {
  candidate: CandidateCvDetail;
  onSaveManual: () => void;
  onValidateExtraction: () => void;
  isSaving?: boolean;
  isValidating?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
}

export function CvBottomBar({
  candidate,
  onSaveManual,
  onValidateExtraction,
  isSaving = false,
  isValidating = false,
  lastSavedAt,
  hasUnsavedChanges = false,
}: CvBottomBarProps) {
  const isValidated = candidate.extractionStatus === 'validated';

  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-3.5 backdrop-blur-md shadow-lg dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      {/* Partie gauche : Statut d'enregistrement et version ETag */}
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          <Layers className="h-3 w-3 text-slate-500" />
          <span>v{candidate.version}</span>
        </span>

        {isSaving ? (
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Enregistrement automatique en cours…</span>
          </div>
        ) : hasUnsavedChanges ? (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Modifications non enregistrées</span>
          </div>
        ) : lastSavedAt ? (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              Enregistré à{' '}
              {lastSavedAt.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Fiche synchronisée</span>
          </div>
        )}
      </div>

      {/* Partie droite : Boutons Enregistrer & Valider l'extraction */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving || !hasUnsavedChanges}
          onClick={onSaveManual}
          className="h-9 gap-1.5 text-xs text-slate-700 dark:text-slate-300"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          ) : (
            <Save className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span>Enregistrer</span>
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={isValidating || isValidated}
          onClick={onValidateExtraction}
          className={cn(
            'h-9 gap-1.5 text-xs font-semibold shadow-xs',
            isValidated
              ? 'bg-emerald-600 hover:bg-emerald-600 text-white cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white',
          )}
        >
          {isValidating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>{isValidated ? 'Extraction validée' : 'Valider l’extraction'}</span>
        </Button>
      </div>
    </div>
  );
}
