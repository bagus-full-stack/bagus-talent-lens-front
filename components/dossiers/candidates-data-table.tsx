'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  EyeOff,
  User,
  CheckCircle2,
  Bookmark,
  Download,
  Trash2,
  FileText,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { CvDocumentBlindDto, CvDocumentFullDto, CvDocumentDto } from '@/types';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/shared/form-and-toast';
import { bulkCandidateAction } from '@/app/(app)/dossiers/actions';

interface CandidatesDataTableProps {
  folderId: string;
  candidates: CvDocumentDto[];
  isBlindMode: boolean;
}

export function CandidatesDataTable({
  folderId,
  candidates,
  isBlindMode,
}: CandidatesDataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBulkAction = (
    actionType: 'shortlist' | 'export' | 'delete',
    selectedRows: CvDocumentDto[],
    resetSelection: () => void,
  ) => {
    const ids = selectedRows.map((r) => r.id);
    startTransition(async () => {
      try {
        const res = await bulkCandidateAction(folderId, ids, actionType);
        if (!res.success) {
          toast.error('Erreur', res.error || 'Action impossible.');
          return;
        }
        toast.success('Succès', res.message || 'Action exécutée avec succès.');
        resetSelection();
        router.refresh();
      } catch {
        toast.error('Erreur système', "Échec de l'exécution de l'action groupée.");
      }
    });
  };

  const columns = useMemo<ColumnDef<CvDocumentDto>[]>(() => {
    return [
      // 1. Colonne de sélection multiple
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            aria-label="Sélectionner tous les profils de la page"
            className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            aria-label={`Sélectionner le candidat ${row.original.id}`}
            className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },

      // 2. Colonne Identifiant ou Nom selon le DTO reçu (Blind ou Full)
      {
        id: 'identity',
        header: 'Identité / Pseudonyme',
        accessorFn: (row) => {
          if (!row.isAnonymized) {
            const full = row as CvDocumentFullDto;
            return `${full.firstName} ${full.lastName} ${full.email}`;
          }
          return row.pseudonym;
        },
        cell: ({ row }) => {
          const item = row.original;
          const isFull = !item.isAnonymized;
          const fullItem = item as CvDocumentFullDto;

          return (
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                  isFull
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {isFull ? (
                  <User className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </div>

              <Link
                href={`/cv/${item.id}`}
                className="group/link block hover:opacity-80 transition-opacity"
              >
                {isFull ? (
                  <>
                    <span className="font-bold text-slate-900 group-hover/link:text-indigo-600 dark:text-slate-100 dark:group-hover/link:text-indigo-400 block">
                      {fullItem.firstName} {fullItem.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {fullItem.email}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-indigo-600 group-hover/link:underline dark:text-indigo-400 block font-mono">
                      {item.pseudonym}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">
                      Anonymisé (Anti-biais)
                    </span>
                  </>
                )}
              </Link>
            </div>
          );
        },
      },

      // 3. Colonne « Restreint » (Opposition RGPD)
      {
        id: 'restricted',
        header: 'Restreint',
        cell: ({ row }) => {
          const status = row.original.rgpdStatus;

          if (status === 'dsr_requested') {
            return (
              <div
                className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-help"
                title="Opposition RGPD (Art. 21) active : traitement restreint. Ce profil ne peut être exporté ni partagé à des tiers."
                role="status"
                aria-label="Opposition RGPD active"
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Opposition</span>
              </div>
            );
          }

          if (status === 'retention_warning') {
            return (
              <div
                className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-help"
                title="Avertissement de rétention : ce profil approche de la limite légale CNIL de 24 mois."
                role="status"
                aria-label="Rétention limite"
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Rétention</span>
              </div>
            );
          }

          return (
            <div
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] cursor-help"
              title="Conformité RGPD valide : profil conservé sous base légale légitime."
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Conforme</span>
            </div>
          );
        },
      },

      // 4. Colonne Titre du poste
      {
        accessorKey: 'currentTitle',
        header: 'Titre & Spécialité',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
              {row.original.currentTitle}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {row.original.seniorityLevel}
            </span>
          </div>
        ),
      },

      // 5. Colonne Expérience
      {
        accessorKey: 'yearsExperience',
        header: 'Expérience',
        cell: ({ row }) => (
          <div className="font-mono text-slate-700 dark:text-slate-300">
            <span className="font-bold">{row.original.yearsExperience}</span> ans
          </div>
        ),
      },

      // 6. Colonne Localisation
      {
        accessorKey: 'location',
        header: 'Localisation',
        cell: ({ row }) => (
          <span className="text-slate-600 dark:text-slate-400 truncate max-w-36 block text-xs">
            {row.original.location}
          </span>
        ),
      },

      // 7. Colonne Compétences en badges
      {
        id: 'skills',
        header: 'Compétences clés',
        cell: ({ row }) => {
          const skills = row.original.skills || [];
          const visible = skills.slice(0, 3);
          const remaining = skills.length - visible.length;

          return (
            <div className="flex flex-wrap items-center gap-1 max-w-xs">
              {visible.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {sk}
                </span>
              ))}
              {remaining > 0 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  +{remaining}
                </span>
              )}
            </div>
          );
        },
      },

      // 8. Colonne Statut d'extraction & Qualité
      {
        id: 'extractionStatus',
        header: 'Statut extraction',
        cell: ({ row }) => {
          const anomalies = row.original.anomalies || [];
          const score = row.original.aiMatchScore;

          if (anomalies.length > 0) {
            return (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{anomalies.length} anomalie(s)</span>
              </Badge>
            );
          }

          return (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Score {score}%</span>
            </Badge>
          );
        },
      },

      // 9. Colonne Date d'importation
      {
        accessorKey: 'createdAt',
        header: 'Date d’ajout',
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <span className="font-mono text-[11px] text-slate-500">
              {d.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          );
        },
      },
    ];
  }, []);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={candidates}
        getRowId={(row) => row.id}
        searchPlaceholder="Filtrer les candidats (pseudonyme, titre, compétences)..."
        pageSize={10}
        emptyTitle="Aucun CV dans ce dossier"
        emptyMessage="Importez des CVs au format PDF pour alimenter le vivier sous anonymisation anti-biais."
        renderBulkActions={(selectedRows, resetSelection) => (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                {selectedRows.length}
              </span>
              <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                profil(s) sélectionné(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleBulkAction('shortlist', selectedRows, resetSelection)}
                className="h-8 gap-1.5 text-xs bg-white dark:bg-slate-900"
              >
                <Bookmark className="h-3.5 w-3.5 text-indigo-600" />
                <span>Ajouter à la shortlist</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleBulkAction('export', selectedRows, resetSelection)}
                className="h-8 gap-1.5 text-xs bg-white dark:bg-slate-900"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Exporter {isBlindMode ? '(Anonymisé)' : '(Nominatif)'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleBulkAction('delete', selectedRows, resetSelection)}
                className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer</span>
              </Button>

              {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
            </div>
          </div>
        )}
      />
    </div>
  );
}
