import { z } from 'zod';
import { AnomalySchema } from './cv-document';
import { PatternFieldSchema } from './pattern';

export const BoundingBoxSchema = z.object({
  id: z.string(),
  page: z.number().int().positive(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  label: z.string(),
  category: z.enum(['pii_name', 'pii_contact', 'pii_photo', 'skill', 'experience', 'salary', 'other']).optional(),
  anonymizedText: z.string().optional(),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const HumanCorrectionSchema = z.object({
  correctedBy: z.string(),
  correctedAt: z.string(),
  originalAiValue: z.any(),
  originalConfidence: z.number().min(0).max(100),
});

export type HumanCorrection = z.infer<typeof HumanCorrectionSchema>;

export const ExtractedFieldValueSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'list', 'boolean', 'enum']),
  value: z.any(),
  options: z.array(z.string()).optional(),
  isPii: z.boolean().default(false),
  piiCategory: z.string().optional(),
  confidence: z.number().min(0).max(100),
  isVerified: z.boolean().default(false),
  underThreshold: z.boolean().default(false),
  humanCorrection: HumanCorrectionSchema.optional(),
  bbox: BoundingBoxSchema.optional(),
  aiPromptDescription: z.string().optional(),
});

export type ExtractedFieldValue = z.infer<typeof ExtractedFieldValueSchema>;

export const CvInternalNoteSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  content: z.string().min(1, 'La note ne peut pas être vide'),
  createdAt: z.string(),
});

export type CvInternalNote = z.infer<typeof CvInternalNoteSchema>;

export const CvHistoryEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string(),
  timestamp: z.string(),
  details: z.string(),
});

export type CvHistoryEvent = z.infer<typeof CvHistoryEventSchema>;

export const CandidateCvDetailSchema = z.object({
  id: z.string(),
  pseudonym: z.string(),
  hashId: z.string(),
  folderId: z.string(),
  folderReference: z.string(),
  folderTitle: z.string(),
  currentTitle: z.string(),
  yearsExperience: z.number(),
  seniorityLevel: z.enum(['junior', 'confirmed', 'senior', 'lead', 'director']),
  location: z.string(),
  pipelineStage: z.string(),
  isShortlisted: z.boolean().default(false),
  isBlindMode: z.boolean().default(true),
  isRestricted: z.boolean().default(false),
  version: z.number().int().nonnegative().default(1),
  extractionStatus: z.enum(['in_progress', 'completed', 'validated', 'error']),
  aiMatchScore: z.number().min(0).max(100),
  aiConfidence: z.number().min(0).max(100),
  aiJustification: z.string(),
  patternId: z.string(),
  patternVersion: z.string(),
  patternName: z.string(),
  patternJsonSchema: z.record(z.string(), z.any()),
  patternFields: z.array(PatternFieldSchema),
  extractedFields: z.record(z.string(), ExtractedFieldValueSchema),
  skills: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
    level: z.string().optional(),
  })),
  experiences: z.array(z.object({
    role: z.string(),
    companySector: z.string(),
    period: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()),
  })),
  education: z.array(z.object({
    degree: z.string(),
    institutionType: z.string(),
    year: z.string().optional(),
  })),
  notes: z.array(CvInternalNoteSchema),
  history: z.array(CvHistoryEventSchema),
  anomalies: z.array(AnomalySchema),
  navigation: z.object({
    previousId: z.string().nullable(),
    nextId: z.string().nullable(),
    currentIndex: z.number().int().nonnegative(),
    totalInFolder: z.number().int().nonnegative(),
  }),
  unmaskInfo: z.object({
    actorName: z.string(),
    reason: z.string(),
    unmaskedAt: z.string(),
    expiresAt: z.string(),
  }).optional(),
  nominative: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    fullAddress: z.string(),
    originalCompanies: z.array(z.string()),
    originalInstitutions: z.array(z.string()),
    originalPdfUrl: z.string(),
  }).optional(),
});

export type CandidateCvDetail = z.infer<typeof CandidateCvDetailSchema>;
