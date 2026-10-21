'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ShieldCheck,
  EyeOff,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Layers,
  Globe,
  Wifi,
  WifiOff,
  Download,
  ExternalLink,
  X,
  FileArchive,
  FileCheck,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/shared/form-and-toast';
import { mockFolders } from '@/lib/mock/data/folders';
import { mockPatterns } from '@/lib/mock/data/patterns';
import { mockOrganization } from '@/lib/mock/data/organizations';
import {
  getSignedUploadUrlAction,
  createIngestionJobAction,
  retryIngestionFileAction,
} from '@/app/(app)/import/actions';
import type { IngestionJob, IngestionFileItem, IngestionFileStatus } from '@/types';

interface FileToUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'rejected';
  progress: number;
  storagePath?: string;
  error?: string;
}

interface ImportFlowProps {
  initialFolderId?: string;
  onCloseModal?: () => void;
  isModal?: boolean;
}

export function ImportFlow({
  initialFolderId,
  onCloseModal,
  isModal = false,
}: ImportFlowProps) {
  const router = useRouter();

  // Étape courante du parcours : 1 (Dépôt) -> 2 (Envoi direct Storage) -> 3 (Suivi Realtime & Résumé)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Configuration de l'import
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || mockFolders[0]?.id || '',
  );
  const [selectedPatternId, setSelectedPatternId] = useState<string>(
    mockPatterns[0]?.id || 'PAT-TECH-04',
  );
  const [selectedVersion, setSelectedVersion] = useState<string>(
    mockPatterns[0]?.activeVersion || 'v2.4',
  );
  const [language, setLanguage] = useState<'fr' | 'en' | 'es' | 'de'>('fr');

  // Fichiers sélectionnés pour l'envoi
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Étape 2 & 3 : Suivi du job d'ingestion & Realtime
  const [activeJob, setActiveJob] = useState<IngestionJob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadAbortController, setUploadAbortController] = useState<AbortController | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(true);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Synchronisation de la version lorsqu'on change de pattern
  useEffect(() => {
    const p = mockPatterns.find((item) => item.id === selectedPatternId);
    if (p) {
      setSelectedVersion(p.activeVersion);
    }
  }, [selectedPatternId]);

  // Surveillance de la connexion réseau (reprise automatique)
  useEffect(() => {
    const handleOnline = () => {
      setRealtimeConnected(true);
      setConnectionNotice(null);
      toast.success('Connexion rétablie', 'Synchronisation temps réel reprise avec le serveur.');
    };
    const handleOffline = () => {
      setRealtimeConnected(false);
      setConnectionNotice('Connexion perdue. Les mises à jour reprendront automatiquement.');
      toast.warning('Connexion perdue', 'Passage en mode hors ligne avec reprise automatique.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Écoute Realtime via SSE (/api/import/events) lorsque le job est actif
  useEffect(() => {
    if (!activeJob?.id || currentStep !== 3) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/import/events?jobId=${activeJob.id}`);

      eventSource.onopen = () => {
        setRealtimeConnected(true);
        setConnectionNotice(null);
      };

      eventSource.onmessage = (e) => {
        try {
          const updatedJob: IngestionJob = JSON.parse(e.data);
          setActiveJob(updatedJob);

          // Si le job vient de se terminer complètement
          if (
            updatedJob.status === 'completed' ||
            updatedJob.status === 'partially_failed' ||
            updatedJob.status === 'failed'
          ) {
            if (updatedJob.status === 'completed') {
              toast.success(
                'Traitement terminé !',
                `Les ${updatedJob.totalFiles} candidatures ont été anonymisées et intégrées.`,
              );
            } else if (updatedJob.status === 'partially_failed') {
              toast.warning(
                'Traitement partiellement abouti',
                `${updatedJob.successCount} CVs réussis, ${updatedJob.failedCount} échec(s) avec reprise possible.`,
              );
            }
          }
        } catch (err) {
          console.error('[SSE parse error]', err);
        }
      };

      eventSource.onerror = () => {
        setRealtimeConnected(false);
        setConnectionNotice('Connexion temps réel instable. Reconnexion en cours...');
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 2500);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [activeJob?.id, currentStep]);

  /* =========================================================================
     1. ÉTAPE 1 : Dépôt & Contrôles ergonomiques côté client
     ========================================================================= */

  const handleFilesDropped = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const newItems: FileToUpload[] = [];

    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.zip'];
    const maxClientBytes = 20 * 1024 * 1024; // 20 Mo

    list.forEach((file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      let error: string | undefined;

      // Contrôle ergonomique : type de fichier
      if (!allowedExts.includes(ext)) {
        error = `Format « ${ext} » refusé. Formats acceptés : PDF, PNG, JPEG, DOCX, ZIP.`;
      }
      // Contrôle ergonomique : taille > 20 Mo
      else if (file.size > maxClientBytes) {
        error = `Fichier trop lourd (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Limite : 20 Mo.`;
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        status: error ? 'rejected' : 'pending',
        progress: 0,
        error,
      });
    });

    setFilesToUpload((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setFilesToUpload((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllFiles = () => {
    setFilesToUpload([]);
  };

  const validFilesCount = filesToUpload.filter((f) => f.status !== 'rejected').length;

  /* =========================================================================
     2. ÉTAPE 2 : Envoi direct Supabase Storage par URL signée
     ========================================================================= */

  const startUploadAndIngestion = async () => {
    const validItems = filesToUpload.filter((f) => f.status !== 'rejected');
    if (validItems.length === 0) {
      toast.error('Aucun fichier valide', 'Veuillez déposer des fichiers conformes pour continuer.');
      return;
    }

    // Vérification du quota IA
    if (mockOrganization.aiTokensUsed >= mockOrganization.aiQuotaLimit) {
      toast.error(
        'Quota IA atteint',
        `Le quota de l'organisation (${mockOrganization.aiQuotaLimit.toLocaleString()} tokens) est épuisé.`,
      );
      return;
    }

    setCurrentStep(2);
    setIsUploading(true);

    const abortController = new AbortController();
    setUploadAbortController(abortController);

    const uploadedPayloads: Array<{
      name: string;
      size: number;
      mimeType: string;
      storagePath: string;
    }> = [];

    let hasCriticalError = false;

    // Upload séquentiel ou parallèle direct vers Storage
    for (let i = 0; i < validItems.length; i++) {
      if (abortController.signal.aborted) break;

      const item = validItems[i];

      // Mise à jour de l'état : upload en cours
      setFilesToUpload((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 15 } : f)),
      );

      try {
        // 1. Demande d'URL signée au serveur (avec validation stricte antivirus, zip bomb, quota)
        const signedRes = await getSignedUploadUrlAction({
          fileName: item.name,
          fileType: item.mimeType,
          fileSize: item.size,
          folderId: selectedFolderId,
        });

        if (!signedRes.success || !signedRes.signedUrl || !signedRes.storagePath) {
          // Rejet côté serveur
          setFilesToUpload((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'rejected',
                    error: signedRes.error || 'Fichier refusé par le serveur.',
                  }
                : f,
            ),
          );
          continue;
        }

        setFilesToUpload((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: 60 } : f)),
        );

        // 2. Upload direct du binaire vers le storage
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('path', signedRes.storagePath);

        const uploadResponse = await fetch(signedRes.signedUrl, {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur HTTP ${uploadResponse.status}`);
        }

        // Marquer comme uploadé
        setFilesToUpload((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'uploaded',
                  progress: 100,
                  storagePath: signedRes.storagePath,
                }
              : f,
          ),
        );

        uploadedPayloads.push({
          name: item.name,
          size: item.size,
          mimeType: item.mimeType,
          storagePath: signedRes.storagePath,
        });
      } catch (err: any) {
        if (abortController.signal.aborted) {
          toast.info('Annulé', 'Téléversement interrompu.');
          setIsUploading(false);
          setCurrentStep(1);
          return;
        }

        setFilesToUpload((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'rejected',
                  error: err.message || 'Échec de transmission au stockage.',
                }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);

    if (uploadedPayloads.length === 0) {
      toast.error('Échec d’envoi', 'Aucun fichier n’a pu être envoyé au stockage sécurisé.');
      return;
    }

    // 3. Création du Ingestion Job côté serveur (le front ne traite JAMAIS le contenu)
    try {
      const jobRes = await createIngestionJobAction({
        folderId: selectedFolderId,
        patternId: selectedPatternId,
        patternVersion: selectedVersion,
        language,
        files: uploadedPayloads,
      });

      if (!jobRes.success || !jobRes.job) {
        toast.error('Erreur d’ingestion', jobRes.error || 'Impossible d’engager le job.');
        return;
      }

      setActiveJob(jobRes.job);
      setCurrentStep(3);
      toast.success(
        'Job d’ingestion engagé',
        `Traitement souverain en cours pour ${jobRes.job.totalFiles} documents.`,
      );
    } catch {
      toast.error('Erreur', 'Impossible de démarrer le job d’ingestion.');
    }
  };

  const cancelUpload = () => {
    if (uploadAbortController) {
      uploadAbortController.abort();
    }
    setIsUploading(false);
    setCurrentStep(1);
  };

  /* =========================================================================
     3. ÉTAPE 3 : Suivi & Reprise ciblée
     ========================================================================= */

  const handleRetryFile = async (fileId: string) => {
    if (!activeJob) return;
    setIsRetrying(fileId);

    try {
      const res = await retryIngestionFileAction(activeJob.id, fileId);
      if (!res.success) {
        toast.error('Échec de la reprise', res.error || 'Impossible de relancer le traitement.');
      } else {
        toast.info('Reprise engagée', 'Nouvelle tentative d’extraction et de parsing...');
        if (res.job) setActiveJob(res.job);
      }
    } catch {
      toast.error('Erreur', 'Impossible de relancer le fichier.');
    } finally {
      setIsRetrying(null);
    }
  };

  const downloadReport = () => {
    if (!activeJob) return;
    const reportData = {
      jobId: activeJob.id,
      folderReference: activeJob.folderReference,
      folderTitle: activeJob.folderTitle,
      pattern: `${activeJob.patternId} (${activeJob.patternVersion})`,
      language: activeJob.language,
      status: activeJob.status,
      timestamp: new Date().toISOString(),
      tokensConsumed: activeJob.tokensConsumed,
      totalFiles: activeJob.totalFiles,
      successCount: activeJob.successCount,
      needsReviewCount: activeJob.needsReviewCount,
      failedCount: activeJob.failedCount,
      files: activeJob.files.map((f) => ({
        name: f.name,
        sizeBytes: f.size,
        status: f.status,
        confidence: f.extractedConfidence,
        tokensUsed: f.tokensUsed,
        candidateId: f.candidateId,
        error: f.errorReason,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_ingestion_${activeJob.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rapport téléchargé', 'Le compte rendu d’ingestion scellé a été exporté.');
  };

  // Calcul du pourcentage global de progression
  const globalProgress = activeJob
    ? Math.round((activeJob.processedFiles / Math.max(1, activeJob.totalFiles)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Bandeau d'état de connexion Realtime */}
      {!realtimeConnected && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{connectionNotice || 'Connexion réseau instable'}</span>
          </div>
          <span className="text-[11px] underline">Reprise automatique en cours</span>
        </div>
      )}

      {/* Indicateur d'étapes (Stepper 1-2-3) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 1
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              Dépôt & Paramètres
            </span>
            <span className="text-[10px] text-slate-500">Formats, pattern et dossier</span>
          </div>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 2
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              Envoi sécurisé
            </span>
            <span className="text-[10px] text-slate-500">Storage signé Supabase</span>
          </div>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 3
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            '3'
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              Suivi Realtime
            </span>
            <span className="text-[10px] text-slate-500">Extraction & Anonymisation</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
         VUE ÉTAPE 1 : DÉPÔT ET CONFIGURATION
         ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-5">
          {/* Grille de sélection des paramètres (Dossier, Pattern, Langue) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Dossier cible */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                <span>Dossier de destination <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              >
                {mockFolders.map((fld) => (
                  <option key={fld.id} value={fld.id}>
                    {fld.reference} — {fld.title} ({fld.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            {/* Pattern d'extraction et version */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pattern & Version d’anonymisation</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedPatternId}
                  onChange={(e) => setSelectedPatternId(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 truncate"
                >
                  {mockPatterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="inline-flex items-center px-2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300 font-mono text-xs font-bold">
                  {selectedVersion}
                </span>
              </div>
            </div>

            {/* Langue principale */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
                <span>Langue principale des CVs</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="fr">Français (OCR & Détection optimisés)</option>
                <option value="en">Anglais (International)</option>
                <option value="de">Allemand</option>
                <option value="es">Espagnol</option>
              </select>
            </div>
          </div>

          {/* Zone de glisser-déposer <FileDropzone> */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) {
                handleFilesDropped(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.docx,.zip,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesDropped(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-sm">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
              Glissez-déposez vos candidatures ou cliquez pour parcourir
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Formats acceptés : <strong className="font-semibold text-slate-700 dark:text-slate-300">PDF, PNG, JPEG, DOCX, ZIP</strong>
            </p>

            {/* Limites clairement affichées */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileCheck className="h-3 w-3 text-indigo-500" />
                <span>20 Mo max par fichier</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileArchive className="h-3 w-3 text-indigo-500" />
                <span>Jusqu'à 200 fichiers par archive ZIP</span>
              </span>
            </div>
          </div>

          {/* Mention souveraineté UE & Absence d'entraînement */}
          <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Garantie Souveraine RGPD & Confidentialité IA :</span>
              <p className="mt-0.5 text-indigo-900/90 dark:text-indigo-300">
                Traitement opéré exclusivement dans l'Union Européenne (centres certifiés SecNumCloud). Vos données et CV ne sont <strong>jamais réutilisés pour l'entraînement</strong> de modèles d'IA publics ou tiers.
              </p>
            </div>
          </div>

          {/* Liste des fichiers prêts au dépôt */}
          {filesToUpload.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Fichiers préparés ({filesToUpload.length})
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {(
                      filesToUpload.reduce((sum, f) => sum + f.size, 0) /
                      (1024 * 1024)
                    ).toFixed(2)}{' '}
                    Mo
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFiles}
                  className="h-7 text-xs text-slate-400 hover:text-rose-500"
                >
                  Tout effacer
                </Button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filesToUpload.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg p-2.5 text-xs border ${
                      item.status === 'rejected'
                        ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30'
                        : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${
                          item.status === 'rejected' ? 'text-rose-500' : 'text-indigo-600'
                        }`}
                      />
                      <div className="truncate">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-400">
                            {(item.size / 1024).toFixed(0)} Ko
                          </span>
                          {item.error && (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              • {item.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label={`Retirer ${item.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bouton de confirmation vers Étape 2 */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={startUploadAndIngestion}
                  disabled={validFilesCount === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm text-xs h-9"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>
                    Transmettre {validFilesCount} document(s) au stockage sécurisé
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
         VUE ÉTAPE 2 : ENVOI STORAGE DIRECT (Progression par fichier & Annulation)
         ========================================================================= */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Envoi direct vers Supabase Storage (URL Signée)
                </h3>
                <p className="text-xs text-slate-500">
                  Vérification antivirus et téléversement chiffré TLS en cours.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelUpload}
              className="text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              Annuler l'envoi
            </Button>
          </div>

          <div className="space-y-3">
            {filesToUpload
              .filter((f) => f.status !== 'rejected' || f.error)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-100 p-3 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {item.status === 'uploaded' ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Transmis
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Rejeté
                        </span>
                      ) : (
                        <span>{item.progress}%</span>
                      )}
                    </span>
                  </div>

                  {/* Barre de progression par fichier */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        item.status === 'uploaded'
                          ? 'bg-emerald-500'
                          : item.status === 'rejected'
                            ? 'bg-rose-500'
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {item.error && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{item.error}</span>
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* =========================================================================
         VUE ÉTAPE 3 : SUIVI REALTIME PAR FICHIER & RÉSUMÉ FINAL
         ========================================================================= */}
      {currentStep === 3 && activeJob && (
        <div className="space-y-5">
          {/* Barre globale de progression */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Ingestion en temps réel : {activeJob.folderTitle} ({activeJob.folderReference})
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {activeJob.patternId}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orchestration Supabase Realtime • Pipeline souverain de détection anti-biais
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Realtime connecté</span>
                </span>
              </div>
            </div>

            {/* Barre de progression globale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  Progression globale ({globalProgress}%)
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {activeJob.processedFiles} / {activeJob.totalFiles} fichiers
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-800 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>

            {/* 3 Cartes d'indicateurs clés */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Fichiers traités
                </span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                  {activeJob.processedFiles} / {activeJob.totalFiles}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-emerald-600 font-semibold">{activeJob.successCount} succès</span>
                  {activeJob.needsReviewCount > 0 && (
                    <span className="text-amber-600 font-semibold">• {activeJob.needsReviewCount} à vérifier</span>
                  )}
                  {activeJob.failedCount > 0 && (
                    <span className="text-rose-600 font-semibold">• {activeJob.failedCount} échec(s)</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Temps estimé restant
                </span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                  {activeJob.estimatedTimeSeconds > 0
                    ? `~ ${activeJob.estimatedTimeSeconds} s`
                    : 'Traitement finalisé'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Vitesse moyenne : 4.5s / CV
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Tokens IA consommés
                </span>
                <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                  {activeJob.tokensConsumed.toLocaleString()} tokens
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Quota restant : {(mockOrganization.aiQuotaLimit - mockOrganization.aiTokensUsed).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Message de réassurance : "Vous pouvez quitter cette page" */}
            <div className="rounded-lg bg-slate-100/80 p-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500 shrink-0" />
                <span>
                  <strong>Vous pouvez quitter cette page en toute sérénité.</strong> Le traitement s'exécute en arrière-plan et vous recevrez une notification dès achèvement.
                </span>
              </span>
            </div>
          </Card>

          {/* Tableau détaillé par fichier (en file, extraction, vectorisation, terminé, à vérifier, échec) */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document / CV</th>
                    <th className="py-3 px-4">Taille</th>
                    <th className="py-3 px-4">Étape du Pipeline</th>
                    <th className="py-3 px-4">Résultat & Anomalies</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeJob.files.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {file.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {(file.size / 1024).toFixed(0)} Ko
                      </td>

                      {/* Étape du pipeline */}
                      <td className="py-3.5 px-4">
                        {file.status === 'queued' && (
                          <Badge variant="outline" className="text-slate-500 text-[10px]">
                            En file d'attente
                          </Badge>
                        )}
                        {file.status === 'extracting' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 gap-1 text-[10px] animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Extraction texte</span>
                          </Badge>
                        )}
                        {file.status === 'vectorizing' && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 gap-1 text-[10px] animate-pulse">
                            <Sparkles className="h-3 w-3" />
                            <span>Vectorisation & Anti-biais</span>
                          </Badge>
                        )}
                        {file.status === 'completed' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Terminé</span>
                          </Badge>
                        )}
                        {file.status === 'needs_review' && (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 gap-1 text-[10px]">
                            <AlertTriangle className="h-3 w-3" />
                            <span>À vérifier</span>
                          </Badge>
                        )}
                        {file.status === 'failed' && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 gap-1 text-[10px]">
                            <AlertCircle className="h-3 w-3" />
                            <span>Échec</span>
                          </Badge>
                        )}
                      </td>

                      {/* Résultat & Anomalies fournies par le serveur */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {file.errorReason ? (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            {file.errorReason}
                          </p>
                        ) : file.extractedConfidence ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                            Qualité parsing : {file.extractedConfidence}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">En attente d'analyse</span>
                        )}
                      </td>

                      {/* Action (Réessayer en cas d'échec) */}
                      <td className="py-3.5 px-4 text-right">
                        {file.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isRetrying === file.id}
                            onClick={() => handleRetryFile(file.id)}
                            className="h-7 text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                          >
                            {isRetrying === file.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            <span>Réessayer</span>
                          </Button>
                        )}
                        {file.candidateId && (
                          <Link href={`/dossiers/${activeJob.folderId}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-500">
                              <span>Voir</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Récapitulatif final lorsque le traitement est terminé */}
          {(activeJob.status === 'completed' ||
            activeJob.status === 'partially_failed' ||
            activeJob.status === 'failed') && (
            <Card className="p-5 border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-bold shrink-0">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                      Rapport d'ingestion finalisé
                    </h4>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-300">
                      {activeJob.successCount} CVs validés avec succès, {activeJob.needsReviewCount} profil(s) avec alertes, {activeJob.failedCount} échec(s).
                    </p>
                  </div>
                </div>

                {/* Liens d'action finaux */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeJob.needsReviewCount > 0 && (
                    <Link href={`/dossiers/${activeJob.folderId}?status=needs_review`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Voir les CV à vérifier ({activeJob.needsReviewCount})</span>
                      </Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadReport}
                    className="gap-1.5 text-xs h-8 bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-600" />
                    <span>Télécharger le rapport</span>
                  </Button>

                  <Link href={`/dossiers/${activeJob.folderId}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-8 shadow-sm">
                      <span>Accéder au dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentStep(1);
                      setActiveJob(null);
                      setFilesToUpload([]);
                    }}
                    className="text-xs h-8 text-slate-500"
                  >
                    Nouvel import
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
