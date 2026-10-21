import { z } from 'zod';

export const IngestionFileStatusSchema = z.enum([
  'queued', // En file d'attente
  'extracting', // Extraction du texte & OCR
  'vectorizing', // Vectorisation & Détection PII
  'completed', // Terminé avec succès
  'needs_review', // À vérifier (anomalie détectée)
  'failed', // Échec du traitement
]);

export type IngestionFileStatus = z.infer<typeof IngestionFileStatusSchema>;

export const IngestionJobStatusSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'partially_failed',
  'failed',
  'cancelled',
]);

export type IngestionJobStatus = z.infer<typeof IngestionJobStatusSchema>;

export const IngestionFileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  mimeType: z.string(),
  storagePath: z.string(),
  status: IngestionFileStatusSchema,
  progress: z.number().min(0).max(100).default(0),
  errorReason: z.string().optional(),
  candidateId: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  extractedConfidence: z.number().min(0).max(100).optional(),
});

export type IngestionFileItem = z.infer<typeof IngestionFileItemSchema>;

export const IngestionJobSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  folderId: z.string(),
  folderTitle: z.string().optional(),
  folderReference: z.string().optional(),
  patternId: z.string(),
  patternVersion: z.string(),
  language: z.enum(['fr', 'en', 'es', 'de']).default('fr'),
  status: IngestionJobStatusSchema,
  totalFiles: z.number().int().nonnegative(),
  processedFiles: z.number().int().nonnegative().default(0),
  successCount: z.number().int().nonnegative().default(0),
  needsReviewCount: z.number().int().nonnegative().default(0),
  failedCount: z.number().int().nonnegative().default(0),
  tokensConsumed: z.number().int().nonnegative().default(0),
  estimatedTimeSeconds: z.number().int().nonnegative().default(0),
  files: z.array(IngestionFileItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IngestionJob = z.infer<typeof IngestionJobSchema>;

export const CreateIngestionJobInputSchema = z.object({
  folderId: z.string().min(1, 'Veuillez sélectionner un dossier de destination.'),
  patternId: z.string().min(1, "Veuillez sélectionner un pattern d'extraction."),
  patternVersion: z.string().min(1, 'La version du pattern est obligatoire.'),
  language: z.enum(['fr', 'en', 'es', 'de']).default('fr'),
  files: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        mimeType: z.string(),
        storagePath: z.string(),
      }),
    )
    .min(1, 'Veuillez sélectionner au moins un fichier à importer.'),
});

export type CreateIngestionJobInput = z.infer<typeof CreateIngestionJobInputSchema>;
