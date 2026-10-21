'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, EyeOff, Lock } from 'lucide-react';

export interface PiiFieldProps {
  /**
   * Valeur reçue directement du serveur.
   * RÈGLE D'OR : Le front n'effectue JAMAIS de masquage lui-même.
   * Si le serveur a caviardé (valeur commence par '***', '[ANONYMISÉ]', ou pseudonyme '#...'),
   * on applique le style visuel de masquage.
   */
  value: string | null | undefined;
  /**
   * Mode d'affichage visuel
   */
  mode?: 'inline' | 'block' | 'badge';
  /**
   * Intitulé du champ (pour l'accessibilité ARIA)
   */
  fieldLabel?: string;
  /**
   * Indique si ce champ est classé PII selon la nomenclature RGPD
   */
  isSensitive?: boolean;
  className?: string;
}

/**
 * Détecte si la valeur reçue du serveur est un marqueur d'anonymisation / caviardage
 */
export function isAnonymizedValue(val: string | null | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed === '***' ||
    trimmed.startsWith('***') ||
    trimmed.includes('[ANONYMISÉ]') ||
    trimmed.includes('[MASQUÉ]') ||
    trimmed.startsWith('CAND-') ||
    trimmed.startsWith('CANDIDAT-') ||
    /^#?[A-Z0-9]{4,8}$/.test(trimmed)
  );
}

export function PiiField({
  value,
  mode = 'inline',
  fieldLabel = 'Donnée personnelle',
  isSensitive = true,
  className,
}: PiiFieldProps) {
  const isMasked = isAnonymizedValue(value);
  const displayValue = value ?? '—';

  // Mode Badge : affichage compact
  if (mode === 'badge') {
    if (isMasked) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium',
            'bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
            className,
          )}
          title={`${fieldLabel} : Donnée caviardée par le serveur (Mode aveugle actif)`}
          aria-label={`${fieldLabel} caviardé : ${displayValue}`}
        >
          <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <span>{displayValue}</span>
        </span>
      );
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          isSensitive
            ? 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            : 'text-slate-700 dark:text-slate-300',
          className,
        )}
        aria-label={`${fieldLabel} : ${displayValue}`}
      >
        {displayValue}
      </span>
    );
  }

  // Mode Block : mise en valeur avec cartouche
  if (mode === 'block') {
    if (isMasked) {
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-amber-200 bg-amber-50/50 p-2.5 dark:border-amber-900/60 dark:bg-amber-950/30',
            className,
          )}
          aria-label={`${fieldLabel} masqué par le serveur`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <EyeOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>{fieldLabel}</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-200/60 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              Caviardé
            </span>
          </div>
          <div className="font-mono text-sm tracking-widest text-amber-900 dark:text-amber-200 select-none">
            {displayValue}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'rounded-md border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900',
          className,
        )}
        aria-label={`${fieldLabel} : ${displayValue}`}
      >
        <div className="text-xs font-semibold text-slate-500 mb-1">{fieldLabel}</div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{displayValue}</div>
      </div>
    );
  }

  // Mode Inline (par défaut)
  if (isMasked) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs font-semibold px-1.5 py-0.5 rounded',
          'bg-amber-100/90 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
          className,
        )}
        title={`${fieldLabel} caviardé côté serveur`}
        aria-label={`${fieldLabel} caviardé : ${displayValue}`}
      >
        <Shield className="h-3 w-3 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span>{displayValue}</span>
      </span>
    );
  }

  return (
    <span
      className={cn('text-inherit font-inherit', className)}
      aria-label={`${fieldLabel} : ${displayValue}`}
    >
      {displayValue}
    </span>
  );
}
