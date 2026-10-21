import type { IngestionJob, IngestionFileItem, IngestionFileStatus, CreateIngestionJobInput } from '@/types';
import { mockIngestionJobs } from '../data/ingestion';

type IngestionListener = (job: IngestionJob) => void;

export class MockIngestionRepository {
  private jobs: IngestionJob[] = [...mockIngestionJobs];
  private listeners: Map<string, Set<IngestionListener>> = new Map();

  async getById(id: string): Promise<IngestionJob | null> {
    return this.jobs.find((j) => j.id === id) || null;
  }

  async getByFolder(folderId: string): Promise<IngestionJob[]> {
    return this.jobs.filter((j) => j.folderId === folderId);
  }

  async createJob(
    input: CreateIngestionJobInput & {
      organizationId: string;
      folderTitle?: string;
      folderReference?: string;
    },
  ): Promise<IngestionJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const fileItems: IngestionFileItem[] = input.files.map((f, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      storagePath: f.storagePath,
      status: 'queued',
      progress: 0,
    }));

    const newJob: IngestionJob = {
      id: jobId,
      organizationId: input.organizationId,
      folderId: input.folderId,
      folderTitle: input.folderTitle || 'Dossier de recrutement',
      folderReference: input.folderReference || '#DOS-01',
      patternId: input.patternId,
      patternVersion: input.patternVersion,
      language: input.language,
      status: 'queued',
      totalFiles: fileItems.length,
      processedFiles: 0,
      successCount: 0,
      needsReviewCount: 0,
      failedCount: 0,
      tokensConsumed: 0,
      estimatedTimeSeconds: fileItems.length * 6, // ~6s par fichier
      files: fileItems,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.unshift(newJob);
    this.broadcast(newJob);

    return newJob;
  }

  async updateJob(id: string, updates: Partial<IngestionJob>): Promise<IngestionJob | null> {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return null;

    this.jobs[idx] = {
      ...this.jobs[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.broadcast(this.jobs[idx]);
    return this.jobs[idx];
  }

  async updateFile(
    jobId: string,
    fileId: string,
    fileUpdates: Partial<IngestionFileItem>,
  ): Promise<IngestionJob | null> {
    const job = await this.getById(jobId);
    if (!job) return null;

    const fileIdx = job.files.findIndex((f) => f.id === fileId);
    if (fileIdx === -1) return null;

    job.files[fileIdx] = {
      ...job.files[fileIdx],
      ...fileUpdates,
    };

    // Recalcul des compteurs globaux du job
    const successCount = job.files.filter((f) => f.status === 'completed').length;
    const needsReviewCount = job.files.filter((f) => f.status === 'needs_review').length;
    const failedCount = job.files.filter((f) => f.status === 'failed').length;
    const processedFiles = successCount + needsReviewCount + failedCount;

    let jobStatus = job.status;
    if (processedFiles === job.totalFiles) {
      if (failedCount === 0) {
        jobStatus = 'completed';
      } else if (successCount > 0 || needsReviewCount > 0) {
        jobStatus = 'partially_failed';
      } else {
        jobStatus = 'failed';
      }
    } else if (processedFiles > 0) {
      jobStatus = 'processing';
    }

    job.successCount = successCount;
    job.needsReviewCount = needsReviewCount;
    job.failedCount = failedCount;
    job.processedFiles = processedFiles;
    job.status = jobStatus;
    job.estimatedTimeSeconds = Math.max(0, (job.totalFiles - processedFiles) * 5);
    job.updatedAt = new Date().toISOString();

    this.broadcast(job);
    return job;
  }

  async retryFile(jobId: string, fileId: string): Promise<IngestionJob | null> {
    const job = await this.getById(jobId);
    if (!job) return null;

    const file = job.files.find((f) => f.id === fileId);
    if (!file) return null;

    file.status = 'queued';
    file.progress = 0;
    file.errorReason = undefined;

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();

    this.broadcast(job);
    return job;
  }

  // Abonnements Realtime (in-memory + Supabase bridge)
  subscribe(jobId: string, callback: IngestionListener): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);

    // Envoi immédiat de l'état actuel
    const current = this.jobs.find((j) => j.id === jobId);
    if (current) {
      callback(current);
    }

    return () => {
      const set = this.listeners.get(jobId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(jobId);
        }
      }
    };
  }

  private broadcast(job: IngestionJob) {
    const set = this.listeners.get(job.id);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(job);
        } catch (err) {
          console.error('[Ingestion Broadcast Error]', err);
        }
      });
    }
  }
}

// Singleton de repository
export const mockIngestionRepo = new MockIngestionRepository();
