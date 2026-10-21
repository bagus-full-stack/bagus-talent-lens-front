'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Sparkles,
  UserCheck,
  XCircle,
  Archive,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* =========================================================================
   1. ConfidenceBadge (Fiabilité IA & Extraction CV)
   ========================================================================= */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceBadgeProps {
  score?: number; // 0 à 100 ou 0 à 1
  level?: ConfidenceLevel;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  score,
  level,
  label,
  showPercent = true,
  className,
}: ConfidenceBadgeProps) {
  // Déterminer le niveau à partir du score si non fourni
  const normalizedScore = score !== undefined ? (score <= 1 ? Math.round(score * 100) : Math.round(score)) : undefined;

  let effectiveLevel: ConfidenceLevel = level || 'medium';
  if (normalizedScore !== undefined && !level) {
    if (normalizedScore >= 80) effectiveLevel = 'high';
    else if (normalizedScore >= 50) effectiveLevel = 'medium';
    else effectiveLevel = 'low';
  }

  const configs = {
    high: {
      defaultLabel: 'Fiabilité Haute',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    medium: {
      defaultLabel: 'Fiabilité Modérée',
      textColor: 'text-amber-800 dark:text-amber-300',
      bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    low: {
      defaultLabel: 'Fiabilité Faible (À vérifier)',
      textColor: 'text-rose-800 dark:text-rose-300',
      bgColor: 'bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:border-rose-800',
      icon: AlertOctagon,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  };

  const current = configs[effectiveLevel];
  const Icon = current.icon;
  const textLabel = label || current.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border',
        current.bgColor,
        current.textColor,
        className,
      )}
      title={`${textLabel}${normalizedScore !== undefined ? ` (${normalizedScore}%)` : ''} - Contrôle d'explicabilité IA`}
      aria-label={`${textLabel}${normalizedScore !== undefined ? ` : ${normalizedScore}%` : ''}`}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', current.iconColor)} aria-hidden="true" />
      <span>{textLabel}</span>
      {showPercent && normalizedScore !== undefined && (
        <span className="font-mono text-[11px] font-bold opacity-90">({normalizedScore}%)</span>
      )}
    </span>
  );
}

/* =========================================================================
   2. StatusBadge (Étapes Pipeline & Statuts Candidature)
   ========================================================================= */

export type CandidacyStatus =
  | 'new'
  | 'sourcing'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'archived';

export interface StatusBadgeProps {
  status: CandidacyStatus | string;
  customLabel?: string;
  className?: string;
}

export function StatusBadge({ status, customLabel, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const configs: Record<
    string,
    { label: string; icon: React.ElementType; style: string; iconColor: string }
  > = {
    new: {
      label: 'Nouveau',
      icon: Sparkles,
      style: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    sourcing: {
      label: 'Sourcing actif',
      icon: CircleDot,
      style: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    screening: {
      label: 'Présélection (Anonyme)',
      icon: Clock,
      style: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    interview: {
      label: 'Entretien client',
      icon: Clock,
      style: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    offer: {
      label: 'Proposition en cours',
      icon: Sparkles,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    hired: {
      label: 'Embauché',
      icon: UserCheck,
      style: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700',
      iconColor: 'text-emerald-700 dark:text-emerald-300',
    },
    rejected: {
      label: 'Non retenu',
      icon: XCircle,
      style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      iconColor: 'text-slate-500',
    },
    archived: {
      label: 'Archivé (Purge RGPD)',
      icon: Archive,
      style: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
      iconColor: 'text-slate-400',
    },
  };

  const current = configs[normalized] || {
    label: customLabel || status,
    icon: CircleDot,
    style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconColor: 'text-slate-500',
  };

  const Icon = current.icon;
  const label = customLabel || current.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        current.style,
        className,
      )}
      aria-label={`Statut : ${label}`}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', current.iconColor)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/* =========================================================================
   3. ScoreGauge (Jauge Circulaire de Matching Explicable)
   ========================================================================= */

export interface ScoreGaugeProps {
  score: number; // 0 à 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showDetails?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  size = 'md',
  label = 'Adéquation',
  showDetails = false,
  className,
}: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  const sizeConfigs = {
    sm: { diameter: 44, strokeWidth: 4, textClass: 'text-xs font-bold' },
    md: { diameter: 64, strokeWidth: 5, textClass: 'text-sm font-extrabold' },
    lg: { diameter: 96, strokeWidth: 8, textClass: 'text-xl font-black' },
  };

  const { diameter, strokeWidth, textClass } = sizeConfigs[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  let colorClass = 'text-slate-400';
  let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  let levelText = 'Faible';

  if (clamped >= 85) {
    colorClass = 'text-emerald-600 dark:text-emerald-400';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    levelText = 'Excellente';
  } else if (clamped >= 70) {
    colorClass = 'text-indigo-600 dark:text-indigo-400';
    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
    levelText = 'Forte';
  } else if (clamped >= 50) {
    colorClass = 'text-amber-600 dark:text-amber-400';
    badgeColor = 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    levelText = 'Moyenne';
  }

  return (
    <div
      className={cn('inline-flex items-center gap-3', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} : ${clamped}% (${levelText})`}
    >
      <div className="relative shrink-0" style={{ width: diameter, height: diameter }}>
        <svg
          className="rotate-[-90deg]"
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
        >
          {/* Cercle d'arrière plan */}
          <circle
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={diameter / 2}
            cy={diameter / 2}
          />
          {/* Cercle de valeur */}
          <circle
            className={cn(colorClass, 'transition-all duration-700 ease-out')}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={diameter / 2}
            cy={diameter / 2}
          />
        </svg>

        {/* Valeur au centre */}
        <div className="absolute inset-0 flex items-center justify-center font-mono">
          <span className={cn(textClass, 'text-slate-900 dark:text-slate-100')}>
            {clamped}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </div>
          <span className={cn('inline-block px-1.5 py-0.2 rounded border text-[10px] font-bold', badgeColor)}>
            {levelText}
          </span>
        </div>
      )}
    </div>
  );
}
