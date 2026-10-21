import React from 'react';
import { notFound } from 'next/navigation';
import { Kanban, Sparkles, User, Clock, ArrowRight } from 'lucide-react';
import { getFolderRepository, getPipelineRepository } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PipelineTabProps {
  params: Promise<{ id: string }>;
}

export default async function PipelineTab({ params }: PipelineTabProps) {
  const { id } = await params;

  const folder = await getFolderRepository().getById(id);
  if (!folder) notFound();

  const pipelineRepo = getPipelineRepository();
  const stages = await pipelineRepo.getStages();
  const candidacies = await pipelineRepo.getCandidaciesByFolder(id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Kanban className="h-5 w-5 text-indigo-600" />
            <span>Pipeline de sélection des candidats</span>
          </h2>
          <p className="text-xs text-slate-500">
            Suivez l'avancement des profils à travers les étapes de qualification et les ruptures d'anonymisation autorisées.
          </p>
        </div>

        <Badge variant="outline" className="font-mono">
          {candidacies.length} profil(s) en cours
        </Badge>
      </div>

      {/* Colonnes Kanban du pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
        {stages.slice(0, 5).map((stg) => {
          const stageCandidacies = candidacies.filter((c) => c.stageId === stg.id);

          return (
            <div
              key={stg.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40 min-w-56"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 pb-2 dark:border-slate-800">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {stg.name}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold dark:bg-slate-800 dark:text-slate-300">
                  {stageCandidacies.length}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                {stageCandidacies.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                    Aucun candidat à cette étape
                  </div>
                ) : (
                  stageCandidacies.map((cnd) => (
                    <Card
                      key={cnd.id}
                      className="p-3 bg-white dark:bg-slate-900 hover:shadow-xs transition-shadow border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {cnd.cvDocumentId.toUpperCase()}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          {cnd.matchScore}% match
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{cnd.assignedRecruiterName || 'Non assigné'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{cnd.daysInStage} jours à cette étape</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
