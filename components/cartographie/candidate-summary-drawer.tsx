'use client';

import React from 'react';
import type { CartographyPoint } from '@/lib/schemas/cartographie';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Layers,
  Sparkles,
  BookmarkPlus,
  ArrowRight,
  GitCommit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import { PIPELINE_LABELS, PIPELINE_COLORS } from '@/lib/cartographie/cartographie-service';
import Link from 'next/link';

interface CandidateSummaryDrawerProps {
  point: CartographyPoint | null;
  onClose: () => void;
  onAddToShortlist?: (candidateId: string) => void;
}

export function CandidateSummaryDrawer({
  point,
  onClose,
  onAddToShortlist,
}: CandidateSummaryDrawerProps) {
  if (!point) return null;

  return (
    <aside
      data-testid="candidate-summary-drawer"
      className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
      aria-label={`Détails du candidat ${point.pseudonym}`}
    >
      {/* En-tête */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-slate-900 dark:text-slate-100 font-mono">
            {point.pseudonym}
          </span>
          <Badge variant="outline" className="text-xs">
            {point.folderReference}
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
        <BlindBadge folder={point.folderReference} compact />

        {/* Titre & Expérience */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {point.currentTitle}
          </h2>
          <p className="text-slate-500">
            {point.yearsExperience} ans d'expérience attestée
          </p>
        </div>

        {/* Étape du pipeline & Cluster */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Pipeline
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PIPELINE_COLORS[point.pipelineStage] }}
              />
              <span className="truncate">{PIPELINE_LABELS[point.pipelineStage]}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Cluster UMAP
            </span>
            <div className="flex items-center gap-1.5 font-medium truncate">
              <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{point.clusterName}</span>
            </div>
          </div>
        </div>

        {/* Compétences attestées */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Compétences vérifiées
          </span>
          <div className="flex flex-wrap gap-1.5">
            {point.allSkills?.map((skill, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[11px]"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Coordonnées vectorielles */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 space-y-1">
          <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase block">
            Coordonnées spatiales (UMAP)
          </span>
          <p>2D : x={point.x}, y={point.y}</p>
          <p>3D : z={point.z}</p>
        </div>
      </div>

      {/* Pied de tiroir avec boutons d'action */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
        {/* Bouton « Ouvrir la fiche » */}
        <Link
          href={`/cv/${point.id}`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-xs transition-colors shadow-xs"
          data-testid="btn-open-cv-card"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Ouvrir la fiche candidat</span>
        </Link>

        {onAddToShortlist && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddToShortlist(point.id)}
            className="w-full justify-center gap-2 text-xs font-medium"
          >
            <BookmarkPlus className="h-3.5 w-3.5 text-indigo-600" />
            <span>Ajouter à une shortlist</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
