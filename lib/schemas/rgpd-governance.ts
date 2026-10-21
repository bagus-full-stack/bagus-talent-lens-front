import { z } from 'zod';

export const RetentionStatusSchema = z.enum([
  'compliant',     // Conforme (> 60 jours)
  'warning_60j',   // Alerte 60j (30 à 60 jours)
  'warning_30j',   // Alerte 30j (1 à 30 jours)
  'to_purge',      // À purger (0 jour ou dépassé)
]);

export type RetentionStatus = z.infer<typeof RetentionStatusSchema>;

export const RETENTION_STATUS_LABELS: Record<RetentionStatus, { label: string; badgeVariant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  compliant: { label: 'Conforme (> 60j)', badgeVariant: 'success' },
  warning_60j: { label: 'Échéance 60 jours', badgeVariant: 'warning' },
  warning_30j: { label: 'Critique 30 jours', badgeVariant: 'destructive' },
  to_purge: { label: 'À purger d’urgence', badgeVariant: 'destructive' },
};

/**
 * Schéma pour la preuve obligatoire de consentement pour prolonger la rétention
 */
export const RetentionExtensionInputSchema = z.object({
  candidateId: z.string().min(1, 'Identifiant candidat requis'),
  months: z.number().int().min(1).max(24).default(12),
  consentDate: z.string().min(1, 'La date de recueil du consentement est obligatoire'),
  consentText: z.string().min(10, 'Le texte exact de consentement présenté au candidat doit comporter au moins 10 caractères'),
  consentSource: z.string().min(3, 'La source de preuve du consentement est obligatoire (ex: Formulaire web, Email signé, FranceConnect)'),
});

export type RetentionExtensionInput = z.infer<typeof RetentionExtensionInputSchema>;

export interface CvRetentionItem {
  id: string;
  candidateId: string;
  candidatePseudonym: string;
  folderReference: string;
  folderTitle: string;
  lastActivityDate: string;
  retention_until: string; // ISO 8601
  daysRemaining: number;
  status: RetentionStatus;
  legalBasis: string;
  consentProof?: {
    date: string;
    text: string;
    source: string;
  };
}

export interface PurgeLogItem {
  id: string;
  date: string;
  cvCount: number;
  sha256Certificate: string;
  proofDocument: string;
  operator: string;
}

/**
 * Schéma Consentement & Base Légale
 */
export const LegalBasisTypeSchema = z.enum([
  'consentement',       // Art. 6.1.a RGPD
  'interet_legitime',   // Art. 6.1.f RGPD
  'contrat',            // Art. 6.1.b RGPD
  'obligation_legale',  // Art. 6.1.c RGPD
  'sans_base_legale',   // Manquant / Non documenté
]);

export type LegalBasisType = z.infer<typeof LegalBasisTypeSchema>;

export const LEGAL_BASIS_LABELS: Record<LegalBasisType, { label: string; article: string }> = {
  consentement: { label: 'Consentement explicite', article: 'Art. 6.1.a' },
  interet_legitime: { label: 'Intérêt légitime documenté', article: 'Art. 6.1.f' },
  contrat: { label: 'Exécution précontractuelle', article: 'Art. 6.1.b' },
  obligation_legale: { label: 'Obligation légale', article: 'Art. 6.1.c' },
  sans_base_legale: { label: 'Sans base légale documentée', article: 'Non conforme' },
};

export const ConsentStatusSchema = z.enum([
  'valid',       // Valide & en vigueur
  'to_renew',    // À renouveler sous peu
  'withdrawn',   // Retiré par le candidat (Art. 7.3)
  'missing',     // Manquant / Non documenté
]);

export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;

export interface ConsentRecord {
  id: string;
  candidateId: string;
  candidatePseudonym: string;
  folderReference: string;
  legalBasis: LegalBasisType;
  status: ConsentStatus;
  obtainedDate: string | null;
  source: string;
  proofDetails?: string;
}

export const BulkLegalBasisInputSchema = z.object({
  candidateIds: z.array(z.string()).min(1, 'Sélectionnez au moins un candidat'),
  legalBasis: z.enum(['consentement', 'interet_legitime', 'contrat', 'obligation_legale']),
  source: z.string().min(3, 'La source de justification est obligatoire'),
  consentDate: z.string().optional(),
  consentText: z.string().optional(),
});

export type BulkLegalBasisInput = z.infer<typeof BulkLegalBasisInputSchema>;

/**
 * Registre des Traitements (Art. 30 RGPD)
 */
export interface ProcessingActivity {
  id: string;
  code: string;
  name: string;
  purpose: string;
  secondaryPurposes: string[];
  dataSubjects: string[];
  dataCategories: string[];
  retentionPeriod: string;
  recipients: string[];
  subprocessors: string[];
  securityMeasures: string[];
  dpoValidated: boolean;
  lastReviewDate: string;
}

export interface SubprocessorInfo {
  id: string;
  name: string;
  role: string;
  region: string;
  country: string;
  dpaStatus: 'signed' | 'in_review' | 'scc_clauses';
  transferSafeguards: string;
  lastDpaReview: string;
}

/**
 * Violations de Données (Art. 33 & 34 RGPD)
 */
export const BreachSeveritySchema = z.enum([
  'low',       // Faible (Sans risque pour les personnes)
  'medium',    // Moyenne (Risque modéré)
  'high',      // Élevée (Risque élevé pour les personnes)
  'critical',  // Critique (Violation massive / données sensibles)
]);

export type BreachSeverity = z.infer<typeof BreachSeveritySchema>;

export const BreachStatusSchema = z.enum([
  'open',           // Ouverte / Détectée
  'investigating',  // En cours d'analyse
  'notified_cnil',  // Notifiée à l'autorité (CNIL)
  'closed',         // Clôturée & remédiée
]);

export type BreachStatus = z.infer<typeof BreachStatusSchema>;

export interface DataBreachRecord {
  id: string;
  reference: string;
  detectedAt: string; // ISO 8601
  title: string;
  description: string;
  nature: 'unauthorized_access' | 'data_loss' | 'accidental_disclosure' | 'alteration' | 'ransomware';
  severity: BreachSeverity;
  affectedPersonsCount: number;
  affectedDataCategories: string[];
  consequences: string;
  remediationTaken: string;
  authorityNotification: 'required' | 'notified' | 'not_required' | 'pending';
  authorityNotifiedAt?: string;
  candidateNotification: 'required' | 'notified' | 'not_required';
  status: BreachStatus;
  reporterName: string;
  reporterRole: string;
}

export const CreateDataBreachInputSchema = z.object({
  title: z.string().min(5, 'Le titre de la violation doit comporter au moins 5 caractères'),
  nature: z.enum(['unauthorized_access', 'data_loss', 'accidental_disclosure', 'alteration', 'ransomware']),
  detectedAt: z.string().min(1, 'La date et heure de détection sont obligatoires'),
  severity: BreachSeveritySchema,
  affectedPersonsCount: z.number().int().min(0, 'Le nombre de personnes affectées doit être positif ou nul'),
  affectedDataCategories: z.array(z.string()).min(1, 'Indiquez au moins une catégorie de données impactées'),
  description: z.string().min(15, 'La description des faits doit comporter au moins 15 caractères'),
  consequences: z.string().min(10, 'L’évaluation des conséquences doit comporter au moins 10 caractères'),
  remediationTaken: z.string().min(10, 'Les mesures prises doivent comporter au moins 10 caractères'),
  authorityNotification: z.enum(['required', 'not_required', 'pending']),
});

export type CreateDataBreachInput = z.infer<typeof CreateDataBreachInputSchema>;
