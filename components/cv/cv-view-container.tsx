'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Award,
  MessageSquare,
  History,
  Shield,
  Loader2,
} from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { PdfViewer, type BoundingBox } from '@/components/shared/pdf-viewer';
import { ReasonDialog } from '@/components/shared/reason-dialog';
import { ReauthDialog } from '@/components/shared/reauth-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useToast } from '@/components/shared/form-and-toast';
import { CvHeader } from './cv-header';
import { CvStatusBanners } from './cv-status-banners';
import { ExtractedDataTab } from './tabs/extracted-data-tab';
import { SkillsTab } from './tabs/skills-tab';
import { NotesTab } from './tabs/notes-tab';
import { HistoryTab } from './tabs/history-tab';
import { CvBottomBar } from './cv-bottom-bar';
import type { CandidateCvDetail } from '@/types';
import {
  updateCvFieldAction,
  validateCvFieldAction,
  validateCvExtractionAction,
  updateCvPipelineStageAction,
  toggleCvShortlistAction,
  toggleCvRestrictionAction,
  addCvNoteAction,
  unmaskCvAction,
  deleteCvAction,
} from '@/app/(app)/cv/actions';
import { cn } from '@/lib/utils';

export interface CvViewContainerProps {
  initialCandidate: CandidateCvDetail;
}

type TabType = 'extracted' | 'skills' | 'notes' | 'history';

export function CvViewContainer({ initialCandidate }: CvViewContainerProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [candidate, setCandidate] = useState<CandidateCvDetail>(initialCandidate);
  const [activeTab, setActiveTab] = useState<TabType>('extracted');
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);

  // États de l'URL signée (60 secondes)
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [hasDocumentError, setHasDocumentError] = useState(false);

  // États d'enregistrement et concurrence optimiste
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingField, setIsSavingField] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versionConflict, setVersionConflict] = useState<{
    conflict: boolean;
    currentVersion: number;
    message: string;
  } | null>(null);

  // Dialogs de la levée d'anonymat en 2 étapes (ReasonDialog puis ReauthDialog)
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [pendingUnmaskReason, setPendingUnmaskReason] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActionPending, startTransition] = useTransition();

  // 1. Récupération & rafraîchissement automatique de l'URL signée (TTL 60s)
  const fetchSignedUrl = useCallback(async () => {
    try {
      const res = await fetch(`/api/cv/${candidate.id}/signed-url`);
      if (!res.ok) throw new Error('Échec récupération URL signée');
      const data = await res.json();
      setSignedUrl(data.signedUrl);
      setDocumentTitle(data.documentTitle || 'CV_Document.pdf');
      setHasDocumentError(false);
    } catch {
      setHasDocumentError(true);
    }
  }, [candidate.id]);

  useEffect(() => {
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  // 2. Synchronisation de la candidate reçue en prop
  useEffect(() => {
    setCandidate(initialCandidate);
  }, [initialCandidate]);

  // 3. Gestion des Bounding Boxes pour le PDF Viewer
  const boundingBoxes: BoundingBox[] = Object.values(candidate.extractedFields)
    .filter((f) => f.bbox)
    .map((f) => ({
      ...f.bbox!,
      category: f.isPii ? 'pii_name' : 'experience',
      fieldKey: f.key,
    }));

  // 4. Enregistrement d'un champ avec Debounce et gestion de conflit de version
  const saveDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    // Mise à jour optimiste locale immédiate
    setCandidate((prev) => {
      const field = prev.extractedFields[key];
      if (!field) return prev;
      return {
        ...prev,
        extractedFields: {
          ...prev.extractedFields,
          [key]: {
            ...field,
            value,
          },
        },
      };
    });

    setHasUnsavedChanges(true);
    setIsSavingField(key);

    if (saveDebounceTimeoutRef.current) {
      clearTimeout(saveDebounceTimeoutRef.current);
    }

    // Debounce de 700ms pour l'enregistrement automatique
    saveDebounceTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const result = await updateCvFieldAction({
          candidateId: candidate.id,
          key,
          value,
          version: candidate.version,
        });

        if (result.conflict) {
          setVersionConflict({
            conflict: true,
            currentVersion: result.currentVersion || candidate.version + 1,
            message: result.message || 'La fiche a été modifiée par un autre utilisateur.',
          });
          addToast({
            title: 'Conflit de version détecté',
            message: 'Un autre recruteur a mis à jour cette fiche.',
            type: 'warning',
          });
        } else if (result.success && result.newVersion) {
          setCandidate((prev) => ({
            ...prev,
            version: result.newVersion!,
          }));
          setHasUnsavedChanges(false);
          setLastSavedAt(new Date());
          setVersionConflict(null);
        } else if (!result.success) {
          addToast({
            title: 'Erreur d’enregistrement',
            message: result.message || 'Impossible d’enregistrer le champ.',
            type: 'error',
          });
        }
      } catch (err) {
        addToast({
          title: 'Erreur réseau',
          message: 'Échec de la synchronisation avec le serveur.',
          type: 'error',
        });
      } finally {
        setIsSaving(false);
        setIsSavingField(null);
      }
    }, 700);
  };

  // 5. Sauvegarde manuelle immédiate
  const handleSaveManual = async () => {
    if (saveDebounceTimeoutRef.current) {
      clearTimeout(saveDebounceTimeoutRef.current);
    }
    setIsSaving(true);
    try {
      addToast({
        title: 'Synchronisation',
        message: 'Toutes les modifications sont enregistrées.',
        type: 'success',
      });
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Validation d'un champ sous le seuil
  const handleValidateField = async (key: string) => {
    try {
      await validateCvFieldAction({ candidateId: candidate.id, key });
      setCandidate((prev) => {
        const field = prev.extractedFields[key];
        if (!field) return prev;
        return {
          ...prev,
          extractedFields: {
            ...prev.extractedFields,
            [key]: {
              ...field,
              isVerified: true,
              underThreshold: false,
            },
          },
        };
      });
      addToast({
        title: 'Champ validé',
        message: `Le champ « ${candidate.extractedFields[key]?.label} » a été certifié.`,
        type: 'success',
      });
    } catch {
      addToast({
        title: 'Erreur',
        message: 'Impossible de valider ce champ.',
        type: 'error',
      });
    }
  };

  // 7. Validation globale de l'extraction
  const handleValidateExtraction = async () => {
    setIsValidating(true);
    try {
      const res = await validateCvExtractionAction({ candidateId: candidate.id });
      if (res.success) {
        setCandidate((prev) => ({
          ...prev,
          extractionStatus: 'validated',
          extractedFields: Object.fromEntries(
            Object.entries(prev.extractedFields).map(([k, f]) => [
              k,
              { ...f, isVerified: true, underThreshold: false },
            ]),
          ),
        }));
        addToast({
          title: 'Extraction certifiée',
          message: 'L’ensemble des champs a été validé et scellé.',
          type: 'success',
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  // 8. Changement d'étape du pipeline
  const handleChangePipelineStage = async (stage: string) => {
    startTransition(async () => {
      await updateCvPipelineStageAction({ candidateId: candidate.id, stage });
      setCandidate((prev) => ({ ...prev, pipelineStage: stage }));
      addToast({
        title: 'Pipeline mis à jour',
        message: `Candidat déplacé vers « ${stage} ».`,
        type: 'info',
      });
    });
  };

  // 9. Shortlist
  const handleToggleShortlist = async () => {
    startTransition(async () => {
      await toggleCvShortlistAction({ candidateId: candidate.id });
      setCandidate((prev) => ({ ...prev, isShortlisted: !prev.isShortlisted }));
      addToast({
        title: candidate.isShortlisted ? 'Retiré de la shortlist' : 'Ajouté à la shortlist',
        message: candidate.isShortlisted
          ? 'Le profil n’est plus dans la shortlist active.'
          : 'Le profil a été ajouté à la shortlist de présentation.',
        type: 'success',
      });
    });
  };

  // 10. Restriction RGPD
  const handleToggleRestriction = async () => {
    startTransition(async () => {
      await toggleCvRestrictionAction({ candidateId: candidate.id });
      setCandidate((prev) => ({ ...prev, isRestricted: !prev.isRestricted }));
      addToast({
        title: candidate.isRestricted ? 'Restriction levée' : 'Opposition RGPD activée',
        message: candidate.isRestricted
          ? 'Le traitement normal de la candidature est restauré.'
          : 'Le profil est placé sous limitation de traitement (Art. 21).',
        type: candidate.isRestricted ? 'info' : 'warning',
      });
    });
  };

  // 11. Ajout de note interne
  const handleAddNote = async (content: string) => {
    const res = await addCvNoteAction({ candidateId: candidate.id, content });
    if (res.success && res.note) {
      setCandidate((prev) => ({
        ...prev,
        notes: [res.note!, ...prev.notes],
      }));
      addToast({
        title: 'Note enregistrée',
        message: 'L’évaluation interne a été consignée dans le dossier.',
        type: 'success',
      });
    }
  };

  // 12. Flux de levée du mode aveugle en 2 étapes :
  // Étape 1 : Saisie du motif légitime Art. 30 (<ReasonDialog>)
  const handleReasonSubmitted = (reason: string) => {
    setPendingUnmaskReason(reason);
    setIsReasonOpen(false);
    setIsReauthOpen(true); // Ouvre la confirmation forte 2FA
  };

  // Étape 2 : Réauthentification forte validée (<ReauthDialog>)
  const handleReauthSuccess = async () => {
    setIsReauthOpen(false);
    startTransition(async () => {
      const res = await unmaskCvAction({
        candidateId: candidate.id,
        reason: pendingUnmaskReason,
      });

      if (res.success && res.detail) {
        setCandidate(res.detail);
        await fetchSignedUrl(); // Renouvelle l'URL signée en mode original
        addToast({
          title: 'Mode aveugle levé',
          message: 'Les données nominatives ont été chargées. Opération tracée WORM (Art. 30).',
          type: 'success',
        });
      } else {
        addToast({
          title: 'Échec de la levée',
          message: res.message || 'Impossible de lever le mode aveugle.',
          type: 'error',
        });
      }
    });
  };

  // 13. Suppression du profil (DSR Purge)
  const handleDelete = async () => {
    startTransition(async () => {
      await deleteCvAction({ candidateId: candidate.id });
      addToast({
        title: 'Candidature supprimée',
        message: 'Le profil a été purgé conformément au RGPD.',
        type: 'info',
      });
      router.push(`/dossiers/${candidate.folderId}`);
    });
  };

  // 14. Export du dossier
  const handleExport = () => {
    addToast({
      title: 'Exportation générée',
      message: `Export ${candidate.isBlindMode ? 'anonymisé' : 'nominatif'} téléchargé.`,
      type: 'info',
    });
  };

  // 15. Interaction Bbox Viewer -> Formulaire
  const handleSelectBbox = (bbox: BoundingBox) => {
    if (bbox.fieldKey) {
      setActiveFieldKey(bbox.fieldKey);
      setActiveTab('extracted');
      // Scroll vers le champ correspondant
      const el = document.getElementById(`field-${bbox.fieldKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. En-tête de la fiche candidat */}
      <CvHeader
        candidate={candidate}
        onToggleShortlist={handleToggleShortlist}
        onChangePipelineStage={handleChangePipelineStage}
        onToggleRestriction={handleToggleRestriction}
        onDelete={() => setIsDeleteOpen(true)}
        onRequestUnmask={() => setIsReasonOpen(true)}
        onExport={handleExport}
        isActionPending={isActionPending}
      />

      {/* 2. Bandeaux d'état (Extraction en cours, CV suspect, Opposition RGPD, etc.) */}
      <CvStatusBanners
        candidate={candidate}
        hasDocumentError={hasDocumentError}
        onRetryDocument={fetchSignedUrl}
        versionConflict={versionConflict}
        onResolveConflict={() => router.refresh()}
        onResolveAnomaly={(id) => {
          setCandidate((prev) => ({
            ...prev,
            anomalies: prev.anomalies.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
          }));
          addToast({
            title: 'Anomalie arbitrée',
            message: 'L’alerte de sécurité a été marquée comme résolue.',
            type: 'info',
          });
        }}
      />

      {/* 3. Panneaux redimensionnables react-resizable-panels */}
      <div className="h-[calc(100vh-16rem)] min-h-[560px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Panneau GAUCHE : <PdfViewer> */}
          <ResizablePanel defaultSize={48} minSize={32} className="h-full">
            <div className="h-full p-2 bg-slate-50 dark:bg-slate-950/60">
              <PdfViewer
                documentTitle={documentTitle || `CV_${candidate.pseudonym}.pdf`}
                signedUrl={signedUrl}
                candidatePseudonym={candidate.pseudonym}
                isBlindMode={candidate.isBlindMode}
                boundingBoxes={boundingBoxes}
                activeBboxId={activeFieldKey}
                onSelectBbox={handleSelectBbox}
                onRefreshSignedUrl={fetchSignedUrl}
                hasLoadError={hasDocumentError}
                onRetry={fetchSignedUrl}
                folderReference={candidate.folderReference}
                className="h-full"
              />
            </div>
          </ResizablePanel>

          {/* Séparateur redimensionnable */}
          <ResizableHandle withHandle />

          {/* Panneau DROIT : Onglets & Formulaire dynamique */}
          <ResizablePanel defaultSize={52} minSize={36} className="h-full flex flex-col">
            <div className="flex flex-col h-full bg-white dark:bg-slate-900">
              {/* Barre des 4 onglets */}
              <div className="flex items-center gap-1 border-b border-slate-200 px-4 pt-2 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-xs shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('extracted')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-all whitespace-nowrap',
                    activeTab === 'extracted'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Données extraites</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-all whitespace-nowrap',
                    activeTab === 'skills'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Compétences ({candidate.skills.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-all whitespace-nowrap',
                    activeTab === 'notes'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Notes ({candidate.notes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition-all whitespace-nowrap',
                    activeTab === 'history'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Historique &amp; WORM</span>
                </button>
              </div>

              {/* Contenu de l'onglet actif avec scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {activeTab === 'extracted' && (
                  <ExtractedDataTab
                    candidate={candidate}
                    activeFieldKey={activeFieldKey}
                    onSelectField={(key) => setActiveFieldKey(key)}
                    onFieldChange={handleFieldChange}
                    onValidateField={handleValidateField}
                    isSavingField={isSavingField}
                  />
                )}

                {activeTab === 'skills' && <SkillsTab candidate={candidate} />}

                {activeTab === 'notes' && (
                  <NotesTab candidate={candidate} onAddNote={handleAddNote} isSubmitting={isSaving} />
                )}

                {activeTab === 'history' && <HistoryTab candidate={candidate} />}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 4. Barre basse : Enregistrer & Valider l'extraction */}
      <CvBottomBar
        candidate={candidate}
        onSaveManual={handleSaveManual}
        onValidateExtraction={handleValidateExtraction}
        isSaving={isSaving}
        isValidating={isValidating}
        lastSavedAt={lastSavedAt}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Modale 1 : Motif légitime Art. 30 RGPD (<ReasonDialog>) */}
      <ReasonDialog
        isOpen={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        onSubmit={handleReasonSubmitted}
        actionType="unmask"
        targetItemName={candidate.pseudonym}
      />

      {/* Modale 2 : Confirmation de sécurité forte 2FA (<ReauthDialog>) */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onSuccess={handleReauthSuccess}
        title="Confirmation de sécurité forte"
        description="La levée du mode aveugle expose des données personnelles sensibles. Veuillez confirmer votre identité."
        actionName="Levée du mode aveugle"
      />

      {/* Modale de confirmation de suppression (DSR Purge) */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression du profil"
        description="Cette action purge définitivement les données de ce candidat conformément au droit à l'effacement (Art. 17 RGPD)."
        confirmLabel="Purger définitivement"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={isActionPending}
      />
    </div>
  );
}
