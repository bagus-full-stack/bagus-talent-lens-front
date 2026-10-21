'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Sparkles, Scale, ArrowRight } from 'lucide-react';
import { ScoreGauge } from '@/components/shared/badges-and-gauges';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CandidateMatchResult, StructuredOfferCriteria } from '@/lib/matching/types';

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateMatchResult[];
  criteria: StructuredOfferCriteria;
  onSelectCandidateToPipeline: (candidateId: string) => void;
}

export function CandidateComparisonModal({
  isOpen,
  onClose,
  candidates,
  criteria,
  onSelectCandidateToPipeline,
}: CandidateComparisonModalProps) {
  if (!isOpen || candidates.length < 2) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-6xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* En-tête de la modale */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="comparison-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Comparatif côte à côte des candidats</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {candidates.length} profils sélectionnés
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Évaluation impartiale des critères indispensables et souhaités de l'offre {criteria.folderReference}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Fermer le comparatif"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps avec tableau comparatif scrollable */}
        <div className="flex-1 overflow-auto p-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] w-64 bg-slate-50/50 dark:bg-slate-800/20">
                  Critères de poste
                </th>
                {candidates.map((res) => (
                  <th key={res.candidate.id} className="p-3 min-w-[200px] align-top">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {res.candidate.pseudonym}
                        </span>
                        <BlindModeBadge compact />
                      </div>

                      <div className="flex items-center gap-2">
                        <ScoreGauge score={res.overallScore} size="sm" showDetails />
                        <span className="text-[11px] font-semibold text-slate-500">
                          Rang #{res.rank}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onSelectCandidateToPipeline(res.candidate.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-7 gap-1"
                      >
                        <span>Retenir dans le pipeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Ligne Expérience */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                  Expérience globale
                </td>
                {candidates.map((res) => (
                  <td key={res.candidate.id} className="p-3 font-medium">
                    {res.candidate.yearsExperience} ans d'expérience
                  </td>
                ))}
              </tr>

              {/* Ligne Localisation */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                  Localisation & Mobilité
                </td>
                {candidates.map((res) => (
                  <td key={res.candidate.id} className="p-3 text-slate-600 dark:text-slate-400">
                    {res.candidate.location}
                  </td>
                ))}
              </tr>

              {/* Ligne Disponibilité */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                  Disponibilité / Préavis
                </td>
                {candidates.map((res) => (
                  <td key={res.candidate.id} className="p-3 text-slate-600 dark:text-slate-400">
                    {res.candidate.availability}
                  </td>
                ))}
              </tr>

              {/* Ligne Séparateur : Critères indispensables */}
              <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                <td
                  colSpan={candidates.length + 1}
                  className="p-2.5 font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider text-[11px]"
                >
                  Critères Indispensables ({criteria.indispensables.length})
                </td>
              </tr>

              {criteria.indispensables.map((crit) => (
                <tr key={crit.id}>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                    {crit.label}
                  </td>
                  {candidates.map((res) => {
                    const evaluation = res.evaluations.find((e) => e.criterionId === crit.id);
                    const status = evaluation?.status || 'missing';

                    return (
                      <td key={res.candidate.id} className="p-3">
                        <div className="flex items-center gap-1.5">
                          {status === 'satisfied' ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                              ✓
                            </span>
                          ) : status === 'partial' ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                              ~
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xs">
                              ✗
                            </span>
                          )}
                          <span className="font-semibold capitalize">
                            {status === 'satisfied' ? 'Validé' : status === 'partial' ? 'Partiel' : 'Non validé'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Ligne Séparateur : Critères souhaités */}
              <tr className="bg-emerald-50/30 dark:bg-emerald-950/20">
                <td
                  colSpan={candidates.length + 1}
                  className="p-2.5 font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider text-[11px]"
                >
                  Critères Souhaités ({criteria.souhaites.length})
                </td>
              </tr>

              {criteria.souhaites.map((crit) => (
                <tr key={crit.id}>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                    {crit.label}
                  </td>
                  {candidates.map((res) => {
                    const evaluation = res.evaluations.find((e) => e.criterionId === crit.id);
                    const status = evaluation?.status || 'missing';

                    return (
                      <td key={res.candidate.id} className="p-3">
                        <div className="flex items-center gap-1.5">
                          {status === 'satisfied' ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-600 font-bold text-xs">
                              ✗
                            </span>
                          )}
                          <span className="font-semibold">
                            {status === 'satisfied' ? 'Validé' : 'Non mentionné'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Résumé synthétique */}
              <tr>
                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                  Synthèse explicative
                </td>
                {candidates.map((res) => (
                  <td key={res.candidate.id} className="p-3 text-[11px] text-slate-600 dark:text-slate-400 italic">
                    « {res.aiSummary} »
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pied de page de la modale */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Fermer le comparatif
          </Button>
        </div>
      </div>
    </div>
  );
}
