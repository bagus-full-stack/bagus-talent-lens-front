'use client';

import React, { useState } from 'react';
import {
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Clock,
  RotateCcw,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from '@/components/shared/badges-and-gauges';
import type { CandidateCvDetail, ExtractedFieldValue } from '@/types';
import { cn } from '@/lib/utils';

export interface ExtractedDataTabProps {
  candidate: CandidateCvDetail;
  activeFieldKey: string | null;
  onSelectField: (key: string) => void;
  onFieldChange: (key: string, value: any) => void;
  onValidateField: (key: string) => void;
  isSavingField?: string | null;
}

export function ExtractedDataTab({
  candidate,
  activeFieldKey,
  onSelectField,
  onFieldChange,
  onValidateField,
  isSavingField,
}: ExtractedDataTabProps) {
  const [showingAiValueKey, setShowingAiValueKey] = useState<string | null>(null);

  // Trier les champs : socle normalisé en tête, puis champs spécifiques
  const fieldsList = Object.values(candidate.extractedFields);

  return (
    <div className="space-y-4">
      {/* En-tête explicatif */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Formulaire dynamique · Schéma {candidate.patternName} ({candidate.patternVersion})
          </span>
        </div>
        <span className="font-mono text-slate-500 text-[11px]">
          {fieldsList.length} champs extraits
        </span>
      </div>

      {/* Grille des champs extraits */}
      <div className="space-y-3.5">
        {fieldsList.map((field) => {
          const isSelected = activeFieldKey === field.key;
          const isUnderThreshold = field.underThreshold;
          const isLockedPii = candidate.isBlindMode && field.isPii;
          const isSaving = isSavingField === field.key;

          return (
            <div
              key={field.key}
              onClick={() => onSelectField(field.key)}
              className={cn(
                'group relative rounded-xl border p-4 transition-all cursor-pointer',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-600 dark:bg-indigo-950/20'
                  : isUnderThreshold
                  ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900',
              )}
            >
              {/* Ligne d'en-tête du champ */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <label
                    htmlFor={`field-${field.key}`}
                    className="font-bold text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    {field.label}
                  </label>

                  {/* Badge PII RGPD */}
                  {field.isPii && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                      title="Donnée Personnelle Identifiante (PII) protégée par le mode aveugle"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      <span>PII</span>
                    </span>
                  )}

                  {/* Indicateur sous seuil « À vérifier » */}
                  {isUnderThreshold && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 animate-pulse">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>À vérifier</span>
                    </span>
                  )}

                  {/* Indicateur de correction humaine */}
                  {field.humanCorrection && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                      title={`Corrigé par ${field.humanCorrection.correctedBy} le ${new Date(field.humanCorrection.correctedAt).toLocaleDateString('fr-FR')}`}
                    >
                      <Check className="h-2.5 w-2.5" />
                      <span>Corrigé manuellement</span>
                    </span>
                  )}
                </div>

                {/* Score de confiance & validation */}
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <span className="text-[10px] text-indigo-600 animate-pulse font-medium">
                      Enregistrement…
                    </span>
                  )}

                  <ConfidenceBadge score={field.confidence} showPercent={true} />

                  {/* Bouton de validation si sous le seuil */}
                  {isUnderThreshold && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onValidateField(field.key);
                      }}
                      className="h-6 px-2 text-[11px] bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200 gap-1 font-semibold"
                    >
                      <Check className="h-3 w-3" />
                      <span>Valider</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Input dynamique selon le type */}
              <div className="mt-1">
                {isLockedPii ? (
                  // Champ PII en mode aveugle : NON MODIFIABLE
                  <div className="relative">
                    <input
                      id={`field-${field.key}`}
                      type="text"
                      disabled
                      value="***"
                      readOnly
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs font-mono font-bold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 cursor-not-allowed select-none"
                    />
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                      <Lock className="h-3 w-3" />
                      <span>Caviardé (Serveur)</span>
                    </div>
                  </div>
                ) : field.type === 'list' ? (
                  // Liste de tags / puces
                  <div className="space-y-1.5">
                    <textarea
                      id={`field-${field.key}`}
                      rows={2}
                      value={
                        Array.isArray(field.value)
                          ? field.value.join('\n')
                          : String(field.value || '')
                      }
                      onChange={(e) =>
                        onFieldChange(
                          field.key,
                          e.target.value.split('\n').filter((s) => s.trim().length > 0),
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      placeholder="Une entrée par ligne…"
                    />
                  </div>
                ) : field.type === 'enum' && field.options ? (
                  // Sélecteur d'énumération
                  <select
                    id={`field-${field.key}`}
                    value={String(field.value || '')}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="">Sélectionnez une option…</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  // Interrupteur booléen
                  <div className="flex items-center gap-3">
                    <input
                      id={`field-${field.key}`}
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(e) => onFieldChange(field.key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`field-${field.key}`}
                      className="text-xs text-slate-700 dark:text-slate-300"
                    >
                      {field.value ? 'Oui / Conforme' : 'Non / Non renseigné'}
                    </label>
                  </div>
                ) : typeof field.value === 'string' && field.value.length > 80 ? (
                  // Long texte (textarea)
                  <textarea
                    id={`field-${field.key}`}
                    rows={3}
                    value={String(field.value ?? '')}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                ) : (
                  // Saisie texte ou nombre standard
                  <input
                    id={`field-${field.key}`}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={String(field.value ?? '')}
                    onChange={(e) =>
                      onFieldChange(
                        field.key,
                        field.type === 'number' ? Number(e.target.value) : e.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Ligne d'informations : correction humaine & Valeur IA */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  {field.humanCorrection ? (
                    <span>
                      Corrigé par <strong className="font-semibold text-slate-700 dark:text-slate-300">{field.humanCorrection.correctedBy}</strong>
                    </span>
                  ) : (
                    <span>Valeur extraite par l’IA</span>
                  )}
                </div>

                {/* Bouton « Voir la valeur de l'IA » */}
                {field.humanCorrection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowingAiValueKey(showingAiValueKey === field.key ? null : field.key);
                    }}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Eye className="h-3 w-3" />
                    <span>
                      {showingAiValueKey === field.key ? 'Masquer valeur IA' : 'Voir la valeur de l’IA'}
                    </span>
                  </button>
                )}
              </div>

              {/* Panneau dépliant : Valeur d'origine de l'IA */}
              {showingAiValueKey === field.key && field.humanCorrection && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-100 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-xs space-y-1 animate-in fade-in-50">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                    <span>Valeur d’origine extraite par l’IA :</span>
                    <ConfidenceBadge score={field.humanCorrection.originalConfidence} showPercent={true} />
                  </div>
                  <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 break-words">
                    {Array.isArray(field.humanCorrection.originalAiValue)
                      ? field.humanCorrection.originalAiValue.join(', ')
                      : String(field.humanCorrection.originalAiValue ?? '—')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
