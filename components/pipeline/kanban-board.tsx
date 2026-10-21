'use client';

import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { ReasonDialog } from '@/components/shared/reason-dialog';
import { ReauthDialog } from '@/components/shared/reauth-dialog';
import { Shield, AlertCircle } from 'lucide-react';
import type { PipelineCandidacy, PipelineStageConfig } from '@/lib/pipeline/pipeline-store';

interface KanbanBoardProps {
  stages: PipelineStageConfig[];
  candidacies: PipelineCandidacy[];
  onMoveCandidacy: (params: {
    candidacyId: string;
    targetStageId: string;
    reason?: string;
    unmaskReason?: string;
  }) => Promise<void>;
  onCardClick: (candidacy: PipelineCandidacy) => void;
}

export function KanbanBoard({
  stages,
  candidacies,
  onMoveCandidacy,
  onCardClick,
}: KanbanBoardProps) {
  // Définition des capteurs Dnd-kit (accessibilité souris, tactile et clavier)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Évite le déclenchement accidentel au clic
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // États pour les dialogues de règles métier
  const [pendingMove, setPendingMove] = useState<{
    candidacy: PipelineCandidacy;
    targetStage: PipelineStageConfig;
  } | null>(null);

  // Dialogue de motif obligatoire (rejet / levée d'anonymat)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [reasonActionType, setReasonActionType] = useState<'rejection' | 'unmask'>('rejection');
  const [recordedReason, setRecordedReason] = useState<string>('');

  // Dialogue de ré-authentification pour levée du mode aveugle
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);

  /**
   * Gestionnaire central de transition après glisser-déposer ou commande clavier
   */
  const initiateTransition = (candidacyId: string, targetStageId: string) => {
    const candidacy = candidacies.find((c) => c.id === candidacyId);
    const targetStage = stages.find((s) => s.id === targetStageId);

    if (!candidacy || !targetStage) return;
    if (candidacy.stageId === targetStage.id) return; // Même étape, rien à faire

    // RÈGLE MÉTIER 1 : Dépôt sur étape de catégorie 'lost' (Refusé)
    // -> Motif codé obligatoire via ReasonDialog
    if (targetStage.category === 'lost') {
      setPendingMove({ candidacy, targetStage });
      setReasonActionType('rejection');
      setIsReasonDialogOpen(true);
      return;
    }

    // RÈGLE MÉTIER 2 : Dépôt sur étape de contact en mode aveugle (Entretien)
    // -> Point de rupture : ReasonDialog PUIS ReauthDialog
    if (targetStage.isUnmaskTrigger && candidacy.isBlind) {
      setPendingMove({ candidacy, targetStage });
      setReasonActionType('unmask');
      setIsReasonDialogOpen(true);
      return;
    }

    // Transition manuelle normale
    onMoveCandidacy({
      candidacyId: candidacy.id,
      targetStageId: targetStage.id,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const candidacyId = String(active.id);
    const targetStageId = String(over.id);

    initiateTransition(candidacyId, targetStageId);
  };

  // Soumission du motif dans le ReasonDialog
  const handleReasonSubmit = async (reason: string) => {
    if (!pendingMove) return;

    if (reasonActionType === 'rejection') {
      // Pour un refus : validation immédiate avec motif codé
      setIsReasonDialogOpen(false);
      const move = pendingMove;
      setPendingMove(null);
      await onMoveCandidacy({
        candidacyId: move.candidacy.id,
        targetStageId: move.targetStage.id,
        reason,
      });
    } else if (reasonActionType === 'unmask') {
      // Pour une levée d'anonymat : conserver le motif et déclencher la ré-authentification 2FA
      setRecordedReason(reason);
      setIsReasonDialogOpen(false);
      setIsReauthDialogOpen(true);
    }
  };

  // Soumission réussie de la ré-authentification
  const handleReauthSuccess = async () => {
    setIsReauthDialogOpen(false);
    if (!pendingMove) return;

    const move = pendingMove;
    const reason = recordedReason;
    setPendingMove(null);
    setRecordedReason('');

    await onMoveCandidacy({
      candidacyId: move.candidacy.id,
      targetStageId: move.targetStage.id,
      unmaskReason: reason,
    });
  };

  // Annulation des dialogues (aucun déplacement de carte)
  const handleCancelDialog = () => {
    setIsReasonDialogOpen(false);
    setIsReauthDialogOpen(false);
    setPendingMove(null);
    setRecordedReason('');
  };

  return (
    <div className="space-y-3" data-testid="kanban-board-container">
      {/* Bandeau permanent : Les changements d'étape sont toujours manuels */}
      <div
        data-testid="permanent-manual-transition-banner"
        className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 flex items-center justify-between shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Principe de maîtrise humaine :</strong> Les changements d'étape sont toujours manuels. Aucune automatisation ne déplace un candidat sans arbitrage explicite d'un recruteur.
          </span>
        </div>
        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider hidden sm:inline">
          Art. 22 RGPD
        </span>
      </div>

      {/* Surface Kanban Dnd-kit */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div
          data-testid="kanban-columns-track"
          className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]"
        >
          {stages.map((stage) => {
            const stageCandidacies = candidacies.filter((c) => c.stageId === stage.id);
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                allStages={stages}
                candidacies={stageCandidacies}
                onCardClick={onCardClick}
                onMoveToStage={initiateTransition}
              />
            );
          })}
        </div>
      </DndContext>

      {/* Dialogue 1 : Motif codé obligatoire pour refus ou levée aveugle */}
      <ReasonDialog
        isOpen={isReasonDialogOpen}
        onClose={handleCancelDialog}
        onSubmit={handleReasonSubmit}
        actionType={reasonActionType}
        targetItemName={pendingMove?.candidacy.pseudonym}
      />

      {/* Dialogue 2 : Ré-authentification forte avant levée de l'anonymat */}
      <ReauthDialog
        isOpen={isReauthDialogOpen}
        onClose={handleCancelDialog}
        onSuccess={handleReauthSuccess}
        title="Levée de l'anonymat pour entretien"
        description={`Le passage du ${pendingMove?.candidacy.pseudonym} à l’étape d'entretien requiert la levée de l’anonymat. Veuillez confirmer votre identité.`}
        actionName="Levée du mode aveugle"
      />
    </div>
  );
}
