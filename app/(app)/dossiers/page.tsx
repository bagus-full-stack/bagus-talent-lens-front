import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { getFolderRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { FoldersToolbar } from '@/components/dossiers/folders-toolbar';
import { FoldersListView } from '@/components/dossiers/folders-list-view';

interface DossiersPageProps {
  searchParams: Promise<{
    search?: string;
    blind?: string;
    job?: string;
    sort?: string;
    page?: string;
    limit?: string;
    view?: string;
  }>;
}

export default async function DossiersPage({ searchParams }: DossiersPageProps) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();

  const search = resolvedParams.search || '';
  const blindFilter = resolvedParams.blind || 'all';
  const jobFilter = resolvedParams.job || 'all';
  const sort = resolvedParams.sort || 'created_desc';
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const limit = Math.max(1, parseInt(resolvedParams.limit || '6', 10));

  // Récupération de la vue persistée depuis l'URL ou le cookie client
  const savedViewCookie = cookieStore.get('tl_folders_view')?.value as 'grid' | 'table' | undefined;
  const view = (resolvedParams.view as 'grid' | 'table') || savedViewCookie || 'grid';

  const folderRepo = getFolderRepository();
  const allFolders = await folderRepo.getAll(mockOrganization.id);

  // Options pour le menu déroulant des offres
  const jobOptions = Array.from(new Set(allFolders.map((f) => f.jobTitle))).filter(Boolean);

  // Filtrage côté serveur
  let filtered = allFolders.filter((f) => {
    // 1. Recherche plein texte
    if (search) {
      const q = search.toLowerCase();
      const match =
        f.title.toLowerCase().includes(q) ||
        f.reference.toLowerCase().includes(q) ||
        f.jobTitle.toLowerCase().includes(q) ||
        (f.department && f.department.toLowerCase().includes(q)) ||
        f.location.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Filtre Mode Aveugle
    if (blindFilter === 'active' && !f.blindModeEnabled) return false;
    if (blindFilter === 'inactive' && f.blindModeEnabled) return false;

    // 3. Filtre Offre
    if (jobFilter !== 'all' && f.jobTitle !== jobFilter) return false;

    return true;
  });

  // Tri côté serveur
  filtered.sort((a, b) => {
    switch (sort) {
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'candidates_desc':
        return b.totalCandidates - a.totalCandidates;
      case 'created_desc':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalCount = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginatedFolders = filtered.slice(startIndex, startIndex + limit);

  return (
    <div className="space-y-6">
      {/* Barre d'outils, filtres, recherche et création */}
      <FoldersToolbar
        initialSearch={search}
        initialBlindFilter={blindFilter}
        initialJobFilter={jobFilter}
        initialSort={sort}
        initialView={view}
        jobOptions={jobOptions}
      />

      {/* Liste des dossiers (Grille ou Tableau) avec pagination URL */}
      <FoldersListView
        folders={paginatedFolders}
        totalCount={totalCount}
        currentPage={page}
        pageSize={limit}
        view={view}
        allFoldersCount={allFolders.length}
      />

      {/* Bannière de conformité CNIL & purge automatique */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Gouvernance RGPD et conservation des viviers :</strong>
            <p className="mt-0.5 text-indigo-800 dark:text-indigo-300">
              Conformément à l'Article 5(1)(e) du RGPD et aux recommandations CNIL, les dossiers de recrutement et leurs candidatures associées sont automatiquement soumis à une politique de purge après 24 mois d'inactivité.
            </p>
          </div>
        </div>
        <Link href="/rgpd" className="text-xs font-bold text-indigo-700 hover:underline shrink-0 ml-4">
          Registre RGPD
        </Link>
      </div>
    </div>
  );
}
