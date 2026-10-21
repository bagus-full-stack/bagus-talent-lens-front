import type {
  VerificationItem,
  VerificationFilter,
  VerificationStats,
  DoubtfulField,
  VerificationMotif,
} from '@/lib/schemas/verification';
import { initialVerificationItems, computeVerificationStats } from '../data/verification-queue';

export class MockVerificationRepository {
  private items: VerificationItem[];

  constructor() {
    // Deep clone initial items so each instance or test run starts fresh or retains in-memory updates
    this.items = JSON.parse(JSON.stringify(initialVerificationItems));
  }

  public async getItems(filter?: Partial<VerificationFilter>): Promise<{
    items: VerificationItem[];
    stats: VerificationStats;
  }> {
    let filtered = [...this.items];

    if (filter) {
      if (filter.motif && filter.motif !== 'all') {
        filtered = filtered.filter((i) => i.motif === filter.motif);
      }

      if (filter.folderId && filter.folderId !== 'all') {
        filtered = filtered.filter((i) => i.folderId === filter.folderId);
      }

      if (filter.status && filter.status !== 'all') {
        if (filter.status === 'pending') {
          filtered = filtered.filter((i) => i.status === 'pending' || i.status === 'in_progress');
        } else {
          filtered = filtered.filter((i) => i.status === filter.status);
        }
      }

      if (filter.dateRange && filter.dateRange !== 'all') {
        const now = new Date('2026-10-04T12:00:00Z').getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        filtered = filtered.filter((i) => {
          const itemDate = new Date(i.createdAt).getTime();
          const diffDays = (now - itemDate) / oneDay;

          if (filter.dateRange === 'today') {
            return diffDays <= 1;
          }
          if (filter.dateRange === 'last_7_days') {
            return diffDays <= 7;
          }
          if (filter.dateRange === 'last_30_days') {
            return diffDays <= 30;
          }
          return true;
        });
      }

      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        filtered = filtered.filter(
          (i) =>
            i.pseudonym.toLowerCase().includes(q) ||
            i.folderReference.toLowerCase().includes(q) ||
            i.folderTitle.toLowerCase().includes(q) ||
            i.motifLabel.toLowerCase().includes(q) ||
            i.summary.toLowerCase().includes(q)
        );
      }
    }

    return {
      items: filtered,
      stats: computeVerificationStats(this.items),
    };
  }

  public async getItemById(id: string): Promise<VerificationItem | null> {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  }

  public async updateDoubtfulField(
    itemId: string,
    fieldKey: string,
    action: 'validate' | 'correct' | 'ignore',
    correctedValue?: any,
    user?: { name: string }
  ): Promise<{ success: boolean; item: VerificationItem; stats: VerificationStats }> {
    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Élément à vérifier ${itemId} introuvable`);
    }

    const item = this.items[itemIndex];
    const fieldIndex = item.doubtfulFields.findIndex((f) => f.key === fieldKey);
    if (fieldIndex === -1) {
      throw new Error(`Champ douteux ${fieldKey} introuvable pour l'élément ${itemId}`);
    }

    const now = new Date().toISOString();
    const field = item.doubtfulFields[fieldIndex];

    if (action === 'validate') {
      field.status = 'validated';
      field.confidence = 100;
      field.updatedAt = now;
    } else if (action === 'correct') {
      field.status = 'corrected';
      field.correctedValue = correctedValue;
      field.confidence = 100;
      field.updatedAt = now;
    } else if (action === 'ignore') {
      field.status = 'ignored';
      field.updatedAt = now;
    }

    // Si tous les champs douteux sont traités (validated / corrected / ignored)
    // et que le contenu suspect n'est pas en attente critique, on passe l'item en "treated"
    const allFieldsTreated = item.doubtfulFields.every((f) => f.status !== 'pending');
    const suspiciousPending = item.suspiciousDetails && item.suspiciousDetails.mitigationStatus === 'pending';

    if (allFieldsTreated && !suspiciousPending) {
      item.status = 'treated';
    }

    this.items[itemIndex] = item;

    return {
      success: true,
      item: JSON.parse(JSON.stringify(item)),
      stats: computeVerificationStats(this.items),
    };
  }

  public async resolveSuspiciousContent(
    itemId: string,
    action: 'exclude' | 'confirm_clean',
    reason: string,
    user?: { name: string }
  ): Promise<{ success: boolean; item: VerificationItem; stats: VerificationStats }> {
    const itemIndex = this.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Élément à vérifier ${itemId} introuvable`);
    }

    const item = this.items[itemIndex];
    if (!item.suspiciousDetails) {
      throw new Error(`L'élément ${itemId} ne comporte aucun contenu suspect identifié`);
    }

    const trimmedReason = reason?.trim() || '';

    // Action "Confirmer qu'il est sain" : motif obligatoire (au moins 10 caractères)
    if (action === 'confirm_clean') {
      if (trimmedReason.length < 10) {
        throw new Error('Le motif obligatoire doit comporter au moins 10 caractères pour confirmer qu’un profil est sain');
      }
      item.suspiciousDetails.mitigationStatus = 'confirmed_clean';
      item.suspiciousDetails.confirmationReason = trimmedReason;
      item.suspiciousDetails.reviewedBy = user?.name || 'Recruteur / Auditeur';
      item.suspiciousDetails.reviewedAt = new Date().toISOString();
      item.status = 'treated';
    } else if (action === 'exclude') {
      item.suspiciousDetails.mitigationStatus = 'excluded';
      item.suspiciousDetails.confirmationReason = trimmedReason || 'Exclusion du vivier de matching suite à détection de prompt injection';
      item.suspiciousDetails.reviewedBy = user?.name || 'Sécurité ATS';
      item.suspiciousDetails.reviewedAt = new Date().toISOString();
      item.status = 'excluded';
    }

    this.items[itemIndex] = item;

    return {
      success: true,
      item: JSON.parse(JSON.stringify(item)),
      stats: computeVerificationStats(this.items),
    };
  }

  public resetQueue(): void {
    this.items = JSON.parse(JSON.stringify(initialVerificationItems));
  }
}

// Singleton repository
export const mockVerificationRepository = new MockVerificationRepository();
