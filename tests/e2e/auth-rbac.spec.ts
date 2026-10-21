import { test, expect } from '@playwright/test';

test.describe('Authentification et Droits RBAC TalentLens (E2E)', () => {
  // Scénario 1 : Accès sans session refusé
  test('1. Redirige un utilisateur non authentifié vers /connexion avec le paramètre ?redirect=', async ({ page, context }) => {
    // Nettoyer les cookies de session
    await context.clearCookies();
    await context.addCookies([
      { name: 'tl_logged_out', value: 'true', domain: 'localhost', path: '/' },
    ]);

    // Tentative d'accès à une route protégée
    await page.goto('/pipeline');

    // Vérification de la redirection
    await expect(page).toHaveURL(/\/connexion\?redirect=%2Fpipeline/);
    await expect(page.locator('h1, span')).toContainText(['TalentLens']);
  });

  // Scénario 2 : Connexion Google sans invitation refusée
  test('2. Rejette une connexion OAuth sans invitation préalable avec message explicite', async ({ page }) => {
    // Navigation vers le callback d'authentification avec un email non invité
    await page.goto(
      '/auth/callback?provider=google&mock_email=pirate@externe-non-invite.com&mock_verified=true&redirect=/pipeline',
    );

    // Vérification de la redirection vers /connexion avec erreur explicite
    await expect(page).toHaveURL(/\/connexion\?error=NO_INVITATION/);
    await expect(page.locator('body')).toContainText('aucune invitation active');
    await expect(page.locator('body')).toContainText('Cabinet Horizon RH');
  });

  // Scénario 3 : Admin en AAL1 redirigé vers la MFA
  test('3. Redirige un Administrateur en niveau AAL1 vers l’écran /mfa-verify avant toute page d’administration', async ({ page, context }) => {
    // Établir une session admin avec niveau AAL1
    await context.addCookies([
      { name: 'tl_session', value: 'active_session', domain: 'localhost', path: '/' },
      { name: 'tl_role', value: 'admin', domain: 'localhost', path: '/' },
      { name: 'tl_aal', value: 'aal1', domain: 'localhost', path: '/' },
    ]);

    // Tentative d'accès aux paramètres de l'organisation
    await page.goto('/parametres');

    // Vérification de la redirection vers l'écran de vérification TOTP
    await expect(page).toHaveURL(/\/mfa-verify\?redirect=%2Fparametres/);
    await expect(page.locator('h1')).toContainText('Vérification à Deux Facteurs');
    await expect(page.locator('body')).toContainText('AAL2 Exigé');
  });

  // Scénario 4 : Lecteur ne voit aucun bouton d'export
  test('4. Garantit que le profil Lecteur (Reader / Client Partenaire) ne voit aucun bouton d’export', async ({ page, context }) => {
    // Établir une session avec rôle lecteur / reader
    await context.addCookies([
      { name: 'tl_session', value: 'active_session', domain: 'localhost', path: '/' },
      { name: 'tl_role', value: 'reader', domain: 'localhost', path: '/' },
      { name: 'tl_aal', value: 'aal1', domain: 'localhost', path: '/' },
    ]);

    // Accès à la page des shortlists
    await page.goto('/shortlists');

    // Vérification que les boutons d'exportation sont absents
    const exportConsolideBtn = page.getByRole('button', { name: /Export consolidé/i });
    const exportAnonymiseBtn = page.getByRole('button', { name: /Export anonymisé/i });
    const genererDossierBtn = page.getByRole('button', { name: /Générer dossier client/i });

    await expect(exportConsolideBtn).not.toBeVisible();
    await expect(exportAnonymiseBtn).not.toBeVisible();
    await expect(genererDossierBtn).not.toBeVisible();
  });
});
