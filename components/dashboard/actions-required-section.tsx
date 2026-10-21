import React from 'react';
import Link from 'next/link';
import { AlertCircle, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getActionsRequired, type ActionRequiredItem } from '@/lib/dashboard/data';
import { LiveActiveImports } from '@/components/dashboard/live-active-imports';
import { EmptyState, ErrorState } from '@/components/shared/feedback-states';

interface ActionsRequiredSectionProps {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export async function ActionsRequiredSection({
  simulateError,
  simulateEmpty,
}: ActionsRequiredSectionProps) {
  let actions: ActionRequiredItem[] = [];

  try {
    actions = await getActionsRequired({
      shouldFail: simulateError,
      isEmpty: simulateEmpty,
    });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur du centre d’actions prioritaires"
          message={err instanceof Error ? err.message : 'Impossible de récupérer les alertes prioritaires.'}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Actions requises & Alertes</h2>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {actions.length} action(s)
        </span>
      </div>

      {/* Widget temps réel : Imports en cours */}
      <LiveActiveImports initialCount={3} />

      {actions.length === 0 ? (
        <EmptyState
          title="Toutes les vérifications sont à jour"
          description="Aucune anomalie d'extraction ou demande RGPD urgente en souffrance."
        />
      ) : (
        <div className="space-y-2.5">
          {actions.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-850/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {act.type === 'dsr_request' ? (
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold">
                      RGPD Art. 17
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      Revue IA
                    </span>
                  )}
                  <strong className="text-white">{act.title}</strong>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{act.description}</p>
                <span className="text-[10px] text-slate-500 font-mono block">{act.date}</span>
              </div>

              <Link
                href={act.actionUrl}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 text-xs font-medium transition-colors shrink-0"
              >
                <span>{act.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
