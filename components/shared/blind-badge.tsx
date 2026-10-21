'use client';

import React from 'react';
import { EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BlindBadgeProps {
  /**
   * Dossier de recrutement associé (ex: '#CYB-88' ou titre)
   */
  folder?: string;
  /**
   * Statut du mode aveugle (défaut: true)
   */
  isActive?: boolean;
  /**
   * Affichage compact (icône + texte court)
   */
  compact?: boolean;
  /**
   * Action au clic (ex: ouvrir dialogue d'élévation ou explication)
   */
  onClick?: () => void;
  className?: string;
}

export function BlindBadge({
  folder,
  isActive = true,
  compact = false,
  onClick,
  className,
}: BlindBadgeProps) {
  if (!isActive) {
    return (
      <span
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          onClick && 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors',
          className,
        )}
        title="Mode aveugle inactif : les données nominatives sont visibles si autorisé"
        aria-label="Mode aveugle inactif"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
        <span className="font-semibold">Mode aveugle : Inactif</span>
      </span>
    );
  }

  if (compact) {
    return (
      <span
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
          'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
          onClick && 'cursor-pointer hover:bg-amber-200/80 dark:hover:bg-amber-900 transition-colors',
          className,
        )}
        title={`Mode aveugle actif${folder ? ` sur le dossier ${folder}` : ''} : les données personnelles (PII) sont caviardées par le serveur`}
        aria-label={`Mode aveugle actif${folder ? ` sur le dossier ${folder}` : ''}`}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <EyeOff className="h-3 w-3 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        <span>Mode aveugle</span>
        {folder && <span className="font-mono text-[11px] opacity-80">({folder})</span>}
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-xs',
        'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
        onClick && 'cursor-pointer hover:bg-amber-200/90 dark:hover:bg-amber-900/90 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
        className,
      )}
      title="Mode aveugle garanti : caviardage serveur selon l'Art. 25 RGPD (Privacy by Design)"
      aria-label={`Mode aveugle actif${folder ? ` pour le dossier ${folder}` : ''}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <EyeOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
      <span className="font-bold">Mode aveugle actif</span>
      {folder && (
        <span className="rounded bg-amber-200/70 dark:bg-amber-900/70 px-1.5 py-0.2 font-mono text-[11px] text-amber-900 dark:text-amber-100">
          {folder}
        </span>
      )}
    </div>
  );
}
