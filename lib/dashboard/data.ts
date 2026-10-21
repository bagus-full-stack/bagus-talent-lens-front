import type { Role, Folder, PipelineStage } from '@/types';
import { mockFolders } from '@/lib/mock/data/folders';
import { mockCandidacies, mockPipelineStages } from '@/lib/mock/data/pipeline';
import { mockDsrRequests } from '@/lib/mock/data/dsr';
import { mockAuditEvents } from '@/lib/mock/data/audit';
import { mockOrganization } from '@/lib/mock/data/organizations';

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  helperText: string;
  iconName: 'file-text' | 'users' | 'clock' | 'sparkles' | 'shield' | 'alert-triangle' | 'calendar' | 'check-circle';
}

export interface ActionRequiredItem {
  id: string;
  type: 'cv_verification' | 'dsr_request' | 'import_in_progress';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  folderRef?: string;
  date: string;
  actionUrl: string;
  actionLabel: string;
}

export interface AnonymousActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'cv' | 'audit' | 'export' | 'folder' | 'dsr';
  pseudonymRef?: string;
}

export interface PipelineStageStat {
  stageId: string;
  stageName: string;
  count: number;
  color: string;
}

export interface AiConsumptionStats {
  tokensUsed: number;
  tokensLimit: number;
  percentageUsed: number;
  estimatedCostEur: number;
  modelBreakdown: {
    model: string;
    task: string;
    tokens: number;
    pct: number;
  }[];
}

/**
 * 1. KPI du tableau de bord selon le rôle de l'utilisateur
 */
export async function getDashboardKpis(
  role: Role,
  options?: { shouldFail?: boolean; isEmpty?: boolean },
): Promise<DashboardKpiItem[]> {
  // Simulation de latence asynchrone réaliste
  await new Promise((resolve) => setTimeout(resolve, 60));

  if (options?.shouldFail) {
    throw new Error('Erreur de chargement des KPI du tableau de bord.');
  }

  if (options?.isEmpty) {
    return [];
  }

  // Variante DPO : Métriques orientées gouvernance et conformité RGPD
  if (role === 'dpo') {
    return [
      {
        id: 'kpi-dsr-open',
        label: 'Demandes RGPD ouvertes',
        value: 2,
        change: '-1 cette semaine',
        changeType: 'positive',
        helperText: 'Droits d’accès & effacement Art. 17',
        iconName: 'shield',
      },
      {
        id: 'kpi-dsr-late',
        label: 'Demandes en retard',
        value: 0,
        change: '0% de retard (100% conformité)',
        changeType: 'positive',
        helperText: 'Délai légal strict CNIL de 30 jours',
        iconName: 'check-circle',
      },
      {
        id: 'kpi-dsr-30d',
        label: 'Échéances à moins de 30j',
        value: 2,
        change: '1 échéance sous 72h (#DSR-089)',
        changeType: 'negative',
        helperText: 'Nécessite double validation DPO',
        iconName: 'calendar',
      },
      {
        id: 'kpi-breaches',
        label: 'Violations signalées',
        value: 0,
        change: 'Intégrité WORM vérifiée',
        changeType: 'positive',
        helperText: 'Registre Art. 33 vierge',
        iconName: 'check-circle',
      },
    ];
  }

  // Variante Lecteur : Consultation sans données de consommation ni d'import
  if (role === 'reader' || role === 'viewer') {
    return [
      {
        id: 'kpi-folders-accessible',
        label: 'Dossiers partagés',
        value: mockFolders.length,
        change: 'Accès en lecture seule',
        changeType: 'neutral',
        helperText: 'Dossiers actifs assignés',
        iconName: 'file-text',
      },
      {
        id: 'kpi-candidates-vivier',
        label: 'Candidatures consultables',
        value: mockCandidacies.length,
        change: 'Profils anonymisés',
        changeType: 'neutral',
        helperText: 'Mode aveugle strict permanent',
        iconName: 'users',
      },
      {
        id: 'kpi-avg-score',
        label: 'Score moyen vivier',
        value: '91.8%',
        change: '+2.4 pts',
        changeType: 'positive',
        helperText: 'Pertinence des profils shortlistés',
        iconName: 'sparkles',
      },
      {
        id: 'kpi-time-qualification',
        label: 'Délai moyen d’arbitrage',
        value: '4.2 jours',
        change: '-0.8j',
        changeType: 'positive',
        helperText: 'Entre soumission et shortlist',
        iconName: 'clock',
      },
    ];
  }

  // Variante Standard (Admin, Recruteur, Propriétaire)
  return [
    {
      id: 'kpi-cv-month',
      label: 'CV traités ce mois',
      value: 142,
      change: '+18% vs mois précédent',
      changeType: 'positive',
      helperText: 'Parsing et détection PII automatique',
      iconName: 'file-text',
    },
    {
      id: 'kpi-pipeline',
      label: 'Candidats en pipeline',
      value: mockCandidacies.length,
      change: '8 en phase d’entretien',
      changeType: 'neutral',
      helperText: 'Répartis sur 3 dossiers prioritaires',
      iconName: 'users',
    },
    {
      id: 'kpi-lead-time',
      label: 'Délai moyen de qualification',
      value: '3.8 jours',
      change: '-1.2j d’accélération',
      changeType: 'positive',
      helperText: 'Gain de 40% grâce au mode aveugle',
      iconName: 'clock',
    },
    {
      id: 'kpi-quality',
      label: 'Qualité d’extraction IA',
      value: '98.4%',
      change: '+0.6% de précision',
      changeType: 'positive',
      helperText: 'Audit de fiabilité et cohérence RAG',
      iconName: 'sparkles',
    },
  ];
}

/**
 * 2. Actions requises (Revue humaine, RGPD, Imports)
 */
export async function getActionsRequired(options?: {
  shouldFail?: boolean;
  isEmpty?: boolean;
}): Promise<ActionRequiredItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  if (options?.shouldFail) {
    throw new Error('Impossible de charger les actions requises.');
  }

  if (options?.isEmpty) {
    return [];
  }

  return [
    {
      id: 'act-cv-01',
      type: 'cv_verification',
      title: 'Vérification d’extraction CV requise',
      description: 'Candidat #A1B2 : incertitude sur la date d’obtention du diplôme d’ingénieur.',
      severity: 'high',
      folderRef: '#DE-2026',
      date: 'Reçu il y a 2h',
      actionUrl: '/dossiers/fld-de-2026',
      actionLabel: 'Examiner le CV',
    },
    {
      id: 'act-dsr-01',
      type: 'dsr_request',
      title: 'Demande d’effacement Art. 17 (DSR-089)',
      description: 'Échéance légale CNIL dans 72h. Double validation DPO requise.',
      severity: 'high',
      folderRef: '#DE-2026',
      date: 'Échéance : 05/10/2026',
      actionUrl: '/rgpd',
      actionLabel: 'Traiter la demande',
    },
    {
      id: 'act-import-01',
      type: 'import_in_progress',
      title: 'Lot de 5 CV en cours d’indexation vectorielle',
      description: 'Dossier #CYB-88 : Vectorisation Milvus et masquage PII en cours.',
      severity: 'medium',
      folderRef: '#CYB-88',
      date: 'En cours (80%)',
      actionUrl: '/dossiers/fld-cyb-88',
      actionLabel: 'Voir le statut',
    },
  ];
}

/**
 * 3. Dossiers récents de recrutement
 */
export async function getRecentFolders(options?: {
  shouldFail?: boolean;
  isEmpty?: boolean;
}): Promise<Folder[]> {
  await new Promise((resolve) => setTimeout(resolve, 70));

  if (options?.shouldFail) {
    throw new Error('Échec du chargement des dossiers récents.');
  }

  if (options?.isEmpty) {
    return [];
  }

  return mockFolders.slice(0, 4);
}

/**
 * 4. Distribution des candidats par étape du pipeline (Recharts)
 */
export async function getPipelineStageStats(options?: {
  shouldFail?: boolean;
  isEmpty?: boolean;
}): Promise<PipelineStageStat[]> {
  await new Promise((resolve) => setTimeout(resolve, 75));

  if (options?.shouldFail) {
    throw new Error('Erreur de récupération des étapes du pipeline.');
  }

  if (options?.isEmpty) {
    return [];
  }

  // Comptage dynamique basé sur mockCandidacies
  const stageCounts: Record<string, number> = {
    'stg-1': 8, // Sourcing
    'stg-2': 11, // Présélectionné
    'stg-3': 5, // Entretien RH
    'stg-4': 3, // Test Tech
    'stg-5': 2, // Entretien Client
    'stg-6': 1, // Offre
  };

  const colors: Record<string, string> = {
    'stg-1': '#3b82f6', // blue
    'stg-2': '#6366f1', // indigo
    'stg-3': '#f59e0b', // amber
    'stg-4': '#8b5cf6', // purple
    'stg-5': '#0ea5e9', // sky
    'stg-6': '#10b981', // emerald
  };

  return mockPipelineStages.slice(0, 6).map((stg) => ({
    stageId: stg.id,
    stageName: stg.name.replace(/^\d+\.\s*/, ''), // Sans le préfixe numérique
    count: stageCounts[stg.id] ?? 2,
    color: colors[stg.id] || '#6366f1',
  }));
}

/**
 * 5. Activité récente 100% ANONYME (Règle d'or : aucune donnée nominative PII)
 */
export async function getAnonymousRecentActivity(options?: {
  shouldFail?: boolean;
  isEmpty?: boolean;
}): Promise<AnonymousActivityItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 85));

  if (options?.shouldFail) {
    throw new Error('Impossible de charger le flux d’activité.');
  }

  if (options?.isEmpty) {
    return [];
  }

  return [
    {
      id: 'act-01',
      title: 'Nouveau CV indexé et anonymisé',
      description: 'Profil enregistré sous le pseudonyme #CYB-88-B4 avec un score d’adéquation de 94%.',
      timestamp: 'Il y a 14 minutes',
      type: 'cv',
      pseudonymRef: '#CYB-88-B4',
    },
    {
      id: 'act-02',
      title: 'Export anonymisé de shortlist validé',
      description: 'Génération de la synthèse aveugle des 5 meilleurs profils pour le dossier #DE-2026.',
      timestamp: 'Il y a 1 heure',
      type: 'export',
      pseudonymRef: '#DE-2026',
    },
    {
      id: 'act-03',
      title: 'Étape franchie dans le pipeline',
      description: 'Candidat #A1B2 promu en phase « Test Technique » sans démasquage.',
      timestamp: 'Il y a 3 heures',
      type: 'cv',
      pseudonymRef: '#A1B2',
    },
    {
      id: 'act-04',
      title: 'Demande RGPD vérifiée',
      description: 'Demande d’effacement #DSR-2026-089 vérifiée et transmise pour arbitrage DPO.',
      timestamp: 'Il y a 5 heures',
      type: 'dsr',
      pseudonymRef: '#DSR-2026-089',
    },
    {
      id: 'act-05',
      title: 'Scellage d’audit immuable WORM',
      description: 'Horodatage SHA-256 consigné dans le registre de conformité pour 14 opérations.',
      timestamp: 'Hier à 18h30',
      type: 'audit',
    },
  ];
}

/**
 * 6. Consommation IA du mois (Masquée pour le rôle Lecteur)
 */
export async function getAiConsumption(
  role: Role,
  options?: { shouldFail?: boolean },
): Promise<AiConsumptionStats | null> {
  // Masqué pour le rôle Lecteur
  if (role === 'reader' || role === 'viewer') {
    return null;
  }

  await new Promise((resolve) => setTimeout(resolve, 65));

  if (options?.shouldFail) {
    throw new Error('Erreur de récupération des données de consommation IA.');
  }

  const tokensUsed = mockOrganization.aiTokensUsed; // 412 500
  const tokensLimit = mockOrganization.aiQuotaLimit; // 500 000
  const percentageUsed = Math.round((tokensUsed / tokensLimit) * 100);

  return {
    tokensUsed,
    tokensLimit,
    percentageUsed,
    estimatedCostEur: 41.25,
    modelBreakdown: [
      {
        model: 'Gemini 1.5 Flash (Parsing CV & Anonymisation PII)',
        task: 'Détection PII, caviardage dynamique et extraction structurée',
        tokens: 245000,
        pct: 59,
      },
      {
        model: 'Gemini 1.5 Pro (Matching Prédictif & Scoring)',
        task: 'Scoring sémantique, explication des critères et analyse de gaps',
        tokens: 167500,
        pct: 41,
      },
    ],
  };
}
