import type { IOrganizationRepository } from '@/lib/api/types';
import type { Organization, Membership } from '@/types';
import { mockOrganization, mockMemberships } from '../data/organizations';

export class MockOrganizationRepository implements IOrganizationRepository {
  private org = { ...mockOrganization };
  private members = [...mockMemberships];

  async getById(id: string): Promise<Organization | null> {
    if (this.org.id === id) return this.org;
    return null;
  }

  async getCurrent(): Promise<Organization> {
    return this.org;
  }

  async getMembers(organizationId: string): Promise<Membership[]> {
    return this.members.filter((m) => m.organizationId === organizationId);
  }

  async updateSettings(id: string, settings: Partial<Organization>): Promise<Organization> {
    if (this.org.id === id) {
      this.org = {
        ...this.org,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
    }
    return this.org;
  }
}
