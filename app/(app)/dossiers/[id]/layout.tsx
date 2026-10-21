import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FolderOpen,
  UploadCloud,
  Sparkles,
  Kanban,
  FileSpreadsheet,
  ChevronRight,
  Shield,
  Briefcase,
  MapPin,
  Layers,
} from 'lucide-react';
import { getFolderRepository } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindBadge } from '@/components/shared/blind-badge';
import { BlindModeToggle } from '@/components/dossiers/blind-mode-toggle';
import { FolderTabs } from '@/components/dossiers/folder-tabs';
import { ImportCvDialog } from '@/components/dashboard/import-cv-dialog';

interface DossierLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function DossierLayout({ children, params }: DossierLayoutProps) {
  const { id } = await params;
  const folderRepo = getFolderRepository();
  const folder = await folderRepo.getById(id);

  if (!folder) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* 1. Fil d'ariane & En-tête du dossier */}
      <div className="flex flex-col gap-4">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dossiers" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Dossiers
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            {folder.reference}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-xs sm:max-w-md">
            {folder.title}
          </span>
        </div>

        {/* Titre, Badges et Actions de tête */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {folder.title}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {folder.reference}
              </span>
              <Badge variant="outline" className="text-xs">
                {folder.contractType}
              </Badge>
              <Badge variant="secondary" className="capitalize text-xs">
                {folder.status === 'active' ? 'Campagne active' : folder.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>{folder.jobTitle}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{folder.location}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>Pattern : {folder.patternId}</span>
              </span>
            </div>
          </div>

          {/* Contrôle du mode aveugle et boutons d'action */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge de statut du mode aveugle */}
            <BlindBadge
              folder={folder.title}
              isActive={folder.blindModeEnabled}
              compact
            />

            {/* Interrupteur sécurisé de bascule du mode aveugle */}
            <BlindModeToggle
              folderId={folder.id}
              blindModeEnabled={folder.blindModeEnabled}
              folderTitle={folder.title}
              folderReference={folder.reference}
            />

            {/* Boutons d'action : Importer, Lancer un matching, Voir le pipeline */}
            <div className="flex items-center gap-2">
              <ImportCvDialog
                buttonText="Importer"
                variant="outline"
                folderId={folder.id}
              />

              <Link href={`/matching?folder=${folder.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>Lancer un matching</span>
                </Button>
              </Link>

              <Link href={`/dossiers/${folder.id}/pipeline`}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-9 shadow-sm">
                  <Kanban className="h-4 w-4" />
                  <span>Voir le pipeline</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onglets en routes imbriquées (CV, Pipeline, Shortlists, Membres, Paramètres) */}
      <FolderTabs
        folderId={folder.id}
        candidateCount={folder.totalCandidates}
      />

      {/* 3. Contenu de la route imbriquée */}
      <div>{children}</div>
    </div>
  );
}
