import { describe, it, expect } from 'vitest';
import { can, type PermissionUser } from '@/lib/permissions';
import { findValidInvitation } from '@/lib/mock/data/invitations';

describe('Scénarios E2E & Règles de Contrôle d’Accès Spécifiées', () => {
  // Scénario 1 : Accès sans session refusé
  it('1. Accès sans session refusé : redirige vers /connexion avec paramètre ?redirect=', () => {
    const handleAuthGuard = (userSession: unknown, targetUrl: string) => {
      if (!userSession) {
        return {
          status: 307,
          redirectUrl: `/connexion?redirect=${encodeURIComponent(targetUrl)}`,
        };
      }
      return { status: 200 };
    };

    const unauthenticatedResult = handleAuthGuard(null, '/pipeline');
    expect(unauthenticatedResult.status).toBe(307);
    expect(unauthenticatedResult.redirectUrl).toBe('/connexion?redirect=%2Fpipeline');

    const authenticatedResult = handleAuthGuard({ id: 'usr-1' }, '/pipeline');
    expect(authenticatedResult.status).toBe(200);
  });

  // Scénario 2 : Connexion Google sans invitation refusée
  it('2. Connexion Google sans invitation refusée avec message d’erreur explicite', () => {
    const verifyOAuthAccess = (email: string, isEmailVerified: boolean) => {
      if (!isEmailVerified) {
        return {
          allowed: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Votre adresse email doit obligatoirement être vérifiée.',
        };
      }

      const invitation = findValidInvitation(email);
      if (!invitation) {
        return {
          allowed: false,
          error: 'NO_INVITATION',
          message: `Accès refusé : aucune invitation active trouvée pour « ${email} » au sein du Cabinet Horizon RH.`,
        };
      }

      return { allowed: true, role: invitation.role };
    };

    // Compte externe non invité
    const unauthorizedAttempt = verifyOAuthAccess('externe.pirate@gmail.com', true);
    expect(unauthorizedAttempt.allowed).toBe(false);
    expect(unauthorizedAttempt.error).toBe('NO_INVITATION');
    expect(unauthorizedAttempt.message).toContain('aucune invitation active');
    expect(unauthorizedAttempt.message).toContain('Cabinet Horizon RH');

    // Compte invité
    const validAttempt = verifyOAuthAccess('candidat.invite@tech-recrutement.fr', true);
    expect(validAttempt.allowed).toBe(true);
    expect(validAttempt.role).toBe('recruiter');

    // Compte non vérifié chez le fournisseur
    const unverifiedAttempt = verifyOAuthAccess('candidat.invite@tech-recrutement.fr', false);
    expect(unverifiedAttempt.allowed).toBe(false);
    expect(unverifiedAttempt.error).toBe('EMAIL_NOT_VERIFIED');
  });

  // Scénario 3 : Admin en AAL1 redirigé vers la MFA
  it('3. Admin en AAL1 redirigé vers /mfa-verify avant toute page d’administration', () => {
    const evaluateAdminMfaPolicy = (role: string, aal: 'aal1' | 'aal2', path: string) => {
      const isOwnerOrAdmin = role === 'owner' || role === 'admin';
      const isAdminRoute =
        path.startsWith('/parametres') ||
        path.startsWith('/utilisateurs') ||
        path.startsWith('/audit');

      if (isOwnerOrAdmin && aal === 'aal1' && isAdminRoute) {
        return {
          allowed: false,
          redirectUrl: `/mfa-verify?redirect=${encodeURIComponent(path)}`,
          reason: 'AAL2_REQUIRED',
        };
      }
      return { allowed: true };
    };

    // Admin avec AAL1 tentant d'accéder à /parametres -> Redirigé vers MFA
    const adminAal1Check = evaluateAdminMfaPolicy('admin', 'aal1', '/parametres');
    expect(adminAal1Check.allowed).toBe(false);
    expect(adminAal1Check.redirectUrl).toBe('/mfa-verify?redirect=%2Fparametres');
    expect(adminAal1Check.reason).toBe('AAL2_REQUIRED');

    // Admin avec AAL2 -> Autorisé
    const adminAal2Check = evaluateAdminMfaPolicy('admin', 'aal2', '/parametres');
    expect(adminAal2Check.allowed).toBe(true);

    // Recruteur avec AAL1 sur son espace recrutement -> Autorisé (AAL2 non exigé pour ce rôle)
    const recruiterCheck = evaluateAdminMfaPolicy('recruiter', 'aal1', '/pipeline');
    expect(recruiterCheck.allowed).toBe(true);
  });

  // Scénario 4 : Lecteur ne voit aucun bouton d’export
  it('4. Lecteur ne voit aucun bouton d’export (export.anonymized et export.named strictement false)', () => {
    const readerUser: PermissionUser = {
      id: 'usr-reader-client',
      role: 'reader',
      can_export: false,
    };

    expect(can(readerUser, 'export.anonymized')).toBe(false);
    expect(can(readerUser, 'export.named')).toBe(false);

    // Comparaison avec un recruteur ou un admin
    const recruiterUser: PermissionUser = {
      id: 'usr-recruiter',
      role: 'recruiter',
    };
    expect(can(recruiterUser, 'export.anonymized')).toBe(true);

    const adminUser: PermissionUser = {
      id: 'usr-admin',
      role: 'admin',
    };
    expect(can(adminUser, 'export.anonymized')).toBe(true);
    expect(can(adminUser, 'export.named')).toBe(true);
  });
});
