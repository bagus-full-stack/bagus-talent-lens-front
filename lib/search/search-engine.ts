import { mockCandidatesRaw, sanitizeToBlindDto, type MockCandidateRecord } from '@/lib/mock/data/candidates';
import type { CvDocumentBlindDto } from '@/types';
import { checkProtectedCriterion, type ProtectedCriterionResult, type ProtectedCriterionDetection } from './protected-criteria';
import type { SearchFilters } from './search-params';

export interface SearchCandidateResult {
  candidate: CvDocumentBlindDto;
  relevanceScore: number;
  matchingSkills: string[];
  justificationExcerpt: string;
}

export interface SearchResponse {
  candidates: SearchCandidateResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  protectedCriterion: ProtectedCriterionDetection | null;
  activeFilterCount: number;
}

export const KNOWN_SKILLS_LIST = [
  'Snowflake',
  'Python avancé',
  'Apache Kafka',
  'Data Governance',
  'GCP BigQuery',
  'Terraform',
  'dbt',
  'CISSP',
  'SIEM Splunk',
  'CrowdStrike Falcon',
  'Mitre ATT&CK',
  'Python SecOps',
  'ISO 27001 Lead Implementer',
  'AWS',
  'Airflow',
  'Kubernetes',
  'Docker',
  'React',
  'TypeScript',
  'Node.js',
  'PySpark',
  'Datadog',
  'PostgreSQL',
  'GraphQL',
  'Go / Golang',
  'CI/CD GitLab',
  'Elasticsearch',
  'Redis',
  'Ansible',
  'DevSecOps',
];

export const SEARCH_PROMPT_EXAMPLES = [
  {
    label: 'Lead Data Platform (Snowflake & Kafka)',
    query: 'Lead Data Architect Snowflake & Kafka avec 8+ ans d’expérience disponible rapidement',
  },
  {
    label: 'Expert Cyber SOC (CISSP / Splunk)',
    query: 'Expert Cybersécurité SOC certifié CISSP ou ISO 27001 en Île-de-France',
  },
  {
    label: 'Fullstack Cloud (React / Node / AWS)',
    query: 'Staff Fullstack Architect React, TypeScript et microservices AWS en télétravail',
  },
  {
    label: 'Ingénieur Data Confirmé (Python / dbt)',
    query: 'Ingénieur Data Confirmé maîtrisant Python, dbt et modélisation dimensionnelle',
  },
  {
    label: '⚠️ Test Garde-fou (Critère protégé)',
    query: 'Développeur femme de moins de 30 ans disponible immédiatement',
  },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Moteur de recherche sémantique & vectoriel TalentLens
 * Conforme RGPD, mode aveugle natif et garde-fou éthique
 */
export function executeCandidateSearch(
  filters: SearchFilters,
  pageSize = 6
): SearchResponse {
  // 1. Audit préalable de critère protégé
  if (filters.query && filters.query.trim()) {
    const protectedAudit: ProtectedCriterionResult = checkProtectedCriterion(filters.query);
    if (protectedAudit.isProtected) {
      return {
        candidates: [],
        totalCount: 0,
        page: 1,
        totalPages: 0,
        pageSize,
        protectedCriterion: protectedAudit,
        activeFilterCount: 0,
      };
    }
  }

  // 2. Base de candidats dédupliqués (1 carte par candidat unique)
  let rawList = [...mockCandidatesRaw];

  // Filtre par dossier de recrutement
  if (filters.folderId && filters.folderId !== 'all') {
    rawList = rawList.filter((c) => c.folderId === filters.folderId);
  }

  // Filtre par années d'expérience (curseur)
  if (filters.minExperience > 0) {
    rawList = rawList.filter((c) => c.yearsExperience >= filters.minExperience);
  }
  if (filters.maxExperience < 15) {
    rawList = rawList.filter((c) => c.yearsExperience <= filters.maxExperience);
  }

  // Filtre par localisation et rayon
  if (filters.location && filters.location.trim()) {
    const locNorm = normalize(filters.location);
    rawList = rawList.filter((c) => {
      const candLoc = normalize(c.location);
      if (locNorm.includes('remote') || locNorm.includes('teletravail')) {
        return candLoc.includes('remote') || candLoc.includes('hybride');
      }
      return candLoc.includes(locNorm);
    });
  }

  // Filtre par disponibilité
  if (filters.availability && filters.availability !== 'all') {
    rawList = rawList.filter((c) => {
      const avail = normalize(c.availability);
      if (filters.availability === 'immediate') {
        return avail.includes('immédiat') || avail.includes('immediat') || avail.includes('disponible');
      }
      if (filters.availability === '1_month') {
        return avail.includes('1 mois') || avail.includes('immédiat') || avail.includes('immediat');
      }
      if (filters.availability === '3_months') {
        return avail.includes('3 mois') || avail.includes('1 mois') || avail.includes('immédiat');
      }
      return true;
    });
  }

  // Filtre par niveau d'études
  if (filters.educationLevel && filters.educationLevel !== 'all') {
    rawList = rawList.filter((c) => {
      const edus = c.education.map((e) => normalize(e.degree)).join(' ');
      if (filters.educationLevel === 'bac5') {
        return edus.includes('ingenieur') || edus.includes('master') || edus.includes('bac+5');
      }
      if (filters.educationLevel === 'bac3') {
        return edus.includes('licence') || edus.includes('bachelor') || edus.includes('bac+3');
      }
      if (filters.educationLevel === 'doctorat') {
        return edus.includes('doctorat') || edus.includes('phd');
      }
      return true;
    });
  }

  // Filtre par compétences strictes
  if (filters.skills && filters.skills.length > 0) {
    rawList = rawList.filter((c) => {
      const candSkills = c.skills.map((s) => normalize(s));
      return filters.skills.some((req) =>
        candSkills.some((cs) => cs.includes(normalize(req)))
      );
    });
  }

  // 3. Calcul de pertinence sémantique & extraction de compétences correspondantes
  const queryTokens = filters.query
    ? normalize(filters.query)
        .split(/[\s,;+]+/)
        .filter((w) => w.length >= 3 && !['avec', 'pour', 'dans', 'plus', 'sous', 'sont'].includes(w))
    : [];

  const scoredResults: SearchCandidateResult[] = rawList.map((candRecord) => {
    // Calcul des compétences correspondantes
    const matchingSkills: string[] = [];
    candRecord.skills.forEach((skill) => {
      const normSkill = normalize(skill);
      // Correspondance avec filtre explicite
      if (filters.skills.some((s) => normSkill.includes(normalize(s)))) {
        matchingSkills.push(skill);
        return;
      }
      // Correspondance avec mots-clés de la requête en langage naturel
      if (queryTokens.some((token) => normSkill.includes(token))) {
        matchingSkills.push(skill);
      }
    });

    // Score de pertinence dynamique
    let relevanceScore = candRecord.aiMatchScore;

    if (queryTokens.length > 0) {
      let boost = 0;
      const fullText = normalize(
        `${candRecord.currentTitle} ${candRecord.experienceSummary} ${candRecord.skills.join(' ')} ${candRecord.aiJustification}`
      );
      queryTokens.forEach((token) => {
        if (fullText.includes(token)) boost += 5;
      });
      relevanceScore = Math.min(99, Math.max(50, relevanceScore + boost - (matchingSkills.length === 0 ? 15 : 0)));
    }

    const blindDto = sanitizeToBlindDto(candRecord);

    return {
      candidate: blindDto,
      relevanceScore,
      matchingSkills: Array.from(new Set(matchingSkills)),
      justificationExcerpt: candRecord.aiJustification || candRecord.experienceSummary,
    };
  });

  // 4. Tri des résultats
  scoredResults.sort((a, b) => {
    if (filters.sortBy === 'experience') {
      return b.candidate.yearsExperience - a.candidate.yearsExperience;
    }
    if (filters.sortBy === 'availability') {
      const aImm = a.candidate.availability.toLowerCase().includes('immédiat') ? 1 : 0;
      const bImm = b.candidate.availability.toLowerCase().includes('immédiat') ? 1 : 0;
      return bImm - aImm;
    }
    // Pertinence par défaut
    return b.relevanceScore - a.relevanceScore;
  });

  // 5. Pagination par curseur
  const totalCount = scoredResults.length;
  const page = Math.max(1, filters.cursor);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedCandidates = scoredResults.slice(startIndex, startIndex + pageSize);

  return {
    candidates: paginatedCandidates,
    totalCount,
    page,
    totalPages,
    pageSize,
    protectedCriterion: null,
    activeFilterCount: 0,
  };
}
