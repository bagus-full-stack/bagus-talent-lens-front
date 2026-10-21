'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCode,
  Plus,
  Search,
  Filter,
  Copy,
  Archive,
  ArrowUpDown,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreVertical,
  Loader2,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import type { Pattern } from '@/types';
import { duplicatePatternAction, archivePatternAction } from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';
import { NewPatternDialog } from './new-pattern-dialog';

interface PatternsListViewProps {
  initialPatterns: Pattern[];
}

export function PatternsListView({ initialPatterns }: PatternsListViewProps) {
  const router = useRouter();
  const [patterns, setPatterns] = useState<Pattern[]>(initialPatterns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc' | 'cv_desc'>('updated_desc');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtrage et tri des patterns
  const filteredPatterns = patterns
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'fr');
      if (sortBy === 'cv_desc') return b.extractedCvCount - a.extractedCvCount;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Calcul des métriques globales
  const totalCvs = patterns.reduce((acc, p) => acc + p.extractedCvCount, 0);
  const totalPiiFields = patterns.reduce((acc, p) => acc + p.piiFieldsCount, 0);
  const avgAccuracy =
    patterns.length > 0
      ? (patterns.reduce((acc, p) => acc + p.matchingAccuracy, 0) / patterns.length).toFixed(1)
      : '95.0';

  // Action : Dupliquer
  const handleDuplicate = (pattern: Pattern) => {
    setActionPendingId(pattern.id);
    startTransition(async () => {
      const res = await duplicatePatternAction(pattern.id);
      setActionPendingId(null);
      if (res.success && res.pattern) {
        toast.success(
          'Pattern dupliqué',
          `Le pattern « ${res.pattern.name} » a été créé avec succès en version brouillon.`,
        );
        setPatterns((prev) => [res.pattern!, ...prev]);
        router.refresh();
      } else {
        toast.error('Erreur', res.error || 'Impossible de dupliquer le pattern.');
      }
    });
  };

  // Action : Archiver
  const handleArchive = (pattern: Pattern) => {
    if (!confirm(`Voulez-vous vraiment archiver le pattern « ${pattern.name} » ?`)) {
      return;
    }
    setActionPendingId(pattern.id);
    startTransition(async () => {
      const res = await archivePatternAction(pattern.id);
      setActionPendingId(null);
      if (res.success && res.pattern) {
        toast.success(
          'Pattern archivé',
          `Le pattern « ${pattern.name} » est maintenant archivé et retiré des ingestions actives.`,
        );
        setPatterns((prev) =>
          prev.map((p) => (p.id === pattern.id ? { ...p, status: 'archived' } : p)),
        );
        router.refresh();
      } else {
        toast.error('Erreur', res.error || "Impossible d'archiver le pattern.");
      }
    });
  };

  // Formatage de date en français
  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête et KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Patterns d'extraction sémantique
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez vos schémas d'extraction JSON Schema, définissez les champs PII et protégez les données sensibles à la source.
          </p>
        </div>

        <button
          onClick={() => setIsNewDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau pattern</span>
        </button>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Patterns configurés</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{patterns.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">CV extraits au total</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalCvs.toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Champs PII sous contrôle</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalPiiFields}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Précision IA moyenne</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{avgAccuracy}%</div>
          </div>
        </div>
      </div>

      {/* Barre d'outils et recherche */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Champ de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, métier ou description..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
          />
        </div>

        {/* Filtres & Tri */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tous domaines</option>
            <option value="Tech">Tech & Ingénierie</option>
            <option value="Commercial">Commercial</option>
            <option value="Management">Management</option>
            <option value="Support">Support Client</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Statut */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="updated_desc">Dernière modification</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="cv_desc">Plus de CV extraits</option>
          </select>
        </div>
      </div>

      {/* Liste des patterns sous forme de tableau interactif */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredPatterns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <FileCode className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Aucun pattern trouvé</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Aucun pattern d'extraction ne correspond à vos critères de recherche ou de filtre.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4">Pattern & Domaine</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Champs & PII</th>
                  <th className="py-3 px-4">CV extraits</th>
                  <th className="py-3 px-4">Précision IA</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Dernière modif.</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredPatterns.map((pattern) => {
                  const isActionBusy = actionPendingId === pattern.id;

                  return (
                    <tr
                      key={pattern.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Nom & description */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mt-0.5 shrink-0">
                            <FileCode className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/patterns/${pattern.id}`}
                                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                {pattern.name}
                              </Link>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {pattern.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-md">
                              {pattern.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Version courante */}
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {pattern.activeVersion}
                        </span>
                      </td>

                      {/* Champs & PII */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {pattern.totalFields} champs
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                            <Shield className="h-3 w-3" />
                            {pattern.piiFieldsCount} PII
                          </span>
                        </div>
                      </td>

                      {/* CV extraits */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {pattern.extractedCvCount > 0 ? (
                          <span>{pattern.extractedCvCount.toLocaleString('fr-FR')} CV</span>
                        ) : (
                          <span className="text-slate-400 italic">0 CV</span>
                        )}
                      </td>

                      {/* Précision IA */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {pattern.matchingAccuracy}%
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${pattern.matchingAccuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-4 px-4">
                        {pattern.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Actif
                          </span>
                        )}
                        {pattern.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="h-3 w-3" />
                            Brouillon
                          </span>
                        )}
                        {pattern.status === 'archived' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Archive className="h-3 w-3" />
                            Archivé
                          </span>
                        )}
                      </td>

                      {/* Dernière modification */}
                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(pattern.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/patterns/${pattern.id}`}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Ouvrir l'éditeur de schéma"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => handleDuplicate(pattern)}
                            disabled={isActionBusy}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            title="Dupliquer ce pattern"
                          >
                            {isActionBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          {pattern.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(pattern)}
                              disabled={isActionBusy}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                              title="Archiver ce pattern"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale de création de pattern */}
      <NewPatternDialog isOpen={isNewDialogOpen} onClose={() => setIsNewDialogOpen(false)} />
    </div>
  );
}
