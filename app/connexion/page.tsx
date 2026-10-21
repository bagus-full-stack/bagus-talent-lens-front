'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  const { switchMockRole, isMockEnvironment } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(urlMessage);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);

  // Décompte visuel de temporisation si blocage serveur
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  // Connexion Classique (Email + Mot de passe)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitCountdown > 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.retryAfterSeconds) {
          setRateLimitCountdown(data.retryAfterSeconds);
        }
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        throw new Error(data.error || 'Identifiants invalides');
      }

      // Connexion réussie
      document.cookie = `tl_role=${data.role || 'admin'}; path=/; max-age=86400`;
      document.cookie = `tl_aal=${data.aal || 'aal2'}; path=/; max-age=86400`;
      document.cookie = `tl_session=active_session; path=/; max-age=86400`;
      // Nettoyer cookie de déconnexion
      document.cookie = 'tl_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (isMockEnvironment) {
        switchMockRole(data.role || 'admin', { aal: data.aal || 'aal2' });
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion OAuth (Google ou LinkedIn OIDC)
  const handleOAuthLogin = (provider: 'google' | 'linkedin') => {
    setIsLoading(true);
    setErrorMessage(null);

    // En mode simulation mock : appel au callback avec vérification d'invitation
    if (isMockEnvironment) {
      const testEmail =
        provider === 'google'
          ? 'e.chen@horizon-rh.fr' // Membre existant validé
          : 'm.lefebvre@horizon-rh.fr'; // Membre LinkedIn existant

      router.push(
        `/auth/callback?provider=${provider}&mock_email=${encodeURIComponent(
          testEmail,
        )}&mock_verified=true&redirect=${encodeURIComponent(redirectPath)}`,
      );
      return;
    }

    // En mode Supabase réel
    window.location.href = `/api/auth/oauth/${provider}?redirect=${encodeURIComponent(redirectPath)}`;
  };

  // Connexion Démo Rapide par Rôle
  const handleQuickDemo = (
    role: 'admin' | 'owner' | 'recruiter' | 'reader' | 'dpo',
    aal: 'aal1' | 'aal2',
  ) => {
    switchMockRole(role, { aal });
    document.cookie = `tl_role=${role}; path=/; max-age=86400`;
    document.cookie = `tl_aal=${aal}; path=/; max-age=86400`;
    document.cookie = `tl_session=active_session; path=/; max-age=86400`;
    document.cookie = 'tl_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    router.push(redirectPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl p-8">
        {/* En-tête TalentLens */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TalentLens</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Mode Aveugle Natif
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Plateforme ATS B2B sécurisée · Organisation <strong>Cabinet Horizon RH</strong>
          </p>
        </div>

        {/* Message d'erreur dynamique (ex: rejet OAuth sans invitation, email non vérifié, etc.) */}
        {errorMessage && (
          <div className="mt-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              {urlError && (
                <span className="font-mono text-[10px] uppercase font-bold text-red-400 block">
                  Code erreur : {urlError}
                </span>
              )}
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Blocage par limitation de requêtes (Rate Limit) */}
        {rateLimitCountdown > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Trop de tentatives infructueuses. Temporisation active :</span>
            </div>
            <span className="font-mono font-bold text-sm text-amber-300">
              {rateLimitCountdown}s
            </span>
          </div>
        )}

        {/* Boutons d'authentification SSO OAuth */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading || rateLimitCountdown > 0}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50"
          >
            {/* Logo Google minimal SVG */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continuer avec Google Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('linkedin')}
            disabled={isLoading || rateLimitCountdown > 0}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50"
          >
            {/* Logo LinkedIn minimal SVG */}
            <svg className="h-4 w-4" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.79 1.75-1.76s-.78-1.76-1.75-1.76a1.76 1.76 0 0 0 0 3.52m1.39 9.74v-8.37H5.07v8.37z" />
            </svg>
            <span>Continuer avec LinkedIn (OIDC)</span>
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold font-mono">
              Ou par identifiants cabinet
            </span>
          </div>
        </div>

        {/* Formulaire Email + Mot de passe */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Adresse email professionnelle
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="prenom.nom@horizon-rh.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Mot de passe
              </label>
              <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">
                Oublié ?
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {attemptsRemaining !== null && attemptsRemaining < 3 && attemptsRemaining > 0 && (
            <p className="text-[11px] text-amber-400 font-medium">
              ⚠️ Attention : plus que {attemptsRemaining} tentative(s) avant verrouillage temporaire.
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || rateLimitCountdown > 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Section Démonstration Rapide */}
        {isMockEnvironment && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Accès Démo Direct (Test des Rôles & Sécurité) :</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'aal2')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left hover:border-indigo-500 transition-colors"
              >
                <div className="font-bold text-white">Idriss (Admin)</div>
                <div className="text-slate-400 text-[10px]">Droits complets · AAL2</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('reader', 'aal1')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left hover:border-amber-500 transition-colors"
              >
                <div className="font-bold text-white">Thomas (Lecteur)</div>
                <div className="text-slate-400 text-[10px]">Aucun export visible</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'aal1')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left hover:border-amber-500 transition-colors"
              >
                <div className="font-bold text-amber-300">Admin AAL1</div>
                <div className="text-slate-400 text-[10px]">Test redirection MFA</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('dpo', 'aal1')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left hover:border-emerald-500 transition-colors"
              >
                <div className="font-bold text-white">Séverine (DPO)</div>
                <div className="text-slate-400 text-[10px]">Arbitrage RGPD Art. 17</div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Info className="h-3.5 w-3.5" />
          <span>Accès réservé aux collaborateurs et partenaires invités.</span>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}
