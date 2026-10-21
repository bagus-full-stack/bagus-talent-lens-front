'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  Loader2,
  Lock,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { UnmaskDialog } from '@/components/shared/unmask-dialog';
import { useSemanticSearch } from '@/lib/hooks/use-semantic-search';
import { SearchQueryBar } from '@/components/recherche/search-query-bar';
import { ProtectedCriterionAlert } from '@/components/recherche/protected-criterion-alert';
import { SearchStrictFiltersPanel } from '@/components/recherche/search-strict-filters-panel';
import { ActiveFilterBadges } from '@/components/recherche/active-filter-badges';
import { SearchResultsList } from '@/components/recherche/search-results-list';
import { BulkActionsBar } from '@/components/recherche/bulk-actions-bar';
import type { CvDocumentBlindDto } from '@/types';
import { useToast } from '@/components/shared/form-and-toast';

function SemanticSearchContent() {
  const {
    filters,
    updateFilters,
    resetFilters,
    response,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useSemanticSearch();

  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [unmaskCandidate, setUnmaskCandidate] = useState<CvDocumentBlindDto | null>(null);

  const handleToggleSelect = (candidateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    const currentCandidates = response?.candidates || [];
    if (currentCandidates.length === 0) return;

    const allCurrentIds = currentCandidates.map((c) => c.candidate.id);
    const isAllSelected = allCurrentIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      // Désélectionne les candidats de la page actuelle
      setSelectedIds((prev) => prev.filter((id) => !allCurrentIds.includes(id)));
    } else {
      // Ajoute tous les candidats de la page actuelle
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allCurrentIds])));
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    updateFilters({ query: suggestion, cursor: 1 });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
              Recrutement
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              Recherche de talents
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span>Recherche sémantique de talents</span>
            <Badge
              variant="secondary"
              className="font-mono text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              NLP & Vecteurs v3.4
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recherche en langage naturel, filtres stricts socle et garde-fou éthique sous Art. L1132-1 du Code du travail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Indexation temps réel</span>
          </div>

          <BlindModeBadge />
        </div>
      </div>

      {/* Bandeau d'information : Mode aveugle ON */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-xs shadow-sm">
        <Shield className="w-4 h-4 text-teal-400 shrink-0" />
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong>Mode aveugle actif :</strong> Les identités nominatives, coordonnées et photos sont strictement masquées pour garantir une impartialité totale lors du tri.
          </span>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            Conforme RGPD & CNIL
          </span>
        </div>
      </div>

      {/* Barre de recherche en langage naturel + exemples cliquables */}
      <SearchQueryBar
        query={filters.query}
        onChangeQuery={(newQuery) => updateFilters({ query: newQuery, cursor: 1 })}
        onSubmitSearch={() => refetch()}
        onSelectExample={(exampleQuery) => updateFilters({ query: exampleQuery, cursor: 1 })}
        isLoading={isLoading}
      />

      {/* Message de garde quand la requête porte sur un critère protégé */}
      {response?.protectedCriterion && (
        <ProtectedCriterionAlert
          criterion={response.protectedCriterion}
          onApplySuggestion={handleApplySuggestion}
        />
      )}

      {/* Grille principale : Panneau de filtres stricts (gauche) + Résultats (droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne gauche (4 cols) : Panneau des filtres stricts */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <SearchStrictFiltersPanel
            filters={filters}
            onChangeFilters={updateFilters}
            onResetFilters={resetFilters}
          />
        </div>

        {/* Colonne droite (8 cols) : Badges actifs + Résultats */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Badges de filtres actifs */}
          <ActiveFilterBadges
            filters={filters}
            onChangeFilters={updateFilters}
            onResetFilters={resetFilters}
          />

          {/* Liste des résultats */}
          <SearchResultsList
            response={response}
            filters={filters}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onChangeFilters={updateFilters}
            onResetFilters={resetFilters}
            onOpenUnmask={(cand) => setUnmaskCandidate(cand)}
            onRetry={refetch}
          />
        </div>
      </div>

      {/* Barre d'actions groupées flottante */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={handleSelectAll}
        isAllSelected={
          Boolean(response?.candidates && response.candidates.length > 0) &&
          (response?.candidates.every((c) => selectedIds.includes(c.candidate.id)) ?? false)
        }
      />

      {/* Modale d'élévation 2FA (UnmaskDialog) */}
      <UnmaskDialog
        isOpen={Boolean(unmaskCandidate)}
        onClose={() => setUnmaskCandidate(null)}
        candidatePseudonym={unmaskCandidate?.pseudonym || ''}
        folderReference="#CYB-88"
        onConfirmUnmask={(reason) => {
          addToast({
            type: 'warning',
            title: 'Levée d’anonymat autorisée',
            message: `Accès temporaire nominatif accordé pour le motif : « ${reason} ». Événement certifié WORM.`,
          });
          setUnmaskCandidate(null);
        }}
      />
    </div>
  );
}

export default function SemanticSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SemanticSearchContent />
    </Suspense>
  );
}
