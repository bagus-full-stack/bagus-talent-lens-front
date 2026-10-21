/**
 * Module d'audit et de conformité éthique de recherche TalentLens
 * En application stricte de l'article L. 1132-1 du Code du travail français
 * et du Règlement Général sur la Protection des Données (RGPD).
 */

export interface ProtectedCriterionDetection {
  isProtected: true;
  code: 'PROTECTED_CRITERION';
  category: 'age' | 'gender' | 'origin' | 'family' | 'health' | 'religion' | 'physical';
  categoryLabel: string;
  detectedSnippet: string;
  legalNotice: string;
  message: string;
  suggestion: string;
}

export interface NoProtectedCriterion {
  isProtected: false;
}

export type ProtectedCriterionResult = ProtectedCriterionDetection | NoProtectedCriterion;

interface CriterionPattern {
  category: ProtectedCriterionDetection['category'];
  categoryLabel: string;
  regex: RegExp;
  generateSuggestion: (query: string, match: string) => string;
}

const PROTECTED_PATTERNS: CriterionPattern[] = [
  // 1. ÂGE (Art. L1132-1)
  {
    category: 'age',
    categoryLabel: 'Âge',
    regex: /\b(?:moins\s+de\s+\d{1,2}\s*(?:ans|a)|plus\s+de\s+\d{1,2}\s*(?:ans|a)|\d{1,2}\s*(?:ans|a)\s*(?:maximum|max|minimum|min)|jeune|jeunes|senior\s+de\s+\d{1,2}\s*ans|retraité|retraitée|cinquantenaire|trentenaire|vingtenaire|âge|agée?|âgée?)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Développeur ou Ingénieur'} avec 3 à 5 ans d'expérience`;
    },
  },

  // 2. GENRE / SEXE / GROSSESSE
  {
    category: 'gender',
    categoryLabel: 'Genre / Sexe',
    regex: /\b(?:femme|femmes|homme|hommes|masculin|féminin|maternité|enceinte|père\s+de\s+famille|mère\s+de\s+famille)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Profil qualifié'} certifié ou diplômé`;
    },
  },

  // 3. ORIGINE / NATIONALITÉ / ETHNIE
  {
    category: 'origin',
    categoryLabel: 'Origine / Nationalité',
    regex: /\b(?:français\s+de\s+souche|européen|européenne|africain|africaine|asiatique|arabe|caucasien|caucasienne|étrangère?|nationalité\s+française|origine\s+[a-z]+)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Candidat'} maîtrisant le français professionnel et la stack technique`;
    },
  },

  // 4. SITUATION DE FAMILLE / ÉTAT CIVIL
  {
    category: 'family',
    categoryLabel: 'Situation de famille',
    regex: /\b(?:célibataire|marié|mariée|sans\s+enfants?|enfants?|divorcé|divorcée|famille|charges?\s+de\s+famille)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Candidat'} disponible immédiatement avec politique de télétravail flexible`;
    },
  },

  // 5. SANTÉ / HANDICAP
  {
    category: 'health',
    categoryLabel: 'Santé / Handicap',
    regex: /\b(?:sans\s+handicap|non\s+handicapé|santé\s+parfaite|valide|handicap|maladie|antécédents?\s+médicaux)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Candidat'} répondant aux exigences techniques du poste`;
    },
  },

  // 6. RELIGION / CROYANCES
  {
    category: 'religion',
    categoryLabel: 'Religion / Convictions',
    regex: /\b(?:chrétien|chrétienne|musulman|musulmane|juif|juive|catholique|religion|croyant|croyante|voile|pratiquant)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Candidat'} spécialisé dans les compétences requises`;
    },
  },

  // 7. APPARENCE PHYSIQUE
  {
    category: 'physical',
    categoryLabel: 'Apparence physique',
    regex: /\b(?:bonne\s+présentation\s+physique|beau|belle|mince|taille\s+minimale|photo\s+obligatoire|apparence)\b/i,
    generateSuggestion: (query, match) => {
      const clean = query.replace(new RegExp(match, 'gi'), '').replace(/\s+/g, ' ').trim();
      return `${clean || 'Profil'} avec excellente communication professionnelle`;
    },
  },
];

/**
 * Analyse une requête en langage naturel pour détecter tout critère discriminatoire prohibé.
 */
export function checkProtectedCriterion(query: string): ProtectedCriterionResult {
  if (!query || typeof query !== 'string') {
    return { isProtected: false };
  }

  const normalized = query.trim();

  for (const item of PROTECTED_PATTERNS) {
    const match = normalized.match(item.regex);
    if (match) {
      const detectedSnippet = match[0];
      const suggestion = item.generateSuggestion(normalized, detectedSnippet);

      return {
        isProtected: true,
        code: 'PROTECTED_CRITERION',
        category: item.category,
        categoryLabel: item.categoryLabel,
        detectedSnippet,
        legalNotice: 'Article L. 1132-1 du Code du travail : Aucun candidat ne peut être écarté d’une procédure de recrutement en raison de son origine, de son sexe, de sa situation de famille, de son apparence physique ou de son âge.',
        message: `Critère protégé détecté : « ${detectedSnippet} » (${item.categoryLabel}). La recherche par critère personnel discriminatoire est strictement bloquée par l'algorithme éthique de TalentLens.`,
        suggestion,
      };
    }
  }

  return { isProtected: false };
}
