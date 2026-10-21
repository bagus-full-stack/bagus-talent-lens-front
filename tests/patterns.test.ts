import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateJsonSchema,
  detectPiiRisk,
  diffPatternFields,
  estimateReExtractionCost,
  DEFAULT_SOCLE_FIELDS,
  PatternFieldSchema,
  PatternFormSchema,
  type PatternField,
} from '@/lib/schemas/pattern';
import {
  getPatternRepository,
  getAuditRepository,
} from '@/lib/api';
import {
  createPatternAction,
  duplicatePatternAction,
  archivePatternAction,
  savePatternDraftAction,
  publishPatternVersionAction,
  restorePatternVersionAction,
  testPatternExtractionAction,
  getReExtractionCostEstimateAction,
} from '@/app/(app)/patterns/actions';

// Mock du contexte utilisateur serveur pour les tests de Server Actions
vi.mock('@/lib/auth/session', () => ({
  getServerCurrentUser: vi.fn().mockResolvedValue({
    id: 'usr-admin-1',
    email: 'admin@talentshield.eu',
    name: 'Administrateur Sécurité',
    role: 'ADMIN',
    aal: 'aal2',
    mfaVerified: true,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Tests Patterns d’extraction sémantique & Éditeur de Schémas RGPD', () => {
  const sampleCustomFields: PatternField[] = [
    ...DEFAULT_SOCLE_FIELDS,
    {
      key: 'annees_experience_data',
      label: "Années d'expérience Data",
      type: 'number',
      required: true,
      isPii: false,
      aiPromptDescription: "Nombre total d'années d'expérience.",
      isLocked: false,
    },
    {
      key: 'certifications_cloud',
      label: 'Certifications Cloud & Kubernetes',
      type: 'list',
      required: false,
      isPii: false,
      aiPromptDescription: 'Certifications AWS, GCP, Azure, CKA.',
      isLocked: false,
    },
    {
      key: 'type_contrat_recherche',
      label: 'Type de contrat souhaité',
      type: 'enum',
      options: ['CDI', 'CDD', 'Freelance / Régie', 'Stage / Alternance'],
      required: true,
      isPii: false,
      isLocked: false,
    },
  ];

  describe('1. Génération du JSON Schema (tests unitaires)', () => {
    it('génère un JSON Schema valide conforme draft-07', () => {
      const schema: any = generateJsonSchema(sampleCustomFields, {
        id: 'PAT-TECH-TEST',
        name: 'Pattern Test Tech',
        version: '1.0',
      });

      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('Pattern Test Tech');
      expect(schema.pattern_id).toBe('PAT-TECH-TEST');
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    });

    it('mappe fidèlement les types primitifs (number, string, array, boolean, enum)', () => {
      const schema: any = generateJsonSchema(sampleCustomFields);

      // number
      expect(schema.properties.annees_experience_data.type).toBe('number');
      // list -> array
      expect(schema.properties.certifications_cloud.type).toBe('array');
      expect(schema.properties.certifications_cloud.items.type).toBe('string');
      // enum -> string with enum array
      expect(schema.properties.type_contrat_recherche.type).toBe('string');
      expect(schema.properties.type_contrat_recherche.enum).toEqual([
        'CDI',
        'CDD',
        'Freelance / Régie',
        'Stage / Alternance',
      ]);
      // text
      expect(schema.properties.nom_complet.type).toBe('string');
    });

    it('inscrit tous les champs requis dans le tableau required du schéma', () => {
      const schema: any = generateJsonSchema(sampleCustomFields);

      expect(schema.required).toContain('nom_complet');
      expect(schema.required).toContain('coordonnees_contact');
      expect(schema.required).toContain('annees_experience_data');
      expect(schema.required).toContain('type_contrat_recherche');
      // certifications_cloud est optionnel
      expect(schema.required).not.toContain('certifications_cloud');
    });

    it('inclut les métadonnées de protection RGPD x-pii et x-locked', () => {
      const schema: any = generateJsonSchema(sampleCustomFields);

      expect(schema.properties.nom_complet['x-pii']).toBe(true);
      expect(schema.properties.nom_complet['x-pii-category']).toBe('identity');
      expect(schema.properties.nom_complet['x-locked']).toBe(true);

      expect(schema.properties.annees_experience_data['x-pii']).toBe(false);
      expect(schema.properties.annees_experience_data['x-locked']).toBe(false);
    });
  });

  describe('2. Validation Zod, slugs uniques et ajout de champs', () => {
    it('valide un champ avec un slug valide (minuscules, chiffres et tirets du bas)', () => {
      const validField = {
        key: 'score_anglais_toeic',
        label: 'Score TOEIC',
        type: 'number' as const,
        required: false,
        isPii: false,
      };

      const result = PatternFieldSchema.safeParse(validField);
      expect(result.success).toBe(true);
    });

    it('rejette un champ dont le slug technique est invalide (espaces, majuscules, caractères spéciaux)', () => {
      const invalidField = {
        key: 'Score Anglais TOEIC!',
        label: 'Score TOEIC',
        type: 'number' as const,
        required: false,
        isPii: false,
      };

      const result = PatternFieldSchema.safeParse(invalidField);
      expect(result.success).toBe(false);
    });

    it('rejette un pattern contenant des doublons de noms techniques (slugs non uniques)', () => {
      const fieldsWithDuplicate = [
        ...sampleCustomFields,
        {
          key: 'annees_experience_data', // Doublon !
          label: "Autre Années d'expérience",
          type: 'number' as const,
          required: false,
          isPii: false,
        },
      ];

      const formData = {
        name: 'Pattern Doublon',
        category: 'Tech' as const,
        description: 'Test de détection de doublons de clés',
        fields: fieldsWithDuplicate,
      };

      const parseResult = PatternFormSchema.safeParse(formData);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const errorMsg = (parseResult.error.issues || (parseResult.error as any).errors || [])[0]?.message || '';
        expect(errorMsg).toContain('nom technique (slug) unique');
      }
    });
  });

  describe('3. Blocage strict des champs verrouillés du socle normalisé', () => {
    it('interdit la suppression d’un champ verrouillé du socle normalisé dans savePatternDraftAction', async () => {
      // Retirer volontairement un champ du socle normalisé : "nom_complet"
      const truncatedFields = sampleCustomFields.filter((f) => f.key !== 'nom_complet');

      const res = await savePatternDraftAction('PAT-TECH-04', truncatedFields);
      expect(res.success).toBe(false);
      expect(res.error).toContain('socle normalisé');
      expect(res.error).toContain('ne peut pas être supprimé');
    });

    it('autorise la suppression d’un champ personnalisé non verrouillé', async () => {
      // Retirer le champ personnalisé "certifications_cloud"
      const fieldsWithoutCustom = sampleCustomFields.filter((f) => f.key !== 'certifications_cloud');

      const res = await savePatternDraftAction('PAT-TECH-04', fieldsWithoutCustom);
      expect(res.success).toBe(true);
      expect(res.version).toBeDefined();
    });
  });

  describe('4. Réordonnancement des champs et persistance de l’ordre', () => {
    it('préserve le nouvel ordre après déplacement et met à jour le schéma JSON généré', () => {
      // Échanger les positions de l'élément 0 et de l'élément 1
      const reordered = [...sampleCustomFields];
      const temp = reordered[0];
      reordered[0] = reordered[1];
      reordered[1] = temp;

      expect(reordered[0].key).toBe(sampleCustomFields[1].key);
      expect(reordered[1].key).toBe(sampleCustomFields[0].key);

      const schema = generateJsonSchema(reordered);
      const schemaPropertiesKeys = Object.keys(schema.properties);
      expect(schemaPropertiesKeys[0]).toBe(sampleCustomFields[1].key);
      expect(schemaPropertiesKeys[1]).toBe(sampleCustomFields[0].key);
    });
  });

  describe('5. Détection de risque PII (anti-fuite RGPD en mode aveugle)', () => {
    it('détecte un risque PII sur un champ texte libre évoquant des données personnelles non masquées', () => {
      const riskyField: PatternField = {
        key: 'numero_telephone_perso',
        label: 'Numéro de portable',
        type: 'text',
        required: false,
        isPii: false, // Non marqué PII alors que c'est un téléphone !
      };

      expect(detectPiiRisk(riskyField)).toBe(true);
    });

    it('détecte un risque PII sur un champ salaire ou rémunération non balisé', () => {
      const riskySalaryField: PatternField = {
        key: 'salaire_actuel_brut',
        label: 'Prétentions salariales',
        type: 'text',
        required: false,
        isPii: false,
      };

      expect(detectPiiRisk(riskySalaryField)).toBe(true);
    });

    it('ne signale pas de risque si le champ est déjà marqué isPii: true', () => {
      const safeField: PatternField = {
        key: 'adresse_postale',
        label: 'Adresse postale',
        type: 'text',
        required: false,
        isPii: true, // Protégé !
        piiCategory: 'address',
      };

      expect(detectPiiRisk(safeField)).toBe(false);
    });

    it('ne signale pas de risque pour des champs techniques purs', () => {
      const techField: PatternField = {
        key: 'frameworks_backend',
        label: 'Frameworks Backend maîtrisés',
        type: 'list',
        required: false,
        isPii: false,
      };

      expect(detectPiiRisk(techField)).toBe(false);
    });
  });

  describe('6. Publication de version, calcul de tokens et audit WORM', () => {
    it('calcule correctement l’estimation des tokens et le coût en euros côté serveur', async () => {
      const cvCount = 1420;
      const fieldsCount = 12;

      const estimate = await getReExtractionCostEstimateAction(cvCount, fieldsCount);

      expect(estimate.affectedCvs).toBe(1420);
      expect(estimate.tokensPerCv).toBeGreaterThan(1000);
      expect(estimate.totalTokens).toBeGreaterThan(1_400_000);
      expect(estimate.estimatedEur).toBeGreaterThan(0);
      expect(estimate.estimatedMinutes).toBeGreaterThanOrEqual(1);
    });

    it('publie une nouvelle version avec incrémentation sémantique et journalise l’événement WORM', async () => {
      const auditRepo = getAuditRepository();
      const initialAuditCount = (await auditRepo.getEvents('org-talentshield-eur', 20)).length;

      const res = await publishPatternVersionAction(
        'PAT-TECH-04',
        sampleCustomFields,
        { reExtractExisting: true },
      );

      expect(res.success).toBe(true);
      expect(res.version).toBeDefined();
      expect(res.version?.status).toBe('active');
      expect(res.pattern?.status).toBe('active');

      // Vérification du calcul de ré-extraction renvoyé
      expect(res.reExtraction).toBeDefined();
      expect(res.reExtraction?.affectedCvs).toBe(1420);
      expect(res.reExtraction?.totalTokens).toBeGreaterThan(0);

      // Vérification du scellement d'audit WORM
      const afterEvents = await auditRepo.getEvents('org-talentshield-eur', 20);
      const publishEvent = afterEvents.find(
        (e) => e.action === 'PATTERN_VERSION_PUBLISH' && e.payload?.patternId === 'PAT-TECH-04',
      );
      expect(publishEvent).toBeDefined();
      expect(publishEvent?.actor.authStrength).toBe('MFA_FIDO2');
    });
  });

  describe('7. Historique des versions, Diff et Restauration', () => {
    it('calcule fidèlement le diff (ajoutés, supprimés, modifiés) entre deux états de champs', () => {
      const v1Fields: PatternField[] = [
        sampleCustomFields[0],
        sampleCustomFields[1],
        sampleCustomFields[2],
      ];

      const v2Fields: PatternField[] = [
        sampleCustomFields[0], // Identique
        { ...sampleCustomFields[1], label: 'Nouveau Libellé Modifié' }, // Modifié
        sampleCustomFields[3], // Ajouté (sampleCustomFields[2] a été supprimé)
      ];

      const diff = diffPatternFields(v1Fields, v2Fields);

      expect(diff.added.length).toBe(1);
      expect(diff.added[0].key).toBe(sampleCustomFields[3].key);

      expect(diff.removed.length).toBe(1);
      expect(diff.removed[0].key).toBe(sampleCustomFields[2].key);

      expect(diff.modified.length).toBe(1);
      expect(diff.modified[0].key).toBe(sampleCustomFields[1].key);
      expect(diff.modified[0].changes[0].property).toBe('libellé');
    });

    it('restaure une version historique et recharge ses champs en brouillon', async () => {
      const res = await restorePatternVersionAction('PAT-TECH-04', 'v2.3');

      expect(res.success).toBe(true);
      expect(res.version?.version).toContain('v2.3-restaure');
      expect(res.version?.status).toBe('draft');
      expect(res.version?.fields).toBeDefined();
    });
  });

  describe('8. Actions de liste : Création, Duplication, Archivage', () => {
    it('crée un nouveau pattern avec le socle normalisé pré-configuré', async () => {
      const res = await createPatternAction({
        name: 'Ingénierie Cybersécurité',
        category: 'Tech',
        description: 'Analyse des certifications CISSP, CEH et pentest.',
      });

      expect(res.success).toBe(true);
      expect(res.pattern?.id).toBeDefined();
      expect(res.pattern?.totalFields).toBe(DEFAULT_SOCLE_FIELDS.length);
    });

    it('duplique un pattern existant avec statut brouillon', async () => {
      const res = await duplicatePatternAction('PAT-TECH-04', 'Copie Test Tech');

      expect(res.success).toBe(true);
      expect(res.pattern?.name).toBe('Copie Test Tech');
      expect(res.pattern?.status).toBe('draft');
      expect(res.pattern?.extractedCvCount).toBe(0);
    });

    it('archive un pattern actif', async () => {
      const res = await archivePatternAction('PAT-SUPP-01');

      expect(res.success).toBe(true);
      expect(res.pattern?.status).toBe('archived');
    });

    it('exécute l’extraction de test sur un document exemple', async () => {
      const res = await testPatternExtractionAction(sampleCustomFields, 'sample-tech-senior');

      expect(res.success).toBe(true);
      expect(res.results).toBeDefined();
      expect(res.results?.length).toBe(sampleCustomFields.length);

      const nomResult = res.results?.find((r) => r.key === 'nom_complet');
      expect(nomResult).toBeDefined();
      expect(nomResult?.confidence).toBeGreaterThan(0.9);
      expect(nomResult?.isPii).toBe(true);
    });
  });
});
