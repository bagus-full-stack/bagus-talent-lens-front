import { z } from 'zod';

export const DsrTypeSchema = z.enum([
  'erasure', // Droit à l'effacement (Art. 17)
  'access', // Droit d'accès (Art. 15)
  'rectification', // Droit de rectification (Art. 16)
  'restriction', // Droit à la limitation (Art. 18)
  'portability', // Droit à la portabilité (Art. 20)
  'opposition', // Droit d'opposition (Art. 21)
]);

export type DsrType = z.infer<typeof DsrTypeSchema>;

export const DSR_TYPE_LABELS: Record<DsrType, { label: string; article: string; description: string }> = {
  erasure: {
    label: "Droit à l'effacement",
    article: 'Art. 17 RGPD',
    description: 'Destruction irréversible de toutes les données personnelles et vectorielles.',
  },
  access: {
    label: "Droit d'accès",
    article: 'Art. 15 RGPD',
    description: 'Transmission de l’intégralité des données détenues et des finalités de traitement.',
  },
  rectification: {
    label: 'Droit de rectification',
    article: 'Art. 16 RGPD',
    description: 'Mise à jour ou correction des informations inexactes sur le candidat.',
  },
  restriction: {
    label: 'Droit à la limitation',
    article: 'Art. 18 RGPD',
    description: 'Gel temporaire du traitement des données sans suppression physique.',
  },
  portability: {
    label: 'Droit à la portabilité',
    article: 'Art. 20 RGPD',
    description: 'Export structuré, couramment utilisé et lisible par machine (JSON/ZIP).',
  },
  opposition: {
    label: "Droit d'opposition",
    article: 'Art. 21 RGPD',
    description: 'Cessation immédiate de l’utilisation du profil dans les algorithmes de matching.',
  },
};

export const DsrStatusSchema = z.enum([
  'received', // Reçue
  'identity_verified', // Identité vérifiée
  'under_review', // En cours d'instruction
  'fulfilled', // Clôturée / Exécutée
  'rejected', // Rejetée légitimement
]);

export type DsrStatus = z.infer<typeof DsrStatusSchema>;

export const DSR_STATUS_LABELS: Record<DsrStatus, { label: string; stepIndex: number }> = {
  received: { label: 'Demande reçue', stepIndex: 1 },
  identity_verified: { label: 'Identité vérifiée', stepIndex: 2 },
  under_review: { label: 'En cours de traitement', stepIndex: 3 },
  fulfilled: { label: 'Clôturée & Exécutée', stepIndex: 4 },
  rejected: { label: 'Rejetée (Motif légal)', stepIndex: 4 },
};

export const DsrDataLocationSchema = z.object({
  id: z.string().optional(),
  category: z.string(), // ex: "Fichiers bruts", "Base relationnelle", "Index IA"
  component: z.string(), // ex: "Fichier PDF original du CV"
  storage: z.string(), // ex: "Bucket AWS S3 chiffré SSE-KMS"
  actionRequired: z.string(), // ex: "Purger définitivement", "Anonymiser"
  itemCount: z.number().int().optional(),
  status: z.enum(['pending', 'purged', 'anonymized', 'restricted']),
});

export type DsrDataLocation = z.infer<typeof DsrDataLocationSchema>;

export const DsrCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type DsrComment = z.infer<typeof DsrCommentSchema>;

export const DsrAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeBytes: z.number(),
  type: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  url: z.string().optional(),
});

export type DsrAttachment = z.infer<typeof DsrAttachmentSchema>;

export const DsrHistoryItemSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  details: z.string(),
});

export type DsrHistoryItem = z.infer<typeof DsrHistoryItemSchema>;

export const DataSubjectRequestSchema = z.object({
  id: z.string(), // ex: "#DSR-2026-089"
  organizationId: z.string().uuid(),
  requestType: DsrTypeSchema,
  candidateId: z.string().optional(),
  candidatePseudonym: z.string(), // ex: "Candidat #A1B2"
  candidateRealName: z.string().optional(), // Visible uniquement avec permission DPO/Owner
  candidateEmail: z.string().email(),
  folderReference: z.string(),
  receivedVia: z.enum(['direct_email', 'web_form', 'registered_mail']),
  status: DsrStatusSchema,
  idVerified: z.boolean(),
  idVerificationNote: z.string().optional(),
  legalDeadline: z.string(), // Date limite légale CNIL (J+30 max)
  daysRemaining: z.number().int(),
  assignedDpoId: z.string(),
  assignedDpoName: z.string(),
  dataLocations: z.array(DsrDataLocationSchema),
  requiresDoubleValidation: z.boolean().default(true),
  firstValidatorId: z.string().optional(),
  firstValidatorName: z.string().optional(),
  firstValidatedAt: z.string().optional(),
  secondValidatorId: z.string().optional(),
  secondValidatorName: z.string().optional(),
  secondValidatedAt: z.string().optional(),
  closureReason: z.string().optional(),
  sha256Certificate: z.string().optional(),
  comments: z.array(DsrCommentSchema).optional().default([]),
  attachments: z.array(DsrAttachmentSchema).optional().default([]),
  history: z.array(DsrHistoryItemSchema).optional().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().optional(),
});

export type DataSubjectRequest = z.infer<typeof DataSubjectRequestSchema>;

export const CreateDsrInputSchema = z.object({
  requestType: DsrTypeSchema,
  candidateId: z.string().min(1, 'Veuillez sélectionner un candidat'),
  candidatePseudonym: z.string().min(1),
  candidateRealName: z.string().optional(),
  candidateEmail: z.string().email('Format email invalide'),
  folderReference: z.string().min(1, 'Référence de dossier obligatoire'),
  receivedVia: z.enum(['direct_email', 'web_form', 'registered_mail']),
  idVerified: z.boolean(),
  idVerificationNote: z.string().min(5, 'La méthode de vérification d’identité est obligatoire (au moins 5 caractères)'),
  assignedDpoId: z.string().optional(),
  assignedDpoName: z.string().optional(),
  initialComment: z.string().optional(),
});

export type CreateDsrInput = z.infer<typeof CreateDsrInputSchema>;
