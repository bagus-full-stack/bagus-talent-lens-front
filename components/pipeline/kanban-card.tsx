'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Clock,
  User,
  ShieldCheck,
  Eye,
  MoreVertical,
  ArrowRight,
  GripVertical,
  Briefcase,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PipelineCandidacy, PipelineStageConfig } from '@/lib/pipeline/pipeline-store';

interface KanbanCardProps {
  candidacy: PipelineCandidacy;
  stages: PipelineStageConfig[];
  onClick: (candidacy: PipelineCandidacy) => void;
  onMoveToStage: (candidacyId: string, targetStageId: string) => void;
}

export function KanbanCard({
  candidacy,
  stages,
  onClick,
  onMoveToStage,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidacy.id,
    data: { candidacy },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const currentStageIndex = stages.findIndex((s) => s.id === candidacy.stageId);
  const prevStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all select-none',
        isDragging && 'opacity-60 shadow-xl ring-2 ring-indigo-500 scale-102 cursor-grabbing'
      )}
      data-testid={`kanban-card-${candidacy.id}`}
    >
      {/* En-tête de carte : Grip + Identité DTO + Score */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Poignée de drag */}
          <button
            {...listeners}
            {...attributes}
            aria-label={`Déplacer ${candidacy.pseudonym}`}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing p-0.5 rounded touch-none"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          {/* Identité selon DTO : Mode aveugle (pseudonyme) ou Démasqué */}
          <span
            onClick={() => onClick(candidacy)}
            className="font-bold text-xs font-mono text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
            data-testid="candidacy-identity"
          >
            {candidacy.isBlind
              ? candidacy.pseudonym
              : candidacy.unmaskedFullName || candidacy.pseudonym}
          </span>
        </div>

        {/* Score % */}
        <Badge
          className={cn(
            'text-[10px] font-mono px-1.5 py-0 font-bold shrink-0',
            candidacy.matchScore >= 90
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
              : candidacy.matchScore >= 80
              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {candidacy.matchScore}%
        </Badge>
      </div>

      {/* Titre du poste */}
      <p
        onClick={() => onClick(candidacy)}
        className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-2 cursor-pointer hover:underline text-[11px]"
      >
        {candidacy.currentTitle}
      </p>

      {/* Compétences clés */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {candidacy.topSkills.map((sk, idx) => (
          <span
            key={idx}
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] px-1.5 py-0.2 rounded font-medium truncate max-w-[120px]"
          >
            {sk}
          </span>
        ))}
      </div>

      {/* Ligne inférieure : Responsable + Ancienneté dans l'étape */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1 truncate max-w-[130px]" title={`Responsable : ${candidacy.assignedRecruiterName}`}>
          <div className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[8px] flex items-center justify-center shrink-0">
            {candidacy.assignedRecruiterName.charAt(0)}
          </div>
          <span className="truncate">{candidacy.assignedRecruiterName.split(' ')[0]}</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-slate-400 shrink-0" title={`Ancienneté dans l'étape`}>
          <Clock className="h-3 w-3" />
          <span data-testid="days-in-stage">{candidacy.daysInStage} j</span>
        </div>
      </div>

      {/* Commandes clavier d'accessibilité rapide */}
      <div className="hidden group-focus-within:flex group-hover:flex items-center justify-between pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-700 text-[10px]">
        {prevStage ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToStage(candidacy.id, prevStage.id);
            }}
            className="text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
            aria-label={`Reculer vers ${prevStage.name}`}
          >
            <ChevronLeft className="h-3 w-3" />
            <span>{prevStage.name}</span>
          </button>
        ) : (
          <span />
        )}

        {nextStage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToStage(candidacy.id, nextStage.id);
            }}
            className="text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer ml-auto"
            aria-label={`Avancer vers ${nextStage.name}`}
          >
            <span>{nextStage.name}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
