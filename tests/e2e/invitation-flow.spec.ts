import { test, expect } from '@playwright/test';

test.describe('Parcours d’Invitation et Activation de Compte /invitation/[token] (E2E)', () => {
  // Scénario 1 : Parcours Administrateur complet avec MFA obligatoire
  test('1. Parcours Admin complet : MFA obligatoire, 8 codes de secours et droits étendus', async ({ page }) => {
    // 1. Accès au lien d'invitation Admin
    await page.goto('/invitation/tok_valid_invitation_admin');

    // Vérification de la présence des informations clés de l'invitation
    await expect(page.locator('body')).toContainText('Cabinet Horizon RH');
    await expect(page.locator('body')).toContainText('Administrateur');
    await expect(page.locator('body')).toContainText('nouvel.admin@horizon-rh.fr');

    // Étape 1 : Saisie d'un mot de passe fort conforme
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('AdminHorizon#2026Secure!');

    // Confirmation du mot de passe
    const confirmInput = page.locator('input[placeholder="Retapez votre mot de passe"]');
    await confirmInput.fill('AdminHorizon#2026Secure!');

    // Vérification des indicateurs de robustesse en direct
    await expect(page.locator('body')).toContainText('Très fort (Conforme RGPD)');

    // Soumission Étape 1
    await page.getByRole('button', { name: /Continuer vers l’étape Sécurité & MFA/i }).click();

    // 2. Étape 2 : Vérification que la MFA est OBLIGATOIRE pour un profil Admin
    await expect(page.locator('body')).toContainText('Double Authentification (MFA AAL2) Obligatoire');
    // Le bouton "Passer pour l'instant" ne doit PAS être disponible
    await expect(page.getByRole('button', { name: /Passer pour l’instant/i })).not.toBeVisible();

    // Vérification de la présence des 8 codes de secours téléchargeables
    await expect(page.locator('body')).toContainText('Vos 8 codes de secours');
    await expect(page.getByRole('button', { name: /Télécharger \(\.txt\)/i })).toBeVisible();

    // Saisie du code OTP à 6 chiffres
    const otpInput = page.locator('input[placeholder="Ex : 123456"]');
    await otpInput.fill('123456');

    // Validation du 2FA
    await page.getByRole('button', { name: /Valider et enregistrer le 2FA/i }).click();

    // 3. Étape 3 : Bienvenue, résumé des droits et charte
    await expect(page.locator('body')).toContainText('Votre compte est prêt !');
    // Vérification des droits accordés à l'admin (Levée du mode aveugle + exports)
    await expect(page.locator('body')).toContainText('Levée du mode aveugle');
    await expect(page.locator('body')).toContainText('Exports nominatifs');

    // Le bouton final doit être désactivé tant que la charte n'est pas cochée
    const finalizeBtn = page.getByRole('button', { name: /Accepter et accéder à l’espace de travail/i });
    await expect(finalizeBtn).toBeDisabled();

    // Cocher la charte d'utilisation
    await page.locator('input[type="checkbox"]').check();
    await expect(finalizeBtn).toBeEnabled();

    // Finalisation
    await finalizeBtn.click();

    // Vérification de la redirection vers l'espace de travail sans conservation du jeton dans l'historique
    await expect(page).toHaveURL('/');
  });

  // Scénario 2 : Parcours Recruteur avec MFA optionnelle
  test('2. Parcours Recruteur : possibilité de passer la MFA et restrictions de sécurité affichées', async ({ page }) => {
    // Accès au lien d'invitation Recruteur
    await page.goto('/invitation/tok_valid_invitation_collaborateur');

    // Vérification de l'intitulé du rôle
    await expect(page.locator('body')).toContainText('Recruteur / Talent Partner');

    // Saisie du mot de passe
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('RecruteurHorizon#2026!');
    const confirmInput = page.locator('input[placeholder="Retapez votre mot de passe"]');
    await confirmInput.fill('RecruteurHorizon#2026!');

    // Continuer vers l'étape 2
    await page.getByRole('button', { name: /Continuer vers l’étape Sécurité & MFA/i }).click();

    // Vérification que le bouton "Passer pour l'instant" EST PRÉSENT pour un recruteur
    const skipBtn = page.getByRole('button', { name: /Passer pour l’instant/i });
    await expect(skipBtn).toBeVisible();

    // Clic sur "Passer pour l'instant"
    await skipBtn.click();

    // Vérification de l'étape 3 et des restrictions du recruteur
    await expect(page.locator('body')).toContainText('Votre compte est prêt !');
    await expect(page.locator('body')).toContainText('Levée d’anonymat interdite');
    await expect(page.locator('body')).toContainText('Export nominatif interdit');

    // Validation de la charte
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Accepter et accéder à l’espace de travail/i }).click();

    await expect(page).toHaveURL('/');
  });

  // Scénario 3 : Invitation expirée
  test('3. Affiche l’écran d’erreur dédié si l’invitation a expiré', async ({ page }) => {
    await page.goto('/invitation/tok_expired_invitation');

    await expect(page.locator('body')).toContainText('Ce lien d’invitation a expiré');
    await expect(page.locator('body')).toContainText('Invitation Expirée');
    await expect(page.getByRole('button', { name: /Retour à la page de connexion/i })).toBeVisible();
  });

  // Scénario 4 : Invitation déjà utilisée
  test('4. Affiche l’écran dédié si l’invitation a déjà été acceptée', async ({ page }) => {
    await page.goto('/invitation/tok_used_invitation');

    await expect(page.locator('body')).toContainText('Votre compte est déjà activé');
    await expect(page.locator('body')).toContainText('Invitation Déjà Utilisée');
    await expect(page.getByRole('button', { name: /Se connecter à TalentLens/i })).toBeVisible();
  });

  // Scénario 5 : Jeton invalide ou introuvable
  test('5. Rejette un jeton inconnu avec message sécurisé sans fuite d’information', async ({ page }) => {
    await page.goto('/invitation/tok_inexistant_9999');

    await expect(page.locator('body')).toContainText('Invitation introuvable');
    await expect(page.getByRole('button', { name: /Aller à la page de connexion/i })).toBeVisible();
  });
});
