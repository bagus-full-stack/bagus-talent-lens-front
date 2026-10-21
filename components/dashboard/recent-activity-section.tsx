import React from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  ShieldCheck,
  Download,
  FolderOpen,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getAnonymousRecentActivity, type AnonymousActivityItem } from '@/lib/dashboard/data';
import { EmptyState, ErrorState } from '@/components/shared/feedback-states';

const TYPE_ICONS = {
  cv: FileText,
  audit: ShieldCheck,
  export: Download,
  folder: FolderOpen,
  dsr: ShieldCheck,
};

interface RecentActivitySectionProps {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export async function RecentActivitySection({
  simulateError,
  simulateEmpty,
}: RecentActivitySectionProps) {
  let activities: AnonymousActivityItem[] = [];

  try {
    activities = await getAnonymousRecentActivity({
      shouldFail: simulateError,
      isEmpty: simulateEmpty,
    });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur du journal d’activité"
          message={err instanceof Error ? err.message : 'Impossible de récupérer les événements récents.'}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Activité récente (Flux Anonymisé)</h2>
            <span className="text-[10px] text-slate-500 font-mono block">
              Garantie Zéro PII · Libellés serveurs scellés
            </span>
          </div>
        </div>

        <Link
          href="/audit"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
        >
          <span>Registre d'audit</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="Aucune activité récente enregistrée"
          description="Les actions du cabinet et les modifications d'état s'afficheront ici."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const Icon = TYPE_ICONS[act.type] || Activity;
            return (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-850/40 hover:bg-slate-850/80 transition-all text-xs"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-white truncate">{act.title}</strong>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {act.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {act.description}
                  </p>

                  {act.pseudonymRef && (
                    <div className="pt-1">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {act.pseudonymRef}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
