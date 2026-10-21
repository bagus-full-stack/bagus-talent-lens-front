import React from 'react';
import { notFound } from 'next/navigation';
import { Settings, Shield, Archive, AlertTriangle, Save } from 'lucide-react';
import { getFolderRepository } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ParametresTabProps {
  params: Promise<{ id: string }>;
}

export default async function ParametresTab({ params }: ParametresTabProps) {
  const { id } = await params;

  const folder = await getFolderRepository().getById(id);
  if (!folder) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          <span>Paramètres du dossier de recrutement</span>
        </h2>
        <p className="text-xs text-slate-500">
          Modifiez les informations administratives, la politique de conservation et le statut de cette campagne.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Informations générales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre du dossier
            </label>
            <Input defaultValue={folder.title} className="text-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Référence normalisée
            </label>
            <Input defaultValue={folder.reference} disabled className="text-xs font-mono bg-slate-50 dark:bg-slate-800" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Offre associée / Intitulé du poste
            </label>
            <Input defaultValue={folder.jobTitle} className="text-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Localisation
            </label>
            <Input defaultValue={folder.location} className="text-xs" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-9">
            <Save className="h-4 w-4" />
            <span>Enregistrer les modifications</span>
          </Button>
        </div>
      </Card>

      {/* Zone de Danger / Archivage */}
      <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0 mt-0.5">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                Archiver ce dossier de recrutement
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300/80 mt-1 max-w-xl">
                L'archivage fige les candidatures associées et déclenche le compte à rebours de rétention légale de 24 mois avant purge définitive des données personnelles.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 text-xs shrink-0">
            Archiver le dossier
          </Button>
        </div>
      </Card>
    </div>
  );
}
