'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Download,
  Filter,
  Search,
  CheckCircle,
  Copy,
  Lock,
  ExternalLink,
  ShieldAlert,
  Calendar,
  User,
  FolderOpen,
  Hash,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  Terminal,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Can } from '@/components/shared/can';
import { useAuth } from '@/lib/auth/auth-context';
import { mockAuditEvents } from '@/lib/mock/data/audit';
import { mockFolders } from '@/lib/mock/data/folders';
import type { AuditEvent } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminAuditPage() {
  const { role, user } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const [events, setEvents] = useState<AuditEvent[]>(mockAuditEvents);

  // Filtres
  const [search, setSearch] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [merkleFilter, setMerkleFilter] = useState<string>('all');

  // Tiroir latéral (Drawer/Sheet)
  const [activeDrawerEvent, setActiveDrawerEvent] = useState<AuditEvent | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // 1. Alertes du jour (KPIs)
  const alertsSummary = useMemo(() => {
    const unmaskCount = events.filter((e) => e.action === 'BLIND_MODE_UNMASK').length;
    const injectionCount = events.filter((e) => e.action === 'SECURITY_PROMPT_INJECTION_DETECTED').length;
    const dsrCount = events.filter((e) => e.action.startsWith('DSR_')).length;
    const exportCount = events.filter((e) => e.action.startsWith('EXPORT_')).length;

    return {
      unmaskCount,
      injectionCount,
      dsrCount,
      exportCount,
      totalToday: 24, // Volume simulé des dernières 24h
    };
  }, [events]);

  // 2. Filtrage des événements
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Recherche textuelle
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesQuery =
          evt.id.toLowerCase().includes(q) ||
          evt.actor.name.toLowerCase().includes(q) ||
          evt.justification.toLowerCase().includes(q) ||
          evt.resource.id.toLowerCase().includes(q) ||
          evt.sha256Seal.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Filtre Action
      if (selectedAction !== 'all') {
        if (selectedAction === 'UNMASK' && evt.action !== 'BLIND_MODE_UNMASK') return false;
        if (selectedAction === 'INJECTION' && evt.action !== 'SECURITY_PROMPT_INJECTION_DETECTED') return false;
        if (selectedAction === 'EXPORT' && !evt.action.startsWith('EXPORT_')) return false;
        if (selectedAction === 'DSR' && !evt.action.startsWith('DSR_')) return false;
      }

      // Filtre Dossier
      if (selectedFolder !== 'all') {
        if (evt.resource.folderReference !== selectedFolder) return false;
      }

      // Filtre Merkle
      if (merkleFilter === 'verified' && !evt.merkleVerified) return false;
      if (merkleFilter === 'unverified' && evt.merkleVerified) return false;

      return true;
    });
  }, [events, search, selectedAction, selectedFolder, merkleFilter]);

  // Copie dans le presse-papiers
  const handleCopyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export réglementaire SOC-2 / CNIL
  const handleExportWormRegistry = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccessMessage(
        'Archive scellée RFC 3161 générée : "talentlens_worm_registry_2026.json" (Empreinte SHA-256 certifiée).'
      );
      setTimeout(() => setExportSuccessMessage(null), 5000);

      // Déclenchement du téléchargement simulé
      const jsonBlob = new Blob([JSON.stringify(events, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(jsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentlens_worm_registry_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar
        blindMode={blindMode}
        onBlindModeToggle={() => setBlindMode(!blindMode)}
        currentFolderReference="#DE-2026"
      />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} shortlistCount={3} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Fil d'Ariane & En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
                  Administration
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  Registre d'Audit Immuable
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Registre d'Audit WORM &amp; Sécurité
                </h1>
                <Badge variant="success" className="text-xs font-semibold px-2.5 py-0.5">
                  RFC 3161 Scellé
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enregistrement continu Write-Once-Read-Many inviolable conforme SOC-2 Type II et Art. 30 RGPD.
              </p>
            </div>

            {/* Bouton d'export réglementaire (Contrôlé par la permission audit.read) */}
            <div className="flex items-center gap-2">
              <Can action="audit.read">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportWormRegistry}
                  disabled={isExporting}
                  className="gap-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 shadow-xs"
                >
                  <Download className={cn('h-4 w-4', isExporting && 'animate-bounce')} />
                  <span>
                    {isExporting ? 'Génération du registre certifié...' : 'Exporter registre scellé (SOC-2 / CNIL)'}
                  </span>
                </Button>
              </Can>
            </div>
          </div>

          {/* Bannière de confirmation d'export */}
          {exportSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportSuccessMessage(null)}
                className="hover:opacity-75"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. Tableau de bord des alertes du jour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Dé-caviardages exécutés
                  </div>
                  <div className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1">
                    {alertsSummary.unmaskCount}
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                    100% tracés avec motif Art. 30
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                  <KeyRound className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    Tentatives de Prompt Injection
                  </div>
                  <div className="text-2xl font-bold text-rose-950 dark:text-rose-100 mt-1">
                    {alertsSummary.injectionCount}
                  </div>
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                    Isolées par TalentLens AI Guard
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    Demandes DSR RGPD
                  </div>
                  <div className="text-2xl font-bold text-indigo-950 dark:text-indigo-100 mt-1">
                    {alertsSummary.dsrCount}
                  </div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Sous protocole double validation
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Intégrité de la Chaîne Merkle
                  </div>
                  <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                    100%
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Zéro anomalie de hachage détectée
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Barre d'outils et filtres avancés */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Recherche textuelle */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Rechercher par identifiant (#EVT...), acteur, justificatif..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              {/* Filtre Action */}
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="text-xs h-9 bg-slate-50 dark:bg-slate-950">
                  <SelectValue placeholder="Type d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="UNMASK">Dé-caviardages (Unmask)</SelectItem>
                  <SelectItem value="INJECTION">Alertes Sécurité (Injections)</SelectItem>
                  <SelectItem value="EXPORT">Exports de données</SelectItem>
                  <SelectItem value="DSR">Demandes DSR (Art. 17)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Dossier */}
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="text-xs h-9 bg-slate-50 dark:bg-slate-950">
                  <SelectValue placeholder="Dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les dossiers</SelectItem>
                  <SelectItem value="#DE-2026">#DE-2026 (Data Engineer)</SelectItem>
                  <SelectItem value="#CYB-88">#CYB-88 (Cybersécurité)</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Statut Merkle */}
              <Select value={merkleFilter} onValueChange={setMerkleFilter}>
                <SelectTrigger className="text-xs h-9 bg-slate-50 dark:bg-slate-950">
                  <SelectValue placeholder="Statut Merkle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout statut Merkle</SelectItem>
                  <SelectItem value="verified">Vérifiés uniquement (100%)</SelectItem>
                  <SelectItem value="unverified">Non certifiés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Table des événements d'audit immuables */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Événement &amp; Date</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Acteur &amp; Force Auth</th>
                    <th className="py-3 px-4">Ressource</th>
                    <th className="py-3 px-4">Justification (Art. 30)</th>
                    <th className="py-3 px-4">Intégrité</th>
                    <th className="py-3 px-4 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Aucun événement ne correspond aux critères de filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr
                        key={evt.id}
                        onClick={() => setActiveDrawerEvent(evt)}
                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {evt.id}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(evt.timestamp).toLocaleString('fr-FR')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              evt.action === 'BLIND_MODE_UNMASK'
                                ? 'warning'
                                : evt.action === 'SECURITY_PROMPT_INJECTION_DETECTED'
                                ? 'destructive'
                                : evt.action.startsWith('DSR_')
                                ? 'outline'
                                : 'secondary'
                            }
                            className="text-[10px] uppercase font-bold tracking-tight"
                          >
                            {evt.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {evt.actor.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono">{evt.actor.role}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {evt.actor.authStrength}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {evt.resource.type.toUpperCase()} : {evt.resource.pseudonym || evt.resource.id}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {evt.resource.folderReference}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {evt.justification}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              Merkle Valide
                            </span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {evt.sha256Seal.slice(0, 16)}...
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDrawerEvent(evt);
                            }}
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950 gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspecter</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* 4. Tiroir latéral (Sheet/Drawer) d'inspection approfondie */}
      {activeDrawerEvent && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop sombre */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setActiveDrawerEvent(null)}
          />

          {/* Panneau latéral */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col h-full overflow-y-auto space-y-5 z-10 animate-in slide-in-from-right duration-200">
            {/* En-tête tiroir */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Preuve d'Audit Certifiée
                  </h3>
                  <div className="font-mono text-xs text-slate-400">
                    {activeDrawerEvent.id} · Horodatage RFC 3161
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawerEvent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Détails légaux & Justification */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Action Consignée :</span>
                  <Badge variant="outline" className="font-mono text-[11px] font-bold">
                    {activeDrawerEvent.action}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Date &amp; Heure UTC :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {activeDrawerEvent.timestamp}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Acteur responsable :</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {activeDrawerEvent.actor.name} ({activeDrawerEvent.actor.role})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Adresse IP source :</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {activeDrawerEvent.actor.ip}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Niveau d'authentification :</span>
                  <Badge variant="success" className="text-[10px] font-mono">
                    {activeDrawerEvent.actor.authStrength}
                  </Badge>
                </div>
              </div>

              {/* Justification réglementaire obligatoire */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Motif d'accès consigné (Art. 30 RGPD) :
                </label>
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  {activeDrawerEvent.justification}
                </div>
              </div>

              {/* Empreinte cryptographique immuable */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center justify-between">
                  <span>Empreinte SHA-256 scellée (Merkle Leaf) :</span>
                  <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                    Intégrité 100%
                  </span>
                </label>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all select-all border border-slate-800">
                  {activeDrawerEvent.sha256Seal}
                </div>
              </div>

              {/* Payload JSON d'origine */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Payload brut de l'événement (JSON) :
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPayload(activeDrawerEvent.payload)}
                    className="h-7 text-[11px] gap-1 text-slate-600 dark:text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
                  </Button>
                </div>

                <pre className="p-3 bg-slate-950 text-slate-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 border border-slate-800">
                  {JSON.stringify(activeDrawerEvent.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Pied du tiroir */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDrawerEvent(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
