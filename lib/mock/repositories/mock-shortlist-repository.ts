import type { IShortlistRepository } from '@/lib/api/types';
import type { Shortlist } from '@/types';
import { mockShortlists } from '../data/shortlists';

export class MockShortlistRepository implements IShortlistRepository {
  private shortlists = [...mockShortlists];

  async getByFolder(folderId: string): Promise<Shortlist[]> {
    return this.shortlists.filter((s) => s.folderId === folderId);
  }

  async getById(id: string): Promise<Shortlist | null> {
    return this.shortlists.find((s) => s.id === id) || null;
  }

  async create(data: Omit<Shortlist, 'id' | 'createdAt' | 'updatedAt' | 'candidateCount'>): Promise<Shortlist> {
    const newShortlist: Shortlist = {
      ...data,
      id: `sh-${Date.now().toString(36)}`,
      candidateCount: data.candidateIds.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.shortlists.push(newShortlist);
    return newShortlist;
  }

  async reorderCandidates(shortlistId: string, candidateIds: string[]): Promise<Shortlist | null> {
    const sl = this.shortlists.find((s) => s.id === shortlistId);
    if (!sl) return null;

    sl.candidateIds = candidateIds;
    sl.candidateCount = candidateIds.length;
    sl.rankings = {};
    candidateIds.forEach((cid, index) => {
      sl.rankings[cid] = index + 1;
    });
    sl.updatedAt = new Date().toISOString();
    return sl;
  }
}
