'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Users,
  Shield,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  SearchX,
} from 'lucide-react';
import type { Folder } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';

interface FoldersListViewProps {
  folders: Folder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  view: 'grid' | 'table';
  allFoldersCount: number;
}

export function FoldersListView({
  folders,
  totalCount,
  currentPage,
  pageSize,
  view,
  allFoldersCount,
}: FoldersListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPage = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push(pathname);
  };

  // État vide
  if (folders.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-400">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
          Aucun dossier ne correspond à votre recherche
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Modifiez vos filtres de recherche ou réinitialisez-les pour afficher l’ensemble des {allFoldersCount} dossiers de recrutement.
        </p>
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-xs"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Affichage en GRILLE */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((fld) => (
            <Card
              key={fld.id}
              className="flex flex-col justify-between p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md group"
            >
              <div>
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold group-hover:scale-105 transition-transform shrink-0">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {fld.reference}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {fld.title}
                      </h3>
                    </div>
                  </div>
                  <BlindBadge isActive={fld.blindModeEnabled} compact />
                </div>

                {/* Métadonnées de l'offre */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{fld.jobTitle}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{fld.location}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {fld.contractType}
                    </Badge>
                  </div>
                </div>

                {/* Statistiques candidatures */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Vivier</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fld.totalCandidates} CVs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Qualifiés</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {fld.qualifiedCandidates} profils
                    </span>
                  </div>
                </div>
              </div>

              {/* Pied de carte : Membres & Lien d'accès */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden" title="Membres assignés">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    IO
                  </div>
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    ML
                  </div>
                </div>

                <Link href={`/dossiers/${fld.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 dark:group-hover:bg-indigo-950/40"
                  >
                    <span>Ouvrir</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* 2. Affichage en TABLEAU */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dossier & Référence</th>
                  <th className="py-3 px-4">Offre & Type</th>
                  <th className="py-3 px-4">Mode Aveugle</th>
                  <th className="py-3 px-4">Candidatures (CV)</th>
                  <th className="py-3 px-4">Localisation</th>
                  <th className="py-3 px-4">Équipe</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {folders.map((fld) => (
                  <tr
                    key={fld.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold shrink-0">
                          <FolderOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            href={`/dossiers/${fld.id}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block"
                          >
                            {fld.title}
                          </Link>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            {fld.reference}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                        {fld.jobTitle}
                      </span>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {fld.contractType}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <BlindBadge isActive={fld.blindModeEnabled} compact />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums block">
                          {fld.totalCandidates} CVs
                        </span>
                        <span className="text-emerald-600 font-semibold block text-[10px]">
                          {fld.qualifiedCandidates} qualifiés
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span>{fld.location}</span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        {fld.remotePolicy.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                          IO
                        </div>
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                          ML
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/dossiers/${fld.id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                          <span>Accéder</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination serveur (paramètres d'URL) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3">
        <p className="text-xs text-slate-500">
          Affichage de <span className="font-semibold text-slate-700 dark:text-slate-300">
            {folders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          à{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {Math.min(currentPage * pageSize, totalCount)}
          </span>{' '}
          sur <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> dossiers
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Précédent</span>
          </Button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className={`h-8 w-8 text-xs p-0 ${
                  currentPage === pageNum ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''
                }`}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <span>Suivant</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
