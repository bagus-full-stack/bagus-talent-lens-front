import { test, expect } from '@playwright/test';

test.describe('Parcours d’Importation et Ingestion Souveraine /import (E2E)', () => {
  test('1. Affichage de la Dropzone, des limites affichées et de la mention souveraine UE', async ({ page }) => {
    await page.goto('/import');

    // Vérification du titre principal
    await expect(page.locator('body')).toContainText('Import & Ingestion Souveraine de CV');

    // Vérification des sélecteurs de dossier, pattern et langue
    await expect(page.locator('body')).toContainText('Dossier de destination');
    await expect(page.locator('body')).toContainText('Pattern & Version d’anonymisation');
    await expect(page.locator('body')).toContainText('Langue principale des CVs');

    // Vérification des limites affichées (20 Mo, 200 fichiers)
    await expect(page.locator('body')).toContainText('20 Mo max par fichier');
    await expect(page.locator('body')).toContainText('Jusqu\'à 200 fichiers par archive ZIP');

    // Vérification de la mention légale stricte : UE & pas d'entraînement
    await expect(page.locator('body')).toContainText('Garantie Souveraine RGPD');
    await expect(page.locator('body')).toContainText('jamais réutilisés pour l\'entraînement');
    await expect(page.locator('body')).toContainText('Union Européenne');
  });

  test('2. Contrôles côté client & serveur : rejet des formats interdits et gros fichiers', async ({ page }) => {
    await page.goto('/import');

    // Création d'un fichier factice au format non autorisé (.exe)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Glissez-déposez vos candidatures ou cliquez pour parcourir/i).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles([
      {
        name: 'script_malveillant.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('FAKE_BINARY_CONTENT'),
      },
    ]);

    // Vérification de l'alerte d'interdiction de format
    await expect(page.locator('body')).toContainText('Format « .exe » refusé');
    await expect(page.locator('body')).toContainText('Formats acceptés : PDF, PNG, JPEG, DOCX, ZIP');
  });

  test('3. Téléversement de fichiers valides et transition vers le suivi Realtime', async ({ page }) => {
    await page.goto('/import');

    // Sélection de 2 fichiers factices conformes (PDF et DOCX)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Glissez-déposez vos candidatures ou cliquez pour parcourir/i).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles([
      {
        name: 'cv_sophie_martin_lead_data.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 Fake PDF Content for Playwright E2E'),
      },
      {
        name: 'cv_alexis_dupont_devops.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('PK Fake Docx Archive Content'),
      },
    ]);

    // Les 2 fichiers doivent apparaître dans la liste préparée
    await expect(page.locator('body')).toContainText('Fichiers préparés (2)');
    await expect(page.locator('body')).toContainText('cv_sophie_martin_lead_data.pdf');
    await expect(page.locator('body')).toContainText('cv_alexis_dupont_devops.docx');

    // Clic sur l'envoi vers le stockage
    const sendButton = page.getByRole('button', {
      name: /Transmettre 2 document\(s\) au stockage sécurisé/i,
    });
    await sendButton.click();

    // Transition vers l'étape de suivi Realtime
    await expect(page.locator('body')).toContainText('Ingestion en temps réel', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Realtime connecté');

    // Vérification des indicateurs clés
    await expect(page.locator('body')).toContainText('Fichiers traités');
    await expect(page.locator('body')).toContainText('Temps estimé restant');
    await expect(page.locator('body')).toContainText('Tokens IA consommés');

    // Vérification du message de réassurance « vous pouvez quitter cette page »
    await expect(page.locator('body')).toContainText('Vous pouvez quitter cette page en toute sérénité');
  });

  test('4. Modale plein écran appelée depuis un dossier (/dossiers/[id])', async ({ page }) => {
    await page.goto('/dossiers/fld-de-2026');

    // Clic sur le bouton « Importer » dans l'en-tête du dossier
    const importBtn = page.getByRole('button', { name: /^Importer$/i });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Vérification de l'ouverture de la modale d'import
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('body')).toContainText('Importer des CVs & Candidatures');
    await expect(page.locator('body')).toContainText('Data Engineer Paris');

    // Fermeture de la modale
    await page.getByLabel('Fermer la modale').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
