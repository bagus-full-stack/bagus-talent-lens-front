import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSignedUploadUrlAction,
  createIngestionJobAction,
  retryIngestionFileAction,
} from '@/app/(app)/import/actions';
import { getIngestionRepository, getAuditRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { mockFolders } from '@/lib/mock/data/folders';
import type { PermissionUser } from '@/lib/permissions';

let mockUser: PermissionUser | null = {
  id: 'usr_idriss_ouedraogo',
  role: 'admin',
  can_reveal_identity: true,
  can_export: true,
  aal: 'aal2',
  organizationId: mockOrganization.id,
};

vi.mock('@/lib/auth/session', () => ({
  getServerCurrentUser: vi.fn(async () => mockUser),
  requireServerPermission: vi.fn(async () => mockUser),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Parcours d’Importation et Ingestion de CV (/import)', () => {
  beforeEach(() => {
    mockUser = {
      id: 'usr_idriss_ouedraogo',
      role: 'admin',
      can_reveal_identity: true,
      can_export: true,
      aal: 'aal2',
      organizationId: mockOrganization.id,
    };
    mockOrganization.aiTokensUsed = 412500; // Reset token quota below limit
  });

  // 1. Contrôles d'autorité serveur lors de la demande d'URL signée
  describe('1. Contrôles d’autorité serveur (MIME, Antivirus, Zip Bomb, Quota)', () => {
    it('génère une URL signée valide pour un PDF conforme (< 20 Mo)', async () => {
      const res = await getSignedUploadUrlAction({
        fileName: 'cv_senior_architect.pdf',
        fileType: 'application/pdf',
        fileSize: 2 * 1024 * 1024, // 2 Mo
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(true);
      expect(res.signedUrl).toBeDefined();
      expect(res.storagePath).toContain('resumes/');
      expect(res.uploadToken).toBeDefined();
    });

    it('rejette un fichier dépassant la limite stricte de 20 Mo', async () => {
      const res = await getSignedUploadUrlAction({
        fileName: 'huge_cv_scan.pdf',
        fileType: 'application/pdf',
        fileSize: 25 * 1024 * 1024, // 25 Mo > 20 Mo
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('dépasse la limite stricte de 20 Mo');
    });

    it('rejette une extension ou un type MIME non autorisé (ex: .exe)', async () => {
      const res = await getSignedUploadUrlAction({
        fileName: 'script_installer.exe',
        fileType: 'application/x-msdownload',
        fileSize: 500000,
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Format non autorisé');
    });

    it('rejette une archive suspecte ou Zip bomb potentielle', async () => {
      const res = await getSignedUploadUrlAction({
        fileName: 'suspicious_zipbomb.zip',
        fileType: 'application/zip',
        fileSize: 1024,
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Archive suspecte rejetée');
    });

    it('rejette un document contenant une signature malveillante antivirus', async () => {
      const res = await getSignedUploadUrlAction({
        fileName: 'cv_with_eicar_virus.pdf',
        fileType: 'application/pdf',
        fileSize: 10240,
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Alerte sécurité antivirus');
    });

    it('bloque l’ingestion lorsque le quota IA de l’organisation est atteint', async () => {
      mockOrganization.aiTokensUsed = mockOrganization.aiQuotaLimit; // Quota saturé

      const res = await getSignedUploadUrlAction({
        fileName: 'cv_normal.pdf',
        fileType: 'application/pdf',
        fileSize: 500000,
        folderId: mockFolders[0].id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Quota IA mensuel atteint');
    });
  });

  // 2. Création de job d'ingestion serveur
  describe('2. Création du ingestion_job via Server Action', () => {
    it('crée un job d’ingestion avec traçabilité d’audit WORM', async () => {
      const auditRepo = getAuditRepository();
      const folder = mockFolders[0];

      const res = await createIngestionJobAction({
        folderId: folder.id,
        patternId: 'PAT-TECH-04',
        patternVersion: 'v2.4',
        language: 'fr',
        files: [
          {
            name: 'cv_candidat_01.pdf',
            size: 1500000,
            mimeType: 'application/pdf',
            storagePath: 'resumes/org/fld/cv_01.pdf',
          },
          {
            name: 'cv_candidat_02.docx',
            size: 800000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            storagePath: 'resumes/org/fld/cv_02.docx',
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.job).toBeDefined();
      expect(res.job?.totalFiles).toBe(2);
      expect(res.job?.status).toBe('queued');
      expect(res.job?.files).toHaveLength(2);
      expect(res.job?.files[0].status).toBe('queued');

      // Vérifier le scellement d'audit WORM
      const events = await auditRepo.getEvents(mockOrganization.id, 5);
      const importEvent = events.find((e) => e.resource.id === res.job?.id);
      expect(importEvent).toBeDefined();
      expect(importEvent?.action).toBe('IMPORT_EXECUTE');
    });

    it('interdit la création de job à un utilisateur sans permission import (ex: reader)', async () => {
      mockUser = {
        id: 'usr_reader',
        role: 'reader',
        can_reveal_identity: false,
        can_export: false,
        aal: 'aal1',
        organizationId: mockOrganization.id,
      };

      const res = await createIngestionJobAction({
        folderId: mockFolders[0].id,
        patternId: 'PAT-TECH-04',
        patternVersion: 'v2.4',
        language: 'fr',
        files: [
          {
            name: 'cv.pdf',
            size: 10000,
            mimeType: 'application/pdf',
            storagePath: 'resumes/cv.pdf',
          },
        ],
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Permission refusée');
    });
  });

  // 3. Suivi Realtime et Reprise ciblée
  describe('3. Suivi Realtime et Reprise ciblée des fichiers en échec', () => {
    it('notifie les abonnés Realtime lors des transitions de statut d’un job', async () => {
      const repo = getIngestionRepository();

      const job = await repo.createJob({
        folderId: mockFolders[0].id,
        patternId: 'PAT-TECH-04',
        patternVersion: 'v2.4',
        language: 'fr',
        organizationId: mockOrganization.id,
        files: [
          {
            name: 'cv_test_realtime.pdf',
            size: 1200000,
            mimeType: 'application/pdf',
            storagePath: 'resumes/cv_test.pdf',
          },
        ],
      });

      const eventsReceived: string[] = [];
      const unsubscribe = repo.subscribe(job.id, (updated) => {
        eventsReceived.push(updated.files[0].status);
      });

      // Simulation de passage en extracting puis en completed
      await repo.updateFile(job.id, job.files[0].id, {
        status: 'extracting',
        progress: 35,
      });

      await repo.updateFile(job.id, job.files[0].id, {
        status: 'completed',
        progress: 100,
        extractedConfidence: 97,
      });

      expect(eventsReceived).toContain('extracting');
      expect(eventsReceived).toContain('completed');

      unsubscribe();
    });

    it('permet la reprise ciblée d’un fichier en échec (retryIngestionFileAction)', async () => {
      const repo = getIngestionRepository();

      const job = await repo.createJob({
        folderId: mockFolders[0].id,
        patternId: 'PAT-TECH-04',
        patternVersion: 'v2.4',
        language: 'fr',
        organizationId: mockOrganization.id,
        files: [
          {
            name: 'cv_failed_initially.pdf',
            size: 1000000,
            mimeType: 'application/pdf',
            storagePath: 'resumes/cv_fail.pdf',
          },
        ],
      });

      const fileId = job.files[0].id;

      // Marquer le fichier en échec
      await repo.updateFile(job.id, fileId, {
        status: 'failed',
        errorReason: 'Erreur réseau temporaire.',
      });

      let currentJob = await repo.getById(job.id);
      expect(currentJob?.files[0].status).toBe('failed');
      expect(currentJob?.failedCount).toBe(1);

      // Relance ciblée via Server Action
      const retryRes = await retryIngestionFileAction(job.id, fileId);
      expect(retryRes.success).toBe(true);

      currentJob = await repo.getById(job.id);
      expect(currentJob?.files[0].status).toBe('queued');
      expect(currentJob?.status).toBe('processing');
    });
  });
});
