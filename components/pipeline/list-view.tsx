'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Users,
  CheckSquare,
  Square,
  Shield,
  ArrowRight,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type {
  PipelineCandidacy,
  PipelineStageConfig,
} from '@/lib/pipeline/pipeline-store';
import { ReasonDialog } from '@/components/shared/reason-dialog';

interface ListViewProps {
  stages: PipelineStageConfig[];
  candidacies: PipelineCandidacy[];
  recruiters: { id: string; name: string }[];
  onSelectCandidacy: (candidacy: PipelineCandidacy) => void;
  onBulkMove: (candidacyIds: string[], targetStageId: string, reason?: string) => Promise<void>;
  onBulkAssign: (candidacyIds: string[], recruiterId: string) => Promise<void>;
}

export function ListView({
  stages,
  candidacies,
  recruiters,
  onSelectCandidacy,
  onBulkMove,
  onBulkAssign,
}: ListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);

  const isAllSelected =
    candidacies.length > 0 && selectedIds.length === candidacies.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidacies.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkMoveSubmit = async (targetStageId: string) => {
    const stage = stages.find((s) => s.id === targetStageId);
    if (stage?.category === 'lost') {
      setIsBulkRejectDialogOpen(true);
      return;
    }
    await onBulkMove(selectedIds, targetStageId);
    setSelectedIds([]);
  };

  const handleBulkRejectSubmit = async (reason: string) => {
    setIsBulkRejectDialogOpen(false);
    const rejectedStage = stages.find((s) => s.category === 'lost');
    if (rejectedStage) {
      await onBulkMove(selectedIds, rejectedStage.id, reason);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-3" data-testid="pipeline-list-view">
      {/* Barre d'actions groupées */}
      {selectedIds.length > 0 && (
        <div
          data-testid="bulk-actions-bar"
          className="bg-slate-900 text-white rounded-lg p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-100"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-400 font-mono">
              {selectedIds.length}
            </span>
            <span>candidat{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Déplacer vers une étape */}
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkMoveSubmit(e.target.value);
              }}
              defaultValue=""
              aria-label="Déplacer vers une étape"
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs"
            >
              <option value="" disabled>
                Déplacer vers une étape...
              </option>
              {stages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.name}
                </option>
              ))}
            </select>

            {/* Assigner à un responsable */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkAssign(selectedIds, e.target.value);
                  setSelectedIds([]);
                }
              }}
              defaultValue=""
              aria-label="Assigner à un responsable"
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs"
            >
              <option value="" disabled>
                Assigner à un recruteur...
              </option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Bouton Refuser en masse avec motif */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBulkRejectDialogOpen(true)}
              className="h-7 text-xs border-rose-500 text-rose-300 hover:bg-rose-950/40 gap-1"
            >
              <XCircle className="h-3 w-3" />
              <span>Refuser avec motif</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-7 text-xs text-slate-400 hover:text-white"
            >
              Désélectionner
            </Button>
          </div>
        </div>
      )}

      {/* Tableau des candidatures */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Tout sélectionner"
                    className="cursor-pointer"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">Candidat (DTO)</th>
                <th className="py-2.5 px-3">Titre actuel</th>
                <th className="py-2.5 px-3">Étape</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">Responsable</th>
                <th className="py-2.5 px-3">Ancienneté</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {candidacies.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const stage = stages.find((s) => s.id === c.stageId);

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(c.id)}
                        aria-label={`Sélectionner ${c.pseudonym}`}
                        className="cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>

                    <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => onSelectCandidacy(c)}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left font-mono"
                      >
                        {c.isBlind
                          ? c.pseudonym
                          : c.unmaskedFullName || c.pseudonym}
                      </button>
                    </td>

                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                      {c.currentTitle}
                    </td>

                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {stage?.name || 'Inconnue'}
                      </Badge>
                    </td>

                    <td className="py-2 px-3 font-mono font-bold">
                      <span className={c.matchScore >= 90 ? 'text-emerald-600' : 'text-indigo-600'}>
                        {c.matchScore}%
                      </span>
                    </td>

                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {c.assignedRecruiterName}
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-500">
                      {c.daysInStage} j
                    </td>

                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectCandidacy(c)}
                        className="h-7 px-2 text-[11px] text-indigo-600 dark:text-indigo-400"
                      >
                        Détails
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogue de refus motivé pour actions groupées */}
      <ReasonDialog
        isOpen={isBulkRejectDialogOpen}
        onClose={() => setIsBulkRejectDialogOpen(false)}
        onSubmit={handleBulkRejectSubmit}
        actionType="rejection"
        targetItemName={`${selectedIds.length} candidats sélectionnés`}
      />
    </div>
  );
}
