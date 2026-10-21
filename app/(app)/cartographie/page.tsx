'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Network,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Box,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import { CartographyControls } from '@/components/cartographie/cartography-controls';
import { ClusterLegend } from '@/components/cartographie/cluster-legend';
import { CartographyHoverTooltip } from '@/components/cartographie/cartography-hover-tooltip';
import { CandidateSummaryDrawer } from '@/components/cartographie/candidate-summary-drawer';
import { LassoActionBar } from '@/components/cartographie/lasso-action-bar';
import { AccessibleTableView } from '@/components/cartographie/accessible-table-view';
import { CartographyFooter } from '@/components/cartographie/cartography-footer';
import { ThresholdWarningCard } from '@/components/cartographie/threshold-warning-card';
import type {
  CartographyPoint,
  CartographyCluster,
  CartographyFilters,
  CartographyDataResponse,
} from '@/lib/schemas/cartographie';

// Chargement dynamique avec ssr: false des composants lourds WebGL / Canvas
const Cartography2DPlotly = dynamic(
  () => import('@/components/cartographie/cartography-2d-plotly'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        <p className="mt-2 text-xs text-slate-500 font-medium">Chargement du moteur 2D Plotly...</p>
      </div>
    ),
  }
);

const Cartography3DFiber = dynamic(
  () => import('@/components/cartographie/cartography-3d-fiber'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full flex flex-col items-center justify-center bg-slate-950 rounded-lg border border-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
        <p className="mt-2 text-xs text-slate-400 font-medium">Initialisation du GPU Three.js (Instanced Mesh)...</p>
      </div>
    ),
  }
);

const DEFAULT_FILTERS: CartographyFilters = {
  folderId: 'all',
  selectedSkills: [],
  minExperience: 0,
  maxExperience: 20,
  searchSkill: '',
  selectedClusterId: null,
  colorBy: 'cluster',
  opacity: 0.85,
  viewMode: '2d',
  viewFormat: 'graph',
};

export default function CartographiePage() {
  const [data, setData] = useState<CartographyDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [filters, setFilters] = useState<CartographyFilters>(DEFAULT_FILTERS);
  const [datasetSize, setDatasetSize] = useState<number>(1200);

  // Sélections interactives
  const [hoveredPoint, setHoveredPoint] = useState<CartographyPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CartographyPoint | null>(null);
  const [lassoSelectedPoints, setLassoSelectedPoints] = useState<CartographyPoint[]>([]);

  // Notification d'action
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Chargement des données vectorielles
  const fetchData = useCallback(async (count = 1200) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/cartographie?count=${count}`);
      if (res.ok) {
        const json: CartographyDataResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur chargement cartographie:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(datasetSize);
  }, [fetchData, datasetSize]);

  // Recalcul incrémental UMAP par l'Admin
  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      const res = await fetch('/api/cartographie/recalculate', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        await fetchData(datasetSize);
        showToast(json.message || 'Recalcul UMAP terminé avec succès.');
      }
    } catch (err) {
      console.error('Erreur recalcul:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleUpdateFilters = (partial: Partial<CartographyFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    // Si on change de filtre, désélectionner le lasso
    setLassoSelectedPoints([]);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setLassoSelectedPoints([]);
    setSelectedPoint(null);
  };

  // Filtrage côté client
  const points = data?.points || [];
  const clusters = data?.clusters || [];

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      // Filtre dossier
      if (filters.folderId !== 'all' && p.folderId !== filters.folderId) {
        return false;
      }
      // Filtre expérience
      if (p.yearsExperience < filters.minExperience || p.yearsExperience > filters.maxExperience) {
        return false;
      }
      return true;
    });
  }, [points, filters.folderId, filters.minExperience, filters.maxExperience]);

  // Détection du seuil critique (< 50 CVs)
  const isBelowThreshold = filteredPoints.length < 50;

  // Création d'une shortlist depuis la sélection au lasso
  const handleCreateShortlistFromLasso = (selected: CartographyPoint[]) => {
    showToast(`Shortlist « Sélection UMAP » créée avec ${selected.length} candidats !`);
  };

  // Liste des compétences disponibles
  const availableSkills = useMemo(() => {
    const s = new Set<string>();
    points.forEach((p) => p.topSkills.forEach((sk) => s.add(sk)));
    return Array.from(s).slice(0, 20);
  }, [points]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. En-tête de la page */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
            <Network className="h-4 w-4" />
            <span>Représentation Vectorielle des Viviers</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cartographie sémantique des compétences
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Projection UMAP haute dimension avec analyse de proximité, clusters sémantiques et isolation de profils.
          </p>
        </div>

        {/* Rappel Mode aveugle actif */}
        <BlindBadge folder="Vivier global" />
      </header>

      {/* Toast de notification */}
      {notification && (
        <div
          data-testid="cartography-toast"
          className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in duration-150"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. État : Seuil critique (< 50 CVs) */}
      {isBelowThreshold && (
        <ThresholdWarningCard
          currentCount={filteredPoints.length}
          onExpandFilters={() => handleUpdateFilters({ folderId: 'all', minExperience: 0 })}
          onLoadSyntheticData={() => setDatasetSize(1200)}
        />
      )}

      {/* 3. Panneau de contrôle */}
      <CartographyControls
        filters={filters}
        totalPointsCount={points.length}
        filteredCount={filteredPoints.length}
        availableSkills={availableSkills}
        onChange={handleUpdateFilters}
        onReset={handleResetFilters}
        onSelectDatasetSize={(sz) => setDatasetSize(sz)}
        currentDatasetSize={datasetSize}
      />

      {/* 4. Légende des clusters (cliquable pour isoler) */}
      <ClusterLegend
        clusters={clusters}
        selectedClusterId={filters.selectedClusterId}
        onToggleCluster={(id) => {
          handleUpdateFilters({
            selectedClusterId: filters.selectedClusterId === id ? null : id,
          });
        }}
      />

      {/* 5. Espace de visualisation principal (2D Plotly / 3D Three.js / Tableau Accessible) */}
      <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 overflow-hidden shadow-xs min-h-[520px]">
        {/* Infobulle de survol (flottante en haut à droite) */}
        <CartographyHoverTooltip point={hoveredPoint} />

        {/* Vue tabulaire accessible pour lecteurs d'écran */}
        {filters.viewFormat === 'table' ? (
          <AccessibleTableView
            points={filteredPoints}
            clusters={clusters}
            onSelectPoint={(p) => setSelectedPoint(p)}
          />
        ) : filters.viewMode === '3d' ? (
          /* Vue 3D : react-three-fiber (instanced mesh) */
          <Cartography3DFiber
            points={filteredPoints}
            clusters={clusters}
            colorBy={filters.colorBy}
            opacity={filters.opacity}
            searchSkill={filters.searchSkill}
            selectedClusterId={filters.selectedClusterId}
            onSelectPoint={(p) => setSelectedPoint(p)}
            onHoverPoint={(p) => setHoveredPoint(p)}
          />
        ) : (
          /* Vue 2D : Plotly.js scattergl */
          <Cartography2DPlotly
            points={filteredPoints}
            clusters={clusters}
            colorBy={filters.colorBy}
            opacity={filters.opacity}
            searchSkill={filters.searchSkill}
            selectedClusterId={filters.selectedClusterId}
            onSelectPoint={(p) => setSelectedPoint(p)}
            onHoverPoint={(p) => setHoveredPoint(p)}
            onLassoSelect={(selected) => setLassoSelectedPoints(selected)}
            lassoActive={true}
          />
        )}
      </div>

      {/* 6. Barre d'action contextuelle du lasso */}
      <LassoActionBar
        selectedPoints={lassoSelectedPoints}
        onClearSelection={() => setLassoSelectedPoints([])}
        onCreateShortlist={handleCreateShortlistFromLasso}
      />

      {/* 7. Tiroir de détail latéral du candidat */}
      <CandidateSummaryDrawer
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onAddToShortlist={(id) => showToast(`Candidat ajouté à la shortlist active.`)}
      />

      {/* 8. Pied de page avec date de calcul et recalcul UMAP incrémental */}
      <CartographyFooter
        lastCalculatedAt={data?.lastCalculatedAt || '2026-10-06T03:00:00Z'}
        isRecalculating={isRecalculating}
        onRecalculate={handleRecalculate}
        isAdmin={true}
      />
    </div>
  );
}
