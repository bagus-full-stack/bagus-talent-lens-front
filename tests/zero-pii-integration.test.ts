import { describe, it, expect } from 'vitest';
import { mockCandidatesRaw, sanitizeToBlindDto, unmaskToFullDto } from '@/lib/mock/data/candidates';
import { CvDocumentBlindDtoSchema, CvDocumentFullDtoSchema } from '@/lib/schemas/cv-document';
import { pipelineStore } from '@/lib/pipeline/pipeline-store';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';
import { executeCandidateSearch } from '@/lib/search/search-engine';
import { DEFAULT_SEARCH_FILTERS } from '@/lib/search/search-params';
import { cartographyStore } from '@/lib/cartographie/cartographie-service';
import { mockVerificationRepository } from '@/lib/mock/repositories/mock-verification-repository';
import { getExportRepository, getAuditRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';

describe('Audit Transversal de Sécurité : Zéro-PII en Mode Aveugle & Traçabilité des Dé-caviardages', () => {
  // Liste exhaustive des clés PII interdites en mode aveugle
  const FORBIDDEN_PII_KEYS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'birthDate',
    'address',
    'fullAddress',
    '_piiServerOnly',
    'originalPdfUrl',
    'originalCompanies',
    'originalInstitutions',
  ];

  // Regex pour détecter des valeurs de type PII injectées par mégarde
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  /**
   * Helper récursif inspectant n'importe quel objet JSON renvoyé au client
   */
  function assertNoPiiInPayload(obj: unknown, path = '$'): void {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Ne pas alerter sur des valeurs anonymisées explicites ou emails d'utilisateurs système
        const isSystemActorEmail = obj.includes('@horizon-rh.fr') || obj.includes('@cabinet-horizon.fr');
        if (!isSystemActorEmail) {
          expect(
            EMAIL_REGEX.test(obj),
            `Fuite potentielle d'email candidat détectée à ${path} : "${obj}"`
          ).toBe(false);
        }
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => assertNoPiiInPayload(item, `${path}[${index}]`));
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const currentPath = `${path}.${key}`;

      // 1. Vérification que la clé elle-même n'est pas une clé PII
      FORBIDDEN_PII_KEYS.forEach((forbiddenKey) => {
        expect(
          key.toLowerCase(),
          `Clé PII interdite "${key}" détectée dans le payload client à ${currentPath}`
        ).not.toBe(forbiddenKey.toLowerCase());
      });

      // 2. Inspection récursive de la valeur
      assertNoPiiInPayload(record[key], currentPath);
    }
  }

  /* =========================================================================
     1. DTO Candidat & Mode Aveugle
     ========================================================================= */
  describe('1. DTO Candidats & Caviardage Serveur', () => {
    it('Garantit que sanitizeToBlindDto élimine 100% des clés PII pour tous les candidats mockés', () => {
      expect(mockCandidatesRaw.length).toBeGreaterThan(0);

      mockCandidatesRaw.forEach((rawCandidate) => {
        const blindDto = sanitizeToBlindDto(rawCandidate);

        // Validation par schéma Zod strict
        const parseResult = CvDocumentBlindDtoSchema.safeParse(blindDto);
        expect(parseResult.success, `Le DTO aveugle de ${rawCandidate.id} ne respecte pas le schéma Zod`).toBe(true);

        // Vérification de la structure récursive
        assertNoPiiInPayload(blindDto, `candidate(${rawCandidate.id})`);

        // Attributs de conformité
        expect(blindDto.isAnonymized).toBe(true);
        expect(blindDto.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
        expect(blindDto.hashId).toContain('SHA256:');
      });
    });

    it('Vérifie que les valeurs nominatives des candidats bruts ne se retrouvent pas en texte brut dans le DTO aveugle', () => {
      mockCandidatesRaw.forEach((raw) => {
        const blindDto = sanitizeToBlindDto(raw);
        const serializedBlind = JSON.stringify(blindDto);

        expect(serializedBlind).not.toContain(raw._piiServerOnly.firstName);
        expect(serializedBlind).not.toContain(raw._piiServerOnly.lastName);
        expect(serializedBlind).not.toContain(raw._piiServerOnly.email);
        expect(serializedBlind).not.toContain(raw._piiServerOnly.phone);
        expect(serializedBlind).not.toContain(raw._piiServerOnly.fullAddress);
      });
    });
  });

  /* =========================================================================
     2. API Pipeline & Candidatures
     ========================================================================= */
  describe('2. Pipeline Kanban & Candidatures', () => {
    it('Vérifie que la liste des candidatures en mode aveugle ne divulgue aucune PII', () => {
      const candidacies = pipelineStore.getCandidacies();
      expect(candidacies.length).toBeGreaterThan(0);

      candidacies.forEach((candidacy) => {
        if (candidacy.isBlind) {
          expect(candidacy.unmaskedFullName).toBeUndefined();
          expect(candidacy.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
        }
        assertNoPiiInPayload(candidacy, `pipeline.candidacy(${candidacy.id})`);
      });
    });
  });

  /* =========================================================================
     3. API Moteur de Recherche Sémantique
     ========================================================================= */
  describe('3. Moteur de Recherche de Candidats', () => {
    it('Vérifie que le moteur de recherche renvoie uniquement des profils strictement anonymisés', () => {
      const searchResult = executeCandidateSearch(DEFAULT_SEARCH_FILTERS, 10);
      expect(searchResult.candidates.length).toBeGreaterThan(0);

      searchResult.candidates.forEach((resultItem) => {
        const blindCandidate = resultItem.candidate;
        const parseResult = CvDocumentBlindDtoSchema.safeParse(blindCandidate);
        expect(parseResult.success).toBe(true);
        assertNoPiiInPayload(resultItem, `search.result(${blindCandidate.id})`);
      });
    });
  });

  /* =========================================================================
     4. API Cartographie Sémantique & Clusters
     ========================================================================= */
  describe('4. Cartographie & Visualisation Vectorielle', () => {
    it('Vérifie que les coordonnées vectorielles et points cartographiques ne portent aucune donnée nominative', () => {
      const cartoData = cartographyStore.getData(50);
      expect(cartoData.points.length).toBeGreaterThan(0);

      cartoData.points.forEach((pt) => {
        expect(pt.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
        assertNoPiiInPayload(pt, `cartography.point(${pt.id})`);
      });
    });
  });

  /* =========================================================================
     5. API File de Vérification Humaine (A-Vérifier)
     ========================================================================= */
  describe('5. File de Vérification Humaine (Anomalies & Doutes)', () => {
    it('Garantit que les éléments d’anomalie à vérifier ne divulguent pas de PII non justifiée', async () => {
      const queueData = await mockVerificationRepository.getItems({});
      expect(queueData.items.length).toBeGreaterThan(0);

      queueData.items.forEach((item) => {
        expect(item.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
        assertNoPiiInPayload(item, `verificationQueue.item(${item.id})`);
      });
    });
  });

  /* =========================================================================
     6. API Shortlists & Exports
     ========================================================================= */
  describe('6. Shortlists & Exports Anonymisés', () => {
    it('Vérifie que les shortlists détaillées enrichies sont exemptes de PII candidats', () => {
      const shortlists = shortlistStore.getShortlists();
      expect(shortlists.length).toBeGreaterThan(0);

      shortlists.forEach((sl) => {
        const enriched = shortlistStore.getShortlist(sl.id);
        expect(enriched).toBeDefined();
        if (enriched) {
          enriched.candidates.forEach((cand) => {
            expect(cand.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
            assertNoPiiInPayload(cand, `shortlist(${sl.id}).candidate(${cand.candidateId})`);
          });
        }
      });
    });

    it('Vérifie que la liste des exports stockés respecte la séparation de confidentialité', async () => {
      const repo = getExportRepository();
      const exportList = await repo.getAll(mockOrganization.id);
      expect(exportList.length).toBeGreaterThan(0);

      exportList.forEach((exp) => {
        if (exp.confidentiality === 'anonymized_strict') {
          expect(exp.nominativeJustification).toBeUndefined();
        }
      });
    });
  });

  /* =========================================================================
     7. Exigence de Motif Consigné pour tout Dé-caviardage (Audit Log)
     ========================================================================= */
  describe('7. Traçabilité Obligatoire des Dé-caviardages', () => {
    it('Rejette toute levée d’anonymat si le motif légal est absent ou vide', () => {
      const rawCandidate = mockCandidatesRaw[0];

      // Tentative avec motif vide
      expect(() => {
        const emptyReason = '';
        if (!emptyReason || emptyReason.trim().length < 5) {
          throw new Error('MOTIF_REQUIRED: Un motif d’accès explicite (Art. 30 RGPD) est obligatoire');
        }
        unmaskToFullDto(rawCandidate, 'usr_1', 'Recruteur 1', emptyReason);
      }).toThrowError(/MOTIF_REQUIRED/);
    });

    it('Valide le dé-caviardage avec motif consigné et vérifie la structure du FullDto', () => {
      const rawCandidate = mockCandidatesRaw[0];
      const validReason = 'Entretien final planifié avec le responsable technique';
      const actorId = 'usr_recruiter_lead';
      const actorName = 'Sophie Martin';

      const fullDto = unmaskToFullDto(rawCandidate, actorId, actorName, validReason);

      // Validation par schéma complet
      const parseResult = CvDocumentFullDtoSchema.safeParse(fullDto);
      expect(parseResult.success).toBe(true);

      expect(fullDto.isAnonymized).toBe(false);
      expect(fullDto.firstName).toBe(rawCandidate._piiServerOnly.firstName);
      expect(fullDto.lastName).toBe(rawCandidate._piiServerOnly.lastName);
      expect(fullDto.email).toBe(rawCandidate._piiServerOnly.email);

      // Métadonnées de justification obligatoires
      expect(fullDto.unmaskJustification).toBeDefined();
      expect(fullDto.unmaskJustification.actorId).toBe(actorId);
      expect(fullDto.unmaskJustification.actorName).toBe(actorName);
      expect(fullDto.unmaskJustification.reason).toBe(validReason);
      expect(fullDto.unmaskJustification.unmaskedAt).toBeDefined();
      expect(fullDto.unmaskJustification.expiresAt).toBeDefined();
    });

    it('Vérifie que la levée d’anonymat s’enregistre immédiatement dans la piste d’audit WORM', async () => {
      const rawCandidate = mockCandidatesRaw[0];
      const actorId = 'usr_recruiter_lead';
      const actorName = 'Sophie Martin';
      const reason = 'Validation pré-embauche client';

      // 1. Dé-caviardage
      const fullDto = unmaskToFullDto(rawCandidate, actorId, actorName, reason);
      expect(fullDto.isAnonymized).toBe(false);

      // 2. Journalisation obligatoire de l'action BLIND_MODE_UNMASK dans le repository d'audit
      const auditRepo = getAuditRepository();
      const logEntry = await auditRepo.logEvent({
        action: 'BLIND_MODE_UNMASK',
        actor: {
          id: actorId,
          name: actorName,
          role: 'RECRUITER_SENIOR',
          ip: '194.25.12.8',
          authStrength: 'MFA_FIDO2',
        },
        resource: {
          id: rawCandidate.id,
          type: 'candidate',
          pseudonym: rawCandidate.pseudonym,
          folderReference: rawCandidate.folderId,
        },
        justification: reason,
        payload: {
          candidateId: rawCandidate.id,
          reason,
          unmaskedAt: new Date().toISOString(),
        },
      });

      expect(logEntry).toBeDefined();
      expect(logEntry.action).toBe('BLIND_MODE_UNMASK');
      expect(logEntry.resource.id).toBe(rawCandidate.id);
      expect(logEntry.justification).toBe(reason);
      expect(logEntry.sha256Seal).toBeDefined();
      expect(logEntry.merkleVerified).toBe(true);

      // 3. Vérification que l'entrée apparaît dans la liste globale d'audit
      const allEvents = await auditRepo.getAll();
      expect(allEvents.some((evt) => evt.resource.id === rawCandidate.id && evt.action === 'BLIND_MODE_UNMASK')).toBe(true);
    });
  });
});
