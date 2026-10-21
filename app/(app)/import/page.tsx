import React from 'react';
import Link from 'next/link';
import { UploadCloud, ChevronRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { getServerCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions';
import { ImportFlow } from '@/components/import/import-flow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImportPageProps {
  searchParams: Promise<{
    folder?: string;
  }>;
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const { folder } = await searchParams;
  const user = await getServerCurrentUser();

  // Contrôle de permission côté serveur
  const isAllowed = can(user, 'import');

  if (!isAllowed) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <Card className="p-8 text-center border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Permission refusée [403]
          </h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Votre rôle actuel (<span className="font-semibold uppercase">{user?.role || 'visiteur'}</span>) ne dispose pas de l'habilitation nécessaire pour importer des CVs ou ingérer des fichiers dans le vivier.
          </p>
          <div className="mt-6">
            <Link href="/dossiers">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Retour aux dossiers</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Fil d'ariane et Titre */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dossiers" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Espace de recrutement
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            Import de CV & Ingestion
          </span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold shrink-0">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Import & Ingestion Souveraine de CV
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Téléversement direct vers Supabase Storage, orchestration IA anti-biais et suivi en temps réel.
            </p>
          </div>
        </div>
      </div>

      {/* Parcours d'importation complet */}
      <ImportFlow initialFolderId={folder} />
    </div>
  );
}
