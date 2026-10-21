'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  FileX,
  FileText,
  UserCheck,
  UserX,
  Edit3,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronLeft,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Ban,
  Clock,
  Layers,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import { TopBar } from '@/components/shared/top-bar';
import { Sidebar } from '@/components/shared/sidebar';
import { VerificationQueueHeader } from '@/components/a-verifier/verification-queue-header';
import { VerificationLeftPane } from '@/components/a-verifier/verification-left-pane';
import { KeyboardShortcutsDialog } from '@/components/a-verifier/keyboard-shortcuts-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { mockFolders } from '@/lib/mock/data/folders';
import {
  getVerificationQueueAction,
  updateDoubtfulFieldAction,
  resolveSuspiciousAction,
} from './actions';
import type {
  VerificationItem,
  VerificationFilter,
  DoubtfulField,
  VerificationStats,
} from '@/lib/schemas/verification';
import { cn } from '@/lib/utils';

export default function VerificationQueuePage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // États locaux
  const [blindMode, setBlindMode] = useState<boolean>(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number>(0);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [suspiciousReason, setSuspiciousReason] = useState<string>('');
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [hoveredBboxId, setHoveredBboxId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Filtre
  const [filter, setFilter] = useState<Partial<VerificationFilter>>({
    motif: 'all',
    folderId: 'all',
    status: 'pending',
    dateRange: 'all',
    search: '',
  });

  // 1. TanStack Query : Chargement des éléments de la file
  const { data, isLoading } = useQuery({
    queryKey: ['verification-queue', filter],
    queryFn: async () => {
      return await getVerificationQueueAction(filter);
    },
  });

  const items = useMemo(() => data?.items || [], [data?.items]);
  const stats: VerificationStats = useMemo(
    () =>
      data?.stats || {
        total: 0,
        treated: 0,
        pending: 0,
        excluded: 0,
        suspiciousCount: 0,
      },
    [data?.stats]
  );

  // Sélection du premier élément par défaut : calculé dynamiquement
  const effectiveSelectedItemId = useMemo(() => {
    if (selectedItemId && items.some((i) => i.id === selectedItemId)) {
      return selectedItemId;
    }
    return items.length > 0 ? items[0].id : null;
  }, [items, selectedItemId]);

  const currentItem = useMemo(
    () => items.find((i) => i.id === effectiveSelectedItemId) || null,
    [items, effectiveSelectedItemId]
  );

  const activeItemIndex = useMemo(
    () => (effectiveSelectedItemId ? items.findIndex((i) => i.id === effectiveSelectedItemId) : -1),
    [items, effectiveSelectedItemId]
  );

  // 2. Mutation Optimiste : Arbitrage d'un champ douteux (Validate / Correct / Ignore)
  const fieldMutation = useMutation({
    mutationFn: async (params: {
      itemId: string;
      fieldKey: string;
      action: 'validate' | 'correct' | 'ignore';
      correctedValue?: any;
    }) => {
      return await updateDoubtfulFieldAction({
        ...params,
        simulateError,
      });
    },
    onMutate: async (newAction) => {
      await queryClient.cancelQueries({ queryKey: ['verification-queue', filter] });
      const previousData = queryClient.getQueryData<{
        items: VerificationItem[];
        stats: VerificationStats;
      }>(['verification-queue', filter]);

      // Optimistic update
      if (previousData) {
        const nextItems = previousData.items.map((item) => {
          if (item.id !== newAction.itemId) return item;
          const updatedFields = item.doubtfulFields.map((f) => {
            if (f.key !== newAction.fieldKey) return f;
            return {
              ...f,
              status:
                newAction.action === 'validate'
                  ? ('validated' as const)
                  : newAction.action === 'correct'
                  ? ('corrected' as const)
                  : ('ignored' as const),
              correctedValue: newAction.correctedValue,
            };
          });
          const allTreated = updatedFields.every((f) => f.status !== 'pending');
          return {
            ...item,
            doubtfulFields: updatedFields,
            status: allTreated ? ('treated' as const) : item.status,
          };
        });

        queryClient.setQueryData(['verification-queue', filter], {
          ...previousData,
          items: nextItems,
        });
      }

      return { previousData };
    },
    onError: (err: any, _newAction, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['verification-queue', filter], context.previousData);
      }
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la mise à jour (Rollback optimiste appliqué).',
      });
    },
    onSuccess: () => {
      setEditingFieldKey(null);
      setBannerMessage({
        type: 'success',
        text: 'Action validée et synchronisée avec succès.',
      });
      setTimeout(() => setBannerMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
  });

  // 3. Mutation Optimiste : Résolution de contenu suspect (Exclude / Confirm Clean)
  const suspiciousMutation = useMutation({
    mutationFn: async (params: {
      itemId: string;
      action: 'exclude' | 'confirm_clean';
      reason: string;
    }) => {
      return await resolveSuspiciousAction({
        ...params,
        simulateError,
      });
    },
    onMutate: async (newAction) => {
      await queryClient.cancelQueries({ queryKey: ['verification-queue', filter] });
      const previousData = queryClient.getQueryData<{
        items: VerificationItem[];
        stats: VerificationStats;
      }>(['verification-queue', filter]);

      if (previousData) {
        const nextItems = previousData.items.map((item) => {
          if (item.id !== newAction.itemId) return item;
          return {
            ...item,
            status: newAction.action === 'exclude' ? ('excluded' as const) : ('treated' as const),
            suspiciousDetails: item.suspiciousDetails
              ? {
                  ...item.suspiciousDetails,
                  mitigationStatus: newAction.action,
                  confirmationReason: newAction.reason,
                }
              : undefined,
          };
        });

        queryClient.setQueryData(['verification-queue', filter], {
          ...previousData,
          items: nextItems,
        });
      }

      return { previousData };
    },
    onError: (err: any, _newAction, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['verification-queue', filter], context.previousData);
      }
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la résolution de sécurité (Rollback optimiste appliqué).',
      });
    },
    onSuccess: (data: any) => {
      setSuspiciousReason('');
      setBannerMessage({
        type: 'success',
        text: 'Résolution de sécurité enregistrée dans le journal WORM.',
      });
      setTimeout(() => setBannerMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
  });

  // Navigation vers le prochain non traité
  const handleNextUntreated = useCallback(() => {
    const nextItem = items.find((i) => i.status === 'pending' && i.id !== selectedItemId);
    if (nextItem) {
      setSelectedItemId(nextItem.id);
      setActiveFieldIndex(0);
    }
  }, [items, selectedItemId]);

  // Raccourcis clavier (Navigation & Actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable;

      // ? : Guide des raccourcis
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        return;
      }

      // Échap : fermer fenêtre ou annuler édition
      if (e.key === 'Escape') {
        if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
          return;
        }
        if (editingFieldKey) {
          setEditingFieldKey(null);
          return;
        }
      }

      if (isInputFocused) return;

      // J ou Flèche bas : Élément suivant dans la file
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (activeItemIndex < items.length - 1) {
          setSelectedItemId(items[activeItemIndex + 1].id);
          setActiveFieldIndex(0);
        }
      }

      // K ou Flèche haut : Élément précédent
      if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (activeItemIndex > 0) {
          setSelectedItemId(items[activeItemIndex - 1].id);
          setActiveFieldIndex(0);
        }
      }

      // N : Prochain non traité
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextUntreated();
      }

      // Actions sur le champ actif si un élément est sélectionné
      if (currentItem && currentItem.doubtfulFields.length > 0) {
        const field = currentItem.doubtfulFields[activeFieldIndex];
        if (field) {
          // V : Valider la valeur
          if (e.key === 'v' || e.key === 'V') {
            e.preventDefault();
            fieldMutation.mutate({
              itemId: currentItem.id,
              fieldKey: field.key,
              action: 'validate',
            });
          }

          // C : Commencer à corriger
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            setEditingFieldKey(field.key);
            setEditValue(String(field.suggestedValue ?? field.currentValue ?? ''));
          }

          // I : Ignorer
          if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            fieldMutation.mutate({
              itemId: currentItem.id,
              fieldKey: field.key,
              action: 'ignore',
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    items,
    activeItemIndex,
    currentItem,
    activeFieldIndex,
    editingFieldKey,
    isShortcutsHelpOpen,
    handleNextUntreated,
    fieldMutation,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <TopBar
        blindMode={blindMode}
        onBlindModeToggle={() => setBlindMode(!blindMode)}
        currentFolderReference="#DE-2026"
      />

      <div className="flex flex-1">
        <Sidebar currentRole={role} folderCount={mockFolders.length} shortlistCount={3} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto w-full">
          {/* Notification Banner */}
          {bannerMessage && (
            <div
              className={cn(
                'p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all animate-in fade-in',
                bannerMessage.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-200'
              )}
            >
              <div className="flex items-center gap-2">
                {bannerMessage.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{bannerMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="hover:opacity-75"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* En-tête de la file */}
          <VerificationQueueHeader
            stats={stats}
            onNextUntreated={handleNextUntreated}
            onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
            simulateError={simulateError}
            onToggleSimulateError={() => setSimulateError(!simulateError)}
            onToggleTestPanel={() => setIsTestPanelOpen(!isTestPanelOpen)}
            isTestPanelOpen={isTestPanelOpen}
            hasPending={stats.pending > 0}
          />

          {/* Corps principal : 2 colonnes (Volet gauche + Zone centrale d'arbitrage côte à côte) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Colonne gauche (4 colonnes) : Liste & Filtres */}
            <div className="lg:col-span-4">
              <VerificationLeftPane
                items={items}
                selectedItemId={selectedItemId}
                onSelectItem={(id) => {
                  setSelectedItemId(id);
                  setActiveFieldIndex(0);
                }}
                filter={filter}
                onFilterChange={(newF) => setFilter(newF)}
                activeItemIndex={activeItemIndex}
              />
            </div>

            {/* Colonne droite (8 colonnes) : Zone centrale d'arbitrage côte à côte */}
            <div className="lg:col-span-8 space-y-4">
              {isLoading ? (
                <div className="h-[600px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs text-slate-500">Chargement des éléments de la file...</p>
                </div>
              ) : !currentItem ? (
                <div className="h-[500px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Tous les éléments sont traités
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Aucun profil ne nécessite d'arbitrage avec les filtres sélectionnés.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter({ motif: 'all', folderId: 'all', status: 'all', dateRange: 'all', search: '' })}
                    className="text-xs"
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bandeau d'en-tête du candidat sélectionné */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-sm text-indigo-700 dark:text-indigo-300">
                        {currentItem.pseudonym.replace('Candidat #', '#')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {currentItem.pseudonym}
                          </h2>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {currentItem.folderReference}
                          </Badge>
                          <Badge
                            variant={
                              currentItem.status === 'treated'
                                ? 'success'
                                : currentItem.status === 'excluded'
                                ? 'destructive'
                                : 'warning'
                            }
                            className="text-[10px]"
                          >
                            {currentItem.status === 'treated'
                              ? 'Traité'
                              : currentItem.status === 'excluded'
                              ? 'Exclu'
                              : 'En attente'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{currentItem.folderTitle}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] truncate max-w-[200px]">
                            {currentItem.hashId.slice(0, 20)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsShortcutsHelpOpen(true)}
                        className="text-xs h-8 gap-1.5"
                        title="Guide des raccourcis (?)"
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Raccourcis</span>
                        <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">?</kbd>
                      </Button>
                    </div>
                  </div>

                  {/* ALERTE SPÉCIALE : Détection de prompt injection ou contenu suspect */}
                  {currentItem.motif === 'contenu_suspect' && currentItem.suspiciousDetails && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-xl p-5 shadow-xs space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 flex items-center gap-2">
                              Alerte de Sécurité IA · {currentItem.suspiciousDetails.threatDescription}
                            </h3>
                            <Badge variant="destructive" className="text-[10px] font-bold tracking-wide uppercase">
                              Risque Critique
                            </Badge>
                          </div>
                          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                            {currentItem.summary}
                          </p>
                        </div>
                      </div>

                      {/* Extrait injecté détecté */}
                      <div className="bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-800 rounded-lg p-3 font-mono text-xs text-rose-900 dark:text-rose-200 space-y-1">
                        <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                          Payload suspect intercepté :
                        </div>
                        <div className="bg-rose-50/70 dark:bg-rose-950/70 p-2 rounded border border-rose-200 dark:border-rose-900">
                          {currentItem.suspiciousDetails.detectedText}
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1">
                          Méthode de détection : {currentItem.suspiciousDetails.detectionMethod}
                        </div>
                      </div>

                      {/* Arbitrage de sécurité */}
                      <div className="pt-2 border-t border-rose-200 dark:border-rose-900/80 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Motif d'arbitrage de sécurité (consigné au registre WORM) :
                          </label>
                          <Input
                            placeholder="Ex: Tentative délibérée de forcer le matching IA via texte blanc sur blanc..."
                            value={suspiciousReason}
                            onChange={(e) => setSuspiciousReason(e.target.value)}
                            className="text-xs bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={suspiciousMutation.isPending}
                            onClick={() =>
                              suspiciousMutation.mutate({
                                itemId: currentItem.id,
                                action: 'exclude',
                                reason: suspiciousReason || 'Exclusion suite à tentative de prompt injection avérée',
                              })
                            }
                            className="text-xs gap-1.5 shadow-sm"
                          >
                            <UserX className="w-4 h-4" />
                            Exclure le candidat du vivier
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={suspiciousMutation.isPending}
                            onClick={() =>
                              suspiciousMutation.mutate({
                                itemId: currentItem.id,
                                action: 'confirm_clean',
                                reason: suspiciousReason || 'Faux positif vérifié manuellement par le recruteur',
                              })
                            }
                            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950 gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Confirmer l'innocuité (Faux positif)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disposition côte à côte : Visionneuse SVG à gauche + Fiche d'arbitrage à droite */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Volet A : Visionneuse de document vectoriel avec Bounding Boxes */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[560px]">
                      {/* Barre d'outils visionneuse */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Document scellé · Page 1/{currentItem.documentPageCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            title="Zoom arrière"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono px-1">{zoomLevel}%</span>
                          <button
                            type="button"
                            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            title="Zoom avant"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rendu Document avec superposition des Bounding Boxes */}
                      <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-auto flex items-center justify-center">
                        <div
                          className="relative bg-white text-slate-900 shadow-xl border border-slate-300 dark:border-slate-700 rounded-sm w-[420px] min-h-[500px] p-6 text-xs select-none transition-transform duration-200"
                          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                        >
                          {/* En-tête document simulé */}
                          <div className="border-b border-slate-200 pb-3 mb-4 flex justify-between items-start">
                            <div>
                              <div className="text-base font-bold text-slate-900">
                                {currentItem.pseudonym}
                              </div>
                              <div className="text-[11px] text-indigo-600 font-medium">
                                {currentItem.folderTitle}
                              </div>
                            </div>
                            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              CAVIARDÉ
                            </div>
                          </div>

                          {/* Corps du CV avec surlignage des bboxes */}
                          <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed">
                            <div className="font-semibold text-slate-900 text-xs border-b pb-0.5">
                              RÉSUMÉ DU PROFIL
                            </div>
                            <p className="text-slate-600">
                              {currentItem.anonymizedSnippet}
                            </p>

                            <div className="font-semibold text-slate-900 text-xs border-b pb-0.5 pt-2">
                              EXPÉRIENCES &amp; PARCOURS
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="font-bold text-slate-800">Lead Ingénieur Données</span> · FinTech Licorne
                                <div className="text-[10px] text-slate-500">2021 - Présent (3 ans)</div>
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">Senior Data Engineer</span> · Plateforme E-Commerce
                                <div className="text-[10px] text-slate-500">2018 - 2021 (3 ans)</div>
                              </div>
                            </div>

                            <div className="font-semibold text-slate-900 text-xs border-b pb-0.5 pt-2">
                              CONDITIONS &amp; DISPONIBILITÉ
                            </div>
                            <div className="text-[10px] space-y-1">
                              <div>Rémunération souhaitée : 68k - 75k €</div>
                              <div>Disponibilité : 1 mois (Négociable)</div>
                            </div>
                          </div>

                          {/* Bounding Boxes interactives superposées */}
                          {currentItem.doubtfulFields.map((field) => {
                            if (!field.bbox) return null;
                            const isHovered = hoveredBboxId === field.bbox.id;
                            const isPending = field.status === 'pending';

                            return (
                              <div
                                key={field.bbox.id}
                                onMouseEnter={() => setHoveredBboxId(field.bbox!.id)}
                                onMouseLeave={() => setHoveredBboxId(null)}
                                className={cn(
                                  'absolute rounded transition-all cursor-pointer border-2',
                                  isPending
                                    ? isHovered
                                      ? 'bg-amber-400/30 border-amber-600 shadow-md ring-2 ring-amber-400'
                                      : 'bg-amber-300/20 border-amber-500 animate-pulse'
                                    : 'bg-emerald-300/20 border-emerald-500'
                                )}
                                style={{
                                  left: `${field.bbox.x}%`,
                                  top: `${field.bbox.y}%`,
                                  width: `${field.bbox.width}%`,
                                  height: `${field.bbox.height}%`,
                                }}
                              >
                                <span className="absolute -top-4 left-0 text-[9px] font-bold px-1 rounded bg-amber-500 text-white leading-none py-0.5 whitespace-nowrap shadow-xs">
                                  {field.label} ({field.confidence}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Volet B : Fiche d'arbitrage interactive des champs */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col h-[560px] overflow-hidden">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              Champs douteux à arbitrer ({currentItem.doubtfulFields.length})
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Validez ou rectifiez la donnée extraite par l'analyseur IA.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
                        {currentItem.doubtfulFields.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                            <p className="text-xs">Aucun champ douteux sur ce dossier.</p>
                          </div>
                        ) : (
                          currentItem.doubtfulFields.map((field, idx) => {
                            const isEditing = editingFieldKey === field.key;
                            const isPending = field.status === 'pending';
                            const isCurrentActive = activeFieldIndex === idx;

                            return (
                              <div
                                key={field.key}
                                onClick={() => setActiveFieldIndex(idx)}
                                onMouseEnter={() => field.bbox && setHoveredBboxId(field.bbox.id)}
                                onMouseLeave={() => setHoveredBboxId(null)}
                                className={cn(
                                  'border rounded-xl p-3.5 transition-all text-xs space-y-2.5',
                                  isCurrentActive
                                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {field.label}
                                    </span>
                                    <Badge
                                      variant={
                                        field.status === 'validated'
                                          ? 'success'
                                          : field.status === 'corrected'
                                          ? 'secondary'
                                          : field.status === 'ignored'
                                          ? 'outline'
                                          : 'warning'
                                      }
                                      className="text-[9px] uppercase font-bold"
                                    >
                                      {field.status === 'validated'
                                        ? 'Validé'
                                        : field.status === 'corrected'
                                        ? 'Rectifié'
                                        : field.status === 'ignored'
                                        ? 'Ignoré'
                                        : 'À vérifier'}
                                    </Badge>
                                  </div>

                                  <span className="text-[11px] font-mono text-slate-500">
                                    Confiance : {field.confidence}%
                                  </span>
                                </div>

                                {/* Motif d'incertitude */}
                                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-900 flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{field.issue}</span>
                                </div>

                                {/* Valeurs (Actuelle vs Suggérée) */}
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Valeur extraite</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 break-words">
                                      {String(field.currentValue || '—')}
                                    </div>
                                  </div>

                                  <div className="p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                                    <div className="text-[10px] text-indigo-500 font-semibold mb-0.5">Proposition IA</div>
                                    <div className="font-bold text-indigo-900 dark:text-indigo-200 break-words">
                                      {String(field.suggestedValue || '—')}
                                    </div>
                                  </div>
                                </div>

                                {/* Mode Édition en ligne */}
                                {isEditing ? (
                                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                      Saisir la valeur corrigée :
                                    </div>
                                    <Input
                                      autoFocus
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="text-xs h-8"
                                      placeholder="Nouvelle valeur..."
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingFieldKey(null)}
                                        className="h-7 text-xs"
                                      >
                                        Annuler
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          fieldMutation.mutate({
                                            itemId: currentItem.id,
                                            fieldKey: field.key,
                                            action: 'correct',
                                            correctedValue: editValue,
                                          })
                                        }
                                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Enregistrer
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Boutons d'action : Valider / Corriger / Ignorer */
                                  <div className="flex items-center justify-end gap-1.5 pt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={fieldMutation.isPending}
                                      onClick={() =>
                                        fieldMutation.mutate({
                                          itemId: currentItem.id,
                                          fieldKey: field.key,
                                          action: 'ignore',
                                        })
                                      }
                                      className="h-7 text-[11px] text-slate-600 hover:text-slate-800 dark:text-slate-400"
                                      title="Raccourci : touche I"
                                    >
                                      Ignorer (I)
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={fieldMutation.isPending}
                                      onClick={() => {
                                        setEditingFieldKey(field.key);
                                        setEditValue(String(field.suggestedValue ?? field.currentValue ?? ''));
                                      }}
                                      className="h-7 text-[11px] gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                                      title="Raccourci : touche C"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      Corriger (C)
                                    </Button>

                                    <Button
                                      size="sm"
                                      disabled={fieldMutation.isPending}
                                      onClick={() =>
                                        fieldMutation.mutate({
                                          itemId: currentItem.id,
                                          fieldKey: field.key,
                                          action: 'validate',
                                          correctedValue: field.suggestedValue ?? field.currentValue,
                                        })
                                      }
                                      className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                      title="Raccourci : touche V"
                                    >
                                      <Check className="w-3 h-3" />
                                      Valider (V)
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Pied de volet avec bouton "Élément suivant" */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {currentItem.doubtfulFields.filter((f) => f.status !== 'pending').length}/
                          {currentItem.doubtfulFields.length} champ(s) résolu(s)
                        </span>

                        <Button
                          size="sm"
                          onClick={handleNextUntreated}
                          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Guide des raccourcis clavier (Modal) */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
