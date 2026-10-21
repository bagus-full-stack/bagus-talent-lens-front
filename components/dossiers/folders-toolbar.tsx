'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Plus,
  EyeOff,
  FolderOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/can';
import { NewFolderDialog } from './new-folder-dialog';

interface FoldersToolbarProps {
  initialSearch?: string;
  initialBlindFilter?: string;
  initialJobFilter?: string;
  initialSort?: string;
  initialView?: 'grid' | 'table';
  jobOptions: string[];
}

export function FoldersToolbar({
  initialSearch = '',
  initialBlindFilter = 'all',
  initialJobFilter = 'all',
  initialSort = 'created_desc',
  initialView = 'grid',
  jobOptions,
}: FoldersToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>(initialView);

  // Mise à jour de l'URL avec les paramètres de filtrage et réinitialisation de la page à 1
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    if (!('page' in updates)) {
      params.set('page', '1');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchTerm.trim() || null });
  };

  const handleViewToggle = (newView: 'grid' | 'table') => {
    setView(newView);
    // Persistance dans cookie côté client pour les requêtes futures
    if (typeof document !== 'undefined') {
      document.cookie = `tl_folders_view=${newView}; path=/; max-age=31536000`;
    }
    updateParams({ view: newView });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* En-tête et bouton d'action principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Espace de recrutement</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">Dossiers</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Dossiers de recrutement
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gérez vos campagnes, viviers de CV et pipelines sous anonymisation anti-biais et contrôle RGPD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Can action="settings.write">
              <Button
                onClick={() => setIsNewFolderOpen(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau dossier</span>
              </Button>
            </Can>
          </div>
        </div>

        {/* Barre de recherche, filtres et bascule grille/tableau */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Formulaire de recherche */}
            <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher par titre, référence (#DE-2026), poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => updateParams({ search: searchTerm.trim() || null })}
                className="pl-9 text-xs"
              />
            </form>

            {/* Filtres et tris */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
              {/* Filtre Mode Aveugle */}
              <select
                value={initialBlindFilter}
                onChange={(e) => updateParams({ blind: e.target.value })}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                aria-label="Filtrer par mode aveugle"
              >
                <option value="all">Mode aveugle : Tous</option>
                <option value="active">Mode aveugle : Actif uniquement</option>
                <option value="inactive">Mode aveugle : Inactif</option>
              </select>

              {/* Filtre par Offre / Poste */}
              <select
                value={initialJobFilter}
                onChange={(e) => updateParams({ job: e.target.value })}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                aria-label="Filtrer par offre liée"
              >
                <option value="all">Toutes les offres associées</option>
                {jobOptions.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>

              {/* Tri */}
              <select
                value={initialSort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                aria-label="Trier les dossiers"
              >
                <option value="created_desc">Plus récents en premier</option>
                <option value="title_asc">Titre (A → Z)</option>
                <option value="title_desc">Titre (Z → A)</option>
                <option value="candidates_desc">Nombre de CVs (décroissant)</option>
              </select>

              {/* Bascule Grille / Tableau (persistée) */}
              <div
                className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800"
                role="group"
                aria-label="Bascule d'affichage"
              >
                <button
                  type="button"
                  onClick={() => handleViewToggle('grid')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    view === 'grid'
                      ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                  aria-pressed={view === 'grid'}
                  title="Affichage en grille"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grille</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewToggle('table')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    view === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                  aria-pressed={view === 'table'}
                  title="Affichage en tableau"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tableau</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boîte de dialogue de création */}
      <NewFolderDialog
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
      />
    </>
  );
}
