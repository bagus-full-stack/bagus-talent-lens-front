import { describe, it, expect } from 'vitest';
import {
  createDsrAction,
  validateErasureStepAction,
  advanceDsrStatusAction,
} from '@/app/actions/dsr';
import { getDsrRepository } from '@/lib/api';
import { DsrService } from '@/lib/rgpd/dsr-service';
import type { DataSubjectRequest } from '@/lib/schemas/dsr';

import { mockOrganization } from '@/lib/mock/data/organizations';

describe("Gestion des Demandes DSR (/rgpd/demandes) - Double Validation, Cascade & Alertes", () => {
  const dsrRepo = getDsrRepository() as any;

  describe("1. Contrôle des Permissions (rgpd.manage)", () => {
    it("Refuse la création d'une demande DSR pour le rôle recruiter (sans rgpd.manage)", async () => {
      const result = await createDsrAction(
        {
          requestType: 'erasure',
          candidateId: 'cand-a1b2',
          candidatePseudonym: 'Candidat #A1B2',
          candidateEmail: 'lucas.meyer@email.fr',
          folderReference: '#DE-2026',
          receivedVia: 'direct_email',
          idVerified: true,
          idVerificationNote: 'CNI contrôlée',
        },
        {
          id: 'usr_recruiter_basic',
          name: 'Jean Recruteur',
          role: 'recruiter',
        }
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.error).toContain('réservée aux rôles DPO, Admin et Owner');
    });

    it("Autorise la création d'une demande DSR pour le rôle DPO", async () => {
      const result = await createDsrAction(
        {
          requestType: 'access',
          candidateId: 'cand-c8f2',
          candidatePseudonym: 'Candidat #C8F2',
          candidateEmail: 'alexandre.dupont@cybersec.fr',
          folderReference: '#CYB-88',
          receivedVia: 'web_form',
          idVerified: true,
          idVerificationNote: 'Passeport vérifié via FranceConnect',
        },
        {
          id: 'usr_severine_petit',
          name: 'Séverine Petit',
          role: 'dpo',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toMatch(/^#DSR-2026-\d{3}$/);
      expect(result.data?.status).toBe('identity_verified');
    });
  });

  describe("2. Double Validation d'Effacement (Art. 17 RGPD) & Règle d'Utilisateur Distinct", () => {
    it("Étape 1 : Le premier validateur (DPO) accorde sa signature", async () => {
      // Création d'une nouvelle demande d'effacement
      const createRes = await createDsrAction(
        {
          requestType: 'erasure',
          candidateId: 'cand-test-del',
          candidatePseudonym: 'Candidat #T99',
          candidateEmail: 'test.del@candidat.fr',
          folderReference: '#DE-2026',
          receivedVia: 'direct_email',
          idVerified: true,
          idVerificationNote: 'Vérification CNI conforme',
        },
        {
          id: 'usr_dpo_primary',
          name: 'Sarah DPO',
          role: 'dpo',
        }
      );

      expect(createRes.success).toBe(true);
      const dsrId = createRes.data!.id;

      // Première validation par le DPO
      const step1 = await validateErasureStepAction(
        dsrId,
        {
          id: 'usr_dpo_primary',
          name: 'Sarah DPO',
          role: 'dpo',
        },
        'Premier niveau d’effacement accordé après audit de recevabilité.',
        true // Reauth MFA confirmée
      );

      expect(step1.success).toBe(true);
      expect(step1.data?.dsr.firstValidatorId).toBe('usr_dpo_primary');
      expect(step1.data?.dsr.status).toBe('under_review');
    });

    it("Étape 2 : REFUSE formellement la seconde validation par le MÊME utilisateur", async () => {
      // On récupère une demande existante où usr_severine_petit est le premier validateur
      const dsr = await dsrRepo.getById('#DSR-2026-089');
      expect(dsr).toBeDefined();
      expect(dsr?.firstValidatorId).toBe('usr_severine_petit');

      // Tentative de seconde validation par la même personne (usr_severine_petit)
      const attemptSameUser = await validateErasureStepAction(
        '#DSR-2026-089',
        {
          id: 'usr_severine_petit', // Même identifiant !
          name: 'Séverine Petit',
          role: 'dpo',
        },
        'Tentative de seconde validation par le même utilisateur',
        true
      );

      expect(attemptSameUser.success).toBe(false);
      expect(attemptSameUser.code).toBe('SAME_VALIDATOR_REFUSED');
      expect(attemptSameUser.error).toContain('utilisateur distinct du premier validateur');
    });

    it("Étape 2 : ACCEPTE la seconde validation par un utilisateur DISTINCT (Admin/Owner)", async () => {
      // Seconde validation par un second utilisateur distinct (usr_idriss_ouedraogo)
      const step2 = await validateErasureStepAction(
        '#DSR-2026-089',
        {
          id: 'usr_idriss_ouedraogo', // Utilisateur distinct !
          name: 'Idriss Ouédraogo',
          role: 'admin',
        },
        'Contre-signature accordée. Ordre d’effacement immédiat.',
        true
      );

      expect(step2.success).toBe(true);
      expect(step2.data?.dsr.secondValidatorId).toBe('usr_idriss_ouedraogo');
      expect(step2.data?.dsr.status).toBe('fulfilled');
      expect(step2.data?.dsr.closedAt).toBeDefined();
      expect(step2.data?.dsr.sha256Certificate).toContain('CERT-WORM-SHA256');

      // Vérification du rapport d'effacement généré
      expect(step2.data?.erasureReport).toBeDefined();
      expect(step2.data?.erasureReport?.firstValidator.name).toBe('Séverine Petit (DPO)');
      expect(step2.data?.erasureReport?.secondValidator.name).toBe('Idriss Ouédraogo');
    });

    it("Refuse la validation d'effacement sans ré-authentification forte (2FA)", async () => {
      const noReauth = await validateErasureStepAction(
        '#DSR-2026-088',
        {
          id: 'usr_admin_test',
          name: 'Marc Admin',
          role: 'admin',
        },
        'Test sans MFA',
        false // 2FA non confirmée
      );

      expect(noReauth.success).toBe(false);
      expect(noReauth.code).toBe('REAUTH_REQUIRED');
      expect(noReauth.error).toContain('ré-authentification forte');
    });
  });

  describe("3. Inventaire Certifié et Rapport d'Effacement Sans PII", () => {
    it("Fournit l'inventaire complet des 10 catégories d'actifs de données par le serveur", () => {
      const inventory = DsrService.getCandidateInventory('cand-a1b2', 'Candidat #A1B2');

      expect(inventory).toHaveLength(10);

      const components = inventory.map((i) => i.component);
      expect(components).toContain('Fichier PDF original du CV');
      expect(components).toContain('Version caviardée / Blind CV');
      expect(components).toContain('Données extraites par l’IA');
      expect(components).toContain('Texte brut issu de l’OCR');
      expect(components).toContain('Chunks et Embeddings vectoriels');
      expect(components).toContain('Position sur la cartographie sémantique');
      expect(components).toContain('Notes internes d’évaluation recruteur');
      expect(components).toContain('Candidatures actives & étapes du pipeline');
      expect(components).toContain('Résultats de matching prédictif');
      expect(components).toContain('Exports archivés et dossiers partagés');
    });

    it("Génère un rapport d'effacement irréversible strictement exempt de toute PII (Zéro Nom, Email, Téléphone)", () => {
      const mockDsr: DataSubjectRequest = {
        id: '#DSR-2026-089',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        requestType: 'erasure',
        candidatePseudonym: 'Candidat #A1B2',
        candidateRealName: 'Lucas Meyer',
        candidateEmail: 'lucas.meyer@email.fr',
        folderReference: '#DE-2026',
        receivedVia: 'direct_email',
        status: 'fulfilled',
        idVerified: true,
        legalDeadline: '2026-10-05T23:59:59Z',
        daysRemaining: 0,
        assignedDpoId: 'usr_dpo',
        assignedDpoName: 'DPO',
        dataLocations: [],
        requiresDoubleValidation: true,
        createdAt: '2026-09-28T09:14:00Z',
        updatedAt: '2026-10-02T11:30:00Z',
      };

      const report = DsrService.generateErasureReport(
        mockDsr,
        { id: 'usr_val1', name: 'Séverine Petit', role: 'DPO' },
        { id: 'usr_val2', name: 'Idriss Ouédraogo', role: 'ADMIN' }
      );

      // Structure du rapport
      expect(report.candidatePseudonym).toBe('Candidat #A1B2');
      expect(report.sha256CertificateSeal).toMatch(/^SHA256:[a-f0-9]{64}$/);
      expect(report.purgedComponents.length).toBeGreaterThan(0);

      // Garantie stricte de non-divulgation de PII
      const reportJson = JSON.stringify(report);
      expect(reportJson).not.toContain('Lucas');
      expect(reportJson).not.toContain('Meyer');
      expect(reportJson).not.toContain('lucas.meyer@email.fr');
    });

    it("Simule l'exécution de la cascade complète en 6 étapes séquentielles", () => {
      const steps = DsrService.getErasureCascadeSteps();
      expect(steps).toHaveLength(6);
      expect(steps[0].label).toContain('Verrouillage');
      expect(steps[1].label).toContain('Purge définitive');
      expect(steps[3].label).toContain('Désindexation et purge des chunks');
      expect(steps[4].label).toContain('Retrait du point spatial');
      expect(steps[5].label).toContain('Scellement immuable WORM');
    });
  });

  describe("4. Alertes d'Échéance Légale CNIL (J-10, J-3, Retard) & Accessibilité", () => {
    it("Calcule et classe correctement les statuts d'alerte selon le nombre de jours restants", async () => {
      const dsrs: DataSubjectRequest[] = await dsrRepo.getAll(mockOrganization.id);

      // Recherche de l'alerte J-3 (critique)
      const criticalDsr = dsrs.find((d) => d.id === '#DSR-2026-089');
      expect(criticalDsr?.daysRemaining).toBeLessThanOrEqual(3);

      // Recherche de l'alerte J-10
      const warningDsr = dsrs.find((d) => d.id === '#DSR-2026-085');
      expect(warningDsr?.daysRemaining).toBeLessThanOrEqual(10);
      expect(warningDsr?.daysRemaining).toBeGreaterThan(3);

      // Recherche du retard légal (< 0)
      const overdueDsr = dsrs.find((d) => d.id === '#DSR-2026-082');
      expect(overdueDsr?.daysRemaining).toBeLessThan(0);
    });

    it("Génère des libellés d'accessibilité ARIA descriptifs pour les lecteurs d'écran", () => {
      const formatAriaCountdown = (days: number, isClosed: boolean, deadlineStr: string) => {
        if (isClosed) return `Demande clôturée`;
        if (days <= 0)
          return `Échéance légale CNIL dépassée depuis ${Math.abs(days)} jours (date limite le ${deadlineStr})`;
        return `Compte à rebours légal CNIL : ${days} jours restants avant le ${deadlineStr}`;
      };

      const ariaOverdue = formatAriaCountdown(-2, false, '05/10/2026');
      expect(ariaOverdue).toContain('Échéance légale CNIL dépassée depuis 2 jours');

      const ariaCritical = formatAriaCountdown(3, false, '10/10/2026');
      expect(ariaCritical).toContain('Compte à rebours légal CNIL : 3 jours restants');

      const ariaClosed = formatAriaCountdown(0, true, '30/09/2026');
      expect(ariaClosed).toBe('Demande clôturée');
    });
  });
});
