'use client';

import React from 'react';
import { ShieldAlert, ArrowRight, Sparkles, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProtectedCriterionDetection } from '@/lib/search/protected-criteria';

interface ProtectedCriterionAlertProps {
  criterion: ProtectedCriterionDetection;
  onApplySuggestion: (suggestion: string) => void;
}

export function ProtectedCriterionAlert({
  criterion,
  onApplySuggestion,
}: ProtectedCriterionAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 sm:p-5 text-rose-900 dark:text-rose-100 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
              <span>Garde-fou éthique activé : Critère protégé détecté</span>
            </h3>
            <Badge
              variant="outline"
              className="bg-rose-200/60 text-rose-900 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700 text-[11px] font-mono"
            >
              Art. L1132-1 Code du travail
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
            {criterion.message}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-300 font-medium pt-0.5">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>
              La sélection doit reposer exclusivement sur des compétences techniques et qualifications professionnelles vérifiables.
            </span>
          </div>
        </div>
      </div>

      {/* Proposition de reformulation objective */}
      {criterion.suggestion && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/50">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Suggestion de reformulation objective :
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              « {criterion.suggestion} »
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => onApplySuggestion(criterion.suggestion)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shrink-0 shadow-sm"
          >
            <span>Appliquer la reformulation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
