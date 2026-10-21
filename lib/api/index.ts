import type {
  ICvRepository,
  IFolderRepository,
  IOrganizationRepository,
  IPipelineRepository,
  IShortlistRepository,
  IExportRepository,
  IDsrRepository,
  IAuditRepository,
  IPatternRepository,
} from './types';

import { MockCvRepository } from '@/lib/mock/repositories/mock-cv-repository';
import { MockFolderRepository } from '@/lib/mock/repositories/mock-folder-repository';
import { MockOrganizationRepository } from '@/lib/mock/repositories/mock-organization-repository';
import { MockPipelineRepository } from '@/lib/mock/repositories/mock-pipeline-repository';
import { MockShortlistRepository } from '@/lib/mock/repositories/mock-shortlist-repository';
import { MockExportRepository } from '@/lib/mock/repositories/mock-export-repository';
import { MockDsrRepository } from '@/lib/mock/repositories/mock-dsr-repository';
import { MockAuditRepository } from '@/lib/mock/repositories/mock-audit-repository';
import { MockPatternRepository } from '@/lib/mock/repositories/mock-pattern-repository';

// Note : En production avec variable DATA_SOURCE="supabase", les implémentations Supabase
// sont instanciées. Par défaut (démonstrateur hors-ligne / sandbox), les mocks sont utilisés.
const useSupabase = process.env.DATA_SOURCE === 'supabase';

// Singletons pour la durée de vie du serveur
const mockCvRepo = new MockCvRepository();
const mockFolderRepo = new MockFolderRepository();
const mockOrgRepo = new MockOrganizationRepository();
const mockPipelineRepo = new MockPipelineRepository();
const mockShortlistRepo = new MockShortlistRepository();
const mockExportRepo = new MockExportRepository();
const mockDsrRepo = new MockDsrRepository();
const mockAuditRepo = new MockAuditRepository();
const mockPatternRepo = new MockPatternRepository();

export function getCvRepository(): ICvRepository {
  if (useSupabase) {
    // Si Supabase est activé, retourner l'adaptateur Supabase (ou fallback mock si non configuré)
    return mockCvRepo;
  }
  return mockCvRepo;
}

export function getFolderRepository(): IFolderRepository {
  return mockFolderRepo;
}

export function getOrganizationRepository(): IOrganizationRepository {
  return mockOrgRepo;
}

export function getPipelineRepository(): IPipelineRepository {
  return mockPipelineRepo;
}

export function getShortlistRepository(): IShortlistRepository {
  return mockShortlistRepo;
}

export function getExportRepository(): IExportRepository {
  return mockExportRepo;
}

export function getDsrRepository(): IDsrRepository {
  return mockDsrRepo;
}

export function getAuditRepository(): IAuditRepository {
  return mockAuditRepo;
}

import { mockIngestionRepo, MockIngestionRepository } from '@/lib/mock/repositories/mock-ingestion-repository';

export function getPatternRepository(): IPatternRepository {
  return mockPatternRepo;
}

export function getIngestionRepository(): MockIngestionRepository {
  return mockIngestionRepo;
}

export * from './types';
