'use client';

import React from 'react';
import { Calendar, RefreshCw, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CartographyFooterProps {
  lastCalculatedAt: string;
  isRecalculating: boolean;
  onRecalculate: () => void;
  isAdmin?: boolean;
}

export function CartographyFooter({
  lastCalculatedAt,
  isRecalculating,
  onRecalculate,
  isAdmin = true,
}: CartographyFooterProps) {
  const formattedDate = (() => {
    try {
      const d = new Date(lastCalculatedAt);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return lastCalculatedAt;
    }
  })();

  return (
    <footer
      data-testid="cartography-footer"
      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs"
    >
      {/* Date et note permanente */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span data-testid="last-calculated-date">Dernier calcul UMAP : {formattedDate}</span>
        </div>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <p className="text-[11px] italic text-slate-500 dark:text-slate-400" data-testid="incremental-note">
          Positions recalculées chaque nuit ; nouveaux CV placés sans déplacer les autres.
        </p>
      </div>

      {/* Bouton Recalculer (Admin) */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Rôle Admin
        </Badge>
        <Button
          size="sm"
          variant="outline"
          disabled={!isAdmin || isRecalculating}
          onClick={onRecalculate}
          data-testid="btn-recalculate-umap"
          className="h-7 px-3 text-xs gap-1.5 font-medium border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <RefreshCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>{isRecalculating ? 'Calcul en cours...' : 'Recalculer'}</span>
        </Button>
      </div>
    </footer>
  );
}
