import { z } from 'zod';

export const ExportFormatSchema = z.enum([
  'pdf_shortlist',
  'pdf_individual',
  'csv_table',
  'worm_certified_pdf',
]);

export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportConfidentialitySchema = z.enum([
  'anonymized_strict',
  'nominative_justified',
]);

export type ExportConfidentiality = z.infer<typeof ExportConfidentialitySchema>;

export const ExportStatusSchema = z.enum([
  'available',
  'downloaded',
  'expired',
  'blocked',
]);

export type ExportStatus = z.infer<typeof ExportStatusSchema>;

export const ExportSchema = z.object({
  id: z.string(), // ex: "#EXP-2026-9812"
  organizationId: z.string().uuid(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  folderId: z.string(),
  folderReference: z.string(),
  folderTitle: z.string(),
  title: z.string(),
  format: ExportFormatSchema,
  confidentiality: ExportConfidentialitySchema,
  candidateCount: z.number().int().positive(),
  fileSizeBytes: z.number().int().positive(),
  downloadUrl: z.string().optional(),
  expiresAt: z.string(), // 7 jours de rétention
  status: ExportStatusSchema,
  justification: z.string().optional(),
  sha256Hash: z.string(),
  downloadCount: z.number().int().default(0),
  lastAccessedAt: z.string().optional(),
  createdAt: z.string(),
});

export type Export = z.infer<typeof ExportSchema>;

export const NOMINATIVE_REASON_LABELS: Record<string, string> = {
  contract_preparation: 'Préparation d’une promesse d’embauche / contrat de travail',
  client_explicit_request: 'Demande expresse du client avec DPA / accord de confidentialité signé',
  legal_compliance: 'Conformité légale / obligation réglementaire',
  client_interview_meeting: 'Entretien direct avec le candidat planifié',
};

export const CreateExportInputSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  folderId: z.string().optional(),
  folderReference: z.string().optional(),
  folderTitle: z.string().optional(),
  candidateCount: z.number().int().positive(),
  format: ExportFormatSchema,
  confidentiality: ExportConfidentialitySchema,
  options: z.object({
    includeScores: z.boolean().default(true),
    includeSkills: z.boolean().default(true),
    includeContact: z.boolean().default(false),
    includeNotes: z.boolean().default(false),
  }),
  nominativeJustification: z
    .object({
      reasonCode: z.string().optional(),
      legalBasisConfirmed: z.boolean().optional(),
      reauthVerified: z.boolean().optional(),
      comment: z.string().optional(),
    })
    .optional(),
});

export type CreateExportInput = z.infer<typeof CreateExportInputSchema>;

