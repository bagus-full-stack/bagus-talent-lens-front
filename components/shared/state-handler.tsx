'use client';

import React from 'react';
import { AlertCircle, FolderSearch, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface StateHandlerProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  loadingSkeletonRows?: number;
  children: React.ReactNode;
}

export function StateHandler({
  isLoading,
  isError,
  isEmpty,
  errorMessage = 'Une erreur est survenue lors de la récupération sécurisée des données.',
  emptyTitle = 'Aucun élément disponible',
  emptyDescription = 'Aucun enregistrement ne correspond aux critères de sélection ou aux filtres actifs.',
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  loadingSkeletonRows = 4,
  children,
}: StateHandlerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4" role="status" aria-label="Chargement en cours">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: loadingSkeletonRows }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50/70 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-red-900 dark:text-red-200">
          Erreur de chargement des données
        </h3>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
          {errorMessage}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-1.5 border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <FolderSearch className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {emptyTitle}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {emptyDescription}
        </p>
        {emptyActionLabel && onEmptyAction && (
          <Button
            size="sm"
            onClick={onEmptyAction}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
