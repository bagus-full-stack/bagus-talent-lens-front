import type { CvDocumentBlindDto } from '@/types';

export type CriterionCategory = 'indispensable' | 'souhaite';

export interface MatchingCriterion {
  id: string;
  label: string;
  category: CriterionCategory;
  type: 'skill' | 'seniority' | 'location' | 'contract' | 'education' | 'language';
  weight: number;
}

export interface StructuredOfferCriteria {
  jobTitle: string;
  folderId: string;
  folderReference: string;
  folderTitle: string;
  seniority: string;
  location: string;
  contract: string;
  indispensables: MatchingCriterion[];
  souhaites: MatchingCriterion[];
}

export type CriterionStatus = 'satisfied' | 'partial' | 'missing';

export interface CriterionEvaluation {
  criterionId: string;
  criterionLabel: string;
  category: CriterionCategory;
  status: CriterionStatus; // 'satisfied' (✓), 'partial' (~), 'missing' (✗)
  detail: string;
  sourceExcerpt?: {
    page: number;
    text: string;
    bboxId?: string;
  };
}

export interface CandidateMatchResult {
  rank: number;
  candidate: CvDocumentBlindDto;
  overallScore: number; // 0 à 100%
  breakdown: {
    indispensableScore: number; // %
    indispensableSatisfied: number;
    indispensableTotal: number;
    souhaiteScore: number; // %
    souhaiteSatisfied: number;
    souhaiteTotal: number;
    similarityScore: number; // %
  };
  aiSummary: string;
  evaluations: CriterionEvaluation[];
  skillGap: {
    acquired: string[];
    partial: string[];
    missing: string[];
  };
  sourcedExcerpts: Array<{
    page: number;
    fieldLabel: string;
    text: string;
    bboxId?: string;
  }>;
  status: 'active' | 'shortlisted' | 'pipelined' | 'discarded';
  discardReason?: string;
}

export interface ScoringWeights {
  indispensableWeight: number; // ex: 50%
  souhaiteWeight: number; // ex: 30%
  similarityWeight: number; // ex: 20%
  version: string; // ex: "v2.4 - Octobre 2026"
  updatedAt: string;
  updatedBy: string;
}

export interface MatchRunHistoryItem {
  id: string;
  timestamp: string;
  jobTitle: string;
  folderReference: string;
  candidatesCount: number;
  topScore: number;
  weightsVersion: string;
}
