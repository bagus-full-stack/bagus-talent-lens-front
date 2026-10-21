'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, KeyRound, ChevronRight } from 'lucide-react';
import type { Membership } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AdminMfaAlertProps {
  members: Membership[];
}

export function AdminMfaAlert({ members }: AdminMfaAlertProps) {
  // Détecter les comptes à privilèges élevés (owner ou admin) sans MFA active
  const unshieldedAdmins = members.filter(
    (m) => (m.role === 'admin' || m.role === 'owner') && (!m.mfaEnabled || m.aal !== 'aal2')
  );

  if (unshieldedAdmins.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50/90 p-4 text-xs text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 space-y-2 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
          <div>
            <strong className="font-bold text-sm block">
              Alerte Sécurité Critique : {unshieldedAdmins.length} compte(s) Administrateur / Propriétaire sans MFA renforcée
            </strong>
            <span className="text-[11px] text-red-800 dark:text-red-300">
              Conformité CNIL & SOC-2 : L’authentification multi-facteurs (FIDO2 ou TOTP) est strictement obligatoire pour tous les rôles à privilèges.
            </span>
          </div>
        </div>

        <Badge variant="destructive" className="shrink-0 font-mono text-xs">
          Niveau de risque : Élevé
        </Badge>
      </div>

      <div className="pt-2 border-t border-red-200 dark:border-red-900/40 flex flex-wrap items-center gap-2">
        <span className="font-medium text-red-900 dark:text-red-200">
          Comptes concernés :
        </span>
        {unshieldedAdmins.map((adm) => (
          <span
            key={adm.id}
            className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-900 dark:text-red-100 font-mono text-[11px] flex items-center gap-1"
          >
            <span>{adm.fullName}</span>
            <span className="text-[10px] text-red-600 dark:text-red-300">({adm.email})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
