'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import type { PipelineCandidacy, PipelineStageConfig } from '@/lib/pipeline/pipeline-store';
import { Shield, Lock, CheckCircle2, XCircle } from 'lucide-react';

interface KanbanColumnProps {
  stage: PipelineStageConfig;
  allStages: PipelineStageConfig[];
  candidacies: PipelineCandidacy[];
  onCardClick: (candidacy: PipelineCandidacy) => void;
  onMoveToStage: (candidacyId: string, targetStageId: string) => void;
}

export function KanbanColumn({
  stage,
  allStages,
  candidacies,
  onCardClick,
  onMoveToStage,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage },
  });

  const getStageHeaderColor = () => {
    switch (stage.category) {
      case 'won':
        return 'border-t-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'lost':
        return 'border-t-rose-500 bg-rose-50/40 dark:bg-rose-950/20';
      default:
        return 'border-t-indigo-500 bg-slate-50/60 dark:bg-slate-900/40';
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${stage.id}`}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 overflow-hidden transition-colors border-t-4',
        getStageHeaderColor(),
        isOver && 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
      )}
    >
      {/* En-tête de colonne */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
            {stage.name}
          </span>
          {stage.isUnmaskTrigger && (
            <span title="Première étape de contact (levée d’anonymat 2FA)">
              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
            </span>
          )}
          {stage.category === 'won' && (
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
          )}
          {stage.category === 'lost' && (
            <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
          )}
        </div>

        <Badge
          variant="secondary"
          className="text-[10px] font-mono h-5 px-1.5 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          {candidacies.length}
        </Badge>
      </div>

      {/* Cartes dans la colonne */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[400px]">
        {candidacies.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <span>Aucun candidat</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Glissez une carte ici</span>
          </div>
        ) : (
          candidacies.map((c) => (
            <KanbanCard
              key={c.id}
              candidacy={c}
              stages={allStages}
              onClick={onCardClick}
              onMoveToStage={onMoveToStage}
            />
          ))
        )}
      </div>
    </div>
  );
}
