import React from 'react';
import { notFound } from 'next/navigation';
import { Bookmark, Users, Share2, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { getFolderRepository, getShortlistRepository } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ShortlistsTabProps {
  params: Promise<{ id: string }>;
}

export default async function ShortlistsTab({ params }: ShortlistsTabProps) {
  const { id } = await params;

  const folder = await getFolderRepository().getById(id);
  if (!folder) notFound();

  const shortlistRepo = getShortlistRepository();
  const shortlists = await shortlistRepo.getByFolder(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-indigo-600" />
            <span>Shortlists et sélections client</span>
          </h2>
          <p className="text-xs text-slate-500">
            Listes restreintes de candidats prêtes à être partagées ou présentées aux managers recruteurs.
          </p>
        </div>

        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-9">
          <Plus className="h-4 w-4" />
          <span>Nouvelle shortlist</span>
        </Button>
      </div>

      {shortlists.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Bookmark className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            Aucune shortlist créée pour ce dossier
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Sélectionnez des candidats dans l'onglet « CV & Vivier » et cliquez sur « Ajouter à la shortlist » pour créer votre première sélection.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortlists.map((sh) => (
            <Card key={sh.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {sh.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Créée par {sh.createdByName}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {sh.candidateCount} candidats
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Profils retenus :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sh.candidateIds.map((cid, idx) => (
                      <span
                        key={cid}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-mono"
                      >
                        <span className="text-indigo-600 font-bold">#{idx + 1}</span>
                        <span>{cid}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {sh.isShared ? 'Partageable en lien sécurisé' : 'Privée'}
                </span>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                  <Share2 className="h-3.5 w-3.5 text-slate-600" />
                  <span>Partager</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
