import { describe, it, expect, beforeEach } from 'vitest';
import {
  changeUserRoleAction,
  toggleUserPermissionAction,
  resetUserMfaAction,
  revokeUserSessionsAction,
  removeUserMembershipAction,
  createInvitationAction,
  resendInvitationAction,
  revokeInvitationAction,
  __resetUserStoreForTests,
} from '@/app/actions/users';
import {
  can,
  getPermissionsMatrix,
  PERMISSION_ACTIONS_CONFIG,
  type PermissionAction,
} from '@/lib/permissions';

describe('Administration des Utilisateurs (/admin/utilisateurs)', () => {
  const adminActor = {
    id: 'usr_idriss_ouedraogo',
    name: 'Idriss Ouédraogo',
    role: 'admin' as const,
  };

  const recruiterActor = {
    id: 'usr_marc_lefebvre',
    name: 'Marc Lefebvre',
    role: 'recruiter' as const,
  };

  beforeEach(() => {
    __resetUserStoreForTests();
  });

  describe('1. Garde-fous serveur : Protection du dernier Owner & Auto-modification', () => {
    it('Refuse catégoriquement de retirer le dernier Owner de l’organisation', async () => {
      // Dans le mock, 'usr_eleonore_chen' est le seul owner
      const res = await removeUserMembershipAction('usr_eleonore_chen', adminActor);

      expect(res.success).toBe(false);
      expect(res.code).toBe('LAST_OWNER_PROTECTION');
      expect(res.error).toContain('dernier Propriétaire');
    });

    it('Refuse de rétrograder le dernier Owner vers un autre rôle', async () => {
      const res = await changeUserRoleAction('usr_eleonore_chen', 'admin', adminActor);

      expect(res.success).toBe(false);
      expect(res.code).toBe('LAST_OWNER_PROTECTION');
      expect(res.error).toContain('au moins un Propriétaire');
    });

    it('Refuse qu’un utilisateur modifie son propre rôle', async () => {
      const res = await changeUserRoleAction(
        adminActor.id,
        'recruiter',
        adminActor
      );

      expect(res.success).toBe(false);
      expect(res.code).toBe('SELF_MODIFICATION_REFUSED');
      expect(res.error).toContain('propre rôle');
    });

    it('Refuse qu’un utilisateur se retire lui-même de l’organisation', async () => {
      const res = await removeUserMembershipAction(adminActor.id, adminActor);

      expect(res.success).toBe(false);
      expect(res.code).toBe('SELF_MODIFICATION_REFUSED');
      expect(res.error).toContain('vous-même');
    });

    it('Refuse toute action d’administration pour un utilisateur non autorisé (ex: recruiter)', async () => {
      const res = await changeUserRoleAction(
        'usr_marc_lefebvre',
        'admin',
        recruiterActor
      );

      expect(res.success).toBe(false);
      expect(res.code).toBe('FORBIDDEN');
    });

    it('Autorise le retrait d’un membre standard (non-owner) et mentionne la révocation immédiate', async () => {
      const res = await removeUserMembershipAction('usr_marc_lefebvre', adminActor);

      expect(res.success).toBe(true);
      expect(res.data?.removedUserId).toBe('usr_marc_lefebvre');
    });

    it('Autorise le retrait d’un Owner s’il reste au moins un autre Owner actif', async () => {
      // 1. Promouvoir un autre membre au rôle Owner
      const promoteRes = await changeUserRoleAction(
        'usr_severine_petit',
        'owner',
        adminActor
      );
      expect(promoteRes.success).toBe(true);

      // 2. Maintenant qu’il y a 2 Owners, retirer Éléonore Chen est autorisé
      const removeRes = await removeUserMembershipAction('usr_eleonore_chen', adminActor);
      expect(removeRes.success).toBe(true);
    });
  });

  describe('2. Mise à jour des permissions fines et sécurité MFA', () => {
    it('Bascule la permission can_reveal_identity d’un membre', async () => {
      const targetUserId = 'usr_marc_lefebvre';

      const res = await toggleUserPermissionAction(
        targetUserId,
        'can_reveal_identity',
        adminActor
      );

      expect(res.success).toBe(true);
      expect(res.data?.can_reveal_identity).toBe(true);

      // Deuxième bascule -> false
      const res2 = await toggleUserPermissionAction(
        targetUserId,
        'can_reveal_identity',
        adminActor
      );
      expect(res2.success).toBe(true);
      expect(res2.data?.can_reveal_identity).toBe(false);
    });

    it('Bascule la permission can_export d’un membre', async () => {
      const targetUserId = 'usr_marc_lefebvre';

      const res = await toggleUserPermissionAction(
        targetUserId,
        'can_export',
        adminActor
      );

      expect(res.success).toBe(true);
      expect(res.data?.can_export).toBe(true);
    });

    it('Réinitialise la MFA d’un utilisateur', async () => {
      const targetUserId = 'usr_severine_petit'; // avait mfaEnabled: true

      const res = await resetUserMfaAction(targetUserId, adminActor);

      expect(res.success).toBe(true);
      expect(res.data?.mfaEnabled).toBe(false);
      expect(res.data?.aal).toBe('aal1');
    });

    it('Révoque immédiatement toutes les sessions actives d’un membre', async () => {
      const res = await revokeUserSessionsAction('usr_marc_lefebvre', adminActor);

      expect(res.success).toBe(true);
      expect(res.data?.revokedAt).toBeDefined();
    });
  });

  describe('3. Gestion des invitations et cycle de vie', () => {
    it('Crée une nouvelle invitation avec expiration à 7 jours', async () => {
      const res = await createInvitationAction(
        {
          email: 'future.recruteuse@horizon-rh.fr',
          role: 'recruiter',
          can_reveal_identity: false,
          can_export: true,
        },
        adminActor
      );

      expect(res.success).toBe(true);
      expect(res.data?.email).toBe('future.recruteuse@horizon-rh.fr');
      expect(res.data?.role).toBe('recruiter');
      expect(res.data?.status).toBe('pending');

      const expiresDate = new Date(res.data!.expiresAt);
      const diffDays = Math.round((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
    });

    it('Prolonge une invitation existante de 7 jours via resendInvitationAction', async () => {
      const res = await resendInvitationAction('inv-1001-1111-2222-333344445555', adminActor);

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('pending');
      const diffDays = Math.round((new Date(res.data!.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(6);
    });

    it('Révoque une invitation via revokeInvitationAction', async () => {
      const res = await revokeInvitationAction('inv-1001-1111-2222-333344445555', adminActor);

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('revoked');
    });
  });

  describe('4. Génération de la matrice Rôles × Permissions depuis la source unique', () => {
    it('Génère l’intégralité des 13 actions documentées dans /lib/permissions', () => {
      const matrix = getPermissionsMatrix();
      const expectedActions = Object.keys(PERMISSION_ACTIONS_CONFIG) as PermissionAction[];

      expect(matrix.length).toBe(13);
      expectedActions.forEach((act) => {
        expect(matrix.some((m) => m.action === act)).toBe(true);
      });
    });

    it('Vérifie que la matrice est en parfaite cohérence avec la fonction can()', () => {
      const matrix = getPermissionsMatrix();

      matrix.forEach((row) => {
        // Owner : doit toujours être granted
        expect(row.roles.owner).toBe('granted');
        expect(can({ id: 't', role: 'owner' }, row.action)).toBe(true);

        // Admin : doit toujours être granted
        expect(row.roles.admin).toBe('granted');
        expect(can({ id: 't', role: 'admin' }, row.action)).toBe(true);

        // Reader : interdiction absolue sur tous les exports
        if (row.action === 'export.anonymized' || row.action === 'export.named') {
          expect(row.roles.reader).toBe('forbidden');
          expect(can({ id: 't', role: 'reader' }, row.action)).toBe(false);
          expect(can({ id: 't', role: 'reader', can_export: true }, row.action)).toBe(false);
        }

        // Recruiter : conditionnel sur export.named et identity.reveal
        if (row.action === 'export.named') {
          expect(row.roles.recruiter).toBe('conditional');
          expect(can({ id: 't', role: 'recruiter', can_export: false }, row.action)).toBe(false);
          expect(can({ id: 't', role: 'recruiter', can_export: true }, row.action)).toBe(true);
        }
        if (row.action === 'identity.reveal') {
          expect(row.roles.recruiter).toBe('conditional');
          expect(can({ id: 't', role: 'recruiter', can_reveal_identity: false }, row.action)).toBe(false);
          expect(can({ id: 't', role: 'recruiter', can_reveal_identity: true }, row.action)).toBe(true);
        }

        // Recruiter : refus sur rgpd.manage, audit.read, settings.write, users.manage
        if (
          row.action === 'rgpd.manage' ||
          row.action === 'audit.read' ||
          row.action === 'settings.write' ||
          row.action === 'users.manage'
        ) {
          expect(row.roles.recruiter).toBe('forbidden');
          expect(can({ id: 't', role: 'recruiter' }, row.action)).toBe(false);
        }
      });
    });
  });
});
