import type { IAuditRepository } from '@/lib/api/types';
import type { AuditEvent } from '@/types';
import { mockAuditEvents } from '../data/audit';

export class MockAuditRepository implements IAuditRepository {
  private events = [...mockAuditEvents];

  async getEvents(organizationId: string, limit = 50): Promise<AuditEvent[]> {
    return this.events.slice(0, limit);
  }

  async getAll(): Promise<AuditEvent[]> {
    return this.events;
  }

  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'sha256Seal' | 'merkleVerified'>): Promise<AuditEvent> {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newEvent: AuditEvent = {
      ...event,
      id: `#EVT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      sha256Seal: `${randomHex}8fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
      merkleVerified: true,
    };
    this.events.unshift(newEvent);
    return newEvent;
  }
}
