'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RotateCcw, ShieldCheck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-2">
          Connexion réseau requise
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Vous êtes actuellement hors ligne. Pour préserver la confidentialité stricte et la conformité RGPD, aucune donnée de dossier ni profil candidat n'est conservé dans le cache local.
        </p>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-normal">
            <span className="font-semibold text-slate-200">Garantie Zéro-PII :</span> Les données nominatives et candidatures requièrent une connexion sécurisée et une authentification serveur valide.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleReload}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm shadow-lg shadow-indigo-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            Vérifier la connexion
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-slate-700 hover:bg-slate-700/50 text-slate-300 gap-2 text-sm"
            >
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
