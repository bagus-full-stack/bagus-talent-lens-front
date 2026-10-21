import { describe, it, expect } from 'vitest';
import {
  extendRetentionAction,
  bulkUpdateLegalBasisAction,
  declareDataBreachAction,
  triggerPurgeAction,
  exportArticle30RegistryAction,
} from '@/app/actions/rgpd';
import { mockConsentRecords } from '@/lib/mock/data/rgpd-governance';

describe('Gouvernance RGPD (/rgpd) - Rétention, Consentement & Violations Art. 33', () => {
  const dpoActor = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  };

  const recruiterActor = {
    id: 'usr_recruiter_basic',
    name: 'Jean Recruteur',
    role: 'recruiter',
  };

  describe('1. Prolongation de rétention avec preuve de consentement obligatoire', () => {
    it('Refuse strictement la prolongation si la date de consentement est absente', async () => {
      const res = await extendRetentionAction(
        {
          candidateId: 'cand-m4k9',
          months: 12,
          consentDate: '',
          consentText: 'Consentement renouvelé pour 12 mois suite à échange téléphonique.',
          consentSource: 'Entretien de suivi',
        },
        dpoActor
      );

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('Refuse strictement la prolongation si le texte de consentement présenté est absent ou trop court', async () => {
      const res = await extendRetentionAction(
        {
          candidateId: 'cand-m4k9',
          months: 12,
          consentDate: '2026-10-07',
          consentText: 'Court', // < 10 caractères
          consentSource: 'Email opt-in',
        },
        dpoActor
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('10 caractères');
    });

    it('Refuse strictement la prolongation si la source vérifiable est absente', async () => {
      const res = await extendRetentionAction(
        {
          candidateId: 'cand-m4k9',
          months: 12,
          consentDate: '2026-10-07',
          consentText: 'Le candidat a validé la conservation de son CV pour 12 mois supplémentaires.',
          consentSource: '',
        },
        dpoActor
      );

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('Refuse la prolongation si l’acteur n’a pas la permission rgpd.manage (ex: recruiter)', async () => {
      const res = await extendRetentionAction(
        {
          candidateId: 'cand-m4k9',
          months: 12,
          consentDate: '2026-10-07',
          consentText: 'Le candidat accepte formellement la conservation de son profil.',
          consentSource: 'Formulaire opt-in web',
        },
        recruiterActor
      );

      expect(res.success).toBe(false);
      expect(res.code).toBe('FORBIDDEN');
    });

    it('Valide la prolongation avec preuve complète et met à jour l’échéance', async () => {
      const res = await extendRetentionAction(
        {
          candidateId: 'cand-m4k9',
          months: 12,
          consentDate: '2026-10-07',
          consentText: 'Le candidat accepte expressément le renouvellement de son dossier pour 12 mois.',
          consentSource: 'Formulaire en ligne TalentLens opt-in vérifié',
        },
        dpoActor
      );

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.status).toBe('compliant');
      expect(res.data?.consentProof?.source).toBe('Formulaire en ligne TalentLens opt-in vérifié');
    });
  });

  describe('2. Filtre sans base légale documentée et action en masse', () => {
    it('Détecte les profils sans base légale documentée dans le jeu de données', () => {
      const missingBases = mockConsentRecords.filter(
        (c) => c.legalBasis === 'sans_base_legale' || c.status === 'missing'
      );
      expect(missingBases.length).toBeGreaterThanOrEqual(3);
      expect(missingBases.some((c) => c.candidateId === 'cand-z5b4')).toBe(true);
      expect(missingBases.some((c) => c.candidateId === 'cand-d3t7')).toBe(true);
    });

    it('Régularise en masse les profils sans base légale via bulkUpdateLegalBasisAction', async () => {
      const candidateIds = ['cand-z5b4', 'cand-d3t7'];

      const res = await bulkUpdateLegalBasisAction(
        {
          candidateIds,
          legalBasis: 'consentement',
          source: 'Campagne de réengagement automne 2026',
          consentDate: '2026-10-07',
          consentText: 'Acceptation formulaire opt-in suite à relance par email.',
        },
        dpoActor
      );

      expect(res.success).toBe(true);
      expect(res.data?.count).toBe(2);
    });

    it('Refuse la mise à jour en masse pour un utilisateur non autorisé', async () => {
      const res = await bulkUpdateLegalBasisAction(
        {
          candidateIds: ['cand-z5b4'],
          legalBasis: 'interet_legitime',
          source: 'Sourcing direct',
        },
        recruiterActor
      );

      expect(res.success).toBe(false);
      expect(res.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Formulaire guidé de violation de données (Art. 33 & 34 RGPD)', () => {
    it('Valide le formulaire de déclaration et enregistre la violation avec compte à rebours 72h', async () => {
      const detectedAt = new Date().toISOString();
      const res = await declareDataBreachAction(
        {
          title: 'Fuite potentielle de logs sur serveur secondaire',
          nature: 'unauthorized_access',
          detectedAt,
          severity: 'high',
          affectedPersonsCount: 25,
          affectedDataCategories: [
            'Identité et coordonnées (nom, prénom, email)',
            'Documents CV et lettres de motivation',
          ],
          description: 'Analyse d’anomalie révélant un accès anormal aux endpoints d’exportation.',
          consequences: 'Risque de consultation illégitime de données de candidature de 25 personnes.',
          remediationTaken: 'Isolation du serveur, révocation des jetons JWT, audit forensique.',
          authorityNotification: 'required',
        },
        dpoActor
      );

      expect(res.success).toBe(true);
      expect(res.data?.reference).toMatch(/^VIO-2026-\d{3}$/);
      expect(res.data?.status).toBe('open');
      expect(res.data?.authorityNotification).toBe('required');
    });

    it('Refuse la déclaration si la description ou les conséquences sont trop succinctes', async () => {
      const res = await declareDataBreachAction(
        {
          title: 'Incident mineur',
          nature: 'data_loss',
          detectedAt: new Date().toISOString(),
          severity: 'low',
          affectedPersonsCount: 0,
          affectedDataCategories: ['Métadonnées'],
          description: 'Court', // Moins de 15 caractères
          consequences: 'Négligeable',
          remediationTaken: 'Aucune mesure nécessaire',
          authorityNotification: 'not_required',
        },
        dpoActor
      );

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('Refuse la déclaration pour un rôle non gestionnaire RGPD', async () => {
      const res = await declareDataBreachAction(
        {
          title: 'Tentative d’intrusion constatée',
          nature: 'unauthorized_access',
          detectedAt: new Date().toISOString(),
          severity: 'medium',
          affectedPersonsCount: 0,
          affectedDataCategories: ['Logs'],
          description: 'Description valide de plus de quinze caractères.',
          consequences: 'Conséquences évaluées détaillées.',
          remediationTaken: 'Mesures correctives immédiates prises.',
          authorityNotification: 'not_required',
        },
        recruiterActor
      );

      expect(res.success).toBe(false);
      expect(res.code).toBe('FORBIDDEN');
    });
  });

  describe('4. Purge et Export du Registre Art. 30', () => {
    it('Déclenche une purge certifiée WORM avec scellement SHA-256', async () => {
      const res = await triggerPurgeAction(['cand-z5b4'], dpoActor);
      expect(res.success).toBe(true);
      expect(res.data?.sha256Certificate).toBeDefined();
      expect(res.data?.sha256Certificate.length).toBe(64);
    });

    it('Exporte les activités et sous-traitants du registre Art. 30 avec sceau SHA-256', async () => {
      const res = await exportArticle30RegistryAction(dpoActor);
      expect(res.success).toBe(true);
      expect(res.data?.activities.length).toBeGreaterThan(0);
      expect(res.data?.subprocessors.length).toBeGreaterThan(0);
    });
  });
});
