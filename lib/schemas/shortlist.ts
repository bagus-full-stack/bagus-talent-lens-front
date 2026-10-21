import { z } from 'zod';

export const ShortlistVisibilitySchema = z.enum(['private', 'team']);
export type ShortlistVisibility = z.infer<typeof ShortlistVisibilitySchema>;

export const ShortlistSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  folderId: z.string(),
  folderReference: z.string(),
  folderTitle: z.string().optional(),
  organizationId: z.string().optional(),
  createdBy: z.string(),
  createdByName: z.string(),
  candidateIds: z.array(z.string()),
  visibility: ShortlistVisibilitySchema.default('team'),
  isBlind: z.boolean().default(true),
  notes: z.record(z.string(), z.string()).default({}), // candidateId -> note (commentaire court)
  rankings: z.record(z.string(), z.number()).default({}), // candidateId -> rank (1, 2, 3...)
  candidateCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Shortlist = z.infer<typeof ShortlistSchema>;

export const ShortlistCandidateRecordSchema = z.object({
  candidateId: z.string(),
  rank: z.number().int().positive(),
  pseudonym: z.string(),
  currentTitle: z.string(),
  matchScore: z.number().min(0).max(100),
  topSkills: z.array(z.string()),
  note: z.string().default(''),
  isRestricted: z.boolean().default(false), // Opposition RGPD (Traitement limité)
  rgpdStatus: z.string(),
  isBlind: z.boolean().default(true),
});

export type ShortlistCandidateRecord = z.infer<typeof ShortlistCandidateRecordSchema>;

export const CreateShortlistInputSchema = z.object({
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères'),
  folderId: z.string().min(1, 'Un dossier / offre doit être sélectionné'),
  visibility: ShortlistVisibilitySchema.default('team'),
  candidateIds: z.array(z.string()).default([]),
});

export type CreateShortlistInput = z.infer<typeof CreateShortlistInputSchema>;
