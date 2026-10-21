'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Plus,
  FileSpreadsheet,
  Users,
  Shield,
  Download,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { Can } from '@/components/shared/can';
import { useAuth } from '@/lib/auth/auth-context';
import { mockShortlists } from '@/lib/mock/data/shortlists';
import { mockFolders } from '@/lib/mock/data/folders';
import { ExportWizardModal } from '@/components/export/export-wizard-modal';

export default function ShortlistsPage() {
  const { role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [selectedShortlist, setSelectedShortlist] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
                <Bookmark className="h-4 w-4" />
                <span>Sélections Partagées & Dossiers Clients</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Shortlists de présélection
                </h1>
                <Badge variant="secondary" className="font-mono">
                  {mockShortlists.length} actives
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gérez vos sélections ciblées de candidats par poste, organisez les profils par pertinence et exportez des dossiers de présentation anonymisés conformes RGPD.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Le Lecteur / Reader ne voit aucun bouton d'export */}
              <Can action="export.anonymized">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export consolidé</span>
                </Button>
              </Can>

              <Can action="shortlist.write">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle shortlist</span>
                </Button>
              </Can>
            </div>
          </div>

          {/* Rappel de conformité légale */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Rappel de conformité légale et éthique :</strong> Le partage avec des commanditaires externes ou clients finaux s'effectue exclusivement par export PDF/CSV cryptographiquement anonymisé.
              </span>
            </div>
          </div>

          {/* Cartes des shortlists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockShortlists.map((sl) => (
              <Card key={sl.id} className="p-5 space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {sl.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Offre : {sl.folderReference}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Partagée avec l'équipe
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {sl.candidateCount} profils
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <BlindModeBadge compact />
                  <span className="text-[11px] text-slate-500">
                    Créée par {sl.createdByName}
                  </span>
                </div>

                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/50 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Top profils présélectionnés
                  </div>
                  <div className="space-y-1 text-xs">
                    {sl.candidateIds.slice(0, 3).map((cid, i) => (
                      <div key={cid} className="flex justify-between items-center py-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-600 font-bold">#{i + 1}</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            Candidat #{cid.replace('cand-', '').toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-emerald-600">
                          {94 - i * 3}% match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boutons d'export et génération : masqués pour le lecteur */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Can action="export.anonymized">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedShortlist(sl);
                        setWizardOpen(true);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export anonymisé</span>
                    </Button>
                  </Can>

                  <Can action="export.anonymized">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedShortlist(sl);
                        setWizardOpen(true);
                      }}
                      className="h-8 text-xs gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Générer dossier client</span>
                    </Button>
                  </Can>
                </div>
              </Card>
            ))}
          </div>

      {/* Assistant d'export connecté */}
      <ExportWizardModal
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setSelectedShortlist(null);
        }}
        contextTitle={selectedShortlist ? `Dossier Client - ${selectedShortlist.title}` : undefined}
        folderId={selectedShortlist?.folderId || 'fld-de-2026'}
        folderReference={selectedShortlist?.folderReference || '#DE-2026'}
        shortlistId={selectedShortlist?.id}
        candidateIds={selectedShortlist?.candidateIds}
        defaultCandidateCount={selectedShortlist?.candidateCount || 12}
      />
    </div>
  );
}
