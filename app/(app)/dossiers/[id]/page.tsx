import React from 'react';
import { notFound } from 'next/navigation';
import { ShieldCheck, EyeOff, UserCheck, AlertCircle } from 'lucide-react';
import { getFolderRepository, getCvRepository } from '@/lib/api';
import { CandidatesDataTable } from '@/components/dossiers/candidates-data-table';

interface DossierCvPageProps {
  params: Promise<{ id: string }>;
}

export default async function DossierCvPage({ params }: DossierCvPageProps) {
  const { id } = await params;

  const folderRepo = getFolderRepository();
  const folder = await folderRepo.getById(id);

  if (!folder) {
    notFound();
  }

  // Chargement côté serveur des candidats selon le statut du mode aveugle
  // Si blindModeEnabled === true : le serveur renvoie exclusivement des CvDocumentBlindDto (aucune PII)
  // Si blindModeEnabled === false : le serveur renvoie des CvDocumentFullDto (nominatifs)
  const cvRepo = getCvRepository();
  const candidates = await cvRepo.getByFolder(folder.id, folder.blindModeEnabled);

  return (
    <div className="space-y-4">
      {/* Bannière de rappel anti-biais ou traçabilité nominative */}
      {folder.blindModeEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
          <EyeOff className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Mode aveugle strict actif : </span>
            <span>
              Les identités, photos, coordonnées et adresses sont masquées côté serveur. Les évaluations de compétences, scores IA et expériences s’effectuent sans biais cognitif.
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200 flex items-start gap-3 shadow-2xs">
          <UserCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Mode nominatif actif (Accès démasqué) : </span>
            <span>
              Les données à caractère personnel sont consultables. Tout accès, téléchargement ou transfert fait l'objet d'un scellement cryptographique dans le journal d'audit WORM (Art. 30 RGPD).
            </span>
          </div>
        </div>
      )}

      {/* Tableau des candidatures avec sélection multiple et actions groupées */}
      <CandidatesDataTable
        folderId={folder.id}
        candidates={candidates}
        isBlindMode={folder.blindModeEnabled}
      />
    </div>
  );
}
