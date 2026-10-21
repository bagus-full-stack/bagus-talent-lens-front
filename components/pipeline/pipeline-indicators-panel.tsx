'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, AlertOctagon, TrendingUp, BarChart3 } from 'lucide-react';
import type { PipelineCandidacy, PipelineStageConfig } from '@/lib/pipeline/pipeline-store';

interface PipelineIndicatorsPanelProps {
  stages: PipelineStageConfig[];
  candidacies: PipelineCandidacy[];
}

export function PipelineIndicatorsPanel({
  stages,
  candidacies,
}: PipelineIndicatorsPanelProps) {
  const total = candidacies.length;

  // Calcul du délai moyen global
  const avgDays = total > 0
    ? (candidacies.reduce((acc, c) => acc + c.daysInStage, 0) / total).toFixed(1)
    : '0';

  // Décompte des motifs de refus
  const rejectionReasonsCount: Record<string, number> = {};
  candidacies
    .filter((c) => c.status === 'rejected' && c.rejectionReason)
    .forEach((c) => {
      const reason = c.rejectionReason!;
      rejectionReasonsCount[reason] = (rejectionReasonsCount[reason] || 0) + 1;
    });

  const rejectedTotal = candidacies.filter((c) => c.status === 'rejected').length;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
      data-testid="pipeline-indicators-panel"
    >
      {/* 1. Candidats par étape */}
      <Card className="p-3.5 space-y-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-500" />
            <span>Répartition par étape</span>
          </span>
          <span className="font-mono text-slate-500 text-[11px] font-bold">
            {total} profils
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {stages.slice(0, 5).map((stage) => {
            const count = candidacies.filter((c) => c.stageId === stage.id).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={stage.id} className="space-y-0.5 text-[11px]">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="truncate max-w-[170px]">{stage.name}</span>
                  <span className="font-mono font-medium">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Délai moyen par étape (Vélocité) */}
      <Card className="p-3.5 space-y-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Délai moyen d'étape</span>
          </span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            Vélocité : {avgDays} j
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          {stages.slice(0, 3).map((stg) => {
            const inStage = candidacies.filter((c) => c.stageId === stg.id);
            const stgAvg = inStage.length > 0
              ? (inStage.reduce((acc, c) => acc + c.daysInStage, 0) / inStage.length).toFixed(1)
              : '0';
            return (
              <div
                key={stg.id}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5"
              >
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                  {stgAvg} j
                </div>
                <div className="text-[10px] text-slate-400 truncate">{stg.name}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Motifs de refus (Explicabilité éthique) */}
      <Card className="p-3.5 space-y-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4 text-rose-500" />
            <span>Motifs de refus consignés</span>
          </span>
          <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-[11px]">
            {rejectedTotal} écartés
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px] pt-1">
          {Object.entries(rejectionReasonsCount).length === 0 ? (
            <p className="text-slate-400 italic text-[10px] pt-3 text-center">
              Aucun candidat écarté avec motif dans ce périmètre.
            </p>
          ) : (
            Object.entries(rejectionReasonsCount).map(([reason, cnt], i) => (
              <div key={i} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="truncate max-w-[200px]" title={reason}>
                  {reason}
                </span>
                <span className="font-mono font-bold shrink-0">{cnt}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
