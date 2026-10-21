import { z } from 'zod';
import { BoundingBoxSchema } from './cv-detail';

export const VerificationMotifSchema = z.enum([
  'confiance_faible',
  'champ_manquant',
  'document_illisible',
  'contenu_suspect',
  'doublon_probable',
]);

export type VerificationMotif = z.infer<typeof VerificationMotifSchema>;

export const VerificationSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type VerificationSeverity = z.infer<typeof VerificationSeveritySchema>;

export const VerificationStatusSchema = z.enum(['pending', 'in_progress', 'treated', 'excluded']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const DoubtfulFieldStatusSchema = z.enum(['pending', 'validated', 'corrected', 'ignored']);
export type DoubtfulFieldStatus = z.infer<typeof DoubtfulFieldStatusSchema>;

export const DoubtfulFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  currentValue: z.any(),
  suggestedValue: z.any().optional(),
  correctedValue: z.any().optional(),
  type: z.enum(['text', 'number', 'date', 'list', 'boolean', 'enum']).default('text'),
  options: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100),
  issue: z.string(),
  status: DoubtfulFieldStatusSchema.default('pending'),
  bbox: BoundingBoxSchema.optional(),
  updatedAt: z.string().optional(),
});

export type DoubtfulField = z.infer<typeof DoubtfulFieldSchema>;

export const SuspiciousContentDetailsSchema = z.object({
  type: z.enum(['prompt_injection', 'hidden_text', 'system_hijack', 'jailbreak_attempt']),
  detectedText: z.string(),
  detectionMethod: z.string(),
  riskLevel: VerificationSeveritySchema.default('critical'),
  threatDescription: z.string(),
  mitigationStatus: z.enum(['pending', 'excluded', 'confirmed_clean']).default('pending'),
  confirmationReason: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
});

export type SuspiciousContentDetails = z.infer<typeof SuspiciousContentDetailsSchema>;

export const DuplicateDetailsSchema = z.object({
  matchedCandidateId: z.string(),
  matchedPseudonym: z.string(),
  matchedFolderReference: z.string(),
  matchedFolderTitle: z.string(),
  similarityScore: z.number().min(0).max(100),
  identicalFields: z.array(z.string()),
  differencesSummary: z.string(),
  resolutionStatus: z.enum(['pending', 'merged', 'kept_separate']).default('pending'),
  resolvedAt: z.string().optional(),
});

export type DuplicateDetails = z.infer<typeof DuplicateDetailsSchema>;

export const VerificationItemSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  pseudonym: z.string(), // Strictement anonymisé (ex: "Candidat #S4P9")
  hashId: z.string(),
  folderId: z.string(),
  folderReference: z.string(),
  folderTitle: z.string(),
  createdAt: z.string(),
  status: VerificationStatusSchema.default('pending'),
  motif: VerificationMotifSchema,
  motifLabel: z.string(),
  severity: VerificationSeveritySchema,
  summary: z.string(),
  doubtfulFields: z.array(DoubtfulFieldSchema),
  suspiciousDetails: SuspiciousContentDetailsSchema.optional(),
  duplicateDetails: DuplicateDetailsSchema.optional(),
  documentPageCount: z.number().int().positive().default(1),
  anonymizedSnippet: z.string(),
  // Strictement aveugle : aucune PII
  isBlindMode: z.literal(true).default(true),
});

export type VerificationItem = z.infer<typeof VerificationItemSchema>;

export const VerificationFilterSchema = z.object({
  motif: z.union([VerificationMotifSchema, z.literal('all')]).default('all'),
  folderId: z.string().default('all'),
  status: z.union([VerificationStatusSchema, z.literal('all')]).default('all'),
  dateRange: z.enum(['all', 'today', 'last_7_days', 'last_30_days']).default('all'),
  search: z.string().default(''),
});

export type VerificationFilter = z.infer<typeof VerificationFilterSchema>;

export const VerificationStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  treated: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  excluded: z.number().int().nonnegative(),
  suspiciousCount: z.number().int().nonnegative(),
});

export type VerificationStats = z.infer<typeof VerificationStatsSchema>;
