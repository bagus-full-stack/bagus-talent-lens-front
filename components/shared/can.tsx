'use client';

import React from 'react';
import type { PermissionAction } from '@/lib/permissions';
import { getPermissionDeniedReason } from '@/lib/permissions';
import { useAuth } from '@/lib/auth/auth-context';
import { Lock } from 'lucide-react';

export interface CanProps {
  action: PermissionAction;
  resource?: unknown;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
  reason?: string;
  className?: string;
}

/**
 * Composant ergonomique de contrôle d'accès basé sur les rôles et permissions RBAC.
 * - Mode 'hide' (par défaut) : ne rend rien (ou le fallback fourni).
 * - Mode 'disable' : rend l'élément désactivé avec opacité réduite et infobulle d'explication.
 */
export function Can({
  action,
  resource,
  children,
  fallback = null,
  mode = 'hide',
  reason,
  className = '',
}: CanProps) {
  const { can, user } = useAuth();
  const allowed = can(action, resource);

  if (allowed) {
    return <>{children}</>;
  }

  // Fallback quand non autorisé
  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  // Mode disable : infobulle explicative et désactivation visuelle / interactive
  const role = user?.role || 'anonymous';
  const explanation = reason || getPermissionDeniedReason(role, action);

  return (
    <div
      className={`relative inline-flex items-center group cursor-not-allowed ${className}`}
      title={explanation}
      aria-disabled="true"
    >
      <div className="opacity-45 pointer-events-none select-none filter grayscale-[40%] flex items-center gap-1.5">
        {children}
      </div>

      {/* Badge cadenas discret */}
      <span className="sr-only">({explanation})</span>

      {/* Infobulle explicative au survol */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white text-[11px] leading-tight font-medium px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700 max-w-xs text-center flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-amber-400 shrink-0" />
          <span>{explanation}</span>
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
      </div>
    </div>
  );
}
