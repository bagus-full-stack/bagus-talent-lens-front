'use client';

import React from 'react';
import {
  Palette,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Table as TableIcon,
  Box,
  Eye,
  Filter,
  Sparkles,
  Layers,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockFolders } from '@/lib/mock/data/folders';
import type {
  ColorByOption,
  CartographyFilters,
} from '@/lib/schemas/cartographie';

interface CartographyControlsProps {
  filters: CartographyFilters;
  totalPointsCount: number;
  filteredCount: number;
  availableSkills: string[];
  onChange: (partial: Partial<CartographyFilters>) => void;
  onReset: () => void;
  onSelectDatasetSize?: (count: number) => void;
  currentDatasetSize: number;
}

export function CartographyControls({
  filters,
  totalPointsCount,
  filteredCount,
  availableSkills,
  onChange,
  onReset,
  onSelectDatasetSize,
  currentDatasetSize,
}: CartographyControlsProps) {
  const COLOR_BY_OPTIONS: { id: ColorByOption; label: string }[] = [
    { id: 'cluster', label: 'Cluster sémantique' },
    { id: 'pipeline', label: 'Étape du pipeline' },
    { id: 'experience', label: 'Expérience (ans)' },
    { id: 'folder', label: 'Dossier de recrutement' },
  ];

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs space-y-3 shadow-xs"
      data-testid="cartography-controls"
    >
      {/* Ligne 1 : Bascule 2D / 3D / Tableau + Recherche de compétence + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Bascule 2D / 3D et Tableau */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <Button
            variant={filters.viewMode === '2d' && filters.viewFormat === 'graph' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange({ viewMode: '2d', viewFormat: 'graph' })}
            data-testid="toggle-view-2d"
            className="h-7 px-2.5 text-xs font-semibold"
          >
            Vue 2D (Plotly)
          </Button>
          <Button
            variant={filters.viewMode === '3d' && filters.viewFormat === 'graph' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange({ viewMode: '3d', viewFormat: 'graph' })}
            data-testid="toggle-view-3d"
            className="h-7 px-2.5 text-xs font-semibold gap-1.5"
          >
            <Box className="h-3.5 w-3.5" />
            <span>Vue 3D (Three.js)</span>
          </Button>
          <Button
            variant={filters.viewFormat === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange({ viewFormat: filters.viewFormat === 'table' ? 'graph' : 'table' })}
            data-testid="toggle-view-table"
            className="h-7 px-2.5 text-xs font-medium gap-1 text-slate-700 dark:text-slate-300"
            title="Alternative tabulaire pour accessibilité et lecteurs d'écran"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Vue accessible</span>
          </Button>
        </div>

        {/* Compteur de points */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Affichés : <strong className="text-slate-900 dark:text-slate-100">{filteredCount.toLocaleString()}</strong> / {totalPointsCount.toLocaleString()} profils
          </span>

          {/* Sélecteur de volumétrie pour tester la fluidité 50k */}
          {onSelectDatasetSize && (
            <select
              value={currentDatasetSize}
              onChange={(e) => onSelectDatasetSize(parseInt(e.target.value, 10))}
              aria-label="Taille du vivier vectoriel"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-300"
            >
              <option value={30}>30 CVs (Vivier réel)</option>
              <option value={45}>45 CVs (Seuil critique &lt; 50)</option>
              <option value={1200}>1 200 CVs (Normal)</option>
              <option value={10000}>10 000 CVs (Haute densité)</option>
              <option value={50000}>50 000 CVs (GPU Stress test)</option>
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            data-testid="btn-reset-view"
            className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Réinitialiser</span>
          </Button>
        </div>
      </div>

      {/* Ligne 2 : Couleur par + Filtre Dossier + Recherche compétence + Opacité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* 1. Couleur par */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Palette className="h-3 w-3 text-indigo-500" />
            <span>Couleur par</span>
          </label>
          <select
            value={filters.colorBy}
            onChange={(e) => onChange({ colorBy: e.target.value as ColorByOption })}
            data-testid="select-color-by"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
          >
            {COLOR_BY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Filtre Dossier */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Folder className="h-3 w-3 text-indigo-500" />
            <span>Dossier de recrutement</span>
          </label>
          <select
            value={filters.folderId}
            onChange={(e) => onChange({ folderId: e.target.value })}
            data-testid="select-filter-folder"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="all">Tous les dossiers</option>
            {mockFolders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.reference} - {f.title}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Recherche de compétence qui met en évidence les points */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3 text-indigo-500" />
              <span>Mettre en évidence une compétence</span>
            </span>
            {filters.searchSkill && (
              <button
                type="button"
                onClick={() => onChange({ searchSkill: '' })}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Effacer
              </button>
            )}
          </label>
          <div className="relative">
            <Input
              value={filters.searchSkill}
              onChange={(e) => onChange({ searchSkill: e.target.value })}
              placeholder="Ex: Python, Splunk, CISSP, AWS..."
              data-testid="input-search-skill"
              className="h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-7"
            />
            {filters.searchSkill && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </div>
        </div>

        {/* 4. Opacité & Expérience */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-indigo-500" />
              <span>Opacité des points</span>
            </span>
            <span className="font-mono">{Math.round(filters.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={filters.opacity}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
            data-testid="slider-opacity"
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>Exp. min : {filters.minExperience} ans</span>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={filters.minExperience}
              onChange={(e) => onChange({ minExperience: parseInt(e.target.value, 10) })}
              className="w-24 accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
