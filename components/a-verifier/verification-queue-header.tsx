'use client';

import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VerificationStats } from '@/lib/schemas/verification';
import { cn } from '@/lib/utils';

interface VerificationQueueHeaderProps {
  stats: VerificationStats;
  onNextUntreated: () => void;
  onOpenShortcutsHelp: () => void;
  simulateError: boolean;
  onToggleSimulateError: () => void;
  onToggleTestPanel: () => void;
  isTestPanelOpen: boolean;
  hasPending: boolean;
}

export function VerificationQueueHeader({
  stats,
  onNextUntreated,
  onOpenShortcutsHelp,
  simulateError,
  onToggleSimulateError,
  onToggleTestPanel,
  isTestPanelOpen,
  hasPending,
}: VerificationQueueHeaderProps) {
  const percentage = stats.total > 0 ? Math.round((stats.treated / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Titre et description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                À vérifier
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {stats.pending} en attente
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Arbitrage des champs incertains, détection de prompt injection et fiabilisation des profils.
              </p>
            </div>
          </div>
        </div>

        {/* Progression « 7 / 12 traités » et actions rapides */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bloc Progression dynamique */}
          <div
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
            role="status"
            aria-live="polite"
            aria-label={`Progression : ${stats.treated} sur ${stats.total} traités`}
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Progression
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {stats.treated} / {stats.total} traités
              </span>
            </div>

            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-teal-600 dark:bg-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={stats.treated}
                aria-valuemin={0}
                aria-valuemax={stats.total}
              />
            </div>
            <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
              {percentage}%
            </span>
          </div>

          {/* Bouton « Suivant » */}
          <Button
            onClick={onNextUntreated}
            disabled={!hasPending}
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 px-4 h-9.5"
            title="Passer directement au prochain élément non traité (Raccourci: N)"
            aria-label="Passer à l'élément suivant non traité"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Bouton Aide Raccourcis [?] */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShortcutsHelp}
            className="h-9.5 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            title="Afficher les raccourcis clavier (Appuyez sur ?)"
            aria-label="Afficher l'aide des raccourcis clavier"
          >
            <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Raccourcis</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ?
            </kbd>
          </Button>

          {/* Bouton Simulation Erreur Serveur (Rollback Optimiste) */}
          <Button
            variant={simulateError ? 'destructive' : 'outline'}
            size="sm"
            onClick={onToggleSimulateError}
            className={cn(
              'h-9.5 text-xs flex items-center gap-1.5 transition-all',
              simulateError
                ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-400/50'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            )}
            title="Simule une erreur HTTP 500 pour tester le retour arrière optimiste TanStack Query"
          >
            <Zap className={cn('w-3.5 h-3.5', simulateError ? 'animate-pulse text-white' : 'text-amber-500')} />
            <span>{simulateError ? 'Simu. Erreur 500 : ACTIVE' : 'Tester Rollback 500'}</span>
          </Button>

          {/* Bouton Banc de Test interactif */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTestPanel}
            className={cn(
              'h-9.5 text-xs flex items-center gap-1.5',
              isTestPanelOpen
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400'
            )}
            title="Ouvrir le panneau de scénarios de tests automatisés (clavier, optimistic rollback, a11y)"
          >
            <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Banc de Test</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
