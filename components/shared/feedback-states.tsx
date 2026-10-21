'use client';

import React from 'react';
import Link from 'next/link';
import {
  Inbox,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  ArrowLeft,
  Lock,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* =========================================================================
   1. EmptyState (État vide)
   ========================================================================= */

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title = 'Aucune donnée disponible',
  description = 'Il n’y a aucun élément à afficher pour le moment.',
  icon: Icon = Inbox,
  actionText,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30',
        className,
      )}
      role="region"
      aria-label={title}
    >
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3.5">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>

      {(actionText && onAction) && (
        <Button size="sm" onClick={onAction} className="mt-5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
          {actionText}
        </Button>
      )}

      {(actionText && actionHref && !onAction) && (
        <Link href={actionHref}>
          <Button size="sm" className="mt-5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
            {actionText}
          </Button>
        </Link>
      )}
    </div>
  );
}

/* =========================================================================
   2. ErrorState (État d'erreur avec bouton Réessayer)
   ========================================================================= */

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  message = 'Impossible de charger ou d’effectuer l’opération demandée. Veuillez vérifier votre connexion ou réitérer la requête.',
  errorCode,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20',
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 mb-3.5">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">{title}</h3>
        {errorCode && (
          <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-rose-200/70 text-rose-900 dark:bg-rose-900 dark:text-rose-200 font-bold">
            Code: {errorCode}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 max-w-md leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
        >
          {isRetrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          <span>{isRetrying ? 'Tentative en cours...' : 'Réessayer'}</span>
        </Button>
      )}
    </div>
  );
}

/* =========================================================================
   3. ForbiddenState (Erreur 403 - Accès non autorisé)
   ========================================================================= */

export interface ForbiddenStateProps {
  title?: string;
  message?: string;
  requiredRoleOrPermission?: string;
  backHref?: string;
  className?: string;
}

export function ForbiddenState({
  title = 'Accès restreint (403)',
  message = 'Vous ne disposez pas des habilitations nécessaires pour consulter cette ressource ou exécuter cette action.',
  requiredRoleOrPermission,
  backHref = '/',
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20',
        className,
      )}
      role="alert"
    >
      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 mb-3.5">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">{title}</h3>

      <p className="mt-1.5 text-xs text-amber-900/80 dark:text-amber-300/90 max-w-md leading-relaxed">
        {message}
      </p>

      {requiredRoleOrPermission && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-200/60 text-amber-950 text-xs font-semibold dark:bg-amber-900/50 dark:text-amber-200">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
          <span>Habilitation requise : {requiredRoleOrPermission}</span>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Link href={backHref}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-amber-300 hover:bg-amber-100 dark:border-amber-800">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour au tableau de bord</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
