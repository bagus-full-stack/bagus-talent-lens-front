'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { Role } from '@/types';
import { Shield, ChevronDown, Check, UserCheck, AlertTriangle } from 'lucide-react';

export function RoleSwitcher() {
  const { user, role, aal, switchMockRole, isMockEnvironment } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Ce sélecteur n'est JAMAIS rendu en production
  if (!isMockEnvironment) {
    return null;
  }

  const roleProfiles: Array<{
    role: Role;
    aal: 'aal1' | 'aal2';
    name: string;
    description: string;
    badgeColor: string;
    warning?: string;
  }> = [
    {
      role: 'admin',
      aal: 'aal2',
      name: 'Idriss Ouédraogo (Admin AAL2)',
      description: 'Droits complets, MFA AAL2 validée, exports autorisés',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    {
      role: 'owner',
      aal: 'aal2',
      name: 'Éléonore Chen (Fondatrice / Owner)',
      description: 'Gouvernance globale cabinet, habilitation ré-auth requise',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    },
    {
      role: 'recruiter',
      aal: 'aal1',
      name: 'Marc Lefebvre (Recruteur Senior)',
      description: 'Sourcing, matching, pipeline. Mode aveugle actif strict',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
    {
      role: 'reader',
      aal: 'aal1',
      name: 'Thomas Vasseur (Lecteur / Client Partenaire)',
      description: 'Consultation seule. Aucun bouton d’export visible (Test RBAC)',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    {
      role: 'dpo',
      aal: 'aal1',
      name: 'Séverine Petit (Déléguée DPO)',
      description: 'Arbitrage RGPD, validation purges Art. 17, journal WORM',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      role: 'admin',
      aal: 'aal1',
      name: 'Julien Mercier (Admin AAL1 - Test MFA)',
      description: 'Admin sans second facteur : doit déclencher la redirection MFA !',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
      warning: 'Redirection /mfa-verify immédiate sur les pages sensibles',
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors shadow-xs"
        title="Sélecteur de profil de simulation RBAC (Environnement Mock)"
      >
        <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-bold">
          Rôle Démo :
        </span>
        <span className="font-semibold">{user?.fullName.split(' ')[0]} ({role.toUpperCase()})</span>
        <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${aal === 'aal2' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'}`}>
          {aal.toUpperCase()}
        </span>
        <ChevronDown className="h-3 w-3 text-indigo-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Simulation de Rôles & Accréditations</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Permutez instantanément d’identité pour tester les droits RBAC, la MFA AAL2 et la restriction d’export du Lecteur.
              </p>
            </div>

            <div className="mt-1 space-y-1 max-h-80 overflow-y-auto">
              {roleProfiles.map((p, idx) => {
                const isSelected = user?.role === p.role && aal === p.aal;
                return (
                  <button
                    key={`${p.role}-${p.aal}-${idx}`}
                    type="button"
                    onClick={() => {
                      switchMockRole(p.role, { aal: p.aal });
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-md text-xs transition-colors flex items-start justify-between gap-2 border ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <span>{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${p.badgeColor}`}>
                          {p.role}
                        </span>
                        <span className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold ${p.aal === 'aal2' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                          {p.aal.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.description}
                      </p>
                      {p.warning && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>{p.warning}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
