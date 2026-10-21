'use client';

import React from 'react';
import {
  FileText,
  ExternalLink,
  X,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import type { CitationSource } from '@/lib/schemas/chatbot';
import Link from 'next/link';

interface SourcesPanelProps {
  source: CitationSource | null;
  onClose: () => void;
  isOpen: boolean;
}

export function SourcesPanel({ source, onClose, isOpen }: SourcesPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      data-testid="sources-panel"
      className="w-80 md:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 shadow-lg md:shadow-none transition-all z-20"
      aria-label="Panneau Sources et Preuves CV"
    >
      {/* En-tête du panneau */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Source & Preuve CV
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          title="Fermer le panneau de sources"
          aria-label="Fermer le panneau de sources"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {source ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Badge Candidat et Dossier */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200" data-testid="source-candidate">
                {source.candidatePseudonym}
              </span>
              <Badge variant="outline" className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-[10px]">
                {source.folderReference}
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">{source.jobTitle}</p>
            <div className="flex items-center gap-2 pt-1">
              <BlindBadge folder={source.folderReference} compact />
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px]">
                Page {source.page}
              </Badge>
            </div>
          </div>

          {/* Extrait textuel exact */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Passage surligné dans le document
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                Chunk #{source.chunkId.replace('chk-', '')}
              </span>
            </div>
            <div
              data-testid="source-snippet"
              className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-md text-slate-800 dark:text-slate-200 leading-relaxed italic"
            >
              « {source.snippet} »
            </div>
          </div>

          {/* Aperçu visuel de la boîte englobante (bbox) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Coordonnées de zone (BBox)
              </span>
              <span className="text-[10px] font-mono">
                p.{source.bbox.page} [{Math.round(source.bbox.x)}%, {Math.round(source.bbox.y)}%]
              </span>
            </div>

            {/* Simulation de la feuille A4 avec zone surlignée */}
            <div className="relative aspect-[1/1.4] w-full bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner flex flex-col p-2">
              <div className="text-[8px] text-slate-400 font-mono mb-1 flex items-center justify-between">
                <span>CV Numérisé (Page {source.page})</span>
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Zone vérifiée
                </span>
              </div>

              {/* Lignes de texte factices dans le document */}
              <div className="relative flex-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-2 space-y-2 select-none">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />

                {/* Surlignage interactif réel de la bbox */}
                <div
                  data-testid="source-bbox"
                  className="absolute border-2 border-indigo-500 bg-indigo-500/20 rounded shadow-xs flex items-center justify-center transition-all animate-pulse"
                  style={{
                    left: `${Math.max(4, Math.min(85, source.bbox.x))}%`,
                    top: `${Math.max(4, Math.min(85, source.bbox.y))}%`,
                    width: `${Math.max(15, Math.min(90, source.bbox.width))}%`,
                    height: `${Math.max(12, Math.min(45, source.bbox.height))}%`,
                  }}
                  title={source.bbox.label}
                >
                  <span className="bg-indigo-600 text-white text-[8px] font-bold px-1 rounded absolute -top-2 left-1 shadow-xs">
                    {source.bbox.label}
                  </span>
                </div>

                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-4/6 mt-16" />
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Lien vers la fiche CV complète */}
          <div className="pt-2">
            <Link
              href={`/cv/${source.candidateId}?page=${source.page}&bbox=${source.bbox.id}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-xs transition-colors shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Consulter le CV complet à la page {source.page}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Aucune source sélectionnée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Cliquez sur une citation <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">[1]</span>, <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">[2]</span> dans une réponse pour examiner le passage original et la boîte englobante.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
