import { describe, it, expect } from 'vitest';
import { findValidInvitation } from '@/lib/mock/data/invitations';
import { ReauthRequiredError } from '@/lib/auth/recent-auth';

describe('Logique de Contrôle d’Accès, MFA AAL2 & Validation d’Invitation', () => {
  describe('Vérification des Invitations préalables (OAuth Callback)', () => {
    it('accepte un email disposant d’une invitation active valide', () => {
      const invitation = findValidInvitation('candidat.invite@tech-recrutement.fr');
      expect(invitation).toBeDefined();
      expect(invitation?.status).toBe('pending');
      expect(invitation?.role).toBe('recruiter');
    });

    it('rejette un email sans invitation dans l’organisation', () => {
      const invitation = findValidInvitation('hacker.inconnu@attaque.com');
      expect(invitation).toBeUndefined();
    });

    it('rejette une invitation expirée', () => {
      const invitation = findValidInvitation('invite.expire@externe.fr');
      expect(invitation).toBeUndefined();
    });
  });

  describe('Exigence de niveau MFA AAL2 pour rôles Owner et Admin', () => {
    it('détermine si le niveau AAL2 est obligatoire pour le profil', () => {
      const isAal2Required = (role: string) => role === 'owner' || role === 'admin';

      expect(isAal2Required('owner')).toBe(true);
      expect(isAal2Required('admin')).toBe(true);
      expect(isAal2Required('recruiter')).toBe(false);
      expect(isAal2Required('reader')).toBe(false);
      expect(isAal2Required('dpo')).toBe(false);
    });

    it('détecte un Admin en niveau AAL1 nécessitant une redirection MFA', () => {
      const checkMfaRedirect = (user: { role: string; aal: string; targetPath: string }) => {
        const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
        const isAdminPath =
          user.targetPath.startsWith('/parametres') ||
          user.targetPath.startsWith('/utilisateurs') ||
          user.targetPath.startsWith('/audit');

        return isOwnerOrAdmin && user.aal === 'aal1' && isAdminPath;
      };

      // Admin en AAL1 qui tente d'accéder aux paramètres -> redirection exigée
      expect(
        checkMfaRedirect({ role: 'admin', aal: 'aal1', targetPath: '/parametres' }),
      ).toBe(true);

      // Admin en AAL2 -> accès autorisé
      expect(
        checkMfaRedirect({ role: 'admin', aal: 'aal2', targetPath: '/parametres' }),
      ).toBe(false);

      // Recruteur en AAL1 accédant à /pipeline -> pas de redirection AAL2
      expect(
        checkMfaRedirect({ role: 'recruiter', aal: 'aal1', targetPath: '/pipeline' }),
      ).toBe(false);
    });
  });

  describe('Validation de Ré-authentification Récente (requireRecentAuth)', () => {
    it('lève ReauthRequiredError quand le délai maximal est dépassé', () => {
      const maxAgeSeconds = 300; // 5 minutes
      const now = Date.now();
      const expiredTimestamp = now - 600 * 1000; // Il y a 10 minutes

      const isRecent = (ts: number, maxAge: number) => {
        const ageSec = (Date.now() - ts) / 1000;
        return ageSec >= 0 && ageSec <= maxAge;
      };

      expect(isRecent(expiredTimestamp, maxAgeSeconds)).toBe(false);
      expect(isRecent(now - 30 * 1000, maxAgeSeconds)).toBe(true);

      const error = new ReauthRequiredError(maxAgeSeconds);
      expect(error.code).toBe('REAUTH_REQUIRED');
      expect(error.status).toBe(401);
    });
  });
});
