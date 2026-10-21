'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Shield, QrCode, Copy, Check, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function MfaSetupPage() {
  const router = useRouter();
  const { user, switchMockRole } = useAuth();
  const [copied, setCopied] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const secretKey = 'JBSWY3DPEHPK3PXP'; // Base32 secret de démonstration
  const otpauthUrl = `otpauth://totp/TalentLens:${user?.email || 'admin@horizon-rh.fr'}?secret=${secretKey}&issuer=TalentLens%20Horizon%20RH`;

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres affiché par votre application.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp }),
      });

      if (!res.ok) {
        throw new Error('Code de confirmation invalide.');
      }

      setIsSuccess(true);
      if (user) {
        switchMockRole(user.role, { aal: 'aal2' });
      }

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur d’enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Configuration du Second Facteur (TOTP)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sécurisez votre compte TalentLens avec Google Authenticator ou 1Password.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* Étape 1 : QR Code */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex flex-col items-center">
              {/* Simulation QR Code visuel haute fidélité */}
              <div className="w-36 h-36 border-2 border-slate-800 p-2 bg-white flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                  <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                </div>
                <div className="flex justify-center items-center py-2">
                  <QrCode className="h-12 w-12 text-slate-800" />
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-slate-900 bg-slate-900/20" />
                  <div className="w-4 h-4 bg-slate-900" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 font-mono">Scan TOTP 30s</span>
            </div>

            <div className="text-xs space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                1. Scannez le QR code avec votre application mobile
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Ouvrez votre gestionnaire (Google Authenticator, Microsoft Authenticator, 1Password) et ajoutez un compte TalentLens.
              </p>

              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-0.5">Clé secrète de secours :</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <span className="select-all font-bold tracking-wider">{secretKey}</span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="ml-auto text-indigo-600 hover:text-indigo-700 p-1"
                    title="Copier la clé"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Étape 2 : Confirmation */}
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                2. Saisissez le premier code généré pour confirmer l'association
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="Ex : 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>MFA TOTP activé avec succès ! Élévation au niveau AAL2 validée.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6 || isSuccess}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                <span>Activer la protection AAL2</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
