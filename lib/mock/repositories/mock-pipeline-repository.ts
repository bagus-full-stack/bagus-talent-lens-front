import type { IPipelineRepository } from '@/lib/api/types';
import type { PipelineStage, Candidacy } from '@/types';
import { mockPipelineStages, mockCandidacies } from '../data/pipeline';

export class MockPipelineRepository implements IPipelineRepository {
  private stages = [...mockPipelineStages];
  private candidacies = [...mockCandidacies];

  async getStages(): Promise<PipelineStage[]> {
    return this.stages;
  }

  async getCandidaciesByFolder(folderId: string): Promise<Candidacy[]> {
    return this.candidacies.filter((c) => c.folderId === folderId);
  }

  async moveStage(candidacyId: string, targetStageId: string, reason?: string): Promise<Candidacy | null> {
    const cand = this.candidacies.find((c) => c.id === candidacyId);
    if (!cand) return null;
    const stage = this.stages.find((s) => s.id === targetStageId);
    if (!stage) return null;

    cand.stageId = targetStageId;
    cand.currentStageName = stage.name;
    cand.daysInStage = 0;
    cand.updatedAt = new Date().toISOString();
    if (reason) {
      cand.rejectionReason = reason;
    }
    return cand;
  }
}
