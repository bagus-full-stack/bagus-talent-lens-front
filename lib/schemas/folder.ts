import { z } from 'zod';

export const FolderStatusSchema = z.enum(['active', 'archived', 'draft']);

export const FolderSchema = z.object({
  id: z.string(),
  reference: z.string().regex(/^#[A-Z0-9-]+$/),
  title: z.string().min(2),
  organizationId: z.string().uuid(),
  jobTitle: z.string(),
  department: z.string().optional(),
  status: FolderStatusSchema,
  contractType: z.enum(['CDI', 'CDD', 'Freelance', 'Stage']),
  location: z.string(),
  remotePolicy: z.enum(['full_remote', 'hybrid', 'on_site']).default('hybrid'),
  blindModeEnabled: z.boolean().default(true),
  totalCandidates: z.number().int().nonnegative(),
  qualifiedCandidates: z.number().int().nonnegative(),
  patternId: z.string(),
  assignedMemberIds: z.array(z.string()),
  retentionAlertDays: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Folder = z.infer<typeof FolderSchema>;
