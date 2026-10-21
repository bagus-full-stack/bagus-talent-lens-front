import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashInvitationToken,
  resolveInvitationByToken,
  markInvitationAccepted,
  mockInvitations,
} from '@/lib/mock/data/invitations';
import { ROLE_PERMISSIONS } from '@/lib/permissions/rbac';
import { PasswordPolicySchema } from '@/app/invitation/[token]/actions';

describe('Parcours d’invitation /invitation/[token] & Sécurité RBAC', () => {
  const adminToken = 'tok_valid_invitation_admin';
  const recruiterToken = 'tok_valid_invitation_recruiter';
  const expiredToken = 'tok_expired_invitation';
  const usedToken = 'tok_used_invitation';

  it('1. Hachage cryptographique SHA-256 des jetons d’invitation', () => {
    const hash1 = hashInvitationToken(adminToken);
    const hash2 = hashInvitationToken(adminToken);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).not.toBe(adminToken);
  });

  it('2. Résolution d’un jeton valide (Admin) avec permissions associées', () => {
    const res = resolveInvitationByToken(adminToken);
    expect(res.status).toBe('valid');
    expect(res.invitation).toBeDefined();
    expect(res.invitation?.role).toBe('admin');
    expect(res.invitation?.email).toBe('nouvel.admin@horizon-rh.fr');
    expect(res.invitation?.can_reveal_identity).toBe(true);
    expect(res.invitation?.can_export).toBe(true);

    // Vérifier les permissions du rôle Admin
    const perms = ROLE_PERMISSIONS.admin;
    expect(perms.canExecuteUnmask).toBe(true);
    expect(perms.canExportNominative).toBe(true);
    expect(perms.canManageTeam).toBe(true);
  });

  it('3. Résolution d’un jeton valide (Recruteur) avec restrictions de sécurité', () => {
    const res = resolveInvitationByToken(recruiterToken);
    expect(res.status).toBe('valid');
    expect(res.invitation?.role).toBe('recruiter');
    expect(res.invitation?.email).toBe('candidat.invite@tech-recrutement.fr');
    expect(res.invitation?.can_reveal_identity).toBe(false);
    expect(res.invitation?.can_export).toBe(false);

    // Vérifier les restrictions de sécurité pour Recruteur
    const perms = ROLE_PERMISSIONS.recruiter;
    expect(perms.canExecuteUnmask).toBe(false);
    expect(perms.canExportNominative).toBe(false);
  });

  it('4. Rejet et détection d’un jeton expiré', () => {
    const res = resolveInvitationByToken(expiredToken);
    expect(res.status).toBe('expired');
    expect(res.errorMessage).toContain('expirée');
  });

  it('5. Rejet et détection d’un jeton déjà utilisé', () => {
    const res = resolveInvitationByToken(usedToken);
    expect(res.status).toBe('already_used');
    expect(res.errorMessage).toContain('déjà été acceptée');
  });

  it('6. Rejet d’un jeton inconnu ou falsifié', () => {
    const res = resolveInvitationByToken('tok_inconnu_ou_falsifie_123');
    expect(res.status).toBe('not_found');
  });

  it('7. Validation de la politique de robustesse des mots de passe (Zod)', () => {
    // Trop court (<12)
    expect(PasswordPolicySchema.safeParse('Abc1!').success).toBe(false);

    // Sans majuscule
    expect(PasswordPolicySchema.safeParse('motdepasse123!').success).toBe(false);

    // Sans chiffre
    expect(PasswordPolicySchema.safeParse('MotDePasseSecret!').success).toBe(false);

    // Sans caractère spécial
    expect(PasswordPolicySchema.safeParse('MotDePasse12345').success).toBe(false);

    // Conforme : 12+ chars, maj, min, chiffre, spécial
    const validPass = 'TalentLens#2026Secure!';
    expect(PasswordPolicySchema.safeParse(validPass).success).toBe(true);
  });

  it('8. Finalisation de l’invitation et rattachement aux membres de l’organisation', () => {
    const member = markInvitationAccepted(adminToken, {
      fullName: 'Nouveau Membre Admin',
      authMethod: 'password',
      mfaEnrolled: true,
    });

    expect(member).toBeDefined();
    expect(member.role).toBe('admin');
    expect(member.mfaEnabled).toBe(true);
    expect(member.aal).toBe('aal2');
    expect(member.can_reveal_identity).toBe(true);
    expect(member.can_export).toBe(true);

    // Le jeton doit désormais être marqué comme 'accepted'
    const checkAfter = resolveInvitationByToken(adminToken);
    expect(checkAfter.status).toBe('already_used');
  });
});
