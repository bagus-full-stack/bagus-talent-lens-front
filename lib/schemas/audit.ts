import { z } from 'zod';

export const AuditActionSchema = z.enum([
  'BLIND_MODE_UNMASK',
  'BLIND_MODE_RESTORE',
  'EXPORT_NOMINATIVE',
  'EXPORT_ANONYMIZED',
  'DSR_ERASURE_EXECUTE',
  'CANDIDATE_PURGE_CNIL',
  'USER_MFA_ENFORCE',
  'SECURITY_PROMPT_INJECTION_DETECTED',
  'PATTERN_VERSION_PUBLISH',
  'RETENTION_POLICY_UPDATE',
  'RGPD_RETENTION_EXTEND',
  'RGPD_LEGAL_BASIS_UPDATE',
  'RGPD_BREACH_DECLARED',
  'RGPD_BREACH_UPDATED',
  'RGPD_REGISTRY_EXPORT',
  'FOLDER_CREATE',
  'FOLDER_ARCHIVE',
  'SHORTLIST_CREATE',
  'IMPORT_EXECUTE',
  'USER_ROLE_UPDATE',
  'USER_PERMISSION_UPDATE',
  'USER_MFA_RESET',
  'USER_SESSIONS_REVOKE',
  'USER_MEMBERSHIP_REMOVE',
  'INVITATION_CREATE',
  'INVITATION_RESEND',
  'INVITATION_REVOKE',
]);

export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditEventSchema = z.object({
  id: z.string(), // ex: "#EVT-2026-9841"
  timestamp: z.string(), // ISO 8601
  action: AuditActionSchema,
  actor: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    ip: z.string(),
    authStrength: z.enum(['MFA_FIDO2', 'PASSWORD_2FA', 'PASSWORD']),
  }),
  resource: z.object({
    id: z.string(),
    type: z.enum(['candidate', 'folder', 'export', 'dsr', 'organization', 'pattern']),
    pseudonym: z.string().optional(),
    folderReference: z.string().optional(),
  }),
  justification: z.string().optional(),
  sha256Seal: z.string(), // Scellement cryptographique RFC 3161
  merkleVerified: z.boolean().default(true),
  payload: z.record(z.string(), z.unknown()),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
