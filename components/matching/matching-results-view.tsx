'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Sliders,
  Scale,
  ArrowLeft,
  BookmarkPlus,
  Kanban,
  UserX,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { ScoreGauge } from '@/components/shared/badges-and-gauges';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CandidateMatchResult, StructuredOfferCriteria } from '@/lib/matching/types';

interface MatchingResultsViewProps {
  criteria: StructuredOfferCriteria;
  results: CandidateMatchResult[];
  onOpenDrawer: (result: CandidateMatchResult) => void;
  onOpenSettings: () => void;
  onOpenComparison: (selected: CandidateMatchResult[]) => void;
  onBackToCriteria: () => void;
  onShortlistCandidate: (id: string) => void;
  onPipelineCandidate: (id: string) => void;
  onDiscardCandidate: (result: CandidateMatchResult) => void;
  isRealtimeRunning: boolean;
  realtimeProgress: number;
}

export function MatchingResultsView({
  criteria,
  results,
  onOpenDrawer,
  onOpenSettings,
  onOpenComparison,
  onBackToCriteria,
  onShortlistCandidate,
  onPipelineCandidate,
  onDiscardCandidate,
  isRealtimeRunning,
  realtimeProgress,
}: MatchingResultsViewProps) {
  const [minScoreFilter, setMinScoreFilter] = useState(50);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'discarded'>('active');

  // Filtrage selon le score minimum et le statut
  const filteredResults = results.filter((r) => {
    if (activeTab === 'active' && r.status === 'discarded') return false;
    if (activeTab === 'discarded' && r.status !== 'discarded') return false;
    return r.overallScore >= minScoreFilter;
  });

  const handleToggleSelectComparison = (candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 4) {
        return prev; // Limité à 4 candidats maximum
      }
      return [...prev, candidateId];
    });
  };

  const handleLaunchComparison = () => {
    const candidatesToCompare = results.filter((r) => selectedForComparison.includes(r.candidate.id));
    if (candidatesToCompare.length >= 2) {
      onOpenComparison(candidatesToCompare);
    }
  };

  // ÉTAT : Analyse Realtime en cours
  if (isRealtimeRunning) {
    return (
      <Card className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
            <span>Session Realtime `match_run` en cours</span>
            <Badge variant="outline" className="font-mono text-xs text-indigo-600">
              #RUN-2026
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Calcul déterministe d'affinité compétences sous audit éthique et scellement des scores...
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>
              {realtimeProgress < 40
                ? 'Ingestion vectorielle des CVs...'
                : realtimeProgress < 75
                ? 'Évaluation stricte des critères indispensables...'
                : 'Scellement cryptographique RFC 3161 & déduplication...'}
            </span>
            <span className="font-mono font-bold text-indigo-600">{realtimeProgress}%</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${realtimeProgress}%` }}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* RAPPEL PERMANENT OBLIGATOIRE */}
      <div
        role="note"
        aria-label="Garantie de non-décision automatisée"
        className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 sm:p-4 text-xs sm:text-sm text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 flex items-start sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold block sm:inline">
              « Le score est une aide au tri. La décision appartient au recruteur. »
            </span>
            <span className="block text-xs text-indigo-800 dark:text-indigo-300 sm:inline sm:ml-2">
              Conformité stricte AI Act & Art. 22 RGPD : aucune action automatique n'est exécutée sans validation humaine.
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <BlindModeBadge />
        </div>
      </div>

      {/* Barre de contrôle des résultats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToCriteria}
            className="text-xs gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modifier les critères de l'offre</span>
          </Button>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Onglets Actifs / Écartés */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Classés ({results.filter((r) => r.status !== 'discarded').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discarded')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'discarded'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Écartés ({results.filter((r) => r.status === 'discarded').length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Curseur de score minimal */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Seuil min :</span>
            <span className="font-mono font-bold text-indigo-600">{minScoreFilter}%</span>
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="w-20 accent-indigo-600 cursor-pointer h-1.5"
              aria-label="Filtrer par score minimal"
            />
          </div>

          {/* Bouton Réglages de scoring */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="text-xs h-8 gap-1.5 text-slate-700 dark:text-slate-300"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Réglages scoring</span>
          </Button>

          {/* Bouton Comparer 2 à 4 candidats */}
          <Button
            size="sm"
            onClick={handleLaunchComparison}
            disabled={selectedForComparison.length < 2}
            className={`text-xs h-8 gap-1.5 ${
              selectedForComparison.length >= 2
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comparer ({selectedForComparison.length}/4)</span>
          </Button>
        </div>
      </div>

      {/* ÉTAT : Aucun candidat proche */}
      {filteredResults.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Aucun candidat ne franchit le seuil de {minScoreFilter}%
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Les critères indispensables cumulés restreignent fortement le vivier actuel.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMinScoreFilter(40)}
              className="text-xs"
            >
              Abaisser le seuil à 40%
            </Button>
            <Button
              size="sm"
              onClick={onBackToCriteria}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              Réajuster les critères indispensables
            </Button>
          </div>
        </Card>
      ) : (
        /* Classement dédupliqué : Un candidat par ligne unique */
        <div className="space-y-3">
          {filteredResults.map((result) => {
            const { candidate, overallScore, breakdown, rank } = result;
            const isSelected = selectedForComparison.includes(candidate.id);
            const isDiscarded = result.status === 'discarded';

            return (
              <Card
                key={candidate.id}
                className={`p-4 sm:p-5 transition-all duration-200 border ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Gauche : Checkbox comparaison, Rang, Identité DTO, Titre, Jauge */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Checkbox pour sélection de comparaison (2 à 4) */}
                    <div className="pt-1 sm:pt-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectComparison(candidate.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        title="Sélectionner pour le comparatif côte à côte (2 à 4 candidats)"
                        aria-label={`Sélectionner ${candidate.pseudonym} pour comparatif`}
                      />
                    </div>

                    {/* Rang */}
                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono text-slate-700 dark:text-slate-300 shrink-0">
                      #{rank}
                    </div>

                    {/* Jauge circulaire Score % */}
                    <ScoreGauge score={overallScore} size="sm" showDetails />

                    {/* Identité selon DTO & Métadonnées */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {candidate.pseudonym}
                        </span>
                        <BlindModeBadge compact />
                        {isDiscarded && (
                          <Badge variant="destructive" className="text-[10px]">
                            Écarté : {result.discardReason || 'Motif objectif'}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 truncate">
                        {candidate.currentTitle}
                      </h3>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        « {result.aiSummary} »
                      </p>
                    </div>
                  </div>

                  {/* Milieu : Répartition (Indispensables, Souhaités, Similarité) */}
                  <div className="flex items-center gap-4 py-2 lg:py-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-6 shrink-0">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Indispensables
                      </span>
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {breakdown.indispensableSatisfied}/{breakdown.indispensableTotal}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Souhaités
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {breakdown.souhaiteSatisfied}/{breakdown.souhaiteTotal}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Similarité
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                        {breakdown.similarityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Droite : Boutons d'action (Détails, Shortlist, Pipeline, Écarter) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenDrawer(result)}
                      className="text-xs h-8 gap-1 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Détails</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShortlistCandidate(candidate.id)}
                      className="text-xs h-8 gap-1 text-slate-700 dark:text-slate-300"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Shortlist</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onPipelineCandidate(candidate.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1 shadow-xs"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pipeline</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDiscardCandidate(result)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-8 px-2"
                      title="Écarter de l'offre avec un motif objectif (liste codée)"
                      aria-label={`Écarter ${candidate.pseudonym}`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
