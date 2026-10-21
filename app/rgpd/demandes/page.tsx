'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  User,
  Lock,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { can, type PermissionUser } from '@/lib/permissions';
import { mockFolders } from '@/lib/mock/data/folders';
import {
  type DataSubjectRequest,
  type DsrType,
  type DsrStatus,
  DSR_TYPE_LABELS,
  DSR_STATUS_LABELS,
} from '@/lib/schemas/dsr';
import { NewDsrModal } from '@/components/rgpd/new-dsr-modal';

export default function DsrListPage() {
  const { user, role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);

  const permUser: PermissionUser = { id: user?.id || '', role };
  const hasAccess = can(permUser, 'rgpd.manage');

  const [dsrList, setDsrList] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Onglet sélectionné : Toutes / Ouvertes / En retard / Clôturées
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'overdue' | 'closed'>('open');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  const fetchDsrs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rgpd/demandes');
      if (res.ok) {
        const data = await res.json();
        setDsrList(data.dsrs || []);
      }
    } catch (err) {
      console.error('Erreur chargement DSR', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchDsrs();
    }
  }, [hasAccess]);

  // Si rôle non autorisé (recruteur, reader, etc.)
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />
        <div className="flex flex-1">
          <Sidebar currentRole={role} folderCount={mockFolders.length} />
          <main className="flex-1 p-6 max-w-4xl mx-auto flex items-center justify-center">
            <Card className="p-8 max-w-md text-center space-y-4 border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Accès Restreint au Registre DSR
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                L'accès à l'instruction des demandes d'exercice des droits (Articles 15 à 22 du RGPD) est strictement réservé aux rôles <strong>DPO</strong>, <strong>Administrateur</strong> et <strong>Owner</strong>.
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="text-xs mt-2">
                  Retour au tableau de bord
                </Button>
              </Link>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Filtrage selon l'onglet
  const filteredDsrs = dsrList.filter((dsr) => {
    const isOverdue = dsr.daysRemaining <= 0 && dsr.status !== 'fulfilled' && dsr.status !== 'rejected';
    const isOpen = dsr.status !== 'fulfilled' && dsr.status !== 'rejected';
    const isClosed = dsr.status === 'fulfilled' || dsr.status === 'rejected';

    let tabMatch = true;
    if (activeTab === 'open') tabMatch = isOpen;
    else if (activeTab === 'overdue') tabMatch = isOverdue;
    else if (activeTab === 'closed') tabMatch = isClosed;

    const matchesSearch =
      searchQuery.trim() === '' ||
      dsr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dsr.candidatePseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dsr.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dsr.folderReference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || dsr.requestType === typeFilter;

    return tabMatch && matchesSearch && matchesType;
  });

  // Métriques KPI
  const totalCount = dsrList.length;
  const openCount = dsrList.filter((d) => d.status !== 'fulfilled' && d.status !== 'rejected').length;
  const overdueCount = dsrList.filter(
    (d) => d.daysRemaining <= 0 && d.status !== 'fulfilled' && d.status !== 'rejected'
  ).length;
  const closedCount = dsrList.filter((d) => d.status === 'fulfilled' || d.status === 'rejected').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar blindMode={blindMode} onBlindModeToggle={() => setBlindMode(!blindMode)} />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Fil d'ariane & En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/rgpd" className="hover:text-indigo-600 transition-colors">
                  Gouvernance RGPD
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Demandes d'exercice des droits</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Registre des Demandes DSR (Art. 15-22 RGPD)
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {openCount} en cours
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
                Suivi immuable des demandes d'effacement, d'accès, de rectification et d'opposition avec compte à rebours légal CNIL strict de 30 jours et traçabilité WORM.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDsrs}
                disabled={loading}
                className="text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle demande</span>
              </Button>
            </div>
          </div>

          {/* 4 Indicateurs KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">Total des demandes enregistrées</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {totalCount}
              </div>
              <div className="text-[11px] text-slate-400">Registre d'exercice des droits</div>
            </Card>

            <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>En cours d'instruction</span>
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-600">
                {openCount}
              </div>
              <div className="text-[11px] text-slate-400">Sous délai légal de 30 jours</div>
            </Card>

            <Card
              className={`p-4 space-y-1 bg-white dark:bg-slate-900 ${
                overdueCount > 0
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="text-xs font-medium text-rose-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>En retard (Dépassement CNIL)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-600">
                {overdueCount}
              </div>
              <div className="text-[11px] text-rose-500 font-medium">
                {overdueCount > 0 ? 'Urgence légale critique' : 'Aucun retard constaté'}
              </div>
            </Card>

            <Card className="p-4 space-y-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">Délai moyen de clôture</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                8.4 <span className="text-xs font-normal text-slate-500">jours</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">Conforme CNIL (&lt; 30j)</div>
            </Card>
          </div>

          {/* Onglets et Filtres */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              {/* Onglets */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('open')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'open'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Ouvertes</span>
                  <span className="font-mono text-[11px] opacity-80">({openCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('overdue')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'overdue'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <span>En retard</span>
                  {overdueCount > 0 && (
                    <span className="font-mono text-[11px] bg-white text-rose-600 px-1.5 rounded-full font-bold">
                      {overdueCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Toutes</span>
                  <span className="font-mono text-[11px] opacity-80">({totalCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('closed')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'closed'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Clôturées</span>
                  <span className="font-mono text-[11px] opacity-80">({closedCount})</span>
                </button>
              </div>

              {/* Recherche et Filtre de type */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer (#DSR-..., #A1B2, email)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Tous types</option>
                  <option value="erasure">Effacement (Art. 17)</option>
                  <option value="access">Accès (Art. 15)</option>
                  <option value="rectification">Rectification (Art. 16)</option>
                  <option value="opposition">Opposition (Art. 21)</option>
                  <option value="restriction">Limitation (Art. 18)</option>
                  <option value="portability">Portabilité (Art. 20)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tableau des demandes */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Type d'exercice</th>
                    <th className="py-3 px-4">Candidat</th>
                    <th className="py-3 px-4">Réception</th>
                    <th className="py-3 px-4">Échéance CNIL (Compte à rebours)</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDsrs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                        <FileCheck2 className="h-8 w-8 mx-auto text-slate-400 opacity-50" />
                        <p className="font-medium text-xs">Aucune demande ne correspond aux critères sélectionnés.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDsrs.map((dsr) => {
                      const typeMeta = DSR_TYPE_LABELS[dsr.requestType];
                      const statusMeta = DSR_STATUS_LABELS[dsr.status];
                      const isClosed = dsr.status === 'fulfilled' || dsr.status === 'rejected';

                      // Calcul du compte à rebours coloré
                      const days = dsr.daysRemaining;
                      const isOverdue = days <= 0 && !isClosed;
                      const isCritical = days <= 3 && days > 0 && !isClosed;
                      const isWarning = days <= 10 && days > 3 && !isClosed;

                      const deadlineDateStr = new Date(dsr.legalDeadline).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });

                      const accessibleLabel = isClosed
                        ? `Demande clôturée le ${dsr.closedAt ? new Date(dsr.closedAt).toLocaleDateString('fr-FR') : 'récemment'}`
                        : isOverdue
                        ? `Échéance légale CNIL dépassée depuis ${Math.abs(days)} jours (date limite le ${deadlineDateStr})`
                        : `Compte à rebours légal CNIL : ${days} jours restants avant le ${deadlineDateStr}`;

                      return (
                        <tr
                          key={dsr.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          {/* Référence */}
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            <Link
                              href={`/rgpd/demandes/${encodeURIComponent(dsr.id)}`}
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{dsr.id}</span>
                            </Link>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{typeMeta.label}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">
                              {typeMeta.article}
                            </span>
                          </td>

                          {/* Candidat */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {dsr.candidatePseudonym}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Dossier {dsr.folderReference}
                            </div>
                          </td>

                          {/* Réception */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 dark:text-slate-300">
                              {new Date(dsr.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {dsr.receivedVia === 'direct_email'
                                ? 'Email direct'
                                : dsr.receivedVia === 'web_form'
                                ? 'Formulaire Web'
                                : 'Courrier RAR'}
                            </div>
                          </td>

                          {/* Échéance avec Compte à Rebours Coloré & Accessible */}
                          <td className="py-3.5 px-4">
                            {isClosed ? (
                              <div
                                aria-label={accessibleLabel}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Clôturée ({deadlineDateStr})</span>
                              </div>
                            ) : (
                              <div
                                aria-label={accessibleLabel}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-bold ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-500'
                                    : isCritical
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse'
                                    : isWarning
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                }`}
                              >
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {isOverdue
                                    ? `En retard (${days}j)`
                                    : isCritical
                                    ? `J-${days} (Critique)`
                                    : isWarning
                                    ? `J-${days} (Alerte J-10)`
                                    : `J-${days}`}
                                </span>
                                <span className="text-[10px] font-normal opacity-75">
                                  · {deadlineDateStr}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                dsr.status === 'fulfilled'
                                  ? 'border-emerald-300 text-emerald-600 bg-emerald-50/50'
                                  : dsr.status === 'under_review'
                                  ? 'border-indigo-300 text-indigo-600 bg-indigo-50/50'
                                  : dsr.status === 'identity_verified'
                                  ? 'border-blue-300 text-blue-600 bg-blue-50/50'
                                  : 'border-slate-300 text-slate-600'
                              }`}
                            >
                              {statusMeta.label}
                            </Badge>
                          </td>

                          {/* Responsable */}
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            <div className="font-medium text-xs">{dsr.assignedDpoName}</div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/rgpd/demandes/${encodeURIComponent(dsr.id)}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-slate-300 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              >
                                <span>Consulter</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Assistant Nouvelle Demande */}
      <NewDsrModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(created) => {
          fetchDsrs();
        }}
      />
    </div>
  );
}
