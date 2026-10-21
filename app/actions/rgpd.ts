'use server';

import { can, type PermissionUser } from '@/lib/permissions';
import { getAuditRepository } from '@/lib/api';
import {
  RetentionExtensionInputSchema,
  type RetentionExtensionInput,
  BulkLegalBasisInputSchema,
  type BulkLegalBasisInput,
  CreateDataBreachInputSchema,
  type CreateDataBreachInput,
  type CvRetentionItem,
  type ConsentRecord,
  type DataBreachRecord,
  type PurgeLogItem,
  type BreachStatus,
} from '@/lib/schemas/rgpd-governance';
import {
  mockRetentionItems,
  mockConsentRecords,
  mockDataBreaches,
  mockPurgeLogs,
  mockProcessingActivities,
  mockSubprocessors,
} from '@/lib/mock/data/rgpd-governance';

export interface RgpdActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'FORBIDDEN' | 'VALIDATION_ERROR' | 'CONSENT_PROOF_MISSING' | 'NOT_FOUND' | 'SERVER_ERROR';
}

// In-memory state persistent for server actions
let retentionState: CvRetentionItem[] = [...mockRetentionItems];
let consentState: ConsentRecord[] = [...mockConsentRecords];
let breachesState: DataBreachRecord[] = [...mockDataBreaches];
let purgeLogsState: PurgeLogItem[] = [...mockPurgeLogs];

/**
 * Server Action : Prolonger la durée de rétention d'un CV.
 * RÈGLE ABSOLUE RGPD : Refus catégorique si la preuve de consentement est absente ou incomplète !
 */
export async function extendRetentionAction(
  input: RetentionExtensionInput,
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<CvRetentionItem>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return {
        success: false,
        error: "Accès refusé : la prolongation de rétention RGPD est réservée aux profils DPO, Admin et Owner.",
        code: 'FORBIDDEN',
      };
    }

    const parsed = RetentionExtensionInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Preuve de consentement invalide ou incomplète.';
      return {
        success: false,
        error: firstError,
        code: 'VALIDATION_ERROR',
      };
    }

    const data = parsed.data;

    // Contrôle strict de la preuve de consentement
    if (!data.consentDate || !data.consentDate.trim()) {
      return {
        success: false,
        error: "Refus de prolongation : la date de recueil du consentement est obligatoire.",
        code: 'CONSENT_PROOF_MISSING',
      };
    }

    if (!data.consentText || data.consentText.trim().length < 10) {
      return {
        success: false,
        error: "Refus de prolongation : le texte de consentement présenté au candidat doit être fourni (minimum 10 caractères).",
        code: 'CONSENT_PROOF_MISSING',
      };
    }

    if (!data.consentSource || !data.consentSource.trim()) {
      return {
        success: false,
        error: "Refus de prolongation : la source vérifiable du consentement est obligatoire.",
        code: 'CONSENT_PROOF_MISSING',
      };
    }

    // Recherche et mise à jour
    const targetIdx = retentionState.findIndex((r) => r.candidateId === data.candidateId || r.id === data.candidateId);
    let target = targetIdx >= 0 ? retentionState[targetIdx] : null;

    const extensionMonths = data.months || 12;
    const now = new Date();
    const newUntil = new Date(now.getFullYear(), now.getMonth() + extensionMonths, now.getDate());
    const daysRemaining = Math.max(1, Math.round((newUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (!target) {
      // Fallback si ID dynamique
      target = {
        id: `ret-${Date.now()}`,
        candidateId: data.candidateId,
        candidatePseudonym: `Candidat #${data.candidateId.slice(-4).toUpperCase()}`,
        folderReference: '#GEN-2026',
        folderTitle: 'Dossier Général',
        lastActivityDate: now.toISOString().split('T')[0],
        retention_until: newUntil.toISOString(),
        daysRemaining,
        status: 'compliant',
        legalBasis: 'Consentement explicite renouvelé (Art. 6.1.a)',
        consentProof: {
          date: data.consentDate,
          text: data.consentText,
          source: data.consentSource,
        },
      };
      retentionState = [target, ...retentionState];
    } else {
      target = {
        ...target,
        retention_until: newUntil.toISOString(),
        daysRemaining,
        status: 'compliant',
        legalBasis: 'Consentement explicite renouvelé (Art. 6.1.a)',
        consentProof: {
          date: data.consentDate,
          text: data.consentText,
          source: data.consentSource,
        },
      };
      retentionState[targetIdx] = target;
    }

    // Journalisation immuable dans l'audit WORM
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'RGPD_RETENTION_EXTEND' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: target.candidateId,
        type: 'candidate',
        pseudonym: target.candidatePseudonym,
        folderReference: target.folderReference,
      },
      justification: `Prolongation de rétention de ${extensionMonths} mois sur base du consentement du ${data.consentDate} (Source: ${data.consentSource})`,
      payload: {
        previousStatus: 'retention_extended',
        newRetentionUntil: target.retention_until,
        extensionMonths,
        consentSource: data.consentSource,
        consentDate: data.consentDate,
      },
    });

    return {
      success: true,
      data: target,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de la prolongation de la rétention',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Server Action : Mise à jour en masse des bases légales
 */
export async function bulkUpdateLegalBasisAction(
  input: BulkLegalBasisInput,
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<{ count: number; updatedIds: string[] }>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return {
        success: false,
        error: "Accès refusé : la mise à jour des bases légales est réservée aux DPO, Admin et Owner.",
        code: 'FORBIDDEN',
      };
    }

    const parsed = BulkLegalBasisInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues?.[0]?.message || 'Données invalides',
        code: 'VALIDATION_ERROR',
      };
    }

    const data = parsed.data;
    const nowIso = new Date().toISOString().split('T')[0];

    // Mise à jour de l'état
    consentState = consentState.map((c) => {
      if (data.candidateIds.includes(c.candidateId) || data.candidateIds.includes(c.id)) {
        return {
          ...c,
          legalBasis: data.legalBasis,
          status: 'valid',
          obtainedDate: data.consentDate || nowIso,
          source: data.source,
          proofDetails: data.consentText ? `Régularisation : ${data.consentText}` : `Régularisation en masse (${data.source})`,
        };
      }
      return c;
    });

    // Journalisation WORM
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'RGPD_LEGAL_BASIS_UPDATE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: `batch-${Date.now()}`,
        type: 'candidate',
      },
      justification: `Régularisation de base légale en masse vers '${data.legalBasis}' pour ${data.candidateIds.length} profils`,
      payload: {
        count: data.candidateIds.length,
        candidateIds: data.candidateIds,
        legalBasis: data.legalBasis,
        source: data.source,
      },
    });

    return {
      success: true,
      data: { count: data.candidateIds.length, updatedIds: data.candidateIds },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de la mise à jour en masse',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Server Action : Déclarer une violation de données (Art. 33 & 34)
 */
export async function declareDataBreachAction(
  input: CreateDataBreachInput,
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<DataBreachRecord>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return {
        success: false,
        error: "Accès refusé : la déclaration de violation de sécurité requiert l'habilitation DPO ou Admin.",
        code: 'FORBIDDEN',
      };
    }

    const parsed = CreateDataBreachInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues?.[0]?.message || 'Informations de violation incomplètes',
        code: 'VALIDATION_ERROR',
      };
    }

    const data = parsed.data;
    const nextSeq = breachesState.length + 1;
    const reference = `VIO-2026-${String(nextSeq).padStart(3, '0')}`;

    const newBreach: DataBreachRecord = {
      id: `vio-${Date.now()}`,
      reference,
      detectedAt: data.detectedAt,
      title: data.title,
      description: data.description,
      nature: data.nature as any,
      severity: data.severity,
      affectedPersonsCount: data.affectedPersonsCount,
      affectedDataCategories: data.affectedDataCategories,
      consequences: data.consequences,
      remediationTaken: data.remediationTaken,
      authorityNotification: data.authorityNotification,
      candidateNotification: data.severity === 'critical' || data.severity === 'high' ? 'required' : 'not_required',
      status: 'open',
      reporterName: actor.name,
      reporterRole: String(actor.role).toUpperCase(),
    };

    breachesState = [newBreach, ...breachesState];

    // Journalisation WORM
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'RGPD_BREACH_DECLARED' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: newBreach.id,
        type: 'organization',
      },
      justification: `Déclaration formelle d'incident de sécurité / violation Art. 33 : ${newBreach.title} (Gravité: ${newBreach.severity})`,
      payload: {
        reference: newBreach.reference,
        severity: newBreach.severity,
        nature: newBreach.nature,
        affectedPersonsCount: newBreach.affectedPersonsCount,
        authorityNotification: newBreach.authorityNotification,
      },
    });

    return {
      success: true,
      data: newBreach,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de la déclaration de la violation',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Server Action : Mettre à jour le statut d'une violation (ex: notifiée CNIL, clôturée)
 */
export async function updateDataBreachStatusAction(
  breachId: string,
  newStatus: BreachStatus,
  authorityNotified = false,
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<DataBreachRecord>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const idx = breachesState.findIndex((b) => b.id === breachId || b.reference === breachId);
    if (idx === -1) {
      return { success: false, error: 'Violation introuvable', code: 'NOT_FOUND' };
    }

    const current = breachesState[idx];
    const updated: DataBreachRecord = {
      ...current,
      status: newStatus,
      authorityNotification: authorityNotified ? 'notified' : current.authorityNotification,
      authorityNotifiedAt: authorityNotified ? new Date().toISOString() : current.authorityNotifiedAt,
    };

    breachesState[idx] = updated;

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'RGPD_BREACH_UPDATED' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: updated.id,
        type: 'organization',
      },
      justification: `Mise à jour statut violation ${updated.reference} vers '${newStatus}'`,
      payload: {
        reference: updated.reference,
        status: newStatus,
        authorityNotified,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur serveur', code: 'SERVER_ERROR' };
  }
}

/**
 * Server Action : Exécuter la purge immédiate des CV échus
 */
export async function triggerPurgeAction(
  candidateIds?: string[],
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<PurgeLogItem>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const targets = candidateIds && candidateIds.length > 0
      ? candidateIds
      : retentionState.filter((r) => r.status === 'to_purge').map((r) => r.candidateId);

    const purgedCount = targets.length > 0 ? targets.length : 12;

    // Retirer de la rétention active
    retentionState = retentionState.filter((r) => !targets.includes(r.candidateId) && !targets.includes(r.id));

    const newLog: PurgeLogItem = {
      id: `prg-${Date.now()}`,
      date: `${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')} UTC`,
      cvCount: purgedCount,
      sha256Certificate: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      proofDocument: `PV_Destruction_WORM_${new Date().getFullYear()}_${Date.now().toString().slice(-4)}.pdf`,
      operator: `${actor.name} (${String(actor.role).toUpperCase()})`,
    };

    purgeLogsState = [newLog, ...purgeLogsState];

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'CANDIDATE_PURGE_CNIL',
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: newLog.id,
        type: 'candidate',
      },
      justification: `Purge cryptographique WORM définitive de ${purgedCount} CV ayant dépassé la limite de rétention`,
      payload: {
        cvCount: purgedCount,
        sha256Certificate: newLog.sha256Certificate,
        candidateIds: targets,
      },
    });

    return { success: true, data: newLog };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la purge', code: 'SERVER_ERROR' };
  }
}

/**
 * Server Action : Export du registre Art. 30 en JSON / payload structuré
 */
export async function exportArticle30RegistryAction(
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<RgpdActionResult<{
  organization: string;
  generatedAt: string;
  dpo: string;
  activities: typeof mockProcessingActivities;
  subprocessors: typeof mockSubprocessors;
  sha256Seal: string;
}>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const payload = {
      organization: 'TalentLens ATS B2B - Cabinet Conseil',
      generatedAt: new Date().toISOString(),
      dpo: 'Séverine Petit (DPO Externe Certifié)',
      activities: mockProcessingActivities,
      subprocessors: mockSubprocessors,
      sha256Seal: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'RGPD_REGISTRY_EXPORT' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: 'registry-art30',
        type: 'organization',
      },
      justification: 'Génération de l’export complet du Registre des Traitements Art. 30 RGPD',
      payload: {
        activitiesCount: mockProcessingActivities.length,
        subprocessorsCount: mockSubprocessors.length,
      },
    });

    return { success: true, data: payload };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de l’export', code: 'SERVER_ERROR' };
  }
}

/**
 * Fonctions de lecture d'état
 */
export async function getRgpdState() {
  return {
    retentionItems: retentionState,
    purgeLogs: purgeLogsState,
    consentRecords: consentState,
    processingActivities: mockProcessingActivities,
    subprocessors: mockSubprocessors,
    dataBreaches: breachesState,
  };
}
