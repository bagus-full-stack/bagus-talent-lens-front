import { describe, it, expect } from 'vitest';
import { OrganizationSchema } from '@/lib/schemas/organization';
import { FolderSchema } from '@/lib/schemas/folder';
import { ShortlistSchema } from '@/lib/schemas/shortlist';
import { ExportSchema } from '@/lib/schemas/export';
import { DataSubjectRequestSchema } from '@/lib/schemas/dsr';
import { AuditEventSchema } from '@/lib/schemas/audit';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { mockFolders } from '@/lib/mock/data/folders';
import { mockShortlists } from '@/lib/mock/data/shortlists';
import { mockExports } from '@/lib/mock/data/exports';
import { mockDsrRequests } from '@/lib/mock/data/dsr';
import { mockAuditEvents } from '@/lib/mock/data/audit';

describe('Validation des Schémas Zod & Cohérence des Données Métier', () => {
  it('valide le schéma Organization', () => {
    const res = OrganizationSchema.safeParse(mockOrganization);
    expect(res.success).toBe(true);
  });

  it('valide tous les dossiers de recrutement mockés', () => {
    mockFolders.forEach((folder) => {
      const res = FolderSchema.safeParse(folder);
      expect(res.success).toBe(true);
    });
  });

  it('valide les shortlists de présélection', () => {
    mockShortlists.forEach((sl) => {
      const res = ShortlistSchema.safeParse(sl);
      expect(res.success).toBe(true);
    });
  });

  it('valide le registre des exports', () => {
    mockExports.forEach((exp) => {
      const res = ExportSchema.safeParse(exp);
      expect(res.success).toBe(true);
    });
  });

  it('valide les demandes d’exercice des droits DSR RGPD', () => {
    mockDsrRequests.forEach((dsr) => {
      const res = DataSubjectRequestSchema.safeParse(dsr);
      expect(res.success).toBe(true);
    });
  });

  it('valide le journal d’audit WORM immuable', () => {
    mockAuditEvents.forEach((evt) => {
      const res = AuditEventSchema.safeParse(evt);
      expect(res.success).toBe(true);
    });
  });
});
