'use client';

import React, { useState, useTransition } from 'react';
import {
  Sparkles,
  Play,
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Percent,
  Clock,
  Layers,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { PatternField } from '@/lib/schemas/pattern';
import { SAMPLE_CV_EXAMPLES } from '@/lib/mock/data/patterns';
import { testPatternExtractionAction } from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';

interface TestCvTabProps {
  fields: PatternField[];
}

export function TestCvTab({ fields }: TestCvTabProps) {
  const [selectedExampleId, setSelectedExampleId] = useState<string>(SAMPLE_CV_EXAMPLES[0].id);
  const [customCvText, setCustomCvText] = useState<string>('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [blindModePreview, setBlindModePreview] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<
    Array<{
      key: string;
      label: string;
      value: any;
      confidence: number;
      isPii: boolean;
    }> | null
  >(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const currentSample = SAMPLE_CV_EXAMPLES.find((s) => s.id === selectedExampleId) || SAMPLE_CV_EXAMPLES[0];

  // Action : Lancer l'extraction de test
  const handleRunTest = () => {
    startTransition(async () => {
      const startTime = performance.now();
      const res = await testPatternExtractionAction(fields, selectedExampleId);
      const elapsed = Math.round(performance.now() - startTime + 240); // simuler latence réseau modèle UE
      setLatencyMs(elapsed);

      if (res.success && res.results) {
        setResults(res.results);
        toast.success(
          'Extraction réussie',
          `${res.results.length} champs extraits avec succès sur le document exemple.`,
        );
      } else {
        toast.error('Erreur', res.error || "Impossible d'effectuer l'extraction de test.");
      }
    });
  };

  const avgConfidence =
    results && results.length > 0
      ? Math.round((results.reduce((acc, r) => acc + r.confidence, 0) / results.length) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Barre d'outils et sélecteur de CV d'exemple */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Banc d'essai d'extraction IA sur CV réel</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Validez la fidélité de votre schéma et le niveau de confiance du modèle sur un échantillon de CV.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunTest}
            disabled={isPending || fields.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-sm transition-all shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extraction en cours...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Lancer l'extraction de test</span>
              </>
            )}
          </button>
        </div>

        {/* Sélecteur de document exemple */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {SAMPLE_CV_EXAMPLES.map((sample) => {
            const isSelected = selectedExampleId === sample.id && !useCustomText;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSelectedExampleId(sample.id);
                  setUseCustomText(false);
                }}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {sample.title}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {sample.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {sample.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aperçu du texte du document source */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Extrait du document source ({currentSample.title})</span>
          </div>
          <span className="text-[11px] text-slate-400">Texte brut OCR normalisé</span>
        </div>
        <pre className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {currentSample.fullText}
        </pre>
      </div>

      {/* Résultats d'extraction */}
      {results && (
        <div className="space-y-4">
          {/* Métriques d'inférence */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Champs extraits
                </span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {results.length} / {fields.length}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Confiance moyenne
                </span>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {avgConfidence}%
                </div>
              </div>

              {latencyMs && (
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Temps d'inférence
                  </span>
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {latencyMs} ms
                  </div>
                </div>
              )}
            </div>

            {/* Bascule Mode Aveugle sur le résultat du test */}
            <button
              type="button"
              onClick={() => setBlindModePreview(!blindModePreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                blindModePreview
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {blindModePreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{blindModePreview ? 'Simulation Mode Aveugle (PII masquées)' : 'Voir les PII extraites'}</span>
            </button>
          </div>

          {/* Tableau détaillé des résultats champ par champ */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Champ cible</th>
                  <th className="py-3 px-4">Valeur extraite</th>
                  <th className="py-3 px-4">PII RGPD</th>
                  <th className="py-3 px-4 text-right">Indice de confiance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {results.map((res) => {
                  const confPercent = Math.round(res.confidence * 100);
                  const isMasked = blindModePreview && res.isPii;

                  return (
                    <tr
                      key={res.key}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {res.label}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{res.key}</div>
                      </td>

                      <td className="py-3 px-4">
                        {isMasked ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            [ANONYMISÉ - PII PROTÉGÉE]
                          </span>
                        ) : Array.isArray(res.value) ? (
                          <div className="flex flex-wrap gap-1">
                            {res.value.map((v: any, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                              >
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : typeof res.value === 'boolean' ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {res.value ? 'Oui' : 'Non'}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {String(res.value)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {res.isPii ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <Shield className="h-2.5 w-2.5" />
                            <span>PII</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Non PII</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                confPercent >= 90
                                  ? 'bg-emerald-500'
                                  : confPercent >= 80
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                              }`}
                              style={{ width: `${confPercent}%` }}
                            />
                          </div>
                          <span
                            className={`font-semibold font-mono text-xs ${
                              confPercent >= 90
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : confPercent >= 80
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {confPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
