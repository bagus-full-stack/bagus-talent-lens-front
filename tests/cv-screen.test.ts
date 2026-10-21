import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { getCvRepository, getAuditRepository } from '@/lib/api';
import { mockCandidatesRaw } from '@/lib/mock/data/candidates';
import { generateSignedToken, verifySignedToken } from '@/app/api/cv/[id]/signed-url/route';
import { CvHeader } from '@/components/cv/cv-header';
import { ExtractedDataTab } from '@/components/cv/tabs/extracted-data-tab';
import { CvStatusBanners } from '@/components/cv/cv-status-banners';
import { SkillsTab } from '@/components/cv/tabs/skills-tab';
import { HistoryTab } from '@/components/cv/tabs/history-tab';
import { CvBottomBar } from '@/components/cv/cv-bottom-bar';
import {
  updateCvFieldAction,
  validateCvFieldAction,
  validateCvExtractionAction,
  updateCvPipelineStageAction,
  toggleCvShortlistAction,
  toggleCvRestrictionAction,
  addCvNoteAction,
  unmaskCvAction,
} from '@/app/(app)/cv/actions';

// Mock de next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock de la session serveur
let mockCurrentUser = {
  id: 'usr-idriss',
  role: 'admin' as const,
  can_reveal_identity: true,
  can_export: true,
};

vi.mock('@/lib/auth/session', () => ({
  getServerCurrentUser: vi.fn(async () => mockCurrentUser),
}));

describe('Écran Central /cv/[id] · Tests de Robustesse, Anti-PII Leakage & RGPD', () => {
  const repo = getCvRepository();
  const auditRepo = getAuditRepository();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      id: 'usr-idriss',
      role: 'admin',
      can_reveal_identity: true,
      can_export: true,
    };
  });

  /* =========================================================================
     1. DÉFINITION DE TERMINÉ : AUCUNE PII DANS LE DOM NI DANS LES RÉPONSES
     ========================================================================= */
  describe('DÉFINITION DE TERMINÉ : Aucune PII dans le DOM ni dans les réponses réseau en mode aveugle', () => {
    // Liste exhaustive des valeurs PII réelles de tous les candidats mocks
    const ALL_KNOWN_PII = [
      'Lucas',
      'Meyer',
      'lucas.meyer@email.fr',
      '+33 6 12 34 56 78',
      '14 rue de la République',
      'Alexandre',
      'Dupont',
      'alexandre.dupont@cybersec.fr',
      '+33 6 98 76 54 32',
      '28 avenue des Gobelins',
      'Maxime',
      'Leroy',
      'maxime.leroy@infra-cloud.org',
      '+33 6 45 67 89 01',
      '5 rue de la Paix',
      'Éric',
      'Dumont',
      'eric.dumont@security-audit.fr',
      '+33 6 11 22 33 44',
      '12 quai de la Tournelle',
      'Romain',
      'Koenig',
      'romain.koenig@privacy-box.fr',
      '+33 6 33 44 55 66',
      '78 boulevard Saint-Germain',
    ];

    it('vérifie que la réponse getCvDetail en mode aveugle ne contient AUCUNE PII réelle', async () => {
      const candidateIds = ['cand-a1b2', 'cand-c8f2', 'cand-m4l7', 'cand-e3d9', 'cand-r9k1'];

      for (const id of candidateIds) {
        const detail = await repo.getCvDetail(id, true);
        expect(detail).not.toBeNull();
        expect(detail!.isBlindMode).toBe(true);
        expect(detail!.nominative).toBeUndefined();

        // Sérialisation brute de la réponse réseau
        const serialized = JSON.stringify(detail);

        // Vérification qu'aucune valeur PII n'est présente dans la réponse
        for (const pii of ALL_KNOWN_PII) {
          expect(serialized).not.toContain(pii);
        }

        // Vérification que les champs PII ont pour valeur '***'
        const nameField = detail!.extractedFields.nom_complet || detail!.extractedFields.identite_complete;
        expect(nameField).toBeDefined();
        expect(nameField.value).toBe('***');
        expect(detail!.extractedFields.coordonnees_contact.value).toBe('***');
      }
    });

    it('vérifie que le HTML rendu (DOM) ne contient AUCUNE PII en mode aveugle', async () => {
      const detail = await repo.getCvDetail('cand-a1b2', true);
      expect(detail).not.toBeNull();

      // Rendu SSR de tous les composants de la page
      const headerHtml = renderToString(
        React.createElement(CvHeader, {
          candidate: detail!,
          onToggleShortlist: () => {},
          onChangePipelineStage: () => {},
          onToggleRestriction: () => {},
          onDelete: () => {},
          onRequestUnmask: () => {},
          onExport: () => {},
        }),
      );

      const fieldsHtml = renderToString(
        React.createElement(ExtractedDataTab, {
          candidate: detail!,
          activeFieldKey: null,
          onSelectField: () => {},
          onFieldChange: () => {},
          onValidateField: () => {},
        }),
      );

      const bannersHtml = renderToString(
        React.createElement(CvStatusBanners, { candidate: detail! }),
      );

      const skillsHtml = renderToString(
        React.createElement(SkillsTab, { candidate: detail! }),
      );
      const historyHtml = renderToString(
        React.createElement(HistoryTab, { candidate: detail! }),
      );
      const bottomBarHtml = renderToString(
        React.createElement(CvBottomBar, {
          candidate: detail!,
          onSaveManual: () => {},
          onValidateExtraction: () => {},
        }),
      );

      const fullDomHtml = [
        headerHtml,
        fieldsHtml,
        bannersHtml,
        skillsHtml,
        historyHtml,
        bottomBarHtml,
      ].join('\n');

      // Test absolu : parcours du DOM généré
      for (const pii of ALL_KNOWN_PII) {
        expect(fullDomHtml).not.toContain(pii);
      }

      // Vérification des indicateurs d'anonymisation dans le DOM
      expect(fullDomHtml).toContain('Candidat #A1B2');
      expect(fullDomHtml).toContain('***');
      expect(fullDomHtml).toContain('Caviardé (Serveur)');
    });

    it('vérifie que l’URL signée en mode aveugle utilise le mode caviardé', async () => {
      const candidateId = 'cand-a1b2';
      const expiresAt = Date.now() + 60000;
      const token = generateSignedToken(candidateId, 'redacted', expiresAt);

      expect(verifySignedToken(candidateId, 'redacted', token)).toBe(true);
      expect(verifySignedToken(candidateId, 'original', token)).toBe(false); // Refus si tentative d'altération du mode

      // Test d'expiration : token avec date passée
      const expiredToken = generateSignedToken(candidateId, 'redacted', Date.now() - 1000);
      expect(verifySignedToken(candidateId, 'redacted', expiredToken)).toBe(false);
    });
  });

  /* =========================================================================
     2. TESTS DES CORRECTIONS HUMAINES & DEBOUNCE
     ========================================================================= */
  describe('Corrections humaines & indicateur IA', () => {
    it('enregistre une correction manuelle sur un champ non-PII avec traçabilité', async () => {
      const candidateId = 'cand-a1b2';
      const initialDetail = await repo.getCvDetail(candidateId, true);
      const currentVersion = initialDetail!.version;

      const result = await updateCvFieldAction({
        candidateId,
        key: 'annees_experience_data',
        value: 10,
        version: currentVersion,
      });

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(currentVersion + 1);

      // Vérification que le champ est marqué corrigé
      const updated = await repo.getCvDetail(candidateId, true);
      const field = updated!.extractedFields.annees_experience_data;
      expect(field.value).toBe(10);
      expect(field.isVerified).toBe(true);
      expect(field.humanCorrection).toBeDefined();
      expect(field.humanCorrection!.originalAiValue).toBe(8);
      expect(field.humanCorrection!.correctedBy).toContain('Idriss');

      // Vérification que l'événement d'audit a été créé
      const lastHistory = updated!.history[0];
      expect(lastHistory.action).toBe('FIELD_CORRECTED');
    });

    it('interdit la modification directe d’un champ PII en mode aveugle', async () => {
      const candidateId = 'cand-a1b2';
      const detail = await repo.getCvDetail(candidateId, true);

      const keyToTest = detail!.extractedFields.nom_complet ? 'nom_complet' : 'identite_complete';
      const result = await updateCvFieldAction({
        candidateId,
        key: keyToTest,
        value: 'Tentative Piratage',
        version: detail!.version,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('verrouillés');
    });
  });

  /* =========================================================================
     3. CONFLIT DE VERSION (OPTIMISTIC LOCKING / ETAG)
     ========================================================================= */
  describe('Conflit de version / Concurrence optimiste', () => {
    it('détecte un conflit si la version client est obsolète et refuse l’écrasement', async () => {
      const candidateId = 'cand-a1b2';
      const detail = await repo.getCvDetail(candidateId, true);
      const staleVersion = detail!.version;

      // Recruteur B effectue une modification d'abord
      await updateCvFieldAction({
        candidateId,
        key: 'annees_experience_data',
        value: 9,
        version: staleVersion,
      });

      // Recruteur A tente de soumettre avec l'ancienne version
      const conflictResult = await updateCvFieldAction({
        candidateId,
        key: 'annees_experience_data',
        value: 11,
        version: staleVersion, // Version obsolète !
      });

      expect(conflictResult.success).toBe(false);
      expect(conflictResult.conflict).toBe(true);
      expect(conflictResult.currentVersion).toBe(staleVersion + 1);
      expect(conflictResult.message).toContain('Conflit de version');
    });
  });

  /* =========================================================================
     4. LEVÉE DU MODE AVEUGLE (REASON DIALOG + REAUTH + ART. 30 RGPD)
     ========================================================================= */
  describe('Levée du mode aveugle sous contrôle RGPD', () => {
    it('refuse la levée si le motif professionnel Art. 30 est trop court', async () => {
      const result = await unmaskCvAction({
        candidateId: 'cand-a1b2',
        reason: 'Court', // < 10 caractères
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('10 caractères');
    });

    it('refuse la levée si le rôle n’a pas la permission identity.reveal', async () => {
      mockCurrentUser = {
        id: 'usr-reader',
        role: 'reader' as const,
        can_reveal_identity: false,
        can_export: false,
      };

      const result = await unmaskCvAction({
        candidateId: 'cand-a1b2',
        reason: 'Entretien RH technique pour validation finale',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Autorisation insuffisante');
    });

    it('autorise la levée avec motif valide, consigne dans l’audit WORM et charge les données nominatives', async () => {
      const candidateId = 'cand-a1b2';
      const validReason = 'Entretien technique d’embauche planifié avec le CTO';

      const result = await unmaskCvAction({
        candidateId,
        reason: validReason,
      });

      expect(result.success).toBe(true);
      expect(result.detail).toBeDefined();
      expect(result.detail!.isBlindMode).toBe(false);
      expect(result.detail!.nominative).toBeDefined();
      expect(result.detail!.nominative!.firstName).toBe('Lucas');
      expect(result.detail!.nominative!.lastName).toBe('Meyer');
      expect(result.detail!.nominative!.email).toBe('lucas.meyer@email.fr');
      expect(result.detail!.unmaskInfo?.reason).toBe(validReason);

      // Vérification que le journal d'audit WORM a bien enregistré l'événement UNMASK
      const auditEvents = await auditRepo.getAll();
      const unmaskEvent = auditEvents.find(
        (e) => e.action === 'UNMASK' && e.targetId === candidateId,
      );
      expect(unmaskEvent).toBeDefined();
      expect(unmaskEvent!.reason).toBe(validReason);
    });
  });

  /* =========================================================================
     5. ACTIONS SUPPLÉMENTAIRES : PIPELINE, SHORTLIST, RESTRICTION RGPD
     ========================================================================= */
  describe('Actions du recruteur & statuts', () => {
    it('permet de changer l’étape du pipeline de recrutement', async () => {
      const res = await updateCvPipelineStageAction({
        candidateId: 'cand-a1b2',
        stage: 'Entretien Technique',
      });
      expect(res.success).toBe(true);

      const cv = await repo.getCvDetail('cand-a1b2', false);
      expect(cv!.pipelineStage).toBe('Entretien Technique');
    });

    it('permet d’ajouter ou de retirer un candidat de la shortlist', async () => {
      const cvBefore = await repo.getCvDetail('cand-a1b2', false);
      const initialShortlist = cvBefore!.isShortlisted;

      const res = await toggleCvShortlistAction({ candidateId: 'cand-a1b2' });
      expect(res.success).toBe(true);

      const cvAfter = await repo.getCvDetail('cand-a1b2', false);
      expect(cvAfter!.isShortlisted).toBe(!initialShortlist);
    });

    it('permet d’activer l’opposition RGPD Art. 21 (restriction de traitement)', async () => {
      const res = await toggleCvRestrictionAction({ candidateId: 'cand-a1b2' });
      expect(res.success).toBe(true);

      const cv = await repo.getCvDetail('cand-a1b2', false);
      expect(cv!.isRestricted).toBe(true);
    });

    it('ajoute une note d’évaluation interne sans PII', async () => {
      const noteRes = await addCvNoteAction({
        candidateId: 'cand-a1b2',
        content: 'Très bonne maîtrise de Snowflake et Python lors du pré-screening.',
      });

      expect(noteRes.success).toBe(true);
      expect(noteRes.note).toBeDefined();
      expect(noteRes.note!.content).toContain('Snowflake');

      const cv = await repo.getCvDetail('cand-a1b2', false);
      expect(cv!.notes.some((n) => n.id === noteRes.note!.id)).toBe(true);
    });

    it('valide l’extraction globale du CV', async () => {
      const valRes = await validateCvExtractionAction({ candidateId: 'cand-a1b2' });
      expect(valRes.success).toBe(true);

      const cv = await repo.getCvDetail('cand-a1b2', false);
      expect(cv!.extractionStatus).toBe('validated');
    });
  });
});
