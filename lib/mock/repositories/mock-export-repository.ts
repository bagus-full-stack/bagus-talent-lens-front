import type { IExportRepository } from '@/lib/api/types';
import type { Export } from '@/types';
import { mockExports } from '../data/exports';
import { ServerExportGenerator, type GeneratedExportFile } from '@/lib/exports/export-generator';

export class MockExportRepository implements IExportRepository {
  private exports: Export[] = [...mockExports];

  async getAll(organizationId: string): Promise<Export[]> {
    return this.exports.filter((e) => e.organizationId === organizationId);
  }

  async getById(id: string): Promise<Export | null> {
    const item = this.exports.find((e) => e.id === id);
    if (!item) return null;
    if (this.isExpired(item)) {
      item.status = 'expired';
    }
    return item;
  }

  isExpired(exportItem: Export): boolean {
    if (!exportItem.expiresAt) return false;
    return new Date(exportItem.expiresAt).getTime() < Date.now();
  }

  async create(data: Omit<Export, 'id' | 'createdAt' | 'sha256Hash' | 'downloadCount'>): Promise<Export> {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newExport: Export = {
      ...data,
      id: `#EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sha256Hash: `SHA256:${randomHex}8fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.exports.unshift(newExport);
    return newExport;
  }

  async recordDownload(id: string): Promise<Export | null> {
    const item = await this.getById(id);
    if (!item) return null;
    item.downloadCount = (item.downloadCount || 0) + 1;
    item.status = 'downloaded';
    return item;
  }

  async generateFileContent(exportId: string): Promise<{ file: GeneratedExportFile; exportItem: Export }> {
    const exportItem = await this.getById(exportId);
    if (!exportItem) {
      throw new Error('Export introuvable');
    }
    if (this.isExpired(exportItem)) {
      throw new Error('Ce lien d’export a expiré (validité 7 jours échue)');
    }

    const file = ServerExportGenerator.generateFile(
      exportItem as any,
      exportItem.options as any || {
        includeScores: true,
        includeSkills: true,
        includeContact: false,
        includeNotes: false,
      }
    );

    return { file, exportItem };
  }
}
