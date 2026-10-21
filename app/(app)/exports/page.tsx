'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Lock,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExportWizardModal } from '@/components/export/export-wizard-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { mockFolders } from '@/lib/mock/data/folders';
import { mockExports } from '@/lib/mock/data/exports';
import type { Export } from '@/types';
import { cn } from '@/lib/utils';

export default function ExportsManagementPage() {
  const { role } = useAuth();
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const [exportsList, setExportsList] = useState<Export[]>(mockExports);
  const [search, setSearch] = useState<string>('');
  const [selectedConfidentiality, setSelectedConfidentiality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calcul du temps restant avant expiration légale (7 jours max)
  const getRemainingTime = useCallback((expiresAt?: string) => {
    if (!expiresAt) return { isExpired: false, label: '7 jours' };
    const diffMs = new Date(expiresAt).getTime() - now;
    if (diffMs <= 0) {
      return { isExpired: true, label: 'Expiré' };
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return { isExpired: false, label: `${days}j ${hours}h restants` };
    }
    return { isExpired: false, label: `${hours}h restantes` };
  }, [now]);

  // Révocation / Suppression immédiate d'un export
  const handleRevokeExport = (exportId: string) => {
    setExportsList((prev) => prev.filter((e) => e.id !== exportId));
    setRevokedMessage(`L'export ${exportId} a été révoqué avec succès et purgé du serveur.`);
    setTimeout(() => setRevokedMessage(null), 4000);
  };

  // Filtrage des exports
  const filteredExports = useMemo(() => {
    return exportsList.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.folderReference.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedConfidentiality !== 'all') {
        if (item.confidentiality !== selectedConfidentiality) return false;
      }

      if (selectedStatus !== 'all') {
        const remaining = getRemainingTime(item.expiresAt);
        if (selectedStatus === 'expired' && !remaining.isExpired && item.status !== 'expired') return false;
        if (selectedStatus === 'available' && (remaining.isExpired || item.status === 'expired')) return false;
      }

      return true;
    });
  }, [exportsList, search, selectedConfidentiality, selectedStatus, getRemainingTime]);

  // Icône de format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv_table':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'json_audit':
        return <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
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
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
                  Dossiers
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Exports</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Exports &amp; Shortlists Certifiées
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  {exportsList.length} documents générés
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gestion des fichiers shortlist avec filigrane WORM et politique de purge automatique sous 7 jours.
              </p>
            </div>

            {/* Bouton d'ouverture rapide du Wizard */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsWizardOpen(true)}
                className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Export Sécurisé</span>
              </Button>
            </div>
          </div>

          {/* Bannière de confirmation */}
          {revokedMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{revokedMessage}</span>
              </div>
            </div>
          )}

          {/* Règle de conformité RGPD */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Garantie de Sécurité WORM &amp; Plafond 200 Candidats :</span> Tous les exports sont scellés cryptographiquement (SHA-256) avec l'identité de l'opérateur et un filigrane immuable. Les liens de téléchargement expirent irrévocablement après 7 jours conformément aux recommandations CNIL.
            </div>
          </div>

          {/* Barre d'outils et filtres */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Rechercher par identifiant (#EXP...), titre, dossier ou utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedConfidentiality}
                onChange={(e) => setSelectedConfidentiality(e.target.value)}
                className="text-xs h-9 px-3 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="all">Toutes confidentialités</option>
                <option value="anonymized_strict">Anonymisé Strict</option>
                <option value="nominative_justified">Nominatif Justifié</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs h-9 px-3 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="all">Tous statuts</option>
                <option value="available">Valides uniquement</option>
                <option value="expired">Expirés</option>
              </select>
            </div>
          </div>

          {/* Tableau des exports */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Export &amp; Titre</th>
                    <th className="py-3 px-4">Dossier</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Confidentialité</th>
                    <th className="py-3 px-4">Création &amp; Auteur</th>
                    <th className="py-3 px-4">Échéance (7 jours)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredExports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Aucun export généré ne correspond à votre sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredExports.map((item) => {
                      const remaining = getRemainingTime(item.expiresAt);
                      const isExpired = remaining.isExpired || item.status === 'expired';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                                {getFormatIcon(item.format)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {item.title}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{item.id}</span>
                                  <span>•</span>
                                  <span>{item.candidateCount} candidat(s)</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.folderReference}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {item.format.replace('_', ' ')}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4">
                            {item.confidentiality === 'anonymized_strict' ? (
                              <Badge variant="success" className="text-[10px] gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Anonymisé</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px] gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Nominatif 2FA</span>
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {item.userName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className={cn('w-3.5 h-3.5', isExpired ? 'text-rose-500' : 'text-amber-500')} />
                              <span
                                className={cn(
                                  'font-semibold text-xs',
                                  isExpired
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                )}
                              >
                                {remaining.label}
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 truncate max-w-[130px] mt-0.5">
                              {item.sha256Hash?.slice(0, 16)}...
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isExpired ? (
                                <a
                                  href={`/api/exports/${item.id}/download`}
                                  download
                                  className="inline-block"
                                >
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger</span>
                                  </Button>
                                </a>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled
                                  variant="outline"
                                  className="h-7 text-xs text-rose-500 border-rose-200 opacity-60"
                                >
                                  Lien expiré
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRevokeExport(item.id)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Révoquer et détruire l'export"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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

      {/* Assistant Modal d'export */}
      <ExportWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          // Recharger ou synchroniser
        }}
      />
    </div>
  );
}
