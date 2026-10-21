'use client';

import React from 'react';
import { AlertCircle, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThresholdWarningCardProps {
  currentCount: number;
  onExpandFilters: () => void;
  onLoadSyntheticData?: () => void;
}

export function ThresholdWarningCard({
  currentCount,
  onExpandFilters,
  onLoadSyntheticData,
}: ThresholdWarningCardProps) {
  return (
    <div
      data-testid="threshold-warning-card"
      className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 rounded-xl p-5 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 mt-0.5">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Seuil critique : Moins de 50 CV analysés ({currentCount} profil{currentCount > 1 ? 's' : ''})
          </h2>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed max-w-2xl">
            La projection vectorielle (UMAP / t-SNE) nécessite au minimum <strong>50 profils</strong> pour former des clusters sémantiques statistiquement significatifs. En dessous de ce seuil, les distances géométriques ne reflètent pas fidèlement les proximités de compétences.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onExpandFilters}
          data-testid="btn-expand-filters"
          className="bg-white dark:bg-slate-900 border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs h-8"
        >
          <span>Élargir à tous les dossiers</span>
        </Button>

        {onLoadSyntheticData && (
          <Button
            size="sm"
            onClick={onLoadSyntheticData}
            data-testid="btn-load-synthetic"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Charger vivier complet (1 200 CVs)</span>
          </Button>
        )}
      </div>
    </div>
  );
}
