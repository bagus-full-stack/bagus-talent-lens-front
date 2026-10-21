'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldAlert, KeyRound, Smartphone, Loader2, X, CheckCircle2, Lock } from 'lucide-react';

export interface ReauthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  actionName?: string;
}

export function ReauthDialog({
  isOpen,
  onClose,
  onSuccess,
  title = 'Confirmation de Sécurité Forte',
  description = 'Cette opération sensible modifie ou expose des données protégées. Veuillez confirmer votre identité.',
  actionName = 'Action Sensible',
}: ReauthDialogProps) {
  const { user, recordReauth } = useAuth();
  const [method, setMethod] = useState<'totp' | 'password'>('totp');
  const [credential, setCredential] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential) {
      setError(method === 'totp' ? 'Veuillez saisir votre code à 6 chiffres' : 'Veuillez saisir votre mot de passe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Validation d’authentification échouée');
      }

      setIsSuccess(true);
      recordReauth();

      setTimeout(() => {
        setIsSuccess(false);
        setCredential('');
        onSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de ré-authentification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reauth-title"
        className="relative bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 id="reauth-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Lock className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {actionName}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>

        {/* Sélection de la méthode */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMethod('totp');
              setCredential('');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              method === 'totp'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Code TOTP (App)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('password');
              setCredential('');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              method === 'password'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Mot de passe</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {method === 'totp' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Code à 6 chiffres de votre application d’authentification
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="Ex : 123456"
                value={credential}
                onChange={(e) => setCredential(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400 text-center">
                Code temporaire généré par Google Authenticator, Authy ou 1Password.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mot de passe du compte ({user?.email})
              </label>
              <input
                type="password"
                autoFocus
                placeholder="••••••••••••"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Authentification confirmée. Exécution de l'action en cours...</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirmer l’action</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
