import type { AuditEvent } from '@/types';

export const mockAuditEvents: AuditEvent[] = [
  {
    id: '#EVT-2026-9841',
    timestamp: '2026-10-02T14:32:18.491Z',
    action: 'BLIND_MODE_UNMASK',
    actor: {
      id: 'usr_mlefebvre_99',
      name: 'Marc Lefebvre',
      role: 'RECRUITER_SENIOR',
      ip: '194.25.12.8',
      authStrength: 'MFA_FIDO2',
    },
    resource: {
      id: 'cand-a1b2',
      type: 'candidate',
      pseudonym: 'A1B2',
      folderReference: '#DE-2026',
    },
    justification: 'Entretien RH final planifié le 04/10/2026 avec le client Société Générale pour le dossier #DE-2026',
    sha256Seal: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    merkleVerified: true,
    payload: {
      unmaskScope: ['PII_CORE', 'ACADEMIC_TIMELINE'],
      grantedDurationHours: 24,
    },
  },
  {
    id: '#EVT-2026-9830',
    timestamp: '2026-10-02T11:15:02.110Z',
    action: 'EXPORT_NOMINATIVE',
    actor: {
      id: 'usr_idriss_ouedraogo',
      name: 'Idriss Ouédraogo',
      role: 'ADMIN',
      ip: '82.126.94.14',
      authStrength: 'MFA_FIDO2',
    },
    resource: {
      id: '#EXP-2026-9812',
      type: 'export',
      folderReference: '#DE-2026',
    },
    justification: 'Génération dossier shortlist client Société Générale avec levée PII 2FA',
    sha256Seal: '4b9a1e3f8c7d5b2a0e6f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d',
    merkleVerified: true,
    payload: {
      candidateCount: 12,
      format: 'pdf_shortlist',
    },
  },
  {
    id: '#EVT-2026-9799',
    timestamp: '2026-10-01T17:40:55.334Z',
    action: 'SECURITY_PROMPT_INJECTION_DETECTED',
    actor: {
      id: 'system_llm_guard',
      name: 'TalentLens AI Guard v4.2',
      role: 'SYSTEM_AUDITOR',
      ip: '10.0.4.12',
      authStrength: 'MFA_FIDO2',
    },
    resource: {
      id: 'cand-s4p9',
      type: 'candidate',
      pseudonym: 'S4P9',
      folderReference: '#DE-2026',
    },
    justification: 'Détection texte 1pt blanc sur fond blanc contenant chaîne de détournement de parsing',
    sha256Seal: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    merkleVerified: true,
    payload: {
      severity: 'HIGH',
      quarantineAction: 'ISOLATION_PIPELINE',
    },
  },
  {
    id: '#EVT-2026-9750',
    timestamp: '2026-09-28T09:15:00.000Z',
    action: 'DSR_ERASURE_EXECUTE',
    actor: {
      id: 'usr_severine_petit',
      name: 'Sarah Benali (DPO)',
      role: 'DPO',
      ip: '194.25.12.8',
      authStrength: 'MFA_FIDO2',
    },
    resource: {
      id: '#DSR-2026-089',
      type: 'dsr',
      folderReference: '#DE-2026',
    },
    justification: 'Vérification de l’identité du candidat et ouverture du protocole d’effacement Art. 17',
    sha256Seal: '7f8c9a41b2c45d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
    merkleVerified: true,
    payload: {
      subjectPseudonym: 'A1B2',
      legalDeadline: '2026-10-05T23:59:59Z',
    },
  },
];
