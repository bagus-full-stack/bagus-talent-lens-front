import React from 'react';
import type { Role } from '@/types';
import { Cpu, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getAiConsumption, type AiConsumptionStats } from '@/lib/dashboard/data';
import { ErrorState } from '@/components/shared/feedback-states';

interface AiConsumptionSectionProps {
  role: Role;
  simulateError?: boolean;
}

export async function AiConsumptionSection({
  role,
  simulateError,
}: AiConsumptionSectionProps) {
  // Masqué complètement pour le profil Lecteur (Reader / Viewer)
  if (role === 'reader' || role === 'viewer') {
    return null;
  }

  let stats: AiConsumptionStats | null = null;

  try {
    stats = await getAiConsumption(role, { shouldFail: simulateError });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur du suivi de consommation IA"
          message={err instanceof Error ? err.message : 'Impossible d’accéder aux quotas du mois.'}
        />
      </div>
    );
  }

  if (!stats) return null;

  const isNearLimit = stats.percentageUsed >= 80;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Consommation IA du mois</h2>
            <p className="text-[11px] text-slate-400">
              Modèles Gemini 1.5 pour parsing, masquage PII et scoring prédictif
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-mono">Coût estimé</span>
          <span className="text-sm font-bold text-white font-mono">
            {stats.estimatedCostEur.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Jauge globale de quota */}
      <div className="space-y-2 p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">Quota de tokens alloués</span>
            {isNearLimit && (
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> &gt;80% consommé
              </span>
            )}
          </div>
          <span className="font-mono text-slate-300 text-[11px]">
            <strong>{stats.tokensUsed.toLocaleString('fr-FR')}</strong> /{' '}
            {stats.tokensLimit.toLocaleString('fr-FR')} ({stats.percentageUsed}%)
          </span>
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${stats.percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Répartition par modèle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {stats.modelBreakdown.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-800 bg-slate-850/40 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 truncate">{item.model}</span>
              <span className="text-[11px] font-mono text-indigo-400 font-semibold">{item.pct}%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.task}</p>
            <span className="text-[10px] text-slate-500 font-mono block">
              {item.tokens.toLocaleString('fr-FR')} tokens traités
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          Aucune donnée personnelle brute n’est transmise aux modèles d’indexation tiers.
        </span>
      </div>
    </div>
  );
}
