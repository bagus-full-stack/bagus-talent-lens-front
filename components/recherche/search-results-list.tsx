'use client';

import React from 'react';
import {
  ArrowUpDown,
  SearchX,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CandidateResultCard } from './candidate-result-card';
import type { SearchCandidateResult, SearchResponse } from '@/lib/search/search-engine';
import type { SearchFilters } from '@/lib/search/search-params';

interface SearchResultsListProps {
  response: SearchResponse | null;
  filters: SearchFilters;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onChangeFilters: (next: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
  onOpenUnmask: (cand: any) => void;
  onRetry: () => void;
}

export function SearchResultsList({
  response,
  filters,
  isLoading,
  isError,
  errorMessage,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onChangeFilters,
  onResetFilters,
  onOpenUnmask,
  onRetry,
}: SearchResultsListProps) {
  // 1. ÉTAT : ERREUR
  if (isError) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Erreur lors de la recherche
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {errorMessage || 'Une erreur est survenue lors de l’indexation vectorielle des profils.'}
          </p>
        </div>
        <Button onClick={onRetry} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réessayer la recherche</span>
        </Button>
      </Card>
    );
  }

  // 2. ÉTAT : CHARGEMENT
  if (isLoading && !response) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Recherche sémantique vectorielle en cours... Indexation RGPD active.</span>
        </div>

        {[1, 2, 3].map((n) => (
          <Card key={n} className="p-5 space-y-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-64" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-52" />
              </div>
              <div className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const candidates = response?.candidates || [];
  const totalCount = response?.totalCount || 0;
  const page = response?.page || 1;
  const totalPages = response?.totalPages || 1;
  const isAllSelected = candidates.length > 0 && candidates.every((c) => selectedIds.includes(c.candidate.id));

  // 3. ÉTAT : AUCUN RÉSULTAT (SUGGESTIONS)
  if (candidates.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <SearchX className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
            Aucun candidat ne correspond à l’ensemble de vos critères
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Vos filtres sont peut-être trop restrictifs pour le vivier actuel.
          </p>
        </div>

        {/* Bloc de suggestions constructives */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 border border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
            💡 Suggestions pour élargir votre recherche :
          </span>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <span>•</span>
              <span>Augmentez le rayon géographique (+50 km) ou activez le télétravail.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span>•</span>
              <span>Abaissez le seuil d'années d'expérience minimale requis.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span>•</span>
              <span>Réduisez le nombre de compétences obligatoires cumulées.</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={onResetFilters}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser les filtres stricts</span>
        </Button>
      </Card>
    );
  }

  // 4. ÉTAT : RÉSULTATS AVEC CARTES
  return (
    <div className="space-y-4">
      {/* Barre de contrôle des résultats (Total, Sélection multiple, Tri) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
            />
            <span>Tout sélectionner</span>
          </label>

          <span>·</span>

          <span>
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{totalCount}</strong> candidat{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
          </span>
        </div>

        {/* Sélecteur de Tri (Pertinence, Expérience, Disponibilité) */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Trier par :</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChangeFilters({
                sortBy: e.target.value as SearchFilters['sortBy'],
                cursor: 1,
              })
            }
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            aria-label="Critère de tri des résultats"
          >
            <option value="relevance">Pertinence sémantique (IA)</option>
            <option value="experience">Années d'expérience (Décroissant)</option>
            <option value="availability">Disponibilité (Immédiate d'abord)</option>
          </select>
        </div>
      </div>

      {/* Liste des cartes candidats (Une carte unique par candidat dédupliqué) */}
      <div className="space-y-3.5">
        {candidates.map((res) => (
          <CandidateResultCard
            key={res.candidate.id}
            result={res}
            isSelected={selectedIds.includes(res.candidate.id)}
            onToggleSelect={onToggleSelect}
            onOpenUnmask={onOpenUnmask}
            onQuickShortlist={() => {}}
          />
        ))}
      </div>

      {/* Pagination par curseur */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Page <span className="font-bold text-slate-900 dark:text-slate-100">{page}</span> sur{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{totalPages}</span> ({totalCount} au total)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onChangeFilters({ cursor: Math.max(1, page - 1) })}
              className="h-8 px-3 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onChangeFilters({ cursor: Math.min(totalPages, page + 1) })}
              className="h-8 px-3 text-xs gap-1"
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
