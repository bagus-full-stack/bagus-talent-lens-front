import type { IFolderRepository } from '@/lib/api/types';
import type { Folder } from '@/types';
import { mockFolders } from '../data/folders';

export class MockFolderRepository implements IFolderRepository {
  private folders = [...mockFolders];

  async getAll(organizationId: string): Promise<Folder[]> {
    return this.folders.filter((f) => f.organizationId === organizationId);
  }

  async getById(id: string): Promise<Folder | null> {
    return this.folders.find((f) => f.id === id) || null;
  }

  async create(data: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'totalCandidates' | 'qualifiedCandidates'>): Promise<Folder> {
    const newFolder: Folder = {
      ...data,
      id: `fld-${Date.now().toString(36)}`,
      totalCandidates: 0,
      qualifiedCandidates: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.folders.push(newFolder);
    return newFolder;
  }

  async update(id: string, data: Partial<Folder>): Promise<Folder | null> {
    const idx = this.folders.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    this.folders[idx] = {
      ...this.folders[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.folders[idx];
  }
}
