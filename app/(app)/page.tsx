import React, { Suspense } from 'react';
import type { Role } from '@/types';
import { Shield, Sparkles, Building2, User } from 'lucide-react';
import { getServerCurrentUser } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/rbac';
import { ROLE_LABELS } from '@/lib/mock/data/invitations';

// Blocs asynchrones du tableau de bord
import { KpiSection } from '@/components/dashboard/kpi-section';
import { ActionsRequiredSection } from '@/components/dashboard/actions-required-section';
import { RecentFoldersSection } from '@/components/dashboard/recent-folders-section';
import { PipelineSection } from '@/components/dashboard/pipeline-section';
import { RecentActivitySection } from '@/components/dashboard/recent-activity-section';
import { AiConsumptionSection } from '@/components/dashboard/ai-consumption-section';

// Squelettes de chargement indépendants
import {
  KpiCardsSkeleton,
  ActionsRequiredSkeleton,
  RecentFoldersSkeleton,
  PipelineChartSkeleton,
  RecentActivitySkeleton,
  AiConsumptionSkeleton,
} from '@/components/dashboard/dashboard-skeletons';

// Composants interactifs & Error Boundary isolé
import { BlockErrorBoundary } from '@/components/dashboard/block-error-boundary';
import { ImportCvDialog } from '@/components/dashboard/import-cv-dialog';

interface DashboardPageProps {
  searchParams?: Promise<{
    role?: Role;
    mock_role?: Role;
    error_block?: string;
    empty_block?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // 1. Résolution de l'utilisateur et du rôle courant côté serveur
  const serverUser = await getServerCurrentUser();
  const resolvedParams = searchParams ? await searchParams : {};
  const activeRole: Role =
    resolvedParams.role || resolvedParams.mock_role || serverUser?.role || 'admin';

  // 2. Contrôle d'habilitation pour le bouton principal d'import
  const canImport = hasPermission(activeRole, 'canImportCv');

  // 3. Drapeaux de test pour validation des états vides et erreurs partielles
  const isKpiError = resolvedParams.error_block === 'kpi';
  const isKpiEmpty = resolvedParams.empty_block === 'kpi';
  const isActionsError = resolvedParams.error_block === 'actions';
  const isActionsEmpty = resolvedParams.empty_block === 'actions';
  const isFoldersError = resolvedParams.error_block === 'folders';
  const isFoldersEmpty = resolvedParams.empty_block === 'folders';
  const isPipelineError = resolvedParams.error_block === 'pipeline';
  const isPipelineEmpty = resolvedParams.empty_block === 'pipeline';
  const isActivityError = resolvedParams.error_block === 'activity';
  const isActivityEmpty = resolvedParams.empty_block === 'activity';
  const isAiError = resolvedParams.error_block === 'ai';

  const roleLabel = ROLE_LABELS[activeRole] || activeRole;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête principal du tableau de bord */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Tableau de bord</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Mode Aveugle Actif
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pilotage du recrutement prédictif et garanties d’anonymisation RGPD · Cabinet Horizon RH
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge de rôle actif */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300">
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Profil :</span>
            <strong className="text-white">{roleLabel}</strong>
          </div>

          {/* Bouton principal « Importer des CV » soumis à permission canImportCv */}
          {canImport && <ImportCvDialog buttonText="Importer des CV" />}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOC 1 : KPI DU TABLEAU DE BORD (Variante Rôle / DPO / Lecteur) */}
      {/* ========================================================================= */}
      <BlockErrorBoundary title="Indicateurs de performance indisponibles">
        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiSection
            role={activeRole}
            simulateError={isKpiError}
            simulateEmpty={isKpiEmpty}
          />
        </Suspense>
      </BlockErrorBoundary>

      {/* ========================================================================= */}
      {/* BLOC 2 : ACTIONS REQUISES & DOSSIERS RÉCENTS (Grille 2 Colonnes) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions requises (Vérifications CV, RGPD, Imports en cours Realtime) */}
        <BlockErrorBoundary title="Actions requises indisponibles">
          <Suspense fallback={<ActionsRequiredSkeleton />}>
            <ActionsRequiredSection
              simulateError={isActionsError}
              simulateEmpty={isActionsEmpty}
            />
          </Suspense>
        </BlockErrorBoundary>

        {/* Dossiers récents de recrutement */}
        <BlockErrorBoundary title="Dossiers récents indisponibles">
          <Suspense fallback={<RecentFoldersSkeleton />}>
            <RecentFoldersSection
              simulateError={isFoldersError}
              simulateEmpty={isFoldersEmpty}
            />
          </Suspense>
        </BlockErrorBoundary>
      </div>

      {/* ========================================================================= */}
      {/* BLOC 3 : CANDIDATS PAR ÉTAPE (RECHARTS) & ACTIVITÉ RÉCENTE SANS PII */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de distribution par étape */}
        <BlockErrorBoundary title="Graphique du pipeline indisponible">
          <Suspense fallback={<PipelineChartSkeleton />}>
            <PipelineSection
              simulateError={isPipelineError}
              simulateEmpty={isPipelineEmpty}
            />
          </Suspense>
        </BlockErrorBoundary>

        {/* Activité récente (flux 100% anonymisé) */}
        <BlockErrorBoundary title="Journal d'activité indisponible">
          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivitySection
              simulateError={isActivityError}
              simulateEmpty={isActivityEmpty}
            />
          </Suspense>
        </BlockErrorBoundary>
      </div>

      {/* ========================================================================= */}
      {/* BLOC 4 : CONSOMMATION IA DU MOIS (Masqué pour le profil Lecteur) */}
      {/* ========================================================================= */}
      {activeRole !== 'reader' && activeRole !== 'viewer' && (
        <BlockErrorBoundary title="Consommation IA indisponible">
          <Suspense fallback={<AiConsumptionSkeleton />}>
            <AiConsumptionSection
              role={activeRole}
              simulateError={isAiError}
            />
          </Suspense>
        </BlockErrorBoundary>
      )}
    </div>
  );
}
