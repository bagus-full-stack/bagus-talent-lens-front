import { mockCandidatesRaw, sanitizeToBlindDto } from '@/lib/mock/data/candidates';
import type {
  MatchingCriterion,
  StructuredOfferCriteria,
  CandidateMatchResult,
  CriterionEvaluation,
  ScoringWeights,
  MatchRunHistoryItem,
} from './types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  indispensableWeight: 50,
  souhaiteWeight: 30,
  similarityWeight: 20,
  version: 'v2.4 - Octobre 2026',
  updatedAt: '2026-10-01T09:00:00Z',
  updatedBy: 'Direction Éthique & Algorithmes TalentLens',
};

export const INITIAL_MATCH_RUN_HISTORY: MatchRunHistoryItem[] = [
  {
    id: 'run-9021',
    timestamp: '2026-10-05T14:32:00Z',
    jobTitle: 'Lead Data Platform & Architect',
    folderReference: '#DE-2026',
    candidatesCount: 14,
    topScore: 96,
    weightsVersion: 'v2.4 - Octobre 2026',
  },
  {
    id: 'run-8812',
    timestamp: '2026-10-04T10:15:00Z',
    jobTitle: 'Senior Security Operations & Incident Responder',
    folderReference: '#CYB-88',
    candidatesCount: 10,
    topScore: 92,
    weightsVersion: 'v2.3 - Septembre 2026',
  },
  {
    id: 'run-7740',
    timestamp: '2026-09-29T16:45:00Z',
    jobTitle: 'Staff Fullstack Architect (Node/React/AWS)',
    folderReference: '#FULL-12',
    candidatesCount: 6,
    topScore: 89,
    weightsVersion: 'v2.3 - Septembre 2026',
  },
];

export const PRESET_JOB_OFFERS: Record<string, StructuredOfferCriteria> = {
  'fld-de-2026': {
    jobTitle: 'Lead Data Platform & Architect Lakehouse',
    folderId: 'fld-de-2026',
    folderReference: '#DE-2026',
    folderTitle: 'Data Engineer Paris',
    seniority: 'Senior / Lead (7 à 10 ans)',
    location: 'Paris / Île-de-France (Hybride 2j)',
    contract: 'CDI',
    indispensables: [
      {
        id: 'crit-de-1',
        label: 'Maîtrise approfondie de Snowflake & Architecture Lakehouse',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-de-2',
        label: 'Expertise Python distribué & PySpark',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-de-3',
        label: 'Ingestion de flux temps réel via Apache Kafka',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-de-4',
        label: 'Au moins 6 ans d’expérience en Data Engineering',
        category: 'indispensable',
        type: 'seniority',
        weight: 1.0,
      },
    ],
    souhaites: [
      {
        id: 'crit-de-5',
        label: 'Pratique de dbt (data build tool) & Modélisation dimensionnelle',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-de-6',
        label: 'Connaissance du Cloud GCP (BigQuery / Dataflow)',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-de-7',
        label: 'Infrastructure as Code avec Terraform',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
    ],
  },
  'fld-cyb-88': {
    jobTitle: 'Senior Security Operations & Incident Responder SOC L3',
    folderId: 'fld-cyb-88',
    folderReference: '#CYB-88',
    folderTitle: 'Cybersécurité Senior SOC',
    seniority: 'Senior (6 à 8 ans)',
    location: 'Paris / IDF (Hybride 2j/sem.)',
    contract: 'CDI',
    indispensables: [
      {
        id: 'crit-cyb-1',
        label: 'Investigation et réponse aux incidents SOC L3',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-cyb-2',
        label: 'Certification de sécurité reconnue (CISSP ou équivalent)',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-cyb-3',
        label: 'Maîtrise approfondie des SIEM (Splunk / CrowdStrike)',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
    ],
    souhaites: [
      {
        id: 'crit-cyb-4',
        label: 'Framework Mitre ATT&CK & Threat Hunting',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-cyb-5',
        label: 'Scripting d’automatisation Python SecOps',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-cyb-6',
        label: 'Norme ISO 27001 Lead Implementer',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
    ],
  },
  'fld-full-12': {
    jobTitle: 'Staff Fullstack Architect (Node/React/AWS)',
    folderId: 'fld-full-12',
    folderReference: '#FULL-12',
    folderTitle: 'Fullstack Cloud & DevOps',
    seniority: 'Lead / Staff (8+ ans)',
    location: 'Full Remote France',
    contract: 'CDI',
    indispensables: [
      {
        id: 'crit-full-1',
        label: 'Architecture TypeScript / React & Next.js avancée',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-full-2',
        label: 'Conception de microservices backend sous Node.js & GraphQL',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-full-3',
        label: 'Déploiement et conteneurisation Cloud AWS / Kubernetes',
        category: 'indispensable',
        type: 'skill',
        weight: 1.0,
      },
    ],
    souhaites: [
      {
        id: 'crit-full-4',
        label: 'Pratique de Go (Golang) sur les composants haute performance',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
      {
        id: 'crit-full-5',
        label: 'Pipelines CI/CD GitLab & Observabilité Datadog',
        category: 'souhaite',
        type: 'skill',
        weight: 1.0,
      },
    ],
  },
};

export const SAMPLE_JOB_OFFER_TEXT = `OFFRE D'EMPLOI : Lead Data Platform & Architect Lakehouse
Réf Dossier : #DE-2026 - Pôle Data Engineering
Localisation : Paris (Hybride 2j de télétravail par semaine)
Contrat : CDI - Rémunération : 68k - 78k €

Missions et responsabilités :
Nous recherchons un Lead Data Engineer / Architect pour piloter la refonte de notre plateforme analytique vers un Data Lakehouse unifié sous Snowflake et Kafka.
Vous encadrerez une équipe de 6 ingénieurs data et garantirez la performance, la scalabilité et la stricte conformité RGPD de nos flux de streaming.

Prérequis indispensables :
- 6 à 8 années d'expérience minimum en architecture distribuée.
- Maîtrise éprouvée de Snowflake, Python distribué (PySpark) et Apache Kafka.
- Expérience de migration de data warehouses legacy vers une architecture Lakehouse moderne.

Compétences souhaitées :
- Pratique de dbt (data build tool) et gouvernance des données.
- Connaissance de Google Cloud Platform (BigQuery) ou AWS.
- Automatisation de l'infrastructure via Terraform et observabilité Datadog.`;

/**
 * Calcul déterministe d'adéquation compétences / offre
 */
export function calculateMatchingResults(
  criteria: StructuredOfferCriteria,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  folderId?: string
): CandidateMatchResult[] {
  const targetFolderId = folderId || criteria.folderId;
  const filteredCandidates = mockCandidatesRaw.filter((c) =>
    targetFolderId && targetFolderId !== 'all' ? c.folderId === targetFolderId : true
  );

  const results: CandidateMatchResult[] = filteredCandidates.map((candRecord) => {
    const blindDto = sanitizeToBlindDto(candRecord);
    const evaluations: CriterionEvaluation[] = [];

    const candSkillsLower = candRecord.skills.map((s) => s.toLowerCase());
    const fullTextLower = `${candRecord.currentTitle} ${candRecord.experienceSummary} ${candRecord.skills.join(' ')} ${candRecord.experiences.map((e) => `${e.role} ${e.summary} ${e.highlights.join(' ')}`).join(' ')}`.toLowerCase();

    // 1. Évaluation des critères indispensables
    let indispensableSatisfiedCount = 0;
    criteria.indispensables.forEach((crit) => {
      const critTokens = crit.label.toLowerCase().split(/[\s,;&/]+/).filter((w) => w.length >= 4);
      let matchCount = 0;
      critTokens.forEach((tok) => {
        if (candSkillsLower.some((s) => s.includes(tok)) || fullTextLower.includes(tok)) {
          matchCount++;
        }
      });

      // Cas spécial séniorité
      if (crit.type === 'seniority') {
        const requiredYears = 6;
        if (candRecord.yearsExperience >= requiredYears) {
          evaluations.push({
            criterionId: crit.id,
            criterionLabel: crit.label,
            category: 'indispensable',
            status: 'satisfied',
            detail: `${candRecord.yearsExperience} ans d'expérience validés (seuil exigé : ${requiredYears} ans).`,
            sourceExcerpt: {
              page: 1,
              text: `${candRecord.yearsExperience} années d'expertise déclarées dans le parcours.`,
              bboxId: 'bbox-years-1',
            },
          });
          indispensableSatisfiedCount++;
          return;
        } else {
          evaluations.push({
            criterionId: crit.id,
            criterionLabel: crit.label,
            category: 'indispensable',
            status: 'partial',
            detail: `${candRecord.yearsExperience} ans d'expérience (légèrement inférieur aux ${requiredYears} ans requis).`,
          });
          return;
        }
      }

      if (matchCount >= 2 || candSkillsLower.some((s) => crit.label.toLowerCase().includes(s))) {
        evaluations.push({
          criterionId: crit.id,
          criterionLabel: crit.label,
          category: 'indispensable',
          status: 'satisfied',
          detail: 'Compétence confirmée par les missions récentes et validée dans le profil.',
          sourceExcerpt: {
            page: 1,
            text: `Réalisations probantes sur ${crit.label.slice(0, 40)}...`,
            bboxId: `bbox-${crit.id}`,
          },
        });
        indispensableSatisfiedCount++;
      } else if (matchCount === 1) {
        evaluations.push({
          criterionId: crit.id,
          criterionLabel: crit.label,
          category: 'indispensable',
          status: 'partial',
          detail: 'Compétence partiellement couverte ou mentionnée dans un contexte connexe.',
        });
      } else {
        evaluations.push({
          criterionId: crit.id,
          criterionLabel: crit.label,
          category: 'indispensable',
          status: 'missing',
          detail: 'Critère absent des compétences et réalisations du profil.',
        });
      }
    });

    // 2. Évaluation des critères souhaités
    let souhaiteSatisfiedCount = 0;
    criteria.souhaites.forEach((crit) => {
      const critTokens = crit.label.toLowerCase().split(/[\s,;&/]+/).filter((w) => w.length >= 4);
      let matchCount = 0;
      critTokens.forEach((tok) => {
        if (candSkillsLower.some((s) => s.includes(tok)) || fullTextLower.includes(tok)) {
          matchCount++;
        }
      });

      if (matchCount >= 1 || candSkillsLower.some((s) => crit.label.toLowerCase().includes(s))) {
        evaluations.push({
          criterionId: crit.id,
          criterionLabel: crit.label,
          category: 'souhaite',
          status: 'satisfied',
          detail: 'Atout technique confirmé dans le parcours.',
          sourceExcerpt: {
            page: 2,
            text: `Projet validé intégrant ${crit.label.slice(0, 35)}...`,
            bboxId: `bbox-${crit.id}`,
          },
        });
        souhaiteSatisfiedCount++;
      } else {
        evaluations.push({
          criterionId: crit.id,
          criterionLabel: crit.label,
          category: 'souhaite',
          status: 'missing',
          detail: 'Non mentionné comme compétence active.',
        });
      }
    });

    // Calcul des sous-scores
    const indispensableTotal = criteria.indispensables.length || 1;
    const indispensableScore = Math.round((indispensableSatisfiedCount / indispensableTotal) * 100);

    const souhaiteTotal = criteria.souhaites.length || 1;
    const souhaiteScore = Math.round((souhaiteSatisfiedCount / souhaiteTotal) * 100);

    const similarityScore = candRecord.aiMatchScore;

    // Calcul du score global pondéré
    const totalWeights = weights.indispensableWeight + weights.souhaiteWeight + weights.similarityWeight || 100;
    const overallScore = Math.round(
      (indispensableScore * weights.indispensableWeight +
        souhaiteScore * weights.souhaiteWeight +
        similarityScore * weights.similarityWeight) /
        totalWeights
    );

    // Skill gap
    const acquired = evaluations.filter((e) => e.status === 'satisfied').map((e) => e.criterionLabel);
    const partial = evaluations.filter((e) => e.status === 'partial').map((e) => e.criterionLabel);
    const missing = evaluations.filter((e) => e.status === 'missing').map((e) => e.criterionLabel);

    // Citations sourcées
    const sourcedExcerpts = evaluations
      .filter((e) => e.sourceExcerpt)
      .map((e) => ({
        page: e.sourceExcerpt!.page,
        fieldLabel: e.criterionLabel,
        text: e.sourceExcerpt!.text,
        bboxId: e.sourceExcerpt!.bboxId,
      }));

    return {
      rank: 1,
      candidate: blindDto,
      overallScore: Math.min(99, Math.max(45, overallScore)),
      breakdown: {
        indispensableScore,
        indispensableSatisfied: indispensableSatisfiedCount,
        indispensableTotal,
        souhaiteScore,
        souhaiteSatisfied: souhaiteSatisfiedCount,
        souhaiteTotal,
        similarityScore,
      },
      aiSummary: candRecord.aiJustification || `Profil en adéquation forte sur ${acquired.length} critères analysés.`,
      evaluations,
      skillGap: { acquired, partial, missing },
      sourcedExcerpts,
      status: 'active',
    };
  });

  // Déduplication stricte (un candidat par ID unique) et tri décroissant
  const deduplicatedMap = new Map<string, CandidateMatchResult>();
  results.forEach((r) => {
    if (!deduplicatedMap.has(r.candidate.id)) {
      deduplicatedMap.set(r.candidate.id, r);
    }
  });

  const sorted = Array.from(deduplicatedMap.values()).sort((a, b) => b.overallScore - a.overallScore);

  // Attribution des rangs
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  return sorted;
}
