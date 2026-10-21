'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  Trash2,
  Clock,
  AlertTriangle,
  History,
  Lock,
  ChevronRight,
  Download,
  CheckCircle2,
  Eye,
  Filter,
  Search,
  Plus,
  Scale,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  UserX,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { can, type PermissionUser } from '@/lib/permissions';
import { mockFolders } from '@/lib/mock/data/folders';
import {
  type CvRetentionItem,
  type PurgeLogItem,
  type ConsentRecord,
  type ProcessingActivity,
  type SubprocessorInfo,
  type DataBreachRecord,
  type RetentionStatus,
  RETENTION_STATUS_LABELS,
  LEGAL_BASIS_LABELS,
} from '@/lib/schemas/rgpd-governance';
import {
  mockRetentionItems,
  mockPurgeLogs,
  mockConsentRecords,
  mockProcessingActivities,
  mockSubprocessors,
  mockDataBreaches,
} from '@/lib/mock/data/rgpd-governance';
import {
  exportArticle30RegistryAction,
  updateDataBreachStatusAction,
} from '@/app/actions/rgpd';
import { ExtendRetentionModal } from '@/components/rgpd/extend-retention-modal';
import { DeclareBreachModal } from '@/components/rgpd/declare-breach-modal';
import { BulkLegalBasisModal } from '@/components/rgpd/bulk-legal-basis-modal';
import { PurgePreviewModal } from '@/components/rgpd/purge-preview-modal';
import { RgpdCharts } from '@/components/rgpd/rgpd-charts';

type RgpdTab = 'conservation' | 'consentements' | 'registre' | 'violations' | 'indicateurs';

export default function RgpdMainPage() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [blindMode, setBlindMode] = useState<boolean>(true);

  // Sous-navigation par onglet
  const initialTab = (searchParams?.get('tab') as RgpdTab) || 'conservation';
  const [activeTab, setActiveTab] = useState<RgpdTab>(
    ['conservation', 'consentements', 'registre', 'violations', 'indicateurs'].includes(initialTab)
      ? initialTab
      : 'conservation'
  );

  const handleTabChange = (tab: RgpdTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.replace(`/rgpd?${params.toString()}`);
  };

  // Permissions
  const permUser: PermissionUser = { id: user?.id || 'usr-current', role };
  const hasManagePermission = can(permUser, 'rgpd.manage');

  // --- ÉTAT 1 : CONSERVATION ---
  const [retentionItems, setRetentionItems] = useState<CvRetentionItem[]>(mockRetentionItems);
  const [purgeLogs, setPurgeLogs] = useState<PurgeLogItem[]>(mockPurgeLogs);
  const [retentionFilter, setRetentionFilter] = useState<string>('all');
  const [retentionSearch, setRetentionSearch] = useState<string>('');
  const [selectedRetentionItem, setSelectedRetentionItem] = useState<CvRetentionItem | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState<boolean>(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);

  // --- ÉTAT 2 : CONSENTEMENTS ---
  const [consentList, setConsentList] = useState<ConsentRecord[]>(mockConsentRecords);
  const [consentFilterOnlyMissing, setConsentFilterOnlyMissing] = useState<boolean>(false);
  const [consentSearch, setConsentSearch] = useState<string>('');
  const [selectedConsentIds, setSelectedConsentIds] = useState<string[]>([]);
  const [isBulkLegalBasisOpen, setIsBulkLegalBasisOpen] = useState<boolean>(false);

  // --- ÉTAT 3 : REGISTRE ART. 30 ---
  const [activities] = useState<ProcessingActivity[]>(mockProcessingActivities);
  const [subprocessors] = useState<SubprocessorInfo[]>(mockSubprocessors);
  const [selectedActivity, setSelectedActivity] = useState<ProcessingActivity | null>(activities[0] || null);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);

  // --- ÉTAT 4 : VIOLATIONS ---
  const [breaches, setBreaches] = useState<DataBreachRecord[]>(mockDataBreaches);
  const [isDeclareBreachOpen, setIsDeclareBreachOpen] = useState<boolean>(false);
  const [selectedBreach, setSelectedBreach] = useState<DataBreachRecord | null>(null);

  // Filtrage Conservation
  const filteredRetention = useMemo(() => {
    return retentionItems.filter((item) => {
      const matchStatus =
        retentionFilter === 'all' || item.status === retentionFilter;
      const matchSearch =
        !retentionSearch.trim() ||
        item.candidatePseudonym.toLowerCase().includes(retentionSearch.toLowerCase()) ||
        item.folderReference.toLowerCase().includes(retentionSearch.toLowerCase()) ||
        item.folderTitle.toLowerCase().includes(retentionSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [retentionItems, retentionFilter, retentionSearch]);

  const itemsToPurge = useMemo(() => {
    return retentionItems.filter((item) => item.status === 'to_purge' || item.daysRemaining <= 0);
  }, [retentionItems]);

  // Filtrage Consentements
  const filteredConsents = useMemo(() => {
    return consentList.filter((c) => {
      if (consentFilterOnlyMissing && c.legalBasis !== 'sans_base_legale' && c.status !== 'missing') {
        return false;
      }
      if (!consentSearch.trim()) return true;
      const q = consentSearch.toLowerCase();
      return (
        c.candidatePseudonym.toLowerCase().includes(q) ||
        c.folderReference.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      );
    });
  }, [consentList, consentFilterOnlyMissing, consentSearch]);

  // Actions de mise à jour locale
  const handleRetentionSuccess = (updated: CvRetentionItem) => {
    setRetentionItems((prev) =>
      prev.map((i) => (i.candidateId === updated.candidateId ? updated : i))
    );
  };

  const handlePurgeSuccess = (newLog: PurgeLogItem) => {
    setPurgeLogs((prev) => [newLog, ...prev]);
    setRetentionItems((prev) => prev.filter((i) => i.status !== 'to_purge'));
  };

  const handleBulkConsentSuccess = (count: number) => {
    // Recharger la liste des consentements en mémoire
    setConsentList((prev) =>
      prev.map((c) => {
        if (selectedConsentIds.includes(c.candidateId) || selectedConsentIds.includes(c.id)) {
          return {
            ...c,
            legalBasis: 'consentement',
            status: 'valid',
            obtainedDate: new Date().toISOString().split('T')[0],
            source: 'Campagne de régularisation TalentLens',
            proofDetails: 'Régularisation groupée validée',
          };
        }
        return c;
      })
    );
    setSelectedConsentIds([]);
  };

  const handleBreachSuccess = (newBreach: DataBreachRecord) => {
    setBreaches((prev) => [newBreach, ...prev]);
  };

  const handleExportArticle30 = async () => {
    try {
      const res = await exportArticle30RegistryAction({
        id: user?.id || 'usr-dpo',
        name: user?.name || 'Séverine Petit',
        role: role || 'dpo',
      });
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Registre_Traitements_Art30_TalentLens_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportSuccessNotice("Registre Art. 30 exporté avec succès et scellé à l'audit trail.");
        setTimeout(() => setExportSuccessNotice(null), 5000);
      }
    } catch (err: any) {
      console.error("Erreur lors de l'export Art. 30", err);
    }
  };

  // Calcul 72h compte à rebours pour une violation
  const calculateRemainingHours = (detectedAt: string) => {
    const detectTime = new Date(detectedAt).getTime();
    const deadline = detectTime + 72 * 60 * 60 * 1000;
    const now = Date.now();
    return Math.round((deadline - now) / (1000 * 60 * 60));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar
        blindMode={blindMode}
        onBlindModeToggle={() => setBlindMode(!blindMode)}
      />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} shortlistCount={3} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
                  Gouvernance
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Conformité RGPD</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Espace Conformité RGPD & Registre
                </h1>
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>CNIL & SOC-2 Type II</span>
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supervision du cycle de vie des données, registre Art. 30, bases légales, gestion des violations et traçabilité WORM.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/rgpd/demandes">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-sm"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Registre des demandes DSR</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportArticle30}
                className="gap-1.5 text-xs"
              >
                <Download className="h-4 w-4" />
                <span>Exporter registre Art. 30</span>
              </Button>
            </div>
          </div>

          {exportSuccessNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{exportSuccessNotice}</span>
              </div>
              <button
                onClick={() => setExportSuccessNotice(null)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Sous-navigation principale à 5 onglets */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
            {[
              { id: 'conservation', label: 'Conservation des CV', icon: Clock, count: retentionItems.length },
              { id: 'consentements', label: 'Consentements & Base légale', icon: Scale, count: consentList.filter(c => c.legalBasis === 'sans_base_legale').length ? `${consentList.filter(c => c.legalBasis === 'sans_base_legale').length} sans base` : null },
              { id: 'registre', label: 'Registre des traitements (Art. 30)', icon: FileText },
              { id: 'violations', label: 'Violations de données (Art. 33)', icon: ShieldAlert, count: breaches.filter(b => b.status === 'open').length ? `${breaches.filter(b => b.status === 'open').length} ouverte` : null },
              { id: 'indicateurs', label: 'Indicateurs & Tableaux de bord', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as RgpdTab)}
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold bg-indigo-50/20 dark:bg-indigo-950/20 rounded-t-lg'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <Badge
                      variant={tab.id === 'violations' || tab.id === 'consentements' ? 'destructive' : 'outline'}
                      className="text-[10px] py-0 px-1.5"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* ONGLET 1 : CONSERVATION                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'conservation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Bandeau d'alerte CNIL : « La purge supprimera N CV le JJ/MM » */}
              <div className="rounded-xl border border-red-300 bg-red-50/80 p-4 text-xs text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                    <div>
                      <strong className="font-bold text-sm block">
                        La purge supprimera {itemsToPurge.length} CV le 15/10/2026 à 02:00 UTC
                      </strong>
                      <span className="text-[11px] text-red-800 dark:text-red-300">
                        Règle légale CNIL max 24 mois sans réengagement actif · Destruction certifiée WORM
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPurgeModalOpen(true)}
                      className="border-red-300 text-red-800 dark:border-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Voir la liste ({itemsToPurge.length} CV)</span>
                    </Button>
                    {hasManagePermission && (
                      <Button
                        size="sm"
                        onClick={() => setIsPurgeModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Exécuter la purge anticipée</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mini liste des CV à purger dépliée */}
                <div className="pt-2 border-t border-red-200 dark:border-red-900/40 flex flex-wrap gap-2 text-[11px]">
                  <span className="font-semibold text-red-900 dark:text-red-200">
                    Profils concernés :
                  </span>
                  {itemsToPurge.map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-900 dark:text-red-200 font-mono"
                    >
                      {item.candidatePseudonym} ({item.folderReference})
                    </span>
                  ))}
                </div>
              </div>

              {/* 4 Compteurs Rétention CNIL */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <span className="text-xs text-slate-500">Total CV sous rétention active</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {retentionItems.length + 1420}
                  </div>
                  <span className="text-[10px] text-slate-400">Règle légale CNIL max 24 mois</span>
                </Card>

                <Card className="p-4">
                  <span className="text-xs text-slate-500">Conformes (&gt; 60 jours restants)</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                    {retentionItems.filter((i) => i.status === 'compliant').length}
                  </div>
                  <span className="text-[10px] text-emerald-700">Aucune action requise</span>
                </Card>

                <Card className="p-4">
                  <span className="text-xs text-slate-500">À échéance sous 30-60 jours</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-amber-600 tabular-nums">
                    {retentionItems.filter((i) => i.status === 'warning_60j').length}
                  </div>
                  <span className="text-[10px] text-amber-700">Réengagement recommandé</span>
                </Card>

                <Card className="p-4 border-red-200 dark:border-red-900/50">
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    À purger sous 30 jours (Critique)
                  </span>
                  <div className="mt-1 text-2xl font-bold font-mono text-red-600 tabular-nums">
                    {retentionItems.filter((i) => i.status === 'warning_30j' || i.status === 'to_purge').length}
                  </div>
                  <span className="text-[10px] text-red-700 font-medium">Destruction programmée</span>
                </Card>
              </div>

              {/* Barre de filtres et recherche */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Filtrer par candidat pseudonymisé ou dossier..."
                      value={retentionSearch}
                      onChange={(e) => setRetentionSearch(e.target.value)}
                      className="pl-8 text-xs h-9"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all', label: 'Tous' },
                      { id: 'compliant', label: 'Conformes' },
                      { id: 'warning_60j', label: 'Échéance 60 j' },
                      { id: 'warning_30j', label: 'Alerte 30 j' },
                      { id: 'to_purge', label: 'À purger' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setRetentionFilter(btn.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          retentionFilter === btn.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500 shrink-0">
                  {filteredRetention.length} CV affichés
                </div>
              </div>

              {/* Tableau des CV par retention_until */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Candidat pseudonymisé</th>
                        <th className="p-3">Dossier lié</th>
                        <th className="p-3">Dernière activité</th>
                        <th className="p-3">Échéance (retention_until)</th>
                        <th className="p-3">Statut légal</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRetention.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Aucun profil trouvé correspondant aux filtres.
                          </td>
                        </tr>
                      ) : (
                        filteredRetention.map((item) => {
                          const statusConfig = RETENTION_STATUS_LABELS[item.status];
                          const isCritical = item.status === 'to_purge' || item.status === 'warning_30j';
                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                isCritical ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                              }`}
                            >
                              <td className="p-3">
                                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {item.candidatePseudonym}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {item.legalBasis}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-slate-900 dark:text-slate-200">
                                  {item.folderReference}
                                </div>
                                <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                                  {item.folderTitle}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {new Date(item.lastActivityDate).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="p-3">
                                <div className="font-mono font-medium text-slate-900 dark:text-slate-100">
                                  {new Date(item.retention_until).toLocaleDateString('fr-FR')}
                                </div>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    item.daysRemaining <= 0
                                      ? 'text-red-600'
                                      : item.daysRemaining <= 30
                                      ? 'text-amber-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {item.daysRemaining <= 0
                                    ? 'Échéance dépassée'
                                    : `${item.daysRemaining} jours restants`}
                                </span>
                              </td>
                              <td className="p-3">
                                <Badge variant={statusConfig.badgeVariant} className="text-[10px]">
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRetentionItem(item);
                                    setIsExtendModalOpen(true);
                                  }}
                                  className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50"
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>Prolonger</span>
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Journal des purges certifiées WORM */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Journal immuable des purges certifiées (WORM)
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Preuves cryptographiques conformes aux normes ISO/IEC 27001 et Art. 17 RGPD
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {purgeLogs.length} procès-verbaux
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {purgeLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.date}
                          </span>
                          <span className="text-slate-500 ml-2">Volume : {log.cvCount} CV</span>
                          <span className="text-slate-400 ml-2 text-[11px]">({log.operator})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 text-[11px] truncate max-w-44">
                            {log.sha256Certificate.slice(0, 16)}...
                          </span>
                          <button
                            onClick={() => {
                              alert(`Certificat WORM de destruction :
Fichier : ${log.proofDocument}
Horodatage : ${log.date}
Volume : ${log.cvCount} CV détruits
Empreinte SHA-256 : ${log.sha256Certificate}
Opérateur : ${log.operator}
Scellement conforme Art. 17 RGPD.`);
                            }}
                            className="text-indigo-600 hover:underline cursor-pointer font-medium"
                          >
                            {log.proofDocument}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : CONSENTEMENTS ET BASE LÉGALE                                   */}
          {/* ========================================================================= */}
          {activeTab === 'consentements' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Registre des Consentements & Bases Légales (Art. 6 RGPD)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contrôle des fondements juridiques pour chaque profil actif : Consentement, Intérêt légitime ou Contrat.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConsentIds.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setIsBulkLegalBasisOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      <span>Régulariser en masse ({selectedConsentIds.length})</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={consentFilterOnlyMissing ? 'destructive' : 'outline'}
                    onClick={() => setConsentFilterOnlyMissing(!consentFilterOnlyMissing)}
                    className="text-xs gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>
                      {consentFilterOnlyMissing
                        ? 'Voir tous les profils'
                        : 'Filtrer : Sans base légale documentée'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Tableau des consentements */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedConsentIds.length > 0 &&
                              selectedConsentIds.length === filteredConsents.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConsentIds(filteredConsents.map((c) => c.candidateId));
                              } else {
                                setSelectedConsentIds([]);
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                        </th>
                        <th className="p-3">Candidat pseudonymisé</th>
                        <th className="p-3">Base légale (Art. 6)</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Date de recueil</th>
                        <th className="p-3">Source & Preuve</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredConsents.map((consent) => {
                        const isSelected = selectedConsentIds.includes(consent.candidateId);
                        const isMissing =
                          consent.legalBasis === 'sans_base_legale' || consent.status === 'missing';
                        const legalConfig = LEGAL_BASIS_LABELS[consent.legalBasis];

                        return (
                          <tr
                            key={consent.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isMissing ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                            }`}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedConsentIds((prev) => [...prev, consent.candidateId]);
                                  } else {
                                    setSelectedConsentIds((prev) =>
                                      prev.filter((id) => id !== consent.candidateId)
                                    );
                                  }
                                }}
                                className="rounded text-indigo-600"
                              />
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {consent.candidatePseudonym}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2">
                                Dossier {consent.folderReference}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {legalConfig?.label || consent.legalBasis}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {legalConfig?.article}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  consent.status === 'valid'
                                    ? 'success'
                                    : consent.status === 'to_renew'
                                    ? 'warning'
                                    : 'destructive'
                                }
                                className="text-[10px]"
                              >
                                {consent.status === 'valid'
                                  ? 'Valide'
                                  : consent.status === 'to_renew'
                                  ? 'À renouveler'
                                  : consent.status === 'withdrawn'
                                  ? 'Consentement retiré'
                                  : 'Sans base légale'}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {consent.obtainedDate
                                ? new Date(consent.obtainedDate).toLocaleDateString('fr-FR')
                                : 'Non documentée'}
                            </td>
                            <td className="p-3">
                              <div className="text-slate-900 dark:text-slate-200">
                                {consent.source}
                              </div>
                              {consent.proofDetails && (
                                <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                  {consent.proofDetails}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedConsentIds([consent.candidateId]);
                                  setIsBulkLegalBasisOpen(true);
                                }}
                                className="h-7 text-xs"
                              >
                                {isMissing ? 'Régulariser' : 'Modifier'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : REGISTRE DES TRAITEMENTS (ART. 30)                             */}
          {/* ========================================================================= */}
          {activeTab === 'registre' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Registre des Activités de Traitement (Article 30 RGPD)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cartographie formelle des finalités, durées de rétention, destinataires et sous-traitants ultérieurs.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleExportArticle30}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exporter le registre (JSON / PDF)</span>
                </Button>
              </div>

              {/* Fiches des traitements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fiches de traitement répertoriées :
                  </h4>
                  {activities.map((act) => (
                    <Card
                      key={act.id}
                      onClick={() => setSelectedActivity(act)}
                      className={`p-4 cursor-pointer transition-all border ${
                        selectedActivity?.id === act.id
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {act.code}
                        </span>
                        <Badge variant="success" className="text-[10px]">
                          DPO Validé
                        </Badge>
                      </div>
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {act.name}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {act.purpose}
                      </p>
                    </Card>
                  ))}
                </div>

                {/* Détail de la fiche sélectionnée */}
                <div className="lg:col-span-2">
                  {selectedActivity && (
                    <Card className="p-6 space-y-4">
                      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {selectedActivity.code}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {selectedActivity.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Dernière revue DPO : {selectedActivity.lastReviewDate}
                          </span>
                        </div>
                        <Badge variant="outline">Art. 30.1 RGPD</Badge>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                            Finalité principale :
                          </strong>
                          <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                            {selectedActivity.purpose}
                          </p>
                        </div>

                        <div>
                          <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                            Finalités secondaires associées :
                          </strong>
                          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                            {selectedActivity.secondaryPurposes.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                              Personnes concernées :
                            </strong>
                            <div className="flex flex-wrap gap-1">
                              {selectedActivity.dataSubjects.map((s, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px]">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                              Durée de conservation légale :
                            </strong>
                            <p className="text-slate-600 dark:text-slate-400">
                              {selectedActivity.retentionPeriod}
                            </p>
                          </div>
                        </div>

                        <div>
                          <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                            Catégories de données collectées :
                          </strong>
                          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                            {selectedActivity.dataCategories.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <strong className="text-slate-900 dark:text-slate-200 block mb-1">
                            Mesures de sécurité techniques et organisationnelles :
                          </strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {selectedActivity.securityMeasures.map((m, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Tableau des sous-traitants (Data Processors) */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm font-semibold">
                    Liste des Sous-traitants ultérieurs (Article 28 RGPD)
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Contrats de traitement de données (DPA) et garanties de transfert hors-UE
                  </p>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Fournisseur / Sous-traitant</th>
                        <th className="p-3">Rôle / Prestation</th>
                        <th className="p-3">Région / Localisation</th>
                        <th className="p-3">Statut DPA</th>
                        <th className="p-3">Garanties de transfert</th>
                        <th className="p-3">Dernière revue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subprocessors.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                            {sub.name}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {sub.role}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {sub.region}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={sub.dpaStatus === 'signed' ? 'success' : 'warning'}
                              className="text-[10px]"
                            >
                              {sub.dpaStatus === 'signed'
                                ? 'DPA Signé & Conforme'
                                : 'Clauses CCT 2021'}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {sub.transferSafeguards}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {sub.lastDpaReview}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 4 : VIOLATIONS DE DONNÉES (ART. 33 & 34)                          */}
          {/* ========================================================================= */}
          {activeTab === 'violations' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Registre des Violations de Données Personnelles (Articles 33 & 34 RGPD)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Obligation de notification sans retard indu et au plus tard 72 heures après en avoir pris connaissance.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsDeclareBreachOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Déclarer une violation</span>
                </Button>
              </div>

              {/* Tableau du Registre des Violations */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Référence & Titre</th>
                        <th className="p-3">Détection</th>
                        <th className="p-3">Gravité</th>
                        <th className="p-3">Compte à rebours 72h CNIL</th>
                        <th className="p-3">Notification CNIL</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {breaches.map((breach) => {
                        const hoursRemaining = calculateRemainingHours(breach.detectedAt);
                        const isOverdue = hoursRemaining <= 0;
                        const isUrgent = hoursRemaining <= 24 && hoursRemaining > 0;

                        return (
                          <tr key={breach.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-red-600">
                                  {breach.reference}
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {breach.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {breach.description}
                              </p>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                              {new Date(breach.detectedAt).toLocaleString('fr-FR')}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  breach.severity === 'critical' || breach.severity === 'high'
                                    ? 'destructive'
                                    : 'warning'
                                }
                                className="text-[10px]"
                              >
                                {breach.severity.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {breach.status === 'closed' ? (
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  Clôturée dans les délais
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono">
                                  <Clock
                                    className={`h-3.5 w-3.5 ${
                                      isOverdue
                                        ? 'text-red-600'
                                        : isUrgent
                                        ? 'text-amber-600 animate-pulse'
                                        : 'text-indigo-600'
                                    }`}
                                  />
                                  <span
                                    className={`font-bold ${
                                      isOverdue
                                        ? 'text-red-600'
                                        : isUrgent
                                        ? 'text-amber-600'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {isOverdue ? 'Délai 72h échu' : `${hoursRemaining}h restantes`}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  breach.authorityNotification === 'notified'
                                    ? 'success'
                                    : breach.authorityNotification === 'required'
                                    ? 'destructive'
                                    : 'outline'
                                }
                                className="text-[10px]"
                              >
                                {breach.authorityNotification === 'notified'
                                  ? 'CNIL Notifiée'
                                  : breach.authorityNotification === 'required'
                                  ? 'Notification requise'
                                  : 'Non requise'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={breach.status === 'closed' ? 'outline' : 'destructive'}
                                className="text-[10px]"
                              >
                                {breach.status === 'closed' ? 'Clôturée' : 'En cours'}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBreach(breach)}
                                className="h-7 text-xs"
                              >
                                Consulter
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Fiche détail de la violation sélectionnée */}
              {selectedBreach && (
                <Card className="p-6 space-y-4 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-600">
                          {selectedBreach.reference}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {selectedBreach.title}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500">
                        Détectée le {new Date(selectedBreach.detectedAt).toLocaleString('fr-FR')} par {selectedBreach.reporterName} ({selectedBreach.reporterRole})
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBreach(null)}
                      className="text-xs"
                    >
                      Fermer
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong className="block text-slate-700 dark:text-slate-300 mb-1">
                        Faits constatés :
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        {selectedBreach.description}
                      </p>
                    </div>

                    <div>
                      <strong className="block text-slate-700 dark:text-slate-300 mb-1">
                        Évaluation des conséquences :
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        {selectedBreach.consequences}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <strong className="block text-slate-700 dark:text-slate-300 mb-1">
                        Mesures correctives immédiates :
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        {selectedBreach.remediationTaken}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 5 : INDICATEURS & TABLEAUX DE BORD (RECHARTS)                     */}
          {/* ========================================================================= */}
          {activeTab === 'indicateurs' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Indicateurs de Pilotage & Conformité RGPD (KPI Recharts)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mesure continue de la performance réglementaire, des délais d'exercice des droits et du rythme des purges.
                  </p>
                </div>
                <Badge variant="success">Actualisation temps réel</Badge>
              </div>

              {/* Rendu des graphiques Recharts */}
              <RgpdCharts />
            </div>
          )}
        </main>
      </div>

      {/* Modales contextuelles */}
      <ExtendRetentionModal
        isOpen={isExtendModalOpen}
        onClose={() => {
          setIsExtendModalOpen(false);
          setSelectedRetentionItem(null);
        }}
        item={selectedRetentionItem}
        onSuccess={handleRetentionSuccess}
      />

      <PurgePreviewModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        itemsToPurge={itemsToPurge}
        onPurgeSuccess={handlePurgeSuccess}
      />

      <BulkLegalBasisModal
        isOpen={isBulkLegalBasisOpen}
        onClose={() => setIsBulkLegalBasisOpen(false)}
        candidateIds={selectedConsentIds}
        onSuccess={handleBulkConsentSuccess}
      />

      <DeclareBreachModal
        isOpen={isDeclareBreachOpen}
        onClose={() => setIsDeclareBreachOpen(false)}
        onSuccess={handleBreachSuccess}
      />
    </div>
  );
}
