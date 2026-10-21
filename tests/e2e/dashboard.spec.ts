import { test, expect } from '@playwright/test';

test.describe('Tableau de bord / (Dashboard) - E2E Multi-rôles & Résilience', () => {
  // Scénario 1 : Affichage complet pour le profil Admin
  test('1. Profil Admin : Dashboard complet avec bouton d’import, KPIs, graphique Recharts et consommation IA', async ({ page }) => {
    await page.goto('/');

    // En-tête et titre
    await expect(page.locator('h1')).toContainText('Tableau de bord');
    await expect(page.locator('body')).toContainText('Mode Aveugle Actif');
    await expect(page.locator('body')).toContainText('Administrateur');

    // Bouton principal d'import de CV présent pour l'admin
    const importBtn = page.getByRole('button', { name: /Importer des CV/i });
    await expect(importBtn).toBeVisible();

    // KPIs standards
    await expect(page.locator('body')).toContainText('CV traités ce mois');
    await expect(page.locator('body')).toContainText('Candidats en pipeline');
    await expect(page.locator('body')).toContainText('Délai moyen de qualification');

    // Bloc Actions requises & Imports en direct (Realtime)
    await expect(page.locator('body')).toContainText('Actions requises & Alertes');
    await expect(page.locator('body')).toContainText('import(s) en cours d\'indexation');

    // Dossiers récents
    await expect(page.locator('body')).toContainText('Dossiers récents de recrutement');
    await expect(page.locator('body')).toContainText('Data Engineer Paris');

    // Graphique Recharts par étape
    await expect(page.locator('body')).toContainText('Répartition des candidats par étape');

    // Activité récente anonyme
    await expect(page.locator('body')).toContainText('Activité récente (Flux Anonymisé)');
    await expect(page.locator('body')).toContainText('Garantie Zéro PII');

    // Consommation IA du mois (visible pour l'admin)
    await expect(page.locator('body')).toContainText('Consommation IA du mois');
    await expect(page.locator('body')).toContainText('Gemini 1.5 Flash');
  });

  // Scénario 2 : Profil Lecteur (Pas d'import ni de consommation IA)
  test('2. Profil Lecteur : Pas de bouton d’import ni de bloc Consommation IA', async ({ page }) => {
    await page.goto('/?role=reader');

    await expect(page.locator('body')).toContainText('Lecteur');

    // Le bouton principal d'import DOIT ÊTRE ABSENT
    const importBtn = page.getByRole('button', { name: /Importer des CV/i });
    await expect(importBtn).not.toBeVisible();

    // La section Consommation IA DOIT ÊTRE ABSENTE
    await expect(page.locator('body')).not.toContainText('Consommation IA du mois');

    // En revanche les dossiers récents et le pipeline restent visibles
    await expect(page.locator('body')).toContainText('Dossiers partagés');
    await expect(page.locator('body')).toContainText('Candidatures consultables');
  });

  // Scénario 3 : Profil DPO (KPIs orientés RGPD)
  test('3. Profil DPO : KPIs axés conformité RGPD et pas d’importation', async ({ page }) => {
    await page.goto('/?role=dpo');

    await expect(page.locator('body')).toContainText('DPO');

    // Vérification des KPIs spécifiques DPO
    await expect(page.locator('body')).toContainText('Demandes RGPD ouvertes');
    await expect(page.locator('body')).toContainText('Demandes en retard');
    await expect(page.locator('body')).toContainText('Échéances à moins de 30j');

    // Pas de bouton d'import pour le DPO
    const importBtn = page.getByRole('button', { name: /Importer des CV/i });
    await expect(importBtn).not.toBeVisible();
  });

  // Scénario 4 : Résilience en cas d'erreur partielle sur un bloc
  test('4. Résilience : L’erreur du bloc KPI affiche son état d’erreur sans casser les autres blocs', async ({ page }) => {
    await page.goto('/?error_block=kpi');

    // Le bloc KPI est en erreur avec son message dédié
    await expect(page.locator('body')).toContainText('Erreur de chargement des indicateurs KPI');

    // Mais les autres blocs sont parfaitement rendus et fonctionnels
    await expect(page.locator('body')).toContainText('Dossiers récents de recrutement');
    await expect(page.locator('body')).toContainText('Actions requises & Alertes');
    await expect(page.locator('body')).toContainText('Répartition des candidats par étape');
    await expect(page.locator('body')).toContainText('Activité récente (Flux Anonymisé)');
  });

  // Scénario 5 : État vide d’un bloc
  test('5. État vide : Un bloc sans donnée affiche son état vide spécifique', async ({ page }) => {
    await page.goto('/?empty_block=folders');

    await expect(page.locator('body')).toContainText('Aucun dossier actif');
    await expect(page.locator('body')).toContainText('Créer un dossier');
  });
});
