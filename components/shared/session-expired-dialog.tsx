'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Clock, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export function SessionExpiredDialog() {
  const { isSessionExpired, setSessionExpired, user } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isSessionExpired) return null;

  const handleReconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez saisir votre mot de passe pour reprendre votre session.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'password', credential: password }),
      });

      if (!res.ok) {
        throw new Error('Mot de passe incorrect ou session invalidée.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        setSessionExpired(false);
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de reconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop sombre non cliquable pour forcer la reconnexion */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        className="relative bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 id="session-expired-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Session de travail expirée
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pour des raisons de sécurité bancaire et RGPD, votre session a été suspendue.
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Votre travail en cours a été conservé en arrière-plan. Reconnectez-vous pour continuer sans perte de contexte.
        </p>

        <form onSubmit={handleReconnect} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Compte : {user?.email}
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2.5 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Session restaurée avec succès !</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/connexion';
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline"
            >
              Changer de compte
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Reprendre ma session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
