'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  BookmarkPlus,
  ShieldCheck,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { Can } from '@/components/shared/can';
import type { SearchCandidateResult } from '@/lib/search/search-engine';

interface CandidateResultCardProps {
  result: SearchCandidateResult;
  isSelected: boolean;
  onToggleSelect: (candidateId: string) => void;
  onOpenUnmask: (candidate: SearchCandidateResult['candidate']) => void;
  onQuickShortlist: (candidateId: string) => void;
}

export function CandidateResultCard({
  result,
  isSelected,
  onToggleSelect,
  onOpenUnmask,
  onQuickShortlist,
}: CandidateResultCardProps) {
  const { candidate, relevanceScore, matchingSkills, justificationExcerpt } = result;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    if (score >= 75) return 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
    return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Adéquation excellente';
    if (score >= 75) return 'Adéquation forte';
    return 'Adéquation modérée';
  };

  return (
    <Card
      className={`p-4 sm:p-5 transition-all duration-200 border ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox de sélection multiple pour actions groupées */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(candidate.id)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            aria-label={`Sélectionner ${candidate.pseudonym}`}
          />
        </div>

        {/* Corps principal de la fiche */}
        <div className="flex-1 space-y-3.5 min-w-0">
          {/* Ligne d'en-tête : Pseudonyme DTO, Badges éthiques, Score % */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/cv/${candidate.id}`}
                  className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 group"
                >
                  <span>{candidate.pseudonym}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <BlindModeBadge compact />

                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Profil vérifié</span>
                </span>
              </div>

              <h3 className="font-semibold text-sm sm:text-base text-indigo-700 dark:text-indigo-400 mt-1">
                {candidate.currentTitle}
              </h3>

              {/* Métadonnées socle */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{candidate.yearsExperience} ans d'exp.</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{candidate.location}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Préavis : {candidate.availability}</span>
                </span>
              </div>
            </div>

            {/* Score de pertinence sémantique */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
              <div
                className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-lg sm:text-xl tabular-nums ${getScoreColor(
                  relevanceScore
                )}`}
              >
                {relevanceScore}%
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {getScoreLabel(relevanceScore)}
              </span>
            </div>
          </div>

          {/* Compétences : avec compétences correspondantes surlignées */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compétences ({candidate.skills.length}) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => {
                const isMatching = matchingSkills.some(
                  (ms) => ms.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors ${
                      isMatching
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700 font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium'
                    }`}
                  >
                    {isMatching && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    <span>{skill}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Extrait justificatif (Explicabilité éthique IA) */}
          {justificationExcerpt && (
            <div className="rounded-lg border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extrait justificatif & explicabilité du score :</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {justificationExcerpt}
              </p>
            </div>
          )}

          {/* Barre inférieure d'actions individuelles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono text-slate-400">
              Scellé RFC 3161 : {candidate.hashId.slice(0, 18)}...
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickShortlist(candidate.id)}
                className="h-8 text-xs gap-1 text-slate-700 dark:text-slate-300"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shortlist</span>
              </Button>

              <Can action="identity.reveal" mode="disable">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenUnmask(candidate)}
                  className="h-8 text-xs gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-700"
                >
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Lever anonymat</span>
                </Button>
              </Can>

              <Link href={`/cv/${candidate.id}`}>
                <Button
                  size="sm"
                  className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 shadow-sm"
                >
                  <span>Consulter CV</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
