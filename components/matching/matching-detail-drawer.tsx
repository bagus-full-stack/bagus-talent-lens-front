'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  BookmarkPlus,
  Kanban,
  UserX,
} from 'lucide-react';
import { ScoreGauge } from '@/components/shared/badges-and-gauges';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CandidateMatchResult } from '@/lib/matching/types';

interface MatchingDetailDrawerProps {
  result: CandidateMatchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onShortlist: (id: string) => void;
  onPipeline: (id: string) => void;
  onDiscard: (result: CandidateMatchResult) => void;
}

export function MatchingDetailDrawer({
  result,
  isOpen,
  onClose,
  onShortlist,
  onPipeline,
  onDiscard,
}: MatchingDetailDrawerProps) {
  if (!isOpen || !result) return null;

  const { candidate, overallScore, breakdown, evaluations, skillGap, sourcedExcerpts, aiSummary } =
    result;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-candidate-title"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-250">
        {/* En-tête du tiroir */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span id="drawer-candidate-title" className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                {candidate.pseudonym}
              </span>
              <BlindModeBadge compact />
              <Badge variant="outline" className="text-[10px] font-mono">
                Rang #{result.rank}
              </Badge>
            </div>
            <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
              {candidate.currentTitle}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>{candidate.yearsExperience} ans d'expérience</span>
              <span>·</span>
              <span>{candidate.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ScoreGauge score={overallScore} size="sm" showDetails />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer le panneau d'explicabilité"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Rappel permanent d'éthique */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium">
              « Le score est une aide au tri. La décision finale d'avancement appartient au recruteur. »
            </span>
          </div>

          {/* Répartition du score */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pondération et sous-scores déterministes :
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Indispensables</span>
                <span className="font-mono font-black text-lg text-indigo-700 dark:text-indigo-300">
                  {breakdown.indispensableScore}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {breakdown.indispensableSatisfied}/{breakdown.indispensableTotal} validés
                </span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Souhaités</span>
                <span className="font-mono font-black text-lg text-emerald-700 dark:text-emerald-300">
                  {breakdown.souhaiteScore}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {breakdown.souhaiteSatisfied}/{breakdown.souhaiteTotal} validés
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Similarité NLP</span>
                <span className="font-mono font-black text-lg text-slate-800 dark:text-slate-200">
                  {breakdown.similarityScore}%
                </span>
                <span className="text-[10px] text-slate-500 block">Empreinte vectorielle</span>
              </div>
            </div>
          </div>

          {/* Section 1 : « Pourquoi ce score » (Critères ✓ / ~ / ✗) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Pourquoi ce score ? (Détail critère par critère)</span>
            </div>

            <div className="space-y-2">
              {evaluations.map((ev, idx) => {
                const isSatisfied = ev.status === 'satisfied';
                const isPartial = ev.status === 'partial';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                      isSatisfied
                        ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                        : isPartial
                        ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60'
                        : 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isSatisfied ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                            ✓
                          </span>
                        ) : isPartial ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                            ~
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xs">
                            ✗
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {ev.criterionLabel}
                        </span>
                      </div>

                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono capitalize"
                      >
                        {ev.category === 'indispensable' ? 'Indispensable' : 'Souhaité'}
                      </Badge>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px]">
                      {ev.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2 : Skill Gap (Matrice des compétences) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Skill Gap (Analyse des écarts de compétences)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Acquis */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-1.5">
                <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validées ({skillGap.acquired.length})</span>
                </span>
                <div className="space-y-1">
                  {skillGap.acquired.map((s, idx) => (
                    <div key={idx} className="text-[11px] text-emerald-900 dark:text-emerald-200 truncate">
                      • {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Partiels */}
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-1.5">
                <span className="font-bold text-[11px] text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Partielles ({skillGap.partial.length})</span>
                </span>
                <div className="space-y-1">
                  {skillGap.partial.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">Aucune</div>
                  ) : (
                    skillGap.partial.map((s, idx) => (
                      <div key={idx} className="text-[11px] text-amber-900 dark:text-amber-200 truncate">
                        • {s}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Manquants */}
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/20 space-y-1.5">
                <span className="font-bold text-[11px] text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>À développer ({skillGap.missing.length})</span>
                </span>
                <div className="space-y-1">
                  {skillGap.missing.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">Aucun manque</div>
                  ) : (
                    skillGap.missing.map((s, idx) => (
                      <div key={idx} className="text-[11px] text-rose-900 dark:text-rose-200 truncate">
                        • {s}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Extraits sourcés avec lien ouvrant le CV à la page et à la zone (bbox) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Extraits sourcés (Traçabilité WORM & Bounding Boxes)</span>
            </div>

            <div className="space-y-2">
              {sourcedExcerpts.map((src, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {src.fieldLabel}
                    </span>
                    <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                      « {src.text} »
                    </p>
                  </div>

                  <Link
                    href={`/cv/${candidate.id}?page=${src.page}${src.bboxId ? `&bbox=${src.bboxId}` : ''}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 font-semibold text-[11px] shrink-0 border border-indigo-200 dark:border-indigo-800 transition-colors"
                  >
                    <span>Page {src.page}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barre d'actions du tiroir */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscard(result)}
            className="text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800 text-xs gap-1.5"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Écarter avec un motif</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShortlist(candidate.id)}
              className="text-xs gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Ajouter à la shortlist</span>
            </Button>

            <Button
              size="sm"
              onClick={() => onPipeline(candidate.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Avancer dans le pipeline</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
