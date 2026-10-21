'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  UploadCloud,
  X,
  Sparkles,
  Coins,
  Shield,
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import type { Pattern, PatternField } from '@/types';
import {
  publishPatternVersionAction,
  getReExtractionCostEstimateAction,
} from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';

interface PublishVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: Pattern;
  fields: PatternField[];
  onSuccess: (newVersion: any, updatedPattern: Pattern) => void;
}

export function PublishVersionModal({
  isOpen,
  onClose,
  pattern,
  fields,
  onSuccess,
}: PublishVersionModalProps) {
  const [reExtractExisting, setReExtractExisting] = useState(false);
  const [costEstimate, setCostEstimate] = useState<{
    affectedCvs: number;
    tokensPerCv: number;
    totalTokens: number;
    estimatedEur: number;
    estimatedMinutes: number;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Détermination du prochain numéro de version prévisionnel
  let nextVersion = 'v1.0';
  if (pattern.activeVersion.startsWith('v')) {
    const match = pattern.activeVersion.replace('-brouillon', '').match(/v(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      nextVersion = `v${major}.${minor + 1}`;
    } else {
      nextVersion = 'v2.0';
    }
  }

  const handleToggleReExtract = (checked: boolean) => {
    setReExtractExisting(checked);
    if (checked && pattern.extractedCvCount > 0) {
      setIsEstimating(true);
      getReExtractionCostEstimateAction(pattern.extractedCvCount, fields.length)
        .then((estimate) => {
          setCostEstimate(estimate);
        })
        .finally(() => setIsEstimating(false));
    } else {
      setCostEstimate(null);
    }
  };

  if (!isOpen) return null;

  const handleConfirmPublish = () => {
    startTransition(async () => {
      const res = await publishPatternVersionAction(pattern.id, fields, {
        reExtractExisting,
      });

      if (res.success && res.version && res.pattern) {
        toast.success(
          'Version publiée avec succès',
          `La version ${res.version.version} est désormais active et audité dans le journal WORM.`,
        );
        onSuccess(res.version, res.pattern);
        onClose();
      } else {
        toast.error('Erreur de publication', res.error || 'Impossible de publier la version.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Publier une nouvelle version officielle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Validation du schéma, gel d'audit et diffusion aux pipelines d'extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5">
          {/* Progression de version */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Version actuelle</div>
              <div className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                {pattern.activeVersion}
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-indigo-500 shrink-0" />

            <div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Nouvelle version publiée
              </div>
              <div className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                {nextVersion}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">Contenu</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {fields.length} champs ({fields.filter((f) => f.isPii).length} PII)
              </div>
            </div>
          </div>

          {/* Option de ré-extraction des CVs existants */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="reextract-check"
                checked={reExtractExisting}
                onChange={(e) => handleToggleReExtract(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="reextract-check" className="cursor-pointer">
                <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Ré-extraire automatiquement les CV existants associés à ce pattern ?
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Met à jour les dossiers de recrutement en cours avec les nouveaux champs définis.
                </span>
              </label>
            </div>

            {/* Estimation de coût fournie par le serveur si ré-extraction sélectionnée */}
            {reExtractExisting && (
              <div className="mt-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span>Estimation de coût en tokens (fournie par le serveur)</span>
                  </div>
                  {isEstimating && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />}
                </div>

                {pattern.extractedCvCount === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Aucun CV existant n'est rattaché à ce pattern. Aucun surcoût de ré-extraction.
                  </p>
                ) : costEstimate ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">CV concernés</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {costEstimate.affectedCvs.toLocaleString('fr-FR')} CV
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Tokens / CV</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        ~{costEstimate.tokensPerCv} tok
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Total estimé</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        {(costEstimate.totalTokens / 1_000_000).toFixed(2)} M tokens
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Coût estimé HT</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ~{costEstimate.estimatedEur} €
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Avis de scellement réglementaire */}
          <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Traçabilité WORM garantie :</span> Cette publication
              générera un scellement cryptographique SHA-256 dans le journal d'audit infalsifiable avec horodatage certifié.
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleConfirmPublish}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/30"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publication en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmer la publication</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
