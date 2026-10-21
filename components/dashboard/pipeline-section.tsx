import React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';
import { getPipelineStageStats } from '@/lib/dashboard/data';
import { PipelineStageChart } from '@/components/dashboard/pipeline-stage-chart';
import { EmptyState, ErrorState } from '@/components/shared/feedback-states';

interface PipelineSectionProps {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export async function PipelineSection({
  simulateError,
  simulateEmpty,
}: PipelineSectionProps) {
  let stageStats = [];

  try {
    stageStats = await getPipelineStageStats({
      shouldFail: simulateError,
      isEmpty: simulateEmpty,
    });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur de rendu du pipeline"
          message={err instanceof Error ? err.message : 'Impossible de calculer la répartition par étape.'}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Répartition des candidats par étape</h2>
            <p className="text-[11px] text-slate-400">
              Progression fluide à travers les 6 étapes sans rupture de l’anonymat
            </p>
          </div>
        </div>

        <Link
          href="/pipeline"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
        >
          <span>Vue Kanban complète</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {stageStats.length === 0 ? (
        <EmptyState
          title="Aucun candidat dans le pipeline"
          description="Le graphique s'actualisera dès que des candidatures seront positionnées dans le processus."
        />
      ) : (
        <PipelineStageChart data={stageStats} />
      )}
    </div>
  );
}
