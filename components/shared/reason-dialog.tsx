'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReasonDialogActionType =
  | 'unmask' // Levée du mode aveugle
  | 'rejection' // Refus de candidature
  | 'export_named' // Export nominatif de données
  | 'custom';

export interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
  actionType?: ReasonDialogActionType;
  title?: string;
  description?: string;
  targetItemName?: string;
  submitButtonText?: string;
  isLoading?: boolean;
}

const DEFAULT_CONFIGS: Record<
  ReasonDialogActionType,
  { title: string; description: string; buttonText: string; suggestions: string[] }
> = {
  unmask: {
    title: 'Justification de levée du mode aveugle',
    description:
      'Conformément à l’Art. 30 du RGPD, toute levée d’anonymat doit être motivée par une finalité légitime et consignée dans le registre d’audit.',
    buttonText: 'Valider et lever l’anonymat',
    suggestions: [
      'Entretien physique programmé avec le candidat',
      'Validation finale d’embauche par le client partenaire',
      'Contrôle de conformité de habilitations de sécurité',
    ],
  },
  rejection: {
    title: 'Motif objectif de refus de candidature',
    description:
      'Selon le Code du Travail (Art. L1132-1), les motifs de rejet doivent reposer strictement sur des critères professionnels objectifs (compétences, expérience requise).',
    buttonText: 'Enregistrer le refus motivé',
    suggestions: [
      'Expérience insuffisante sur l’architecture Cloud demandée',
      'Niveau d’anglais technique inférieur au seuil C1 requis',
      'Prétentions salariales non alignées avec le budget de la mission',
    ],
  },
  export_named: {
    title: 'Justification d’export nominatif',
    description:
      'L’exportation de données avec identité visible est soumise à traçabilité WORM. Veuillez spécifier le cadre de transmission client.',
    buttonText: 'Autoriser l’export nominatif',
    suggestions: [
      'Transmission du dossier final pour contrat signé',
      'Audit légal commandé par la direction RH',
      'Réponse à réquisition légale ou contrôle CNIL',
    ],
  },
  custom: {
    title: 'Motif de l’opération',
    description: 'Veuillez renseigner le motif détaillé de cette opération sensible.',
    buttonText: 'Confirmer',
    suggestions: [],
  },
};

export function ReasonDialog({
  isOpen,
  onClose,
  onSubmit,
  actionType = 'unmask',
  title,
  description,
  targetItemName,
  submitButtonText,
  isLoading = false,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const config = DEFAULT_CONFIGS[actionType];

  const dialogTitle = title || config.title;
  const dialogDescription = description || config.description;
  const confirmButtonLabel = submitButtonText || config.buttonText;

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= 10;
  const charsRemaining = Math.max(0, 10 - trimmedReason.length);

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    await onSubmit(trimmedReason);
    setReason('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-dialog-title"
      aria-describedby="reason-dialog-desc"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reason-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {dialogTitle}
              </h2>
              {targetItemName && (
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  Cible : {targetItemName}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p id="reason-dialog-desc" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {dialogDescription}
        </p>

        {/* Suggestions rapides */}
        {config.suggestions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Motifs fréquents (cliquer pour insérer) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {config.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(suggestion)}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-200 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="reason-textarea">Motif circonstancié (min. 10 caractères) :</label>
              <span
                className={cn(
                  'text-[11px] font-mono',
                  isValid ? 'text-emerald-600 font-bold' : 'text-amber-600',
                )}
              >
                {isValid ? '✓ Longueur valide' : `${charsRemaining} caractère(s) manquant(s)`}
              </span>
            </div>

            <textarea
              id="reason-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Veuillez décrire la justification professionnelle ou légale..."
              className={cn(
                'w-full rounded-md border p-2.5 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100',
                'focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
                !isValid && trimmedReason.length > 0
                  ? 'border-amber-300 dark:border-amber-700'
                  : 'border-slate-200 dark:border-slate-800',
              )}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">Enregistré dans le journal d'audit WORM</span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLoading} className="text-xs">
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isValid || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <FileText className="h-3.5 w-3.5" />
                <span>{confirmButtonLabel}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
