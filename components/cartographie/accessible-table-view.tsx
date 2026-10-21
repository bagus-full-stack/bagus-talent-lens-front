'use client';

import React, { useState } from 'react';
import type { CartographyPoint, CartographyCluster } from '@/lib/schemas/cartographie';
import { PIPELINE_LABELS, PIPELINE_COLORS } from '@/lib/cartographie/cartographie-service';
import { ExternalLink, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface AccessibleTableViewProps {
  points: CartographyPoint[];
  clusters: CartographyCluster[];
  onSelectPoint: (point: CartographyPoint) => void;
}

export function AccessibleTableView({
  points,
  clusters,
  onSelectPoint,
}: AccessibleTableViewProps) {
  const [collapsedClusters, setCollapsedClusters] = useState<Record<string, boolean>>({});

  const toggleCluster = (clusterId: string) => {
    setCollapsedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  // Grouper les points par cluster
  const pointsByCluster = clusters.map((cluster) => ({
    cluster,
    members: points.filter((p) => p.clusterId === cluster.id),
  }));

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4"
      data-testid="accessible-table-view"
      role="region"
      aria-label="Alternative tabulaire accessible de la cartographie vectorielle"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Vue tabulaire accessible des profils par cluster vectoriel
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Structure sémantique optimisée pour la navigation au clavier et la lecture d'écran (sans données nominatives).
        </p>
      </div>

      <div className="space-y-4">
        {pointsByCluster.map(({ cluster, members }) => {
          const isCollapsed = collapsedClusters[cluster.id];

          return (
            <div
              key={cluster.id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
            >
              {/* En-tête de cluster */}
              <button
                type="button"
                onClick={() => toggleCluster(cluster.id)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-left hover:bg-slate-100 transition-colors cursor-pointer"
                aria-expanded={!isCollapsed}
                aria-controls={`cluster-table-${cluster.id}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {cluster.name}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {members.length} profil{members.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Tableau des membres */}
              {!isCollapsed && (
                <div id={`cluster-table-${cluster.id}`} className="overflow-x-auto">
                  <table className="w-full text-left text-xs" aria-label={`Membres du cluster ${cluster.name}`}>
                    <thead className="bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 text-[11px] font-semibold">
                      <tr>
                        <th className="py-2 px-3">Candidat (DTO)</th>
                        <th className="py-2 px-3">Intitulé de poste</th>
                        <th className="py-2 px-3">Expérience</th>
                        <th className="py-2 px-3">Compétences attestées</th>
                        <th className="py-2 px-3">Étape pipeline</th>
                        <th className="py-2 px-3">Dossier</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.slice(0, 50).map((pt) => (
                        <tr
                          key={pt.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {pt.pseudonym}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-[180px] truncate">
                            {pt.currentTitle}
                          </td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {pt.yearsExperience} ans
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {pt.topSkills.map((sk, i) => (
                                <span
                                  key={i}
                                  className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 font-medium text-[11px]">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: PIPELINE_COLORS[pt.pipelineStage] }}
                              />
                              <span>{PIPELINE_LABELS[pt.pipelineStage]}</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {pt.folderReference}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <Link
                              href={`/cv/${pt.id}`}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                              aria-label={`Ouvrir la fiche de ${pt.pseudonym}`}
                            >
                              <span>Consulter</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {members.length > 50 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                      Affichage des 50 premiers profils sur {members.length} pour ce cluster.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
