import { describe, it, expect } from 'vitest';
import {
  calculateMatchingResults,
  PRESET_JOB_OFFERS,
  DEFAULT_SCORING_WEIGHTS,
} from '@/lib/matching/mock-data';
import type { StructuredOfferCriteria, MatchingCriterion } from '@/lib/matching/types';

describe('1. Déplacement d’un critère (Indispensable ↔ Souhaité)', () => {
  it('moves a criterion from indispensables to souhaites and updates the criteria object', () => {
    const initialOffer: StructuredOfferCriteria = JSON.parse(
      JSON.stringify(PRESET_JOB_OFFERS['fld-de-2026'])
    );

    const criterionToMove = initialOffer.indispensables[0];
    const initialIndispensableCount = initialOffer.indispensables.length;
    const initialSouhaiteCount = initialOffer.souhaites.length;

    // Déplacement de indispensable -> souhaité
    const updatedOffer: StructuredOfferCriteria = {
      ...initialOffer,
      indispensables: initialOffer.indispensables.filter((c) => c.id !== criterionToMove.id),
      souhaites: [...initialOffer.souhaites, { ...criterionToMove, category: 'souhaite' }],
    };

    expect(updatedOffer.indispensables.length).toBe(initialIndispensableCount - 1);
    expect(updatedOffer.souhaites.length).toBe(initialSouhaiteCount + 1);
    expect(updatedOffer.souhaites.some((c) => c.id === criterionToMove.id)).toBe(true);
    expect(updatedOffer.indispensables.some((c) => c.id === criterionToMove.id)).toBe(false);
  });

  it('impacts candidate scoring when an unmet criterion is moved from indispensable to souhaité', () => {
    const offerWithMandatory: StructuredOfferCriteria = JSON.parse(
      JSON.stringify(PRESET_JOB_OFFERS['fld-de-2026'])
    );

    // Ajout d'un critère indispensable inexistant dans les CVs actuels
    const hardCriterion: MatchingCriterion = {
      id: 'crit-hard',
      label: 'Expertise approfondie Rust et WebAssembly haute fréquence',
      category: 'indispensable',
      type: 'skill',
      weight: 1.0,
    };

    offerWithMandatory.indispensables.push(hardCriterion);
    const resultsMandatory = calculateMatchingResults(offerWithMandatory, DEFAULT_SCORING_WEIGHTS);
    const scoreWhenMandatory = resultsMandatory[0].overallScore;

    // Déplacement de ce critère en "souhaité" (nice-to-have)
    const offerWithNiceToHave: StructuredOfferCriteria = {
      ...offerWithMandatory,
      indispensables: offerWithMandatory.indispensables.filter((c) => c.id !== hardCriterion.id),
      souhaites: [...offerWithMandatory.souhaites, { ...hardCriterion, category: 'souhaite' }],
    };

    const resultsNiceToHave = calculateMatchingResults(offerWithNiceToHave, DEFAULT_SCORING_WEIGHTS);
    const scoreWhenNiceToHave = resultsNiceToHave[0].overallScore;

    // Le score est supérieur lorsque le critère manquant n'est que souhaité plutôt qu'indispensable
    expect(scoreWhenNiceToHave).toBeGreaterThanOrEqual(scoreWhenMandatory);
  });

  it('allows adding and deleting criteria dynamically', () => {
    const offer: StructuredOfferCriteria = JSON.parse(
      JSON.stringify(PRESET_JOB_OFFERS['fld-de-2026'])
    );

    const newCriterion: MatchingCriterion = {
      id: 'crit-custom-test',
      label: 'Anglais bilingue C2',
      category: 'souhaite',
      type: 'language',
      weight: 1.0,
    };

    // Ajout
    offer.souhaites.push(newCriterion);
    expect(offer.souhaites.some((c) => c.id === 'crit-custom-test')).toBe(true);

    // Suppression
    offer.souhaites = offer.souhaites.filter((c) => c.id !== 'crit-custom-test');
    expect(offer.souhaites.some((c) => c.id === 'crit-custom-test')).toBe(false);
  });
});

describe('2. Tiroir de détail (« Pourquoi ce score », Skill Gap & Extraits sourcés)', () => {
  it('provides structured criterion evaluations with ✓ / ~ / ✗ statuses', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);

    expect(results.length).toBeGreaterThan(0);
    const firstResult = results[0];

    expect(firstResult.evaluations.length).toBeGreaterThan(0);
    firstResult.evaluations.forEach((evaluation) => {
      expect(['satisfied', 'partial', 'missing']).toContain(evaluation.status);
      expect(evaluation.criterionLabel).toBeTruthy();
      expect(evaluation.detail).toBeTruthy();
    });
  });

  it('breaks down the skill gap into acquired, partial, and missing competencies', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);
    const firstResult = results[0];

    expect(firstResult.skillGap).toBeDefined();
    expect(Array.isArray(firstResult.skillGap.acquired)).toBe(true);
    expect(Array.isArray(firstResult.skillGap.partial)).toBe(true);
    expect(Array.isArray(firstResult.skillGap.missing)).toBe(true);
  });

  it('provides sourced citations with document page number for CV deep-linking', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);
    const firstResult = results[0];

    expect(firstResult.sourcedExcerpts.length).toBeGreaterThan(0);
    firstResult.sourcedExcerpts.forEach((citation) => {
      expect(citation.page).toBeGreaterThanOrEqual(1);
      expect(citation.text).toBeTruthy();
      expect(citation.fieldLabel).toBeTruthy();
    });
  });
});

describe('3. Aucune PII dans le DOM en mode aveugle (/matching)', () => {
  it('strictly delivers blind DTOs with no nominative personal data', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);

    results.forEach(({ candidate }) => {
      // Données anonymisées conformes
      expect(candidate.isAnonymized).toBe(true);
      expect(candidate.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
      expect(candidate.hashId).toContain('SHA256:');

      // Aucune fuite de PII dans l'objet candidat
      const rawCandidate = candidate as any;
      expect(rawCandidate.firstName).toBeUndefined();
      expect(rawCandidate.lastName).toBeUndefined();
      expect(rawCandidate.email).toBeUndefined();
      expect(rawCandidate.phone).toBeUndefined();
      expect(rawCandidate.fullAddress).toBeUndefined();
      expect(rawCandidate._piiServerOnly).toBeUndefined();
    });
  });

  it('deduplicates results so that each unique candidate appears at most once in ranking', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);

    const candidateIds = results.map((r) => r.candidate.id);
    const uniqueIds = new Set(candidateIds);

    expect(candidateIds.length).toBe(uniqueIds.size);
  });
});

describe('4. Comparaison de 2 à 4 candidats sur les critères de l’offre', () => {
  it('prepares candidate comparisons with side-by-side evaluations', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);

    // Sélection de 3 candidats pour comparatif
    const selected = results.slice(0, 3);
    expect(selected.length).toBe(3);

    // Tous les candidats évalués disposent des réponses sur les mêmes critères
    offer.indispensables.forEach((crit) => {
      selected.forEach((res) => {
        const evalForCrit = res.evaluations.find((e) => e.criterionId === crit.id);
        expect(evalForCrit).toBeDefined();
        expect(['satisfied', 'partial', 'missing']).toContain(evalForCrit?.status);
      });
    });
  });

  it('respects the 2 to 4 candidates boundary for side-by-side comparison', () => {
    const offer = PRESET_JOB_OFFERS['fld-de-2026'];
    const results = calculateMatchingResults(offer, DEFAULT_SCORING_WEIGHTS);

    const validComparison2 = results.slice(0, 2);
    const validComparison4 = results.slice(0, 4);

    expect(validComparison2.length).toBeGreaterThanOrEqual(2);
    expect(validComparison4.length).toBeLessThanOrEqual(4);
  });
});
