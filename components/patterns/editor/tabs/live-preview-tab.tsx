'use client';

import React, { useState } from 'react';
import {
  Shield,
  EyeOff,
  Eye,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Hash,
  ListPlus,
  HelpCircle,
} from 'lucide-react';
import type { PatternField } from '@/lib/schemas/pattern';
import { FIELD_TYPE_LABELS, PII_CATEGORY_LABELS } from '@/lib/schemas/pattern';

interface LivePreviewTabProps {
  fields: PatternField[];
  patternName: string;
}

export function LivePreviewTab({ fields, patternName }: LivePreviewTabProps) {
  const [blindMode, setBlindMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôle du rendu live */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Rendu interactif du formulaire d'extraction</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Temps réel
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aperçu dynamique de la structure générée à partir des {fields.length} champs définis.
          </p>
        </div>

        {/* Toggle Mode Aveugle dans l'aperçu */}
        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
          <button
            type="button"
            onClick={() => setBlindMode(!blindMode)}
            className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md transition-all ${
              blindMode
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {blindMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{blindMode ? 'Mode Aveugle ACTIF' : 'Mode Nominatif'}</span>
          </button>
        </div>
      </div>

      {/* Rendu du formulaire */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{patternName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formulaire de saisie et de validation des données extraites par l'IA
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((field) => {
            const isMasked = blindMode && field.isPii;

            return (
              <div
                key={field.key}
                className={`space-y-1.5 p-3 rounded-lg border transition-all ${
                  field.isPii
                    ? 'border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                {/* Libellé + Badges */}
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500 font-bold">*</span>}
                  </label>

                  <div className="flex items-center gap-1.5">
                    {field.isPii && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                        <Shield className="h-2.5 w-2.5" />
                        <span>PII</span>
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                      {FIELD_TYPE_LABELS[field.type]}
                    </span>
                  </div>
                </div>

                {/* Champ input selon le type */}
                {isMasked ? (
                  <div className="w-full px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-mono flex items-center gap-2">
                    <EyeOff className="h-3.5 w-3.5 shrink-0" />
                    <span>[DONNÉE ANONYMISÉE RGPD - MODE AVEUGLE]</span>
                  </div>
                ) : (
                  <>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={`Saisir ${field.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <div className="relative">
                        <input
                          type="number"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'date' && (
                      <div className="relative">
                        <input
                          type="date"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {field.type === 'boolean' && (
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="checkbox"
                          id={`live-${field.key}`}
                          checked={!!formData[field.key]}
                          onChange={(e) => handleInputChange(field.key, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`live-${field.key}`}
                          className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {formData[field.key] ? 'Oui / Validé' : 'Non / Non renseigné'}
                        </label>
                      </div>
                    )}

                    {field.type === 'list' && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder="Mots-clés séparés par des virgules..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        {formData[field.key] && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData[field.key]
                              .split(',')
                              .map((item: string, i: number) => item.trim())
                              .filter(Boolean)
                              .map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {field.type === 'enum' && (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="">Sélectionner une option...</option>
                        {(field.options && field.options.length > 0
                          ? field.options
                          : ['Option 1', 'Option 2', 'Option 3']
                        ).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                )}

                {/* Consigne d'extraction pour l'IA affichée discrètement */}
                {field.aiPromptDescription && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1 mt-1">
                    <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                    <span>{field.aiPromptDescription}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
