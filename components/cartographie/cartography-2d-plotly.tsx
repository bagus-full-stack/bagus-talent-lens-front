'use client';

import React, { useEffect, useRef, useState } from 'react';
import type {
  CartographyPoint,
  CartographyCluster,
  ColorByOption,
} from '@/lib/schemas/cartographie';
import { PIPELINE_COLORS } from '@/lib/cartographie/cartographie-service';

interface Cartography2DPlotlyProps {
  points: CartographyPoint[];
  clusters: CartographyCluster[];
  colorBy: ColorByOption;
  opacity: number;
  searchSkill: string;
  selectedClusterId: string | null;
  onSelectPoint: (point: CartographyPoint) => void;
  onHoverPoint: (point: CartographyPoint | null) => void;
  onLassoSelect: (selectedPoints: CartographyPoint[]) => void;
  lassoActive?: boolean;
}

export function Cartography2DPlotly({
  points,
  clusters,
  colorBy,
  opacity,
  searchSkill,
  selectedClusterId,
  onSelectPoint,
  onHoverPoint,
  onLassoSelect,
  lassoActive = true,
}: Cartography2DPlotlyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const plotlyRef = useRef<any>(null);

  // Déterminer la couleur d'un point
  const getPointColor = (p: CartographyPoint): string => {
    switch (colorBy) {
      case 'cluster': {
        const c = clusters.find((cl) => cl.id === p.clusterId);
        return c?.color || '#6366F1';
      }
      case 'pipeline': {
        return PIPELINE_COLORS[p.pipelineStage] || '#94A3B8';
      }
      case 'experience': {
        if (p.yearsExperience <= 2) return '#38BDF8';
        if (p.yearsExperience <= 5) return '#3B82F6';
        if (p.yearsExperience <= 8) return '#8B5CF6';
        return '#EC4899';
      }
      case 'folder': {
        if (p.folderId === 'fld-de-2026') return '#3B82F6';
        if (p.folderId === 'fld-cyb-88') return '#EF4444';
        return '#10B981';
      }
      default:
        return '#3B82F6';
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initPlot() {
      if (!containerRef.current) return;

      try {
        const Plotly = (await import('plotly.js-dist-min')).default;
        plotlyRef.current = Plotly;

        if (!isMounted || !containerRef.current) return;

        // Filtrage éventuel par cluster isolé
        const visiblePoints = selectedClusterId
          ? points.filter((p) => p.clusterId === selectedClusterId)
          : points;

        const skillQuery = searchSkill.trim().toLowerCase();

        // Calcul des tailles et opacités pour la recherche de compétence
        const colors: string[] = [];
        const sizes: number[] = [];
        const opacities: number[] = [];
        const customDataList: CartographyPoint[] = [];

        visiblePoints.forEach((p) => {
          const matchesSearch =
            !skillQuery ||
            p.topSkills.some((s) => s.toLowerCase().includes(skillQuery)) ||
            (p.allSkills && p.allSkills.some((s) => s.toLowerCase().includes(skillQuery)));

          colors.push(getPointColor(p));
          sizes.push(matchesSearch ? (skillQuery ? 9 : 6) : 4);
          opacities.push(matchesSearch ? opacity : Math.max(0.08, opacity * 0.2));
          customDataList.push(p);
        });

        const trace: any = {
          x: visiblePoints.map((p) => p.x),
          y: visiblePoints.map((p) => p.y),
          mode: 'markers',
          type: 'scattergl', // WebGL haute performance jusqu'à 50 000 points
          marker: {
            color: colors,
            size: sizes,
            opacity: opacities,
            line: {
              width: skillQuery ? 1 : 0.5,
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
          // Formatage strict sans PII (Mode aveugle)
          hoverinfo: 'none', // Géré via infobulle personnalisée sur événement plotly_hover
          customdata: customDataList,
        };

        const layout: any = {
          margin: { l: 20, r: 20, t: 20, b: 20 },
          dragmode: lassoActive ? 'lasso' : 'pan',
          hovermode: 'closest',
          autosize: true,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            showgrid: true,
            gridcolor: 'rgba(148, 163, 184, 0.15)',
            zeroline: false,
            showticklabels: false,
          },
          yaxis: {
            showgrid: true,
            gridcolor: 'rgba(148, 163, 184, 0.15)',
            zeroline: false,
            showticklabels: false,
          },
        };

        const config: any = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: [
            'toImage',
            'sendDataToCloud',
            'toggleSpikelines',
            'hoverClosestCartesian',
            'hoverCompareCartesian',
          ],
          displaylogo: false,
        };

        await Plotly.react(containerRef.current, [trace], layout, config);
        setIsLoading(false);

        // Attachement des gestionnaires d'événements
        const el = containerRef.current as any;

        el.on('plotly_hover', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const p = data.points[0].customdata as CartographyPoint;
            onHoverPoint(p);
          }
        });

        el.on('plotly_unhover', () => {
          onHoverPoint(null);
        });

        el.on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const p = data.points[0].customdata as CartographyPoint;
            onSelectPoint(p);
          }
        });

        el.on('plotly_selected', (eventData: any) => {
          if (eventData && eventData.points && eventData.points.length > 0) {
            const selected = eventData.points.map((p: any) => p.customdata as CartographyPoint);
            onLassoSelect(selected);
          } else {
            onLassoSelect([]);
          }
        });
      } catch (err) {
        console.error('Erreur initialisation Plotly 2D:', err);
      }
    }

    initPlot();

    return () => {
      isMounted = false;
      if (containerRef.current && plotlyRef.current) {
        try {
          plotlyRef.current.purge(containerRef.current);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [
    points,
    clusters,
    colorBy,
    opacity,
    searchSkill,
    selectedClusterId,
    lassoActive,
    onSelectPoint,
    onHoverPoint,
    onLassoSelect,
  ]);

  return (
    <div className="relative w-full h-full min-h-[500px]" data-testid="cartography-2d-container">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            Génération de la projection 2D vectorielle...
          </p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}

export default Cartography2DPlotly;
