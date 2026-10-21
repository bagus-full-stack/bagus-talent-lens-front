'use server';

import { can, type PermissionUser } from '@/lib/permissions';
import { getDsrRepository, getAuditRepository } from '@/lib/api';
import {
  CreateDsrInputSchema,
  type CreateDsrInput,
  type DataSubjectRequest,
  type DsrStatus,
} from '@/lib/schemas/dsr';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { DsrService, type ErasureReport } from '@/lib/rgpd/dsr-service';

export interface DsrActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'FORBIDDEN' | 'SAME_VALIDATOR_REFUSED' | 'REAUTH_REQUIRED' | 'NOT_FOUND' | 'VALIDATION_ERROR';
}

/**
 * Server Action pour la création d'une nouvelle demande DSR.
 * Vérifie rigoureusement l'habilitation 'rgpd.manage' (Owner, Admin, DPO).
 */
export async function createDsrAction(
  input: CreateDsrInput,
  actor: { id: string; name: string; role: any } = {
    id: 'usr_severine_petit',
    name: 'Séverine Petit',
    role: 'dpo',
  }
): Promise<DsrActionResult<DataSubjectRequest>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return {
        success: false,
        error: "Accès refusé : la gestion des demandes RGPD est réservée aux rôles DPO, Admin et Owner.",
        code: 'FORBIDDEN',
      };
    }

    const parsed = CreateDsrInputSchema.safeParse(input);
    if (!parsed.success) {
      const msg =
        parsed.error.issues?.[0]?.message ||
        parsed.error.errors?.[0]?.message ||
        'Données de demande invalides';
      return { success: false, error: msg, code: 'VALIDATION_ERROR' };
    }

    const data = parsed.data;
    const dsrRepo = getDsrRepository() as any;
    const auditRepo = getAuditRepository();

    const created = await dsrRepo.create({
      organizationId: mockOrganization.id,
      requestType: data.requestType,
      candidateId: data.candidateId,
      candidatePseudonym: data.candidatePseudonym,
      candidateRealName: data.candidateRealName,
      candidateEmail: data.candidateEmail,
      folderReference: data.folderReference,
      receivedVia: data.receivedVia,
      status: data.idVerified ? 'identity_verified' : 'received',
      idVerified: data.idVerified,
      idVerificationNote: data.idVerificationNote,
      assignedDpoId: data.assignedDpoId || actor.id,
      assignedDpoName: data.assignedDpoName || actor.name,
      requiresDoubleValidation: data.requestType === 'erasure',
      comments: data.initialComment
        ? [
            {
              id: `cmt-${Date.now()}`,
              authorId: actor.id,
              authorName: actor.name,
              authorRole: String(actor.role).toUpperCase(),
              content: data.initialComment,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    });

    // Journalisation WORM
    await auditRepo.logEvent({
      action: 'DSR_REQUEST_CREATED' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: created.id,
        type: 'dsr' as any,
        folderReference: created.folderReference,
      },
      justification: `Création demande DSR ${created.requestType} pour ${created.candidatePseudonym} (Vérification identité: ${data.idVerificationNote})`,
      payload: {
        requestType: created.requestType,
        candidateEmail: created.candidateEmail,
        legalDeadline: created.legalDeadline,
      },
    });

    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création DSR' };
  }
}

/**
 * Server Action pour la double validation d'effacement (Art. 17).
 * RÈGLE ABSOLUE : Le second validateur ne peut PAS être le même utilisateur que le premier !
 */
export async function validateErasureStepAction(
  dsrId: string,
  validator: { id: string; name: string; role: any },
  comment?: string,
  reauthVerified = false
): Promise<DsrActionResult<{ dsr: DataSubjectRequest; erasureReport?: ErasureReport }>> {
  try {
    const permUser: PermissionUser = { id: validator.id, role: validator.role };
    if (!can(permUser, 'rgpd.manage')) {
      return {
        success: false,
        error: "Accès refusé : la validation d'effacement requiert les droits DPO, Admin ou Owner.",
        code: 'FORBIDDEN',
      };
    }

    const dsrRepo = getDsrRepository() as any;
    const auditRepo = getAuditRepository();
    const dsr = await dsrRepo.getById(dsrId);
    if (!dsr) {
      return { success: false, error: 'Demande DSR introuvable', code: 'NOT_FOUND' };
    }

    // Ré-authentification forte requise
    if (!reauthVerified) {
      return {
        success: false,
        error: "Une ré-authentification forte (MFA/Mot de passe) est obligatoire pour valider l'effacement.",
        code: 'REAUTH_REQUIRED',
      };
    }

    // Contrôle d'auto-validation (même utilisateur)
    if (dsr.firstValidatorId && dsr.firstValidatorId === validator.id) {
      return {
        success: false,
        error: "Double validation refusée : le second validateur doit obligatoirement être un utilisateur distinct du premier validateur.",
        code: 'SAME_VALIDATOR_REFUSED',
      };
    }

    // Validation
    const updated = await dsrRepo.validateErasureStep(dsrId, validator, comment);

    let erasureReport: ErasureReport | undefined;
    if (updated.status === 'fulfilled') {
      erasureReport = DsrService.generateErasureReport(
        updated,
        {
          id: updated.firstValidatorId,
          name: updated.firstValidatorName,
          role: 'PREMIER_VALIDATEUR',
        },
        {
          id: validator.id,
          name: validator.name,
          role: String(validator.role).toUpperCase(),
        }
      );
    }

    // Journalisation WORM
    await auditRepo.logEvent({
      action: (updated.status === 'fulfilled' ? 'DSR_ERASURE_FULFILLED' : 'DSR_ERASURE_LEVEL1_VALIDATED') as any,
      actor: {
        id: validator.id,
        name: validator.name,
        role: String(validator.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: updated.id,
        type: 'dsr' as any,
        folderReference: updated.folderReference,
      },
      justification: comment || `Signature d'effacement RGPD Art. 17 par ${validator.name}`,
      payload: {
        status: updated.status,
        sha256Certificate: updated.sha256Certificate,
      },
    });

    return {
      success: true,
      data: { dsr: updated, erasureReport },
    };
  } catch (err: any) {
    if (err.message && err.message.includes('distinct')) {
      return { success: false, error: err.message, code: 'SAME_VALIDATOR_REFUSED' };
    }
    return { success: false, error: err.message || 'Erreur lors de la validation d’effacement' };
  }
}

/**
 * Server Action pour faire avancer le statut d'une demande générale.
 */
export async function advanceDsrStatusAction(
  dsrId: string,
  newStatus: DsrStatus,
  actor: { id: string; name: string; role: any },
  comment?: string
): Promise<DsrActionResult<DataSubjectRequest>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé (rgpd.manage requis).', code: 'FORBIDDEN' };
    }

    const dsrRepo = getDsrRepository() as any;
    const updated = await dsrRepo.advanceStatus(dsrId, newStatus, actor, comment);
    if (!updated) {
      return { success: false, error: 'Demande introuvable', code: 'NOT_FOUND' };
    }

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur de changement de statut' };
  }
}

/**
 * Server Action pour ajouter un commentaire interne au dossier DSR.
 */
export async function addDsrCommentAction(
  dsrId: string,
  content: string,
  actor: { id: string; name: string; role: any }
): Promise<DsrActionResult<DataSubjectRequest>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé.', code: 'FORBIDDEN' };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Le commentaire ne peut pas être vide.' };
    }

    const dsrRepo = getDsrRepository() as any;
    const updated = await dsrRepo.addComment(dsrId, {
      authorId: actor.id,
      authorName: actor.name,
      authorRole: String(actor.role).toUpperCase(),
      content: content.trim(),
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de l’ajout du commentaire' };
  }
}

/**
 * Server Action pour restreindre le traitement d'un candidat (Art. 18 / 21).
 */
export async function restrictCandidateAction(
  dsrId: string,
  actor: { id: string; name: string; role: any }
): Promise<DsrActionResult<DataSubjectRequest>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'rgpd.manage')) {
      return { success: false, error: 'Accès refusé.', code: 'FORBIDDEN' };
    }

    const dsrRepo = getDsrRepository() as any;
    const updated = await dsrRepo.restrictCandidateTreatment(dsrId, actor);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la restriction du traitement' };
  }
}
