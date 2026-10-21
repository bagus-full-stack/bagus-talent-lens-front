import { z } from 'zod';

export const RoleSchema = z.enum([
  'owner',
  'admin',
  'recruiter',
  'reader',
  'viewer',
  'dpo',
]);

export type Role = z.infer<typeof RoleSchema>;

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string(),
  role: RoleSchema,
  fullName: z.string().min(2),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  mfaEnabled: z.boolean(),
  aal: z.enum(['aal1', 'aal2']).default('aal1'),
  authMethod: z.enum(['google', 'linkedin', 'password', 'fido2']),
  // Permissions fines explicites
  can_reveal_identity: z.boolean().default(false),
  can_export: z.boolean().default(false),
  permissions: z.object({
    canLiftBlindMode: z.boolean(),
    canExportNominative: z.boolean(),
    canAuditDsr: z.boolean(),
    canConfigurePatterns: z.boolean(),
  }).optional(),
  lastActiveAt: z.string(),
  status: z.enum(['active', 'invited', 'suspended']),
});

export type Membership = z.infer<typeof MembershipSchema>;

export const InvitationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
  invitedBy: z.string(),
  invitedByName: z.string(),
  token: z.string(),
  can_reveal_identity: z.boolean().default(false),
  can_export: z.boolean().default(false),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2),
  logoUrl: z.string().nullable().optional(),
  defaultBlindMode: z.boolean().default(true),
  retentionMonths: z.number().int().min(1).max(36).default(24),
  purgeAutomated: z.boolean().default(true),
  allowedAuthDomains: z.array(z.string()),
  allowedLoginMethods: z.array(z.enum(['google', 'linkedin', 'password', 'saml'])),
  aiQuotaLimit: z.number().int().default(500000),
  aiTokensUsed: z.number().int().default(412500),
  mfaEnforced: z.boolean().default(true),
  timezone: z.string().default('Europe/Paris'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
