import { mockShortlists } from '@/lib/mock/data/shortlists';
import { mockFolders } from '@/lib/mock/data/folders';
import { mockCandidatesRaw } from '@/lib/mock/data/candidates';
import type {
  Shortlist,
  ShortlistCandidateRecord,
  CreateShortlistInput,
} from '@/lib/schemas/shortlist';

export interface EnrichedShortlist extends Shortlist {
  candidates: ShortlistCandidateRecord[];
}

class ShortlistStore {
  private shortlists: Map<string, Shortlist> = new Map();

  constructor() {
    for (const s of mockShortlists) {
      const folder = mockFolders.find((f) => f.id === s.folderId);
      const copy: Shortlist = {
        ...s,
        folderTitle: folder?.title || 'Dossier de recrutement',
        visibility: s.isShared ? 'team' : 'private',
        rankings: s.rankings || {},
        notes: s.notes || {},
      };
      this.shortlists.set(copy.id, JSON.parse(JSON.stringify(copy)));
    }
  }

  public getShortlists(): Shortlist[] {
    return Array.from(this.shortlists.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getShortlist(id: string): EnrichedShortlist | null {
    const sl = this.shortlists.get(id);
    if (!sl) return null;

    // Enrichir chaque candidat dans l'ordre défini par candidateIds
    const candidates: ShortlistCandidateRecord[] = [];

    sl.candidateIds.forEach((cid, index) => {
      const raw = mockCandidatesRaw.find((c) => c.id === cid);
      if (raw) {
        // Détection de l'opposition RGPD (Art. 18 / limitation de traitement)
        const isRestricted = raw.rgpdStatus === 'dsr_requested';

        candidates.push({
          candidateId: raw.id,
          rank: sl.rankings[raw.id] || index + 1,
          pseudonym: raw.pseudonym,
          currentTitle: raw.currentTitle,
          matchScore: raw.aiMatchScore || 85,
          topSkills: raw.skills.slice(0, 3),
          note: sl.notes[raw.id] || '',
          isRestricted,
          rgpdStatus: raw.rgpdStatus,
          isBlind: sl.isBlind,
        });
      }
    });

    // Tri par rang
    candidates.sort((a, b) => a.rank - b.rank);

    return {
      ...sl,
      candidates,
    };
  }

  public createShortlist(input: CreateShortlistInput, author = 'Idriss Ouédraogo'): Shortlist {
    const folder = mockFolders.find((f) => f.id === input.folderId);
    const id = `sh-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const rankings: Record<string, number> = {};
    input.candidateIds.forEach((cid, idx) => {
      rankings[cid] = idx + 1;
    });

    const newSl: Shortlist = {
      id,
      title: input.title.trim(),
      folderId: input.folderId,
      folderReference: folder?.reference || '#REF',
      folderTitle: folder?.title || 'Dossier',
      createdBy: 'usr_idriss_ouedraogo',
      createdByName: author,
      candidateIds: [...input.candidateIds],
      visibility: input.visibility,
      isBlind: true,
      notes: {},
      rankings,
      candidateCount: input.candidateIds.length,
      createdAt: now,
      updatedAt: now,
    };

    this.shortlists.set(id, newSl);
    return newSl;
  }

  public updateShortlist(
    id: string,
    partial: Partial<Pick<Shortlist, 'title' | 'folderId' | 'visibility'>>
  ): Shortlist | null {
    const sl = this.shortlists.get(id);
    if (!sl) return null;

    if (partial.title !== undefined) sl.title = partial.title.trim();
    if (partial.visibility !== undefined) sl.visibility = partial.visibility;
    if (partial.folderId !== undefined) {
      sl.folderId = partial.folderId;
      const folder = mockFolders.find((f) => f.id === partial.folderId);
      if (folder) {
        sl.folderReference = folder.reference;
        sl.folderTitle = folder.title;
      }
    }
    sl.updatedAt = new Date().toISOString();

    return sl;
  }

  public duplicateShortlist(id: string): Shortlist | null {
    const original = this.shortlists.get(id);
    if (!original) return null;

    const newId = `sh-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const clone: Shortlist = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      title: `${original.title} (Copie)`,
      createdAt: now,
      updatedAt: now,
    };

    this.shortlists.set(newId, clone);
    return clone;
  }

  public deleteShortlist(id: string): boolean {
    return this.shortlists.delete(id);
  }

  /**
   * Enregistrement de l'ordre en un seul appel
   */
  public reorderCandidates(shortlistId: string, orderedCandidateIds: string[]): EnrichedShortlist | null {
    const sl = this.shortlists.get(shortlistId);
    if (!sl) return null;

    sl.candidateIds = [...orderedCandidateIds];
    sl.candidateCount = orderedCandidateIds.length;
    sl.rankings = {};

    orderedCandidateIds.forEach((cid, idx) => {
      sl.rankings[cid] = idx + 1;
    });

    sl.updatedAt = new Date().toISOString();
    return this.getShortlist(shortlistId);
  }

  public updateCandidateNote(shortlistId: string, candidateId: string, note: string): boolean {
    const sl = this.shortlists.get(shortlistId);
    if (!sl) return false;

    sl.notes[candidateId] = note.trim();
    sl.updatedAt = new Date().toISOString();
    return true;
  }

  public addCandidates(shortlistId: string, newCandidateIds: string[]): EnrichedShortlist | null {
    const sl = this.shortlists.get(shortlistId);
    if (!sl) return null;

    for (const cid of newCandidateIds) {
      if (!sl.candidateIds.includes(cid)) {
        sl.candidateIds.push(cid);
        sl.rankings[cid] = sl.candidateIds.length;
      }
    }
    sl.candidateCount = sl.candidateIds.length;
    sl.updatedAt = new Date().toISOString();

    return this.getShortlist(shortlistId);
  }

  public removeCandidate(shortlistId: string, candidateId: string): EnrichedShortlist | null {
    const sl = this.shortlists.get(shortlistId);
    if (!sl) return null;

    sl.candidateIds = sl.candidateIds.filter((cid) => cid !== candidateId);
    delete sl.notes[candidateId];
    delete sl.rankings[candidateId];

    // Ré-indexation des rangs
    sl.candidateIds.forEach((cid, idx) => {
      sl.rankings[cid] = idx + 1;
    });

    sl.candidateCount = sl.candidateIds.length;
    sl.updatedAt = new Date().toISOString();

    return this.getShortlist(shortlistId);
  }

  /**
   * Export anonymisé strict : exclut automatiquement tout candidat sous statut de traitement limité (RGPD)
   */
  public getExportData(shortlistId: string): {
    shortlist: Shortlist;
    exportableCandidates: ShortlistCandidateRecord[];
    restrictedCount: number;
  } | null {
    const enriched = this.getShortlist(shortlistId);
    if (!enriched) return null;

    const exportableCandidates = enriched.candidates.filter((c) => !c.isRestricted);
    const restrictedCount = enriched.candidates.filter((c) => c.isRestricted).length;

    return {
      shortlist: enriched,
      exportableCandidates,
      restrictedCount,
    };
  }
}

export const shortlistStore = new ShortlistStore();
