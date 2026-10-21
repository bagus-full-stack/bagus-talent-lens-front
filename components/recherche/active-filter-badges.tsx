'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockFolders } from '@/lib/mock/data/folders';
import type { SearchFilters } from '@/lib/search/search-params';

interface ActiveFilterBadgesProps {
  filters: SearchFilters;
  onChangeFilters: (next: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
}

export function ActiveFilterBadges({
  filters,
  onChangeFilters,
  onResetFilters,
}: ActiveFilterBadgesProps) {
  const badges: { label: string; onRemove: () => void }[] = [];

  if (filters.folderId && filters.folderId !== 'all') {
    const folder = mockFolders.find((f) => f.id === filters.folderId);
    badges.push({
      label: `Dossier: ${folder ? folder.reference : filters.folderId}`,
      onRemove: () => onChangeFilters({ folderId: 'all', cursor: 1 }),
    });
  }

  if (filters.minExperience > 0) {
    badges.push({
      label: `Expérience ≥ ${filters.minExperience} ans`,
      onRemove: () => onChangeFilters({ minExperience: 0, cursor: 1 }),
    });
  }

  if (filters.maxExperience < 15) {
    badges.push({
      label: `Expérience ≤ ${filters.maxExperience} ans`,
      onRemove: () => onChangeFilters({ maxExperience: 15, cursor: 1 }),
    });
  }

  filters.contractTypes.forEach((c) => {
    badges.push({
      label: `Contrat: ${c.toUpperCase()}`,
      onRemove: () =>
        onChangeFilters({
          contractTypes: filters.contractTypes.filter((ct) => ct !== c),
          cursor: 1,
        }),
    });
  });

  if (filters.location.trim()) {
    badges.push({
      label: `Lieu: ${filters.location} (+${filters.radius}km)`,
      onRemove: () => onChangeFilters({ location: '', cursor: 1 }),
    });
  }

  if (filters.availability && filters.availability !== 'all') {
    const availMap: Record<string, string> = {
      immediate: 'Immédiate',
      '1_month': '< 1 mois',
      '3_months': '< 3 mois',
      negotiable: 'Négociable',
    };
    badges.push({
      label: `Dispo: ${availMap[filters.availability] || filters.availability}`,
      onRemove: () => onChangeFilters({ availability: 'all', cursor: 1 }),
    });
  }

  filters.languages.forEach((l) => {
    badges.push({
      label: `Langue: ${l.toUpperCase()}`,
      onRemove: () =>
        onChangeFilters({
          languages: filters.languages.filter((lang) => lang !== l),
          cursor: 1,
        }),
    });
  });

  if (filters.educationLevel && filters.educationLevel !== 'all') {
    const eduMap: Record<string, string> = {
      bac5: 'Bac+5 / Ingénieur',
      bac3: 'Bac+3 / Licence',
      doctorat: 'Doctorat',
      autodidacte: 'Autodidacte',
    };
    badges.push({
      label: `Études: ${eduMap[filters.educationLevel] || filters.educationLevel}`,
      onRemove: () => onChangeFilters({ educationLevel: 'all', cursor: 1 }),
    });
  }

  filters.skills.forEach((s) => {
    badges.push({
      label: `Compétence: ${s}`,
      onRemove: () =>
        onChangeFilters({
          skills: filters.skills.filter((sk) => sk !== s),
          cursor: 1,
        }),
    });
  });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
        Filtres actifs ({badges.length}) :
      </span>

      {badges.map((b, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 shadow-2xs"
        >
          <span>{b.label}</span>
          <button
            type="button"
            onClick={b.onRemove}
            className="text-indigo-600 hover:text-indigo-950 dark:text-indigo-300 dark:hover:text-white"
            aria-label={`Supprimer le filtre ${b.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetFilters}
        className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1"
      >
        <RotateCcw className="w-2.5 h-2.5" />
        <span>Tout effacer</span>
      </Button>
    </div>
  );
}
