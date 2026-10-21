import { describe, it, expect } from 'vitest';
import {
  parseSearchFiltersFromParams,
  buildSearchFiltersToParams,
  countActiveFilters,
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from '@/lib/search/search-params';
import {
  checkProtectedCriterion,
  type ProtectedCriterionDetection,
} from '@/lib/search/protected-criteria';
import { executeCandidateSearch } from '@/lib/search/search-engine';

describe('1. Synchronisation URL ↔ Filtres (/recherche)', () => {
  it('parses empty query params as default search filters', () => {
    const params = new URLSearchParams();
    const parsed = parseSearchFiltersFromParams(params);

    expect(parsed.query).toBe('');
    expect(parsed.minExperience).toBe(0);
    expect(parsed.maxExperience).toBe(15);
    expect(parsed.contractTypes).toEqual([]);
    expect(parsed.location).toBe('');
    expect(parsed.radius).toBe(25);
    expect(parsed.availability).toBe('all');
    expect(parsed.languages).toEqual([]);
    expect(parsed.educationLevel).toBe('all');
    expect(parsed.skills).toEqual([]);
    expect(parsed.folderId).toBe('all');
    expect(parsed.sortBy).toBe('relevance');
    expect(parsed.cursor).toBe(1);
  });

  it('serializes search filters to URLSearchParams cleanly omitting defaults', () => {
    const defaultParams = buildSearchFiltersToParams(DEFAULT_SEARCH_FILTERS);
    expect(defaultParams.toString()).toBe('');

    const customFilters: SearchFilters = {
      query: 'Kafka Snowflake',
      minExperience: 5,
      maxExperience: 12,
      contractTypes: ['cdi', 'freelance'],
      location: 'Paris',
      radius: 50,
      availability: 'immediate',
      languages: ['fr', 'en'],
      educationLevel: 'bac5',
      skills: ['Snowflake', 'Python'],
      folderId: 'fld-de-2026',
      sortBy: 'experience',
      cursor: 2,
    };

    const params = buildSearchFiltersToParams(customFilters);

    expect(params.get('q')).toBe('Kafka Snowflake');
    expect(params.get('minExp')).toBe('5');
    expect(params.get('maxExp')).toBe('12');
    expect(params.get('contract')).toBe('cdi,freelance');
    expect(params.get('location')).toBe('Paris');
    expect(params.get('radius')).toBe('50');
    expect(params.get('avail')).toBe('immediate');
    expect(params.get('lang')).toBe('fr,en');
    expect(params.get('edu')).toBe('bac5');
    expect(params.get('skills')).toBe('Snowflake,Python');
    expect(params.get('folder')).toBe('fld-de-2026');
    expect(params.get('sort')).toBe('experience');
    expect(params.get('cursor')).toBe('2');
  });

  it('guarantees bidirectional round-trip fidelity (filters -> params -> filters)', () => {
    const original: SearchFilters = {
      query: 'Architecte Cloud AWS',
      minExperience: 8,
      maxExperience: 15,
      contractTypes: ['cdi'],
      location: 'Lyon',
      radius: 10,
      availability: '1_month',
      languages: ['en'],
      educationLevel: 'bac5',
      skills: ['AWS', 'Kubernetes'],
      folderId: 'fld-full-12',
      sortBy: 'availability',
      cursor: 3,
    };

    const serialized = buildSearchFiltersToParams(original);
    const deserialized = parseSearchFiltersFromParams(serialized);

    expect(deserialized).toEqual(original);
  });

  it('accurately counts active filters for filter badges', () => {
    expect(countActiveFilters(DEFAULT_SEARCH_FILTERS)).toBe(0);

    const activeFilters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      minExperience: 4,
      contractTypes: ['cdi', 'freelance'],
      location: 'Paris',
      skills: ['Python', 'dbt'],
      folderId: 'fld-de-2026',
    };

    // 1 (minExp) + 2 (contracts) + 1 (location) + 2 (skills) + 1 (folder) = 7
    expect(countActiveFilters(activeFilters)).toBe(7);
  });
});

describe('2. Annulation de requête (AbortController)', () => {
  it('triggers an AbortError when AbortController aborts an in-flight search', async () => {
    const controller = new AbortController();

    // Simule une requête asynchrone écoutant le signal
    const simulatedSearch = (signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
          return reject(new DOMException('The user aborted a request.', 'AbortError'));
        }

        const timer = setTimeout(() => {
          resolve('success');
        }, 100);

        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        });
      });

    const promise = simulatedSearch(controller.signal);

    // Annulation immédiate (par exemple lors d'une frappe rapide suivante)
    controller.abort();

    await expect(promise).rejects.toThrow();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('allows subsequent search requests to succeed after canceling obsolete ones', async () => {
    let activeController: AbortController | null = null;

    const performSearch = (query: string) => {
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();
      const signal = activeController.signal;

      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
          } else {
            resolve(`Result for: ${query}`);
          }
        }, 30);

        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    };

    // Première requête lancée
    const req1 = performSearch('Python');
    // Deuxième requête lancée immédiatement (annule la première)
    const req2 = performSearch('Python Snowflake');

    await expect(req1).rejects.toMatchObject({ name: 'AbortError' });
    await expect(req2).resolves.toBe('Result for: Python Snowflake');
  });
});

describe('3. Détection de critère protégé (Garde-fou éthique Art. L1132-1)', () => {
  it('detects age discrimination criteria and returns code PROTECTED_CRITERION', () => {
    const queries = [
      'Lead Data Engineer de moins de 30 ans',
      'Développeur avec plus de 50 ans',
      'Profil junior de 25 ans maximum',
      'Jeune diplômé disponible immédiatement',
    ];

    queries.forEach((q) => {
      const result = checkProtectedCriterion(q);
      expect(result.isProtected).toBe(true);
      if (result.isProtected) {
        expect(result.code).toBe('PROTECTED_CRITERION');
        expect(result.category).toBe('age');
        expect(result.categoryLabel).toBe('Âge');
        expect(result.suggestion).toBeTruthy();
        expect(result.legalNotice).toContain('Article L. 1132-1');
      }
    });
  });

  it('detects gender/sex discrimination criteria', () => {
    const queries = [
      'Développeur femme pour renforcer la parité',
      'Homme avec expérience en sécurité informatique',
      'Profil féminin disponible',
    ];

    queries.forEach((q) => {
      const result = checkProtectedCriterion(q);
      expect(result.isProtected).toBe(true);
      if (result.isProtected) {
        expect(result.category).toBe('gender');
        expect(result.code).toBe('PROTECTED_CRITERION');
      }
    });
  });

  it('detects nationality/origin discrimination criteria', () => {
    const result = checkProtectedCriterion('Ingénieur d’origine européenne ou nationalité française');
    expect(result.isProtected).toBe(true);
    if (result.isProtected) {
      expect(result.category).toBe('origin');
    }
  });

  it('detects family situation criteria', () => {
    const result = checkProtectedCriterion('Consultant sans enfant avec disponibilité totale');
    expect(result.isProtected).toBe(true);
    if (result.isProtected) {
      expect(result.category).toBe('family');
    }
  });

  it('allows objective skills-based queries without triggering guardrail', () => {
    const objectiveQueries = [
      'Lead Data Platform Snowflake & Apache Kafka avec 8 ans d’expérience',
      'Expert Cybersécurité SOC certifié CISSP en Île-de-France',
      'Développeur Fullstack React et Node.js disponible immédiatement',
      'Ingénieur avec 3 à 5 ans d’expérience sur GCP BigQuery',
    ];

    objectiveQueries.forEach((q) => {
      const result = checkProtectedCriterion(q);
      expect(result.isProtected).toBe(false);
    });
  });

  it('halts search execution and returns PROTECTED_CRITERION payload from search engine', () => {
    const response = executeCandidateSearch({
      ...DEFAULT_SEARCH_FILTERS,
      query: 'Développeur femme de moins de 30 ans',
    });

    expect(response.protectedCriterion).not.toBeNull();
    expect(response.protectedCriterion?.code).toBe('PROTECTED_CRITERION');
    expect(response.candidates).toHaveLength(0);
    expect(response.totalCount).toBe(0);
  });
});

describe('4. Moteur de recherche, Mode aveugle & Déduplication (/recherche)', () => {
  it('deduplicates results so that each unique candidate appears at most once', () => {
    const response = executeCandidateSearch({
      ...DEFAULT_SEARCH_FILTERS,
      query: 'Python',
    });

    const ids = response.candidates.map((c) => c.candidate.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it('strictly enforces blind mode with zero nominative PII in candidate results', () => {
    const response = executeCandidateSearch({
      ...DEFAULT_SEARCH_FILTERS,
      folderId: 'fld-de-2026',
    });

    expect(response.candidates.length).toBeGreaterThan(0);

    response.candidates.forEach(({ candidate }) => {
      expect(candidate.isAnonymized).toBe(true);
      expect(candidate.pseudonym).toMatch(/^Candidat #[A-Z0-9]+$/);
      expect(candidate.hashId).toContain('SHA256:');

      // Aucune PII nominative n'est exposée sur l'objet DTO
      expect((candidate as any).firstName).toBeUndefined();
      expect((candidate as any).lastName).toBeUndefined();
      expect((candidate as any).email).toBeUndefined();
      expect((candidate as any).phone).toBeUndefined();
      expect((candidate as any).fullAddress).toBeUndefined();
    });
  });

  it('highlights matching skills corresponding to the search query', () => {
    const response = executeCandidateSearch({
      ...DEFAULT_SEARCH_FILTERS,
      query: 'Snowflake Kafka',
    });

    const leadData = response.candidates.find((c) => c.candidate.id === 'cand-a1b2');
    expect(leadData).toBeDefined();

    expect(leadData?.matchingSkills).toEqual(
      expect.arrayContaining(['Snowflake', 'Apache Kafka'])
    );
  });
});
