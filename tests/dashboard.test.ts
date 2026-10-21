import { describe, it, expect } from 'vitest';
import {
  getDashboardKpis,
  getActionsRequired,
  getRecentFolders,
  getPipelineStageStats,
  getAnonymousRecentActivity,
  getAiConsumption,
} from '@/lib/dashboard/data';
import { hasPermission } from '@/lib/permissions/rbac';

describe('Tableau de bord / (Dashboard) - Données, Rôles & Résilience', () => {
  // Test 1 : Rendu par rôle - Admin
  it('1. Rôle Admin : KPIs complets, consommation IA et droit d’importation', async () => {
    const kpis = await getDashboardKpis('admin');
    expect(kpis).toHaveLength(4);
    expect(kpis.map((k) => k.id)).toEqual([
      'kpi-cv-month',
      'kpi-pipeline',
      'kpi-lead-time',
      'kpi-quality',
    ]);

    const ai = await getAiConsumption('admin');
    expect(ai).not.toBeNull();
    expect(ai?.tokensUsed).toBeGreaterThan(0);
    expect(ai?.modelBreakdown).toHaveLength(2);

    const canImport = hasPermission('admin', 'canImportCv');
    expect(canImport).toBe(true);
  });

  // Test 2 : Rendu par rôle - DPO
  it('2. Rôle DPO : KPIs axés RGPD, alertes Art. 17 et pas d’importation de CV', async () => {
    const kpis = await getDashboardKpis('dpo');
    expect(kpis).toHaveLength(4);
    expect(kpis.map((k) => k.id)).toEqual([
      'kpi-dsr-open',
      'kpi-dsr-late',
      'kpi-dsr-30d',
      'kpi-breaches',
    ]);
    expect(kpis[0].label).toContain('Demandes RGPD');
    expect(kpis[1].value).toBe(0); // 0 retard

    const canImport = hasPermission('dpo', 'canImportCv');
    expect(canImport).toBe(false);
  });

  // Test 3 : Rendu par rôle - Lecteur (Reader)
  it('3. Rôle Lecteur : pas de consommation IA ni d’importation de CV', async () => {
    const kpis = await getDashboardKpis('reader');
    expect(kpis).toHaveLength(4);
    expect(kpis.map((k) => k.id)).toEqual([
      'kpi-folders-accessible',
      'kpi-candidates-vivier',
      'kpi-avg-score',
      'kpi-time-qualification',
    ]);

    // Consommation IA STRICTEMENT masquée pour le rôle Lecteur
    const ai = await getAiConsumption('reader');
    expect(ai).toBeNull();

    // Pas de permission d'import
    const canImport = hasPermission('reader', 'canImportCv');
    expect(canImport).toBe(false);
  });

  // Test 4 : Garantie Zéro PII dans l'activité récente
  it('4. Activité récente : zéro PII (uniquement des pseudonymes et références anonymes)', async () => {
    const activity = await getAnonymousRecentActivity();
    expect(activity.length).toBeGreaterThan(0);

    activity.forEach((item) => {
      // Vérifier l'absence de noms civils ou emails
      expect(item.description).not.toMatch(/@/); // Pas d'email
      expect(item.description).not.toMatch(/0[1-9](\s?\d{2}){4}/); // Pas de numéro de tél français
      expect(item.title).not.toMatch(/Lucas|Alexandre|Marc|Idriss/i); // Pas de prénoms en clair
      // Doit contenir des pseudonymes si mentionné
      if (item.pseudonymRef) {
        expect(item.pseudonymRef).toMatch(/^#(CYB|DE|A1B2|DSR)/);
      }
    });
  });

  // Test 5 : Distribution des candidats pour Recharts
  it('5. Pipeline Recharts : répartition par étape ordonnée', async () => {
    const stats = await getPipelineStageStats();
    expect(stats).toHaveLength(6);
    stats.forEach((stg) => {
      expect(stg.stageName).toBeTruthy();
      expect(stg.count).toBeGreaterThanOrEqual(0);
      expect(stg.color).toMatch(/^#/);
    });
  });

  // Test 6 : États vides pour chaque bloc
  it('6. Gestion des états vides pour tous les blocs du tableau de bord', async () => {
    const emptyKpis = await getDashboardKpis('admin', { isEmpty: true });
    expect(emptyKpis).toEqual([]);

    const emptyActions = await getActionsRequired({ isEmpty: true });
    expect(emptyActions).toEqual([]);

    const emptyFolders = await getRecentFolders({ isEmpty: true });
    expect(emptyFolders).toEqual([]);

    const emptyPipeline = await getPipelineStageStats({ isEmpty: true });
    expect(emptyPipeline).toEqual([]);

    const emptyActivity = await getAnonymousRecentActivity({ isEmpty: true });
    expect(emptyActivity).toEqual([]);
  });

  // Test 7 : Erreur partielle d'un bloc sans affecter les autres
  it('7. Résilience : la panne d’un bloc n’écrase pas les autres sections', async () => {
    // Bloc KPI en échec
    let kpiError: Error | null = null;
    try {
      await getDashboardKpis('admin', { shouldFail: true });
    } catch (e) {
      kpiError = e as Error;
    }
    expect(kpiError).not.toBeNull();
    expect(kpiError?.message).toContain('Erreur de chargement des KPI');

    // Les autres blocs fonctionnent indépendamment en parallèle
    const [actions, folders, pipeline, activity] = await Promise.all([
      getActionsRequired(),
      getRecentFolders(),
      getPipelineStageStats(),
      getAnonymousRecentActivity(),
    ]);

    expect(actions.length).toBeGreaterThan(0);
    expect(folders.length).toBeGreaterThan(0);
    expect(pipeline.length).toBeGreaterThan(0);
    expect(activity.length).toBeGreaterThan(0);
  });
});
