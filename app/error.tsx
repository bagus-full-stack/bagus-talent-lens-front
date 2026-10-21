'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900/50 dark:bg-slate-900 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Une anomalie technique est survenue
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          L'accès sécurisé aux données ou le traitement des composants a rencontré une exception.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            size="sm"
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser la vue
          </Button>
        </div>
      </div>
    </div>
  );
}
