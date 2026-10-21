import { z } from 'zod';

export const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int().nonnegative(),
  isBlindMandatory: z.boolean().default(true),
  isUnmaskTrigger: z.boolean().default(false), // Déclenche proposition de levée aveugle
  colorKey: z.enum(['blue', 'indigo', 'amber', 'purple', 'emerald', 'sky']),
  description: z.string().optional(),
});

export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const CandidacyStatusSchema = z.enum([
  'in_pipeline',
  'rejected',
  'hired',
  'withdrawn',
]);

export type CandidacyStatus = z.infer<typeof CandidacyStatusSchema>;

export const CandidacySchema = z.object({
  id: z.string(),
  folderId: z.string(),
  cvDocumentId: z.string(),
  stageId: z.string(),
  status: CandidacyStatusSchema,
  matchScore: z.number().min(0).max(100),
  appliedAt: z.string(),
  currentStageName: z.string(),
  assignedRecruiterId: z.string(),
  assignedRecruiterName: z.string(),
  daysInStage: z.number().int().nonnegative(),
  rejectionReason: z.string().optional(),
  internalNotesCount: z.number().int().nonnegative().default(0),
  isBlind: z.boolean().default(true),
  updatedAt: z.string(),
});

export type Candidacy = z.infer<typeof CandidacySchema>;
