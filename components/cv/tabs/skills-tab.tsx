'use client';

import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import type { CandidateCvDetail } from '@/types';
import { cn } from '@/lib/utils';

export function SkillsTab({ candidate }: { candidate: CandidateCvDetail }) {
  // Gap analysis simulée ou déduite
  const strongSkills = candidate.skills.slice(0, 4);
  const partialSkills = candidate.skills.slice(4, 6);
  const missingSkills = ['Certification Cloud Avancée (En cours)', 'Expertise Kubernetes Multi-Cluster'];

  return (
    <div className="space-y-6">
      {/* Synthèse Match Score IA */}
      <div className="rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/80 to-purple-50/40 p-4 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              Adéquation Prédictive au Profil Recherché
            </h3>
          </div>
          <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            {candidate.aiMatchScore}%
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {candidate.aiJustification}
        </p>
      </div>

      {/* Analyse d'écart (Gap Analysis) */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          <span>Matrice des Exigences Métier (Gap Analysis)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Critères Forts */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Critères Validés ({strongSkills.length})</span>
            </div>
            <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
              {strongSkills.map((s, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{s.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critères Partiels */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Partiels ({partialSkills.length})</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
              {partialSkills.map((s, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{s.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critères Manquants */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Écarts ({missingSkills.length})</span>
            </div>
            <ul className="space-y-1 text-xs text-rose-900 dark:text-rose-200">
              {missingSkills.map((s, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Toutes les compétences extraites */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5" />
          <span>Toutes les compétences extraites ({candidate.skills.length})</span>
        </h4>

        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              <span>{skill.name}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </span>
          ))}
        </div>
      </div>

      {/* Parcours académique anonymisé ou nominatif */}
      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Formations & Diplômes</span>
        </h4>

        <div className="space-y-2">
          {candidate.education.map((edu, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {edu.degree}
                </span>
                <span className="text-slate-500 text-[11px]">{edu.institutionType}</span>
              </div>
              {edu.year && (
                <span className="font-mono text-slate-500 text-xs">{edu.year}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
