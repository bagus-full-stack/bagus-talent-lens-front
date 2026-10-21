'use client';

import React, { useRef, useEffect } from 'react';
import type {
  VerificationItem,
  VerificationFilter,
  VerificationMotif,
} from '@/lib/schemas/verification';
import {
  Search,
  Filter,
  AlertTriangle,
  FileQuestion,
  FileX,
  ShieldAlert,
  Copy,
  Calendar,
  FolderOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldBan,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VerificationLeftPaneProps {
  items: VerificationItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  filter: Partial<VerificationFilter>;
  onFilterChange: (newFilter: Partial<VerificationFilter>) => void;
  activeItemIndex: number;
}

export function VerificationLeftPane({
  items,
  selectedItemId,
  onSelectItem,
  filter,
  onFilterChange,
  activeItemIndex,
}: VerificationLeftPaneProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll automatique doux de l'élément sélectionné
  useEffect(() => {
    if (activeItemIndex >= 0 && itemRefs.current[activeItemIndex]) {
      itemRefs.current[activeItemIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeItemIndex]);

  const motifOptions: { value: VerificationMotif | 'all'; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'all', label: 'Tous les motifs', icon: Filter, color: 'text-slate-600' },
    { value: 'confiance_faible', label: 'Confiance faible', icon: AlertTriangle, color: 'text-amber-500' },
    { value: 'champ_manquant', label: 'Champ obligatoire manquant', icon: FileQuestion, color: 'text-orange-500' },
    { value: 'document_illisible', label: 'Document illisible', icon: FileX, color: 'text-purple-500' },
    { value: 'contenu_suspect', label: 'Contenu suspect', icon: ShieldAlert, color: 'text-rose-500' },
    { value: 'doublon_probable', label: 'Doublon probable', icon: Copy, color: 'text-indigo-500' },
  ];

  const getMotifBadge = (motif: VerificationMotif) => {
    switch (motif) {
      case 'contenu_suspect':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Contenu suspect
          </span>
        );
      case 'confiance_faible':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Confiance faible
          </span>
        );
      case 'champ_manquant':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
            <FileQuestion className="w-3 h-3 text-orange-600" />
            Champ manquant
          </span>
        );
      case 'document_illisible':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            <FileX className="w-3 h-3 text-purple-600" />
            Document illisible
          </span>
        );
      case 'doublon_probable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
            <Copy className="w-3 h-3 text-indigo-600" />
            Doublon probable
          </span>
        );
    }
  };

  const hasActiveFilters =
    filter.motif !== 'all' ||
    filter.folderId !== 'all' ||
    filter.status !== 'all' ||
    filter.dateRange !== 'all' ||
    (filter.search && filter.search.length > 0);

  const resetFilters = () => {
    onFilterChange({
      motif: 'all',
      folderId: 'all',
      status: 'all',
      dateRange: 'all',
      search: '',
    });
  };

  return (
    <aside
      className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
      aria-label="Volet de sélection des éléments à vérifier"
      role="region"
    >
      {/* Barre de recherche et filtres */}
      <div className="p-3.5 space-y-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Rechercher candidat, dossier, mot-clé..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            aria-label="Recherche textuelle dans les fiches à vérifier"
          />
        </div>

        {/* Ligne 1 : Motif */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Motif de vérification
          </label>
          <select
            value={filter.motif || 'all'}
            onChange={(e) => onFilterChange({ motif: e.target.value as any })}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            aria-label="Filtrer par motif"
          >
            {motifOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ligne 2 : Dossier & Date */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Dossier
            </label>
            <select
              value={filter.folderId || 'all'}
              onChange={(e) => onFilterChange({ folderId: e.target.value })}
              className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              aria-label="Filtrer par dossier"
            >
              <option value="all">Tous les dossiers</option>
              <option value="fld-de-2026">#DE-2026 (Data)</option>
              <option value="fld-cyb-88">#CYB-88 (SOC)</option>
              <option value="fld-full-12">#FULL-12 (Cloud)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Date d'import
            </label>
            <select
              value={filter.dateRange || 'all'}
              onChange={(e) => onFilterChange({ dateRange: e.target.value as any })}
              className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              aria-label="Filtrer par date"
            >
              <option value="all">Toutes dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="last_7_days">7 derniers jours</option>
              <option value="last_30_days">30 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Ligne 3 : Statut et réinitialisation */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500">Statut :</span>
            <button
              onClick={() => onFilterChange({ status: 'all' })}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                (filter.status || 'all') === 'all'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Tous
            </button>
            <button
              onClick={() => onFilterChange({ status: 'pending' })}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                filter.status === 'pending'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              À traiter
            </button>
            <button
              onClick={() => onFilterChange({ status: 'treated' })}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                filter.status === 'treated'
                  ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Traités
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Liste des cartes d'éléments à vérifier */}
      <div
        className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
        role="listbox"
        aria-label="Liste des profils candidats nécessitant une vérification"
        tabIndex={0}
      >
        {items.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-teal-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Aucun profil correspondant
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modifiez vos critères de filtrage ou consultez les profils déjà traités.
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = selectedItemId === item.id;
            const doubtfulPendingCount = item.doubtfulFields.filter((f) => f.status === 'pending').length;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelectItem(item.id)}
                className={cn(
                  'p-3.5 cursor-pointer transition-all border-l-4 outline-hidden select-none',
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-teal-950/40 border-l-teal-600 dark:border-l-teal-500 shadow-xs'
                    : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                      {item.pseudonym}
                    </span>
                    {item.status === 'treated' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        Traité
                      </span>
                    )}
                    {item.status === 'excluded' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                        <ShieldBan className="w-3 h-3 text-rose-600" />
                        Exclu
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        À traiter
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>

                {/* Motif badge */}
                <div className="mb-2">{getMotifBadge(item.motif)}</div>

                {/* Dossier de rattachement */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.folderReference}
                  </span>
                  <span className="truncate text-slate-400">· {item.folderTitle}</span>
                </div>

                {/* Résumé synthétique & champs douteux */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                  {item.summary}
                </p>

                {/* Indicateur de champs à vérifier */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">
                    {doubtfulPendingCount > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {doubtfulPendingCount} champ{doubtfulPendingCount > 1 ? 's' : ''} à confirmer
                      </span>
                    ) : (
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        Tous les champs validés
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">
                      J/K pour naviguer
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pied de volet avec compteur */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        Affichage de <span className="font-semibold text-slate-700 dark:text-slate-300">{items.length}</span> élément(s)
      </div>
    </aside>
  );
}
