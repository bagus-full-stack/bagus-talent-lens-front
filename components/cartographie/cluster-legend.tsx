'use client';

import React from 'react';
import type { CartographyCluster } from '@/lib/schemas/cartographie';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Layers, Check } from 'lucide-react';

interface ClusterLegendProps {
  clusters: CartographyCluster[];
  selectedClusterId: string | null;
  onToggleCluster: (clusterId: string) => void;
}

export function ClusterLegend({
  clusters,
  selectedClusterId,
  onToggleCluster,
}: ClusterLegendProps) {
  return (
    <div
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs shadow-xs space-y-2"
      data-testid="cluster-legend"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Layers className="h-3.5 w-3.5 text-indigo-600" />
          <span>Clusters sémantiques (Cliquer pour isoler)</span>
        </div>
        {selectedClusterId && (
          <button
            type="button"
            onClick={() => onToggleCluster(selectedClusterId)}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Afficher tous les clusters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {clusters.map((cluster) => {
          const isSelected = selectedClusterId === cluster.id;
          const isDimmed = selectedClusterId !== null && !isSelected;

          return (
            <button
              key={cluster.id}
              type="button"
              onClick={() => onToggleCluster(cluster.id)}
              data-testid={`cluster-badge-${cluster.id}`}
              className={cn(
                'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-2xs',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100'
                  : isDimmed
                  ? 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 text-slate-700 dark:text-slate-300'
              )}
              title={`Cliquer pour isoler le cluster ${cluster.name}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: cluster.color }}
              />
              <span className="font-medium truncate max-w-[170px]">{cluster.name}</span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                {cluster.count.toLocaleString()}
              </span>
              {isSelected && <Check className="h-3 w-3 text-indigo-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
