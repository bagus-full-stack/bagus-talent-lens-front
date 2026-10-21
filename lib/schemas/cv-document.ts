import { z } from 'zod';

export const AnomalyTypeSchema = z.enum([
  'confidence_warning',
  'missing_field',
  'security_alert',
  'scan_unreadable',
  'prompt_injection',
]);

export const AnomalySchema = z.object({
  id: z.string(),
  type: AnomalyTypeSchema,
  message: z.string(),
  fieldKey: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean().default(false),
});

export type Anomaly = z.infer<typeof AnomalySchema>;

export const AnonymizedExperienceSchema = z.object({
  role: z.string(),
  companySector: z.string(), // Secteur d'activité anonymisé, ex: "Fintech Leader (Banque)"
  period: z.string(), // ex: "2021 - Présent (3 ans)"
  summary: z.string(),
  highlights: z.array(z.string()),
});

export const AnonymizedEducationSchema = z.object({
  degree: z.string(),
  institutionType: z.string(), // ex: "Grande École d'Ingénieurs (Nom masqué par proxy)"
  year: z.string().optional(),
});

export const GapAnalysisSchema = z.object({
  strongCriteria: z.array(z.string()),
  partialCriteria: z.array(z.string()),
  missingCriteria: z.array(z.string()),
});

/**
 * DTO « AVEUGLE » (Blind DTO)
 * Ce DTO est envoyé au navigateur lorsque le mode aveugle est actif.
 * RÈGLE ABSOLUE : Ce DTO ne contient AUCUNE PII (nom, prénom, email, tel, adresse).
 * Le masquage a été opéré côté serveur lors de la transformation.
 */
export const CvDocumentBlindDtoSchema = z.object({
  id: z.string(),
  pseudonym: z.string(), // ex: "Candidat #A1B2"
  isAnonymized: z.literal(true),
  hashId: z.string(), // Empreinte SHA-256 scellée RFC 3161
  currentTitle: z.string(), // Titre normalisé
  yearsExperience: z.number(),
  seniorityLevel: z.enum(['junior', 'confirmed', 'senior', 'lead', 'director']),
  location: z.string(), // Région administrative sans adresse précise (ex: "Île-de-France (Hybride 2j)")
  skills: z.array(z.string()),
  experienceSummary: z.string(),
  experiences: z.array(AnonymizedExperienceSchema),
  education: z.array(AnonymizedEducationSchema),
  availability: z.string(), // ex: "1 mois (Négociable)"
  targetSalary: z.string(), // ex: "68k - 75k €"
  aiMatchScore: z.number().min(0).max(100),
  aiConfidence: z.number().min(0).max(100),
  aiJustification: z.string(),
  gapAnalysis: GapAnalysisSchema,
  vectorCluster: z.string().optional(), // ex: "Data / Python / ML"
  vectorCoords2D: z.object({ x: z.number(), y: z.number() }).optional(),
  redactedPdfUrl: z.string(),
  anomalies: z.array(AnomalySchema),
  folderId: z.string(),
  rgpdStatus: z.enum(['compliant', 'retention_warning', 'dsr_requested', 'purge_scheduled']),
  retentionDeadline: z.string(), // Date limite légale CNIL (24 mois)
  createdAt: z.string(),
});

export type CvDocumentBlindDto = z.infer<typeof CvDocumentBlindDtoSchema>;

/**
 * DTO « COMPLET » (Nominative Full DTO)
 * Accessible uniquement après levée explicite du mode aveugle autorisée par le serveur (MFA + justification Art. 30).
 */
export const CvDocumentFullDtoSchema = CvDocumentBlindDtoSchema.extend({
  isAnonymized: z.literal(false),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  fullAddress: z.string(),
  originalCompanies: z.array(z.string()),
  originalInstitutions: z.array(z.string()),
  originalPdfUrl: z.string(),
  unmaskJustification: z.object({
    actorId: z.string(),
    actorName: z.string(),
    reason: z.string(),
    unmaskedAt: z.string(),
    expiresAt: z.string(),
  }),
});

export type CvDocumentFullDto = z.infer<typeof CvDocumentFullDtoSchema>;

export type CvDocumentDto = CvDocumentBlindDto | CvDocumentFullDto;
