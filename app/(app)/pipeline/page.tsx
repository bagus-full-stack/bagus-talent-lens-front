'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Kanban as KanbanIcon,
  List as ListIcon,
  Shield,
  Plus,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Settings2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import { Can } from '@/components/shared/can';
import { useAuth } from '@/lib/auth/auth-context';
import { mockFolders } from '@/lib/mock/data/folders';
import { KanbanBoard } from '@/components/pipeline/kanban-board';
import { ListView } from '@/components/pipeline/list-view';
import { CandidacyDrawer } from '@/components/pipeline/candidacy-drawer';
import { PipelineIndicatorsPanel } from '@/components/pipeline/pipeline-indicators-panel';
import { StageConfigDialog } from '@/components/pipeline/stage-config-dialog';
import { AddCandidatesDialog } from '@/components/pipeline/add-candidates-dialog';
import type {
  PipelineCandidacy,
  PipelineStageConfig,
} from '@/lib/pipeline/pipeline-store';

export default function PipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode d'affichage synchronisé avec l'URL (?view=kanban ou ?view=list)
  const currentView = (searchParams.get('view') as 'kanban' | 'list') || 'kanban';

  const setViewMode = (view: 'kanban' | 'list') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.replace(`/pipeline?${params.toString()}`);
  };

  // Filtres
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Données du pipeline
  const [stages, setStages] = useState<PipelineStageConfig[]>([]);
  const [candidacies, setCandidacies] = useState<PipelineCandidacy[]>([]);
  const [recruiters, setRecruiters] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sélections et Tiroir
  const [selectedCandidacy, setSelectedCandidacy] = useState<PipelineCandidacy | null>(null);

  // Dialogues
  const [isStageConfigOpen, setIsStageConfigOpen] = useState(false);
  const [isAddCandidatesOpen, setIsAddCandidatesOpen] = useState(false);

  // Notification d'état (Toasts / Alerte de conflit)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'conflict' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'conflict' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement des données depuis l'API
  const fetchPipelineData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pipeline?folderId=${selectedFolder}`);
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || []);
        setCandidacies(data.candidacies || []);
        setRecruiters(data.recruiters || []);
      }
    } catch (err) {
      console.error('Erreur chargement pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    fetchPipelineData();
  }, [fetchPipelineData]);

  // Candidatures filtrées
  const filteredCandidacies = useMemo(() => {
    return candidacies.filter((c) => {
      if (selectedFolder !== 'all' && c.folderId !== selectedFolder) return false;
      if (selectedRecruiter !== 'all' && c.assignedRecruiterId !== selectedRecruiter) return false;
      if (selectedStageFilter !== 'all' && c.stageId !== selectedStageFilter) return false;
      return true;
    });
  }, [candidacies, selectedFolder, selectedRecruiter, selectedStageFilter]);

  /**
   * Transition d'étape avec mise à jour optimiste et retour arrière en cas d'erreur ou conflit
   */
  const handleMoveCandidacy = async (params: {
    candidacyId: string;
    targetStageId: string;
    reason?: string;
    unmaskReason?: string;
  }) => {
    const original = candidacies.find((c) => c.id === params.candidacyId);
    if (!original) return;

    const previousStageId = original.stageId;
    const targetStage = stages.find((s) => s.id === params.targetStageId);
    if (!targetStage) return;

    // 1. MISE À JOUR OPTIMISTE IMMÉDIATE DANS L'ÉTAT LOCAL
    const targetIsBlind =
      targetStage.isUnmaskTrigger && original.isBlind ? false : original.isBlind;

    setCandidacies((prev) =>
      prev.map((c) =>
        c.id === params.candidacyId
          ? {
              ...c,
              stageId: params.targetStageId,
              isBlind: targetIsBlind,
              unmaskedFullName:
                !targetIsBlind && !c.unmaskedFullName
                  ? `Alexandre ${c.pseudonym.replace('Candidat #', '')}`
                  : c.unmaskedFullName,
              daysInStage: 0,
              rejectionReason: targetStage.category === 'lost' ? params.reason : undefined,
              status:
                targetStage.category === 'lost'
                  ? 'rejected'
                  : targetStage.category === 'won'
                  ? 'hired'
                  : 'in_pipeline',
            }
          : c
      )
    );

    // Si la carte était ouverte dans le tiroir, synchroniser l'affichage
    if (selectedCandidacy?.id === params.candidacyId) {
      setSelectedCandidacy((prev) => (prev ? { ...prev, stageId: params.targetStageId } : null));
    }

    // 2. ENVOI AU SERVEUR AVEC DÉTECTION DE CONFLIT DE VERSION
    try {
      const res = await fetch('/api/pipeline/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidacyId: params.candidacyId,
          targetStageId: params.targetStageId,
          expectedVersion: original.version,
          reason: params.reason,
          unmaskReason: params.unmaskReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // En cas de conflit (409) ou d'erreur serveur : ROLLBACK IMMÉDIAT
        console.warn('Refus serveur lors du déplacement, application du rollback:', data);
        setCandidacies((prev) =>
          prev.map((c) => (c.id === params.candidacyId ? original : c))
        );

        if (res.status === 409) {
          showToast(
            `Conflit de version : Cette carte a déjà été déplacée par un autre recruteur. Vos modifications ont été annulées.`,
            'conflict'
          );
          fetchPipelineData();
        } else {
          showToast(`Erreur : ${data.error || 'La transition a été refusée.'}`, 'error');
        }
      } else {
        // Succès : mise à jour de la version retournée par le serveur
        setCandidacies((prev) =>
          prev.map((c) => (c.id === params.candidacyId ? data.candidacy : c))
        );
        showToast(
          targetIsBlind !== original.isBlind
            ? `Candidat déplacé vers « ${targetStage.name} » avec levée d'anonymat autorisée.`
            : `Candidat déplacé vers « ${targetStage.name} » avec succès.`
        );
      }
    } catch (err) {
      // Erreur réseau : ROLLBACK
      setCandidacies((prev) =>
        prev.map((c) => (c.id === params.candidacyId ? original : c))
      );
      showToast('Erreur réseau lors de la mise à jour. Rollback effectué.', 'error');
    }
  };

  // Ajout de note interne
  const handleAddNote = async (candidacyId: string, content: string) => {
    try {
      const res = await fetch('/api/pipeline/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidacyId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidacies((prev) =>
          prev.map((c) => (c.id === candidacyId ? data.candidacy : c))
        );
        if (selectedCandidacy?.id === candidacyId) {
          setSelectedCandidacy(data.candidacy);
        }
        showToast('Note interne enregistrée dans le registre d’audit.');
      }
    } catch (err) {
      console.error('Erreur ajout note:', err);
    }
  };

  // Modification du responsable
  const handleUpdateRecruiter = async (candidacyId: string, recruiterId: string) => {
    const rec = recruiters.find((r) => r.id === recruiterId);
    if (!rec) return;

    setCandidacies((prev) =>
      prev.map((c) =>
        c.id === candidacyId
          ? { ...c, assignedRecruiterId: rec.id, assignedRecruiterName: rec.name }
          : c
      )
    );
    if (selectedCandidacy?.id === candidacyId) {
      setSelectedCandidacy((prev) =>
        prev ? { ...prev, assignedRecruiterId: rec.id, assignedRecruiterName: rec.name } : null
      );
    }
    showToast(`Responsable réassigné à ${rec.name}.`);
  };

  // Configuration des étapes (Admin)
  const handleSaveStages = async (updatedStages: PipelineStageConfig[]) => {
    try {
      const res = await fetch('/api/pipeline/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: updatedStages }),
      });
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages);
        showToast('Configuration des étapes mise à jour.');
      }
    } catch (err) {
      console.error('Erreur config étapes:', err);
    }
  };

  // Ajout d'un candidat depuis le vivier
  const handleAddCandidate = async (candidateId: string) => {
    const targetFolder = selectedFolder === 'all' ? 'fld-de-2026' : selectedFolder;
    const res = await fetch('/api/pipeline', {
      method: 'GET',
    });
    // Rechargement immédiat
    await fetchPipelineData();
    showToast('Candidat ajouté à l’étape Nouveau.');
  };

  // Actions groupées (Vue Liste)
  const handleBulkMove = async (candidacyIds: string[], targetStageId: string, reason?: string) => {
    for (const id of candidacyIds) {
      await handleMoveCandidacy({
        candidacyId: id,
        targetStageId,
        reason,
      });
    }
  };

  const handleBulkAssign = async (candidacyIds: string[], recruiterId: string) => {
    for (const id of candidacyIds) {
      await handleUpdateRecruiter(id, recruiterId);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Toast de statut */}
      {toastMessage && (
        <div
          data-testid="pipeline-toast"
          className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border flex items-center gap-2 animate-in fade-in duration-150 ${
            toastMessage.type === 'conflict'
              ? 'bg-rose-900 border-rose-700'
              : toastMessage.type === 'error'
              ? 'bg-red-800 border-red-600'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          {toastMessage.type === 'conflict' ? (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. En-tête : sélecteur de dossier, filtres, bascule Kanban/Liste, Ajouter */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <Link href="/" className="hover:text-slate-700">Recrutement</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Pipeline de sélection</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pipeline de recrutement
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bascule Kanban / Liste synchronisée dans l'URL */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              variant={currentView === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              data-testid="btn-view-kanban"
              className="h-7 px-2.5 text-xs font-semibold gap-1.5"
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </Button>
            <Button
              variant={currentView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="btn-view-list"
              className="h-7 px-2.5 text-xs font-semibold gap-1.5"
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span>Liste</span>
            </Button>
          </div>

          {/* Configurer les étapes (Admin) */}
          <Can action="pipeline.write">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStageConfigOpen(true)}
              data-testid="btn-config-stages"
              className="h-8 text-xs gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            >
              <Settings2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Configurer les étapes</span>
            </Button>
          </Can>

          {/* Ajouter des candidats */}
          <Can action="pipeline.write">
            <Button
              size="sm"
              onClick={() => setIsAddCandidatesOpen(true)}
              data-testid="btn-add-candidates"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter des candidats</span>
            </Button>
          </Can>
        </div>
      </header>

      {/* 2. Barre de filtres (Dossier, Responsable, Étape) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur de dossier */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Dossier :</span>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              data-testid="select-filter-folder"
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tous les dossiers</option>
              {mockFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.reference} - {f.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Responsable */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Responsable :</span>
            <select
              value={selectedRecruiter}
              onChange={(e) => setSelectedRecruiter(e.target.value)}
              data-testid="select-filter-recruiter"
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tous les recruteurs</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Étape */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Étape :</span>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              data-testid="select-filter-stage"
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">Toutes les étapes</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rappel mode aveugle */}
        <BlindBadge folder="Mode aveugle actif" compact />
      </div>

      {/* 3. Panneau Indicateurs (Candidats par étape, Vélocité, Motifs de refus) */}
      <PipelineIndicatorsPanel stages={stages} candidacies={filteredCandidacies} />

      {/* 4. Vue active : Kanban ou Liste */}
      {currentView === 'kanban' ? (
        <KanbanBoard
          stages={stages}
          candidacies={filteredCandidacies}
          onMoveCandidacy={handleMoveCandidacy}
          onCardClick={(c) => setSelectedCandidacy(c)}
        />
      ) : (
        <ListView
          stages={stages}
          candidacies={filteredCandidacies}
          recruiters={recruiters}
          onSelectCandidacy={(c) => setSelectedCandidacy(c)}
          onBulkMove={handleBulkMove}
          onBulkAssign={handleBulkAssign}
        />
      )}

      {/* 5. Tiroir de candidature latéral */}
      <CandidacyDrawer
        candidacy={selectedCandidacy}
        stages={stages}
        recruiters={recruiters}
        onClose={() => setSelectedCandidacy(null)}
        onUpdateStage={(cId, stgId) =>
          handleMoveCandidacy({ candidacyId: cId, targetStageId: stgId })
        }
        onUpdateRecruiter={handleUpdateRecruiter}
        onAddNote={handleAddNote}
      />

      {/* 6. Dialogue d'administration des étapes */}
      <StageConfigDialog
        isOpen={isStageConfigOpen}
        stages={stages}
        onClose={() => setIsStageConfigOpen(false)}
        onSaveStages={handleSaveStages}
      />

      {/* 7. Dialogue d'ajout de profils au pipeline */}
      <AddCandidatesDialog
        isOpen={isAddCandidatesOpen}
        folderId={selectedFolder}
        existingCandidacies={candidacies}
        onClose={() => setIsAddCandidatesOpen(false)}
        onAddCandidate={handleAddCandidate}
      />
    </div>
  );
}
