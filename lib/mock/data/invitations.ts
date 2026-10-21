import { createHash } from 'crypto';
import type { Invitation, Role } from '@/types';
import { mockOrganization, mockMemberships } from './organizations';

export interface StoredInvitation extends Invitation {
  tokenHash: string;
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export const mockInvitations: StoredInvitation[] = [
  {
    id: 'inv-admin-0001-1111-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'nouvel.admin@horizon-rh.fr',
    role: 'admin',
    status: 'pending',
    invitedBy: 'usr_idriss_ouedraogo',
    invitedByName: 'Idriss Ouédraogo',
    token: 'tok_valid_invitation_admin',
    tokenHash: hashInvitationToken('tok_valid_invitation_admin'),
    can_reveal_identity: true,
    can_export: true,
    createdAt: '2026-10-02T10:00:00Z',
    expiresAt: '2027-10-16T10:00:00Z',
  },
  {
    id: 'inv-1001-1111-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'candidat.invite@tech-recrutement.fr',
    role: 'recruiter',
    status: 'pending',
    invitedBy: 'usr_idriss_ouedraogo',
    invitedByName: 'Idriss Ouédraogo',
    token: 'tok_valid_invitation_recruiter',
    tokenHash: hashInvitationToken('tok_valid_invitation_recruiter'),
    can_reveal_identity: false,
    can_export: false,
    createdAt: '2026-10-01T10:00:00Z',
    expiresAt: '2027-10-15T10:00:00Z',
  },
  {
    id: 'inv-1002-1111-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'nouveau.collaborateur@horizon-rh.fr',
    role: 'recruiter',
    status: 'pending',
    invitedBy: 'usr_idriss_ouedraogo',
    invitedByName: 'Idriss Ouédraogo',
    token: 'tok_valid_invitation_collaborateur',
    tokenHash: hashInvitationToken('tok_valid_invitation_collaborateur'),
    can_reveal_identity: false,
    can_export: false,
    createdAt: '2026-10-02T08:00:00Z',
    expiresAt: '2027-10-16T08:00:00Z',
  },
  {
    id: 'inv-1003-1111-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'contact.client@entreprise-partenaire.fr',
    role: 'reader',
    status: 'pending',
    invitedBy: 'usr_eleonore_chen',
    invitedByName: 'Éléonore Chen',
    token: 'tok_valid_invitation_client',
    tokenHash: hashInvitationToken('tok_valid_invitation_client'),
    can_reveal_identity: false,
    can_export: false,
    createdAt: '2026-10-02T11:00:00Z',
    expiresAt: '2027-10-16T11:00:00Z',
  },
  {
    id: 'inv-expired-0001-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'invite.expire@externe.fr',
    role: 'reader',
    status: 'expired',
    invitedBy: 'usr_eleonore_chen',
    invitedByName: 'Éléonore Chen',
    token: 'tok_expired_invitation',
    tokenHash: hashInvitationToken('tok_expired_invitation'),
    can_reveal_identity: false,
    can_export: false,
    createdAt: '2026-09-01T10:00:00Z',
    expiresAt: '2026-09-08T10:00:00Z', // Déjà expirée
  },
  {
    id: 'inv-used-0001-2222-333344445555',
    organizationId: mockOrganization.id,
    email: 'deja.inscrit@horizon-rh.fr',
    role: 'recruiter',
    status: 'accepted',
    invitedBy: 'usr_idriss_ouedraogo',
    invitedByName: 'Idriss Ouédraogo',
    token: 'tok_used_invitation',
    tokenHash: hashInvitationToken('tok_used_invitation'),
    can_reveal_identity: false,
    can_export: false,
    createdAt: '2026-09-15T10:00:00Z',
    expiresAt: '2026-10-15T10:00:00Z',
  },
];

export interface SafeInvitationDetails {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: Role;
  roleLabel: string;
  invitedByName: string;
  expiresAt: string;
  can_reveal_identity: boolean;
  can_export: boolean;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export type InvitationResolutionStatus =
  | 'valid'
  | 'expired'
  | 'already_used'
  | 'not_found';

export interface ResolveInvitationResult {
  status: InvitationResolutionStatus;
  invitation?: SafeInvitationDetails;
  errorMessage?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Propriétaire (Associé Gérant)',
  admin: 'Administrateur',
  recruiter: 'Recruteur / Talent Partner',
  reader: 'Lecteur / Client Partenaire',
  viewer: 'Observateur',
  dpo: 'Délégué à la Protection des Données (DPO)',
};

/**
 * Résout un jeton d'invitation (haché en base de données ou comparaison directe)
 */
export function resolveInvitationByToken(rawToken: string): ResolveInvitationResult {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      status: 'not_found',
      errorMessage: 'Jeton d’invitation manquant ou format incorrect.',
    };
  }

  const cleanToken = rawToken.trim();
  const tokenHash = hashInvitationToken(cleanToken);

  // Recherche par hachage SHA-256 ou jeton direct
  const match = mockInvitations.find(
    (inv) => inv.token === cleanToken || inv.tokenHash === tokenHash || inv.tokenHash === cleanToken,
  );

  if (!match) {
    return {
      status: 'not_found',
      errorMessage: 'Ce lien d’invitation est introuvable ou a été révoqué.',
    };
  }

  const safeDetails: SafeInvitationDetails = {
    id: match.id,
    organizationId: match.organizationId,
    organizationName: mockOrganization.name,
    email: match.email,
    role: match.role,
    roleLabel: ROLE_LABELS[match.role] || match.role,
    invitedByName: match.invitedByName,
    expiresAt: match.expiresAt,
    can_reveal_identity: match.can_reveal_identity,
    can_export: match.can_export,
    status: match.status,
  };

  // Statut : déjà utilisée
  if (match.status === 'accepted') {
    return {
      status: 'already_used',
      invitation: safeDetails,
      errorMessage: 'Cette invitation a déjà été acceptée et le compte associé est actif.',
    };
  }

  // Statut : révoquée ou expirée
  const isDateExpired = new Date(match.expiresAt).getTime() < Date.now();
  if (match.status === 'expired' || match.status === 'revoked' || isDateExpired) {
    return {
      status: 'expired',
      invitation: safeDetails,
      errorMessage: 'Cette invitation est expirée. Veuillez contacter votre administrateur.',
    };
  }

  return {
    status: 'valid',
    invitation: safeDetails,
  };
}

/**
 * Valide et accepte l'invitation, enregistre l'utilisateur dans les membres
 */
export function markInvitationAccepted(
  tokenOrId: string,
  options?: {
    fullName?: string;
    authMethod?: 'google' | 'linkedin' | 'password';
    mfaEnrolled?: boolean;
  },
) {
  const tokenHash = hashInvitationToken(tokenOrId.trim());
  const invitation = mockInvitations.find(
    (inv) => inv.id === tokenOrId || inv.token === tokenOrId || inv.tokenHash === tokenHash,
  );

  if (!invitation) {
    throw new Error('Invitation introuvable');
  }

  invitation.status = 'accepted';

  // Vérifier si le membre existe déjà
  const existingMember = mockMemberships.find(
    (m) => m.email.toLowerCase() === invitation.email.toLowerCase(),
  );

  const authMethod = options?.authMethod || 'password';
  const mfaEnabled = options?.mfaEnrolled ?? (invitation.role === 'admin' || invitation.role === 'owner');
  const aal: 'aal1' | 'aal2' = mfaEnabled ? 'aal2' : 'aal1';
  const nameParts = invitation.email.split('@')[0].split('.');
  const defaultName = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  if (existingMember) {
    existingMember.role = invitation.role;
    existingMember.status = 'active';
    existingMember.mfaEnabled = mfaEnabled;
    existingMember.aal = aal;
    existingMember.can_reveal_identity = invitation.can_reveal_identity;
    existingMember.can_export = invitation.can_export;
    return existingMember;
  }

  const newMember = {
    id: `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: invitation.organizationId,
    userId: `usr_${invitation.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    role: invitation.role,
    fullName: options?.fullName || defaultName,
    email: invitation.email,
    mfaEnabled,
    aal,
    authMethod,
    can_reveal_identity: invitation.can_reveal_identity,
    can_export: invitation.can_export,
    permissions: {
      canLiftBlindMode: invitation.can_reveal_identity,
      canExportNominative: invitation.can_export,
      canAuditDsr: invitation.role === 'admin' || invitation.role === 'owner' || invitation.role === 'dpo',
      canConfigurePatterns: invitation.role === 'admin' || invitation.role === 'owner',
    },
    lastActiveAt: 'À l’instant',
    status: 'active' as const,
  };

  mockMemberships.push(newMember);
  return newMember;
}

/**
 * Vérifie si un email dispose d'une invitation valide et active pour l'organisation
 */
export function findValidInvitation(email: string, organizationId?: string): Invitation | undefined {
  const normalized = email.trim().toLowerCase();
  return mockInvitations.find(
    (inv) =>
      inv.email.toLowerCase() === normalized &&
      inv.status === 'pending' &&
      new Date(inv.expiresAt).getTime() > Date.now() &&
      (!organizationId || inv.organizationId === organizationId),
  );
}
