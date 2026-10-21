'use server';

import { can, type PermissionUser } from '@/lib/permissions';
import { getAuditRepository } from '@/lib/api';
import type { Membership, Invitation, Role } from '@/types';
import { mockMemberships, mockOrganization } from '@/lib/mock/data/organizations';
import { mockInvitations, type StoredInvitation, hashInvitationToken } from '@/lib/mock/data/invitations';

export interface UserActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'FORBIDDEN' | 'LAST_OWNER_PROTECTION' | 'SELF_MODIFICATION_REFUSED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'ALREADY_EXISTS';
}

// In-memory state pour les membres et invitations
let membersState: Membership[] = [...mockMemberships];
let invitationsState: StoredInvitation[] = [...mockInvitations];

/**
 * Récupère les membres et invitations actifs
 */
export async function getUsersAndInvitationsAction(
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<{ members: Membership[]; invitations: StoredInvitation[] }>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return {
        success: false,
        error: "Accès refusé : la gestion des utilisateurs requiert les droits Administrateur ou Propriétaire.",
        code: 'FORBIDDEN',
      };
    }

    return {
      success: true,
      data: {
        members: membersState,
        invitations: invitationsState,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur serveur' };
  }
}

/**
 * Modifier le rôle d'un utilisateur.
 * GARDE-FOUS SERVEUR :
 * 1. On ne peut pas modifier son propre rôle.
 * 2. On ne peut pas retirer le rôle Owner du dernier Owner de l'organisation.
 */
export async function changeUserRoleAction(
  targetUserId: string,
  newRole: Role,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<Membership>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return {
        success: false,
        error: "Accès refusé : la gestion des rôles est réservée aux Administrateurs et Propriétaires.",
        code: 'FORBIDDEN',
      };
    }

    // Garde-fou 1 : interdiction de modifier son propre rôle
    if (actor.id === targetUserId) {
      return {
        success: false,
        error: "Action refusée : vous ne pouvez pas modifier votre propre rôle.",
        code: 'SELF_MODIFICATION_REFUSED',
      };
    }

    const memberIdx = membersState.findIndex(
      (m) => m.userId === targetUserId || m.id === targetUserId
    );
    if (memberIdx === -1) {
      return { success: false, error: 'Membre introuvable', code: 'NOT_FOUND' };
    }

    const currentMember = membersState[memberIdx];

    // Garde-fou 2 : protection du dernier Owner
    if (currentMember.role === 'owner' && newRole !== 'owner') {
      const activeOwners = membersState.filter((m) => m.role === 'owner' && m.status === 'active');
      if (activeOwners.length <= 1) {
        return {
          success: false,
          error: "Action impossible : l'organisation doit conserver au moins un Propriétaire (Owner).",
          code: 'LAST_OWNER_PROTECTION',
        };
      }
    }

    const previousRole = currentMember.role;
    const updated: Membership = {
      ...currentMember,
      role: newRole,
    };
    membersState[memberIdx] = updated;

    // Journalisation d'audit WORM
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'USER_ROLE_UPDATE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: updated.userId,
        type: 'organization',
      },
      justification: `Changement du rôle de ${updated.fullName} de '${previousRole}' vers '${newRole}'`,
      payload: {
        targetUserId: updated.userId,
        targetEmail: updated.email,
        previousRole,
        newRole,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la modification du rôle' };
  }
}

/**
 * Basculer une permission granulaire (can_reveal_identity ou can_export)
 */
export async function toggleUserPermissionAction(
  targetUserId: string,
  permissionKey: 'can_reveal_identity' | 'can_export',
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<Membership>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const memberIdx = membersState.findIndex(
      (m) => m.userId === targetUserId || m.id === targetUserId
    );
    if (memberIdx === -1) {
      return { success: false, error: 'Membre introuvable', code: 'NOT_FOUND' };
    }

    const currentMember = membersState[memberIdx];
    const nextVal = !currentMember[permissionKey];

    const updated: Membership = {
      ...currentMember,
      [permissionKey]: nextVal,
    };
    membersState[memberIdx] = updated;

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'USER_PERMISSION_UPDATE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: updated.userId,
        type: 'organization',
      },
      justification: `Mise à jour permission '${permissionKey}' = ${nextVal} pour ${updated.fullName}`,
      payload: {
        targetUserId: updated.userId,
        permissionKey,
        newValue: nextVal,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur serveur' };
  }
}

/**
 * Réinitialiser la MFA d'un collaborateur
 */
export async function resetUserMfaAction(
  targetUserId: string,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<Membership>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const memberIdx = membersState.findIndex(
      (m) => m.userId === targetUserId || m.id === targetUserId
    );
    if (memberIdx === -1) {
      return { success: false, error: 'Membre introuvable', code: 'NOT_FOUND' };
    }

    const currentMember = membersState[memberIdx];
    const updated: Membership = {
      ...currentMember,
      mfaEnabled: false,
      aal: 'aal1',
    };
    membersState[memberIdx] = updated;

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'USER_MFA_RESET' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: updated.userId,
        type: 'organization',
      },
      justification: `Réinitialisation administrative de la MFA pour ${updated.fullName}`,
      payload: {
        targetUserId: updated.userId,
        targetEmail: updated.email,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur serveur' };
  }
}

/**
 * Révoquer immédiatement toutes les sessions actives d'un utilisateur
 */
export async function revokeUserSessionsAction(
  targetUserId: string,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<{ revokedAt: string }>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const member = membersState.find((m) => m.userId === targetUserId || m.id === targetUserId);
    const revokedAt = new Date().toISOString();

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'USER_SESSIONS_REVOKE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: targetUserId,
        type: 'organization',
      },
      justification: `Révocation immédiate de toutes les sessions actives de ${member?.fullName || targetUserId}`,
      payload: {
        targetUserId,
        revokedAt,
      },
    });

    return { success: true, data: { revokedAt } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur serveur' };
  }
}

/**
 * Retirer un membre de l'organisation.
 * GARDE-FOUS SERVEUR :
 * 1. On ne peut pas se retirer soi-même.
 * 2. On ne peut pas retirer le dernier Owner.
 * Toutes les sessions sont révoquées immédiatement.
 */
export async function removeUserMembershipAction(
  targetUserId: string,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<{ removedUserId: string }>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return {
        success: false,
        error: "Accès refusé : la suppression de membres requiert les droits Administrateur ou Propriétaire.",
        code: 'FORBIDDEN',
      };
    }

    // Garde-fou 1 : interdiction de se retirer soi-même
    if (actor.id === targetUserId) {
      return {
        success: false,
        error: "Action refusée : vous ne pouvez pas vous retirer vous-même de l'organisation.",
        code: 'SELF_MODIFICATION_REFUSED',
      };
    }

    const member = membersState.find((m) => m.userId === targetUserId || m.id === targetUserId);
    if (!member) {
      return { success: false, error: 'Membre introuvable', code: 'NOT_FOUND' };
    }

    // Garde-fou 2 : protection du dernier Owner
    if (member.role === 'owner') {
      const activeOwners = membersState.filter((m) => m.role === 'owner' && m.status === 'active');
      if (activeOwners.length <= 1) {
        return {
          success: false,
          error: "Impossible de retirer le dernier Propriétaire (Owner) de l'organisation.",
          code: 'LAST_OWNER_PROTECTION',
        };
      }
    }

    // Suppression effective
    membersState = membersState.filter((m) => m.userId !== targetUserId && m.id !== targetUserId);

    // Journalisation WORM avec mention de révocation des sessions
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'USER_MEMBERSHIP_REMOVE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: member.userId,
        type: 'organization',
      },
      justification: `Retrait définitif du membre ${member.fullName} (${member.email}) avec révocation immédiate de toutes les sessions actives.`,
      payload: {
        removedUserId: member.userId,
        removedEmail: member.email,
        removedRole: member.role,
        sessionsRevokedImmediately: true,
      },
    });

    return { success: true, data: { removedUserId: targetUserId } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du retrait du membre' };
  }
}

/**
 * Créer une invitation
 */
export async function createInvitationAction(
  input: {
    email: string;
    role: Role;
    can_reveal_identity?: boolean;
    can_export?: boolean;
    folderIds?: string[];
  },
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<StoredInvitation>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const emailTrimmed = input.email.trim().toLowerCase();
    if (!emailTrimmed.includes('@')) {
      return { success: false, error: 'Adresse email invalide', code: 'VALIDATION_ERROR' };
    }

    // Vérifier si déjà membre
    const alreadyMember = membersState.some((m) => m.email.toLowerCase() === emailTrimmed);
    if (alreadyMember) {
      return {
        success: false,
        error: "Cet utilisateur est déjà membre actif de l'organisation.",
        code: 'ALREADY_EXISTS',
      };
    }

    // Vérifier si invitation déjà en attente
    const pendingInv = invitationsState.some(
      (inv) => inv.email.toLowerCase() === emailTrimmed && inv.status === 'pending'
    );
    if (pendingInv) {
      return {
        success: false,
        error: "Une invitation est déjà en attente pour cette adresse email.",
        code: 'ALREADY_EXISTS',
      };
    }

    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const newInvitation: StoredInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: mockOrganization.id,
      email: emailTrimmed,
      role: input.role,
      status: 'pending',
      invitedBy: actor.id,
      invitedByName: actor.name,
      token,
      tokenHash: hashInvitationToken(token),
      can_reveal_identity: Boolean(input.can_reveal_identity),
      can_export: Boolean(input.can_export),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    invitationsState = [newInvitation, ...invitationsState];

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'INVITATION_CREATE' as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: newInvitation.id,
        type: 'organization',
      },
      justification: `Envoi d'une invitation à ${newInvitation.email} pour le rôle '${newInvitation.role}' (Expiration 7j)`,
      payload: {
        email: newInvitation.email,
        role: newInvitation.role,
        expiresAt: newInvitation.expiresAt,
      },
    });

    return { success: true, data: newInvitation };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création de l’invitation' };
  }
}

/**
 * Renvoyer une invitation (prolongation +7j)
 */
export async function resendInvitationAction(
  invitationId: string,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<StoredInvitation>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const idx = invitationsState.findIndex((inv) => inv.id === invitationId);
    if (idx === -1) {
      return { success: false, error: 'Invitation introuvable', code: 'NOT_FOUND' };
    }

    const current = invitationsState[idx];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const updated: StoredInvitation = {
      ...current,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    };
    invitationsState[idx] = updated;

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'INVITATION_RESEND' as any,
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
      justification: `Renvoi de l'invitation pour ${updated.email} avec prolongation de 7 jours`,
      payload: {
        invitationId: updated.id,
        email: updated.email,
        newExpiresAt: updated.expiresAt,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du renvoi' };
  }
}

/**
 * Révoquer une invitation
 */
export async function revokeInvitationAction(
  invitationId: string,
  actor: { id: string; name: string; role: any }
): Promise<UserActionResult<StoredInvitation>> {
  try {
    const permUser: PermissionUser = { id: actor.id, role: actor.role };
    if (!can(permUser, 'users.manage')) {
      return { success: false, error: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const idx = invitationsState.findIndex((inv) => inv.id === invitationId);
    if (idx === -1) {
      return { success: false, error: 'Invitation introuvable', code: 'NOT_FOUND' };
    }

    const current = invitationsState[idx];
    const updated: StoredInvitation = {
      ...current,
      status: 'revoked',
    };
    invitationsState[idx] = updated;

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'INVITATION_REVOKE' as any,
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
      justification: `Révocation de l'invitation pour ${updated.email}`,
      payload: {
        invitationId: updated.id,
        email: updated.email,
      },
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la révocation' };
  }
}

/**
 * Réinitialiser le store en mémoire pour les tests unitaires
 */
export async function __resetUserStoreForTests() {
  membersState = [...mockMemberships];
  invitationsState = [...mockInvitations];
}
