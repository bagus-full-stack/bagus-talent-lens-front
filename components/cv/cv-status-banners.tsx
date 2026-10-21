'use client';

import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Loader2,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CandidateCvDetail, Anomaly } from '@/types';

export interface CvStatusBannersProps {
  candidate: CandidateCvDetail;
  hasDocumentError?: boolean;
  onRetryDocument?: () => void;
  versionConflict?: {
    conflict: boolean;
    currentVersion: number;
    message: string;
  } | null;
  onResolveConflict?: () => void;
  onResolveAnomaly?: (anomalyId: string) => void;
}

export function CvStatusBanners({
  candidate,
  hasDocumentError = false,
  onRetryDocument,
  versionConflict,
  onResolveConflict,
  onResolveAnomaly,
}: CvStatusBannersProps) {
  const suspiciousAnomaly = candidate.anomalies.find(
    (a) => (a.type === 'prompt_injection' || a.severity === 'critical') && !a.resolved,
  );

  return (
    <div className="space-y-3">
      {/* 1. Extraction en cours */}
      {candidate.extractionStatus === 'in_progress' && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-200 text-xs shadow-xs animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
            <div>
              <span className="font-bold">Extraction sémantique en cours d’exécution</span>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                L’agent LLM applique actuellement le pattern de structuration et le caviardage anti-biais.
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-sky-200/60 dark:bg-sky-900 px-2 py-0.5 rounded font-bold">
            Phase 2/3
          </span>
        </div>
      )}

      {/* 2. CV Suspect / Alerte Sécurité IA (Prompt Injection, Scan altéré) */}
      {suspiciousAnomaly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-100 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                  CV Suspect · Alerte Sécurité Détectée
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                  {suspiciousAnomaly.type}
                </span>
              </div>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                {suspiciousAnomaly.message}
              </p>
            </div>
          </div>

          {onResolveAnomaly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolveAnomaly(suspiciousAnomaly.id)}
              className="h-8 gap-1.5 text-xs bg-white text-amber-900 border-amber-400 hover:bg-amber-100 shrink-0 self-start sm:self-auto"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-700" />
              <span>Marquer comme arbitré</span>
            </Button>
          )}
        </div>
      )}

      {/* 3. Candidat restreint (Opposition RGPD Art. 21 / limitation de traitement) */}
      {candidate.isRestricted && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 dark:bg-rose-950/70 dark:border-rose-800 dark:text-rose-100 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-200 block text-sm">
                Candidat sous Opposition RGPD (Art. 21) — Traitement restreint
              </span>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                Ce candidat a exercé son droit d'opposition ou de limitation. Aucune donnée ne peut être partagée, exportée vers des tiers ou utilisée pour prise de décision automatisée.
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 px-2 py-1 rounded font-bold uppercase shrink-0">
            DSR Actif
          </span>
        </div>
      )}

      {/* 4. Erreur de chargement du document signé */}
      {hasDocumentError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Échec du chargement du document PDF signé. L’URL temporaire de 60 secondes a expiré.</span>
          </div>
          {onRetryDocument && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetryDocument}
              className="h-7 gap-1 text-xs border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Réessayer</span>
            </Button>
          )}
        </div>
      )}

      {/* 5. Conflit de version / Concurrence optimiste ETag */}
      {versionConflict?.conflict && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500 text-amber-950 font-medium text-xs shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-bold block">Conflit d’édition détecté</span>
              <span>{versionConflict.message} (Version locale obsolète vs v{versionConflict.currentVersion})</span>
            </div>
          </div>
          {onResolveConflict && (
            <Button
              size="sm"
              onClick={onResolveConflict}
              className="h-8 bg-amber-950 text-white hover:bg-amber-900 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Actualiser la fiche</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
