'use client';

import React, { useState, useTransition } from 'react';
import {
  History,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Edit3,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PatternVersion, PatternField } from '@/types';
import { diffPatternFields, type PatternDiffResult } from '@/lib/schemas/pattern';
import { restorePatternVersionAction } from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';

interface VersionsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patternId: string;
  versions: PatternVersion[];
  currentFields: PatternField[];
  onRestore: (restoredFields: PatternField[], restoredVersion: PatternVersion) => void;
}

export function VersionsHistoryModal({
  isOpen,
  onClose,
  patternId,
  versions,
  currentFields,
  onRestore,
}: VersionsHistoryModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || '',
  );
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];

  // Calcul du diff entre la version historique sélectionnée et les champs actuels de l'éditeur
  const diffResult: PatternDiffResult | null = selectedVersion
    ? diffPatternFields(selectedVersion.fields, currentFields)
    : null;

  const handleRestore = (version: PatternVersion) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir restaurer les champs de la version ${version.version} ? Vos modifications non enregistrées seront remplacées.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await restorePatternVersionAction(patternId, version.version);
      if (res.success && res.version) {
        toast.success(
          'Version restaurée',
          `Les ${version.fields.length} champs de la version ${version.version} ont été chargés dans l'éditeur.`,
        );
        onRestore(version.fields, res.version);
        onClose();
      } else {
        toast.error('Erreur', res.error || 'Impossible de restaurer la version.');
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Historique des versions & Comparaison (Diff)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consultez les évolutions du schéma, comparez les différences et restaurez une version antérieure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps avec 2 colonnes : Liste des versions à gauche, Diff et détails à droite */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Colonne gauche : liste des versions */}
          <div className="md:col-span-5 p-4 space-y-2 overflow-y-auto max-h-[60vh]">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              Versions publiées & brouillons ({versions.length})
            </h3>

            {versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;

              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => setSelectedVersionId(ver.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ver.version}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ver.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : ver.status === 'draft'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ver.status === 'active'
                        ? 'Actif'
                        : ver.status === 'draft'
                          ? 'Brouillon'
                          : 'Archivé'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-1.5">
                    {ver.changelog || 'Pas de note de version enregistrée.'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{ver.fields.length} champs</span>
                    <span>{formatDate(ver.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Colonne droite : Diff et Restauration */}
          <div className="md:col-span-7 p-6 space-y-5 overflow-y-auto max-h-[60vh]">
            {selectedVersion && (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                        Version {selectedVersion.version}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({selectedVersion.fields.length} champs configurés)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Créée le {formatDate(selectedVersion.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors shrink-0"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Restaurer cette version</span>
                  </button>
                </div>

                {/* Note de version */}
                {selectedVersion.changelog && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                    <strong className="font-semibold block mb-0.5 text-slate-900 dark:text-slate-100">
                      Journal des modifications (Changelog) :
                    </strong>
                    {selectedVersion.changelog}
                  </div>
                )}

                {/* Affichage du Diff vs Éditeur en cours */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Différences par rapport à l'état actuel</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Comparaison champ par champ
                    </span>
                  </h4>

                  {diffResult && (
                    <div className="space-y-3">
                      {/* Aucun changement */}
                      {diffResult.added.length === 0 &&
                        diffResult.removed.length === 0 &&
                        diffResult.modified.length === 0 && (
                          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                            Aucune différence structurelle : les champs de cette version sont identiques à ceux de votre éditeur.
                          </div>
                        )}

                      {/* Champs ajoutés dans l'éditeur actuel */}
                      {diffResult.added.length > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            <PlusCircle className="h-4 w-4" />
                            <span>Champs absents de la v{selectedVersion.version} (nouveaux) :</span>
                          </div>
                          <ul className="text-xs text-emerald-700 dark:text-emerald-400 pl-5 list-disc space-y-0.5">
                            {diffResult.added.map((f) => (
                              <li key={f.key}>
                                <strong>{f.label}</strong> ({f.key}) - {f.type} {f.isPii ? '• [PII]' : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Champs retirés dans l'éditeur actuel */}
                      {diffResult.removed.length > 0 && (
                        <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                            <MinusCircle className="h-4 w-4" />
                            <span>Champs présents dans la v{selectedVersion.version} mais absents aujourd'hui :</span>
                          </div>
                          <ul className="text-xs text-rose-700 dark:text-rose-400 pl-5 list-disc space-y-0.5">
                            {diffResult.removed.map((f) => (
                              <li key={f.key}>
                                <strong>{f.label}</strong> ({f.key}) - {f.type}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Champs modifiés */}
                      {diffResult.modified.length > 0 && (
                        <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                            <Edit3 className="h-4 w-4" />
                            <span>Champs aux propriétés modifiées :</span>
                          </div>
                          <div className="space-y-1.5 pl-2">
                            {diffResult.modified.map((mod) => (
                              <div key={mod.key} className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-indigo-100 dark:border-indigo-900/40">
                                <span className="font-semibold text-indigo-700 dark:text-indigo-300">{mod.label}</span> ({mod.key}) :
                                <div className="pl-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 mt-0.5">
                                  {mod.changes.map((c, i) => (
                                    <div key={i}>
                                      • <span className="font-medium">{c.property}</span> : <span className="line-through text-rose-500">{String(c.from)}</span> → <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{String(c.to)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            Fermer l'historique
          </button>
        </div>
      </div>
    </div>
  );
}
