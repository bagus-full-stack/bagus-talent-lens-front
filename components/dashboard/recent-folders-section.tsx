import React from 'react';
import Link from 'next/link';
import { FolderOpen, ArrowRight, Users, Sparkles } from 'lucide-react';
import { getRecentFolders } from '@/lib/dashboard/data';
import { BlindBadge } from '@/components/shared/blind-badge';
import { EmptyState, ErrorState } from '@/components/shared/feedback-states';

interface RecentFoldersSectionProps {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export async function RecentFoldersSection({
  simulateError,
  simulateEmpty,
}: RecentFoldersSectionProps) {
  let folders = [];

  try {
    folders = await getRecentFolders({
      shouldFail: simulateError,
      isEmpty: simulateEmpty,
    });
  } catch (err: unknown) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-slate-900/80 p-5">
        <ErrorState
          title="Erreur de chargement des dossiers de recrutement"
          message={err instanceof Error ? err.message : 'Impossible de récupérer la liste des dossiers.'}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderOpen className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Dossiers récents de recrutement</h2>
        </div>

        <Link
          href="/dossiers"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
        >
          <span>Voir tous les dossiers</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {folders.length === 0 ? (
        <EmptyState
          title="Aucun dossier actif"
          description="Créez votre premier dossier pour commencer le sourcing et l’évaluation anonymisée."
          actionText="Créer un dossier"
          actionHref="/dossiers"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {folders.map((fld) => (
            <Link
              key={fld.id}
              href={`/dossiers/${fld.id}`}
              className="p-4 rounded-xl border border-slate-800 bg-slate-850/60 hover:border-indigo-500/40 hover:bg-slate-800/80 transition-all space-y-3 group text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {fld.reference}
                    </span>
                    <strong className="text-white group-hover:text-indigo-300 transition-colors">
                      {fld.title}
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {fld.jobTitle} · {fld.location}
                  </span>
                </div>

                {fld.blindModeEnabled && (
                  <BlindBadge folder={fld.reference} compact />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    <strong>{fld.totalCandidates}</strong> candidat(s)
                  </span>
                </div>
                <div className="text-indigo-300 font-semibold">
                  {fld.qualifiedCandidates} qualifié(s)
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
