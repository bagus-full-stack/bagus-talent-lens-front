import React from 'react';
import type { Role } from '@/types';
import {
  FileText,
  Users,
  Clock,
  Sparkles,
  Shield,
  AlertTriangle,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { getDashboardKpis, type DashboardKpiItem } from '@/lib/dashboard/data';
import { EmptyState, ErrorState } from '@/components/shared/feedback-states';

const ICON_MAP = {
  'file-text': FileText,
  users: Users,
  clock: Clock,
  sparkles: Sparkles,
  shield: Shield,
  'alert-triangle': AlertTriangle,
  calendar: Calendar,
  'check-circle': CheckCircle,
};

interface KpiSectionProps {
  role: Role;
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export async function KpiSection({ role, simulateError, simulateEmpty }: KpiSectionProps) {
  let kpis: DashboardKpiItem[] = [];

  try {
    kpis = await getDashboardKpis(role, {
      shouldFail: simulateError,
      isEmpty: simulateEmpty,
    });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur de chargement des indicateurs KPI"
          message={err instanceof Error ? err.message : 'Impossible de récupérer les métriques en temps réel.'}
        />
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <EmptyState
          title="Aucun indicateur disponible"
          description="Les métriques apparaîtront dès que les premières candidatures seront importées."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const IconComponent = ICON_MAP[kpi.iconName] || FileText;
        return (
          <div
            key={kpi.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700/80 p-5 shadow-xs transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
              <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
                <IconComponent className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-white font-mono">
                {kpi.value}
              </div>
              {kpi.change && (
                <div
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    kpi.changeType === 'positive'
                      ? 'text-emerald-400'
                      : kpi.changeType === 'negative'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                  }`}
                >
                  <span>{kpi.change}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              {kpi.helperText}
            </p>
          </div>
        );
      })}
    </div>
  );
}
