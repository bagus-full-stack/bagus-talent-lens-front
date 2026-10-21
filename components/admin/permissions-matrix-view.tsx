'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Lock,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getPermissionsMatrix,
  MATRIX_ROLES,
  type PermissionMatrixItem,
} from '@/lib/permissions';
import type { Role } from '@/types';

export function PermissionsMatrixView() {
  const [search, setSearch] = useState<string>('');
  const matrix = useMemo(() => getPermissionsMatrix(), []);

  const rolesList: { role: Role; label: string; badgeVariant: 'destructive' | 'warning' | 'outline' | 'success' | 'secondary' }[] = [
    { role: 'owner', label: 'Owner', badgeVariant: 'destructive' },
    { role: 'admin', label: 'Admin', badgeVariant: 'warning' },
    { role: 'recruiter', label: 'Recruiter', badgeVariant: 'outline' },
    { role: 'dpo', label: 'DPO', badgeVariant: 'success' },
    { role: 'reader', label: 'Reader', badgeVariant: 'secondary' },
  ];

  const filteredMatrix = useMemo(() => {
    if (!search.trim()) return matrix;
    const q = search.toLowerCase();
    return matrix.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [matrix, search]);

  const categories = useMemo(() => {
    const map = new Map<string, PermissionMatrixItem[]>();
    for (const item of filteredMatrix) {
      if (!map.has(item.category)) {
        map.set(item.category, []);
      }
      map.get(item.category)!.push(item);
    }
    return map;
  }, [filteredMatrix]);

  return (
    <div className="space-y-4">
      {/* En-tête et rappel de source unique */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Matrice de Contrôle d’Accès Rôles × Permissions (Art. 32 RGPD)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Générée dynamiquement en lecture seule depuis la table de vérité <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">/lib/permissions/index.ts</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              placeholder="Rechercher une permission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Légende :</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Check className="h-3 w-3" />
          </div>
          <span>Accordé nativement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center font-bold">
            <AlertCircle className="h-3 w-3" />
          </div>
          <span>Conditionnel (Drapeau granulaire requis)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 flex items-center justify-center">
            <X className="h-3 w-3" />
          </div>
          <span>Refusé (HTTP 403 Forbidden)</span>
        </div>
      </div>

      {/* Tableau matriciel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="p-3 w-80">Action autorisée (PermissionAction)</th>
                {rolesList.map((r) => (
                  <th key={r.role} className="p-3 text-center w-28">
                    <Badge variant={r.badgeVariant} className="text-[10px] uppercase font-mono">
                      {r.label}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from(categories.entries()).map(([category, items]) => (
                <React.Fragment key={category}>
                  {/* Titre de catégorie */}
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                    <td
                      colSpan={rolesList.length + 1}
                      className="px-3 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      {category}
                    </td>
                  </tr>

                  {items.map((item) => (
                    <tr
                      key={item.action}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          action: &quot;{item.action}&quot;
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {item.description}
                        </span>
                      </td>

                      {rolesList.map((r) => {
                        const status = item.roles[r.role];
                        return (
                          <td key={r.role} className="p-3 text-center align-middle">
                            {status === 'granted' && (
                              <div
                                title={`Autorisé pour le rôle ${r.label}`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}

                            {status === 'conditional' && (
                              <div
                                title={`Conditionnel pour ${r.label} : requiert ${item.action === 'export.named' ? 'can_export' : 'can_reveal_identity'}`}
                                className="inline-flex flex-col items-center gap-0.5"
                              >
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300">
                                  {item.action === 'export.named' ? 'can_export' : 'can_reveal'}
                                </span>
                              </div>
                            )}

                            {status === 'forbidden' && (
                              <div
                                title={`Interdit pour le rôle ${r.label} (403)`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
