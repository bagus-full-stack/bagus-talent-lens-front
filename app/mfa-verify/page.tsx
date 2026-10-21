'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldCheck, Smartphone, ArrowRight, Loader2, AlertCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';

function MfaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { user, aal, switchMockRole, isMockEnvironment } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Re-génération visuelle du cycle TOTP 30s
  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
      setCountdown(seconds);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\s/g, '');
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Veuillez renseigner un code numérique à 6 chiffres valide.');
      return;
    }

    setIsLoading(true);

    try {
      // Appel API de validation du second facteur
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Code TOTP invalide ou expiré.');
      }

      // En mode mock, basculer le rôle en AAL2
      if (isMockEnvironment && user) {
        switchMockRole(user.role, { aal: 'aal2' });
        document.cookie = 'tl_aal=aal2; path=/; max-age=86400';
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de vérification du code TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-xs mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
            Niveau de Sécurité AAL2 Exigé
          </span>
          <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Vérification à Deux Facteurs (2FA)
          </h1>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
            En tant qu’<strong className="text-slate-900 dark:text-slate-200">{user?.role === 'owner' ? 'Propriétaire' : 'Administrateur'}</strong>, l’accès aux dossiers, paramètres et données sensibles requiert impérativement un deuxième facteur certifié.
          </p>
        </div>

        {/* Indicateur de rotation du jeton TOTP */}
        <div className="mt-6 flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Smartphone className="h-4 w-4 text-indigo-500" />
            <span>Ouvrez Google Authenticator ou Authy</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            Renouvellement : <strong className="text-indigo-600 dark:text-indigo-400">{countdown}s</strong>
          </span>
        </div>

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Code de sécurité à 6 chiffres
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="000 000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
            {isMockEnvironment && (
              <p className="mt-1.5 text-[11px] text-indigo-500 dark:text-indigo-400 text-center font-medium">
                💡 En environnement de test, saisissez <strong>123456</strong> ou n'importe quel code à 6 chiffres.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Valider le second facteur</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <Link
            href="/mfa-setup"
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Configurer un nouvel appareil</span>
          </Link>
          <Link
            href="/connexion"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 underline"
          >
            Retour connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <MfaVerifyContent />
    </Suspense>
  );
}
