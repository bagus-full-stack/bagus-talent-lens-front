import { describe, it, expect } from 'vitest';
import { can, requirePermission, ForbiddenError, getPermissionDeniedReason, type PermissionAction, type PermissionUser } from '@/lib/permissions';

describe('Table de Vérité des Permissions RBAC · Matrice Complète Rôle × Action', () => {
  const allActions: PermissionAction[] = [
    'import',
    'search',
    'match',
    'chat',
    'pipeline.write',
    'shortlist.write',
    'export.anonymized',
    'export.named',
    'identity.reveal',
    'rgpd.manage',
    'audit.read',
    'settings.write',
    'users.manage',
  ];

  it('Owner et Admin disposent de l’accès complet à toutes les actions', () => {
    const ownerUser: PermissionUser = { id: 'usr-owner', role: 'owner' };
    const adminUser: PermissionUser = { id: 'usr-admin', role: 'admin' };

    allActions.forEach((action) => {
      expect(can(ownerUser, action)).toBe(true);
      expect(can(adminUser, action)).toBe(true);
      expect(() => requirePermission(action, ownerUser)).not.toThrow();
      expect(() => requirePermission(action, adminUser)).not.toThrow();
    });
  });

  it('Recruteur : accès aux opérations de sourcing et d’évaluation, mais restreint sur la gouvernance', () => {
    const recruiterUser: PermissionUser = {
      id: 'usr-recruiter',
      role: 'recruiter',
      can_reveal_identity: false,
      can_export: false,
    };

    // Actions autorisées
    expect(can(recruiterUser, 'import')).toBe(true);
    expect(can(recruiterUser, 'search')).toBe(true);
    expect(can(recruiterUser, 'match')).toBe(true);
    expect(can(recruiterUser, 'chat')).toBe(true);
    expect(can(recruiterUser, 'pipeline.write')).toBe(true);
    expect(can(recruiterUser, 'shortlist.write')).toBe(true);
    expect(can(recruiterUser, 'export.anonymized')).toBe(true);

    // Actions interdites par défaut
    expect(can(recruiterUser, 'export.named')).toBe(false);
    expect(can(recruiterUser, 'identity.reveal')).toBe(false);
    expect(can(recruiterUser, 'rgpd.manage')).toBe(false);
    expect(can(recruiterUser, 'audit.read')).toBe(false);
    expect(can(recruiterUser, 'settings.write')).toBe(false);
    expect(can(recruiterUser, 'users.manage')).toBe(false);

    // Le garde serveur lève ForbiddenError
    expect(() => requirePermission('users.manage', recruiterUser)).toThrow(ForbiddenError);
    expect(() => requirePermission('identity.reveal', recruiterUser)).toThrow(ForbiddenError);
  });

  it('Recruteur avec permissions fines explicites (can_reveal_identity & can_export)', () => {
    const elevatedRecruiter: PermissionUser = {
      id: 'usr-recruiter-elevated',
      role: 'recruiter',
      can_reveal_identity: true,
      can_export: true,
    };

    expect(can(elevatedRecruiter, 'identity.reveal')).toBe(true);
    expect(can(elevatedRecruiter, 'export.named')).toBe(true);
    // Mais toujours interdit sur la gouvernance globale
    expect(can(elevatedRecruiter, 'users.manage')).toBe(false);
    expect(can(elevatedRecruiter, 'rgpd.manage')).toBe(false);
  });

  it('DPO : habilité sur l’audit WORM, le registre RGPD et l’export légal, mais restreint sur le recrutement', () => {
    const dpoUser: PermissionUser = { id: 'usr-dpo', role: 'dpo' };

    expect(can(dpoUser, 'audit.read')).toBe(true);
    expect(can(dpoUser, 'rgpd.manage')).toBe(true);
    expect(can(dpoUser, 'export.anonymized')).toBe(true);
    expect(can(dpoUser, 'export.named')).toBe(true); // Export légal certifié
    expect(can(dpoUser, 'search')).toBe(true);

    // Interdit de recruter ou modifier les pipelines opérationnels
    expect(can(dpoUser, 'import')).toBe(false);
    expect(can(dpoUser, 'match')).toBe(false);
    expect(can(dpoUser, 'pipeline.write')).toBe(false);
    expect(can(dpoUser, 'shortlist.write')).toBe(false);
    expect(can(dpoUser, 'identity.reveal')).toBe(false);
    expect(can(dpoUser, 'users.manage')).toBe(false);
  });

  it('Lecteur / Observateur : consultation seule et AUCUN droit d’export (Règle stricte)', () => {
    const readerUser: PermissionUser = { id: 'usr-reader', role: 'reader' };

    // Seule la consultation (search) est permise
    expect(can(readerUser, 'search')).toBe(true);

    // Strictement aucun export
    expect(can(readerUser, 'export.anonymized')).toBe(false);
    expect(can(readerUser, 'export.named')).toBe(false);

    // Strictement aucune action modificatrice
    expect(can(readerUser, 'import')).toBe(false);
    expect(can(readerUser, 'match')).toBe(false);
    expect(can(readerUser, 'pipeline.write')).toBe(false);
    expect(can(readerUser, 'shortlist.write')).toBe(false);
    expect(can(readerUser, 'identity.reveal')).toBe(false);
    expect(can(readerUser, 'rgpd.manage')).toBe(false);
    expect(can(readerUser, 'audit.read')).toBe(false);
    expect(can(readerUser, 'settings.write')).toBe(false);
    expect(can(readerUser, 'users.manage')).toBe(false);

    expect(() => requirePermission('export.anonymized', readerUser)).toThrow(ForbiddenError);
  });

  it('Utilisateur anonyme ou non connecté : tout refusé', () => {
    allActions.forEach((action) => {
      expect(can(null, action)).toBe(false);
      expect(can(undefined, action)).toBe(false);
      expect(() => requirePermission(action, null)).toThrow(ForbiddenError);
    });
  });

  it('Fournit des explications pédagogiques claires en français', () => {
    const readerReason = getPermissionDeniedReason('reader', 'export.anonymized');
    expect(readerReason).toContain('Lecteur');
    expect(readerReason).toContain('exporter');

    const unmaskReason = getPermissionDeniedReason('recruiter', 'identity.reveal');
    expect(unmaskReason).toContain('mode aveugle');
    expect(unmaskReason).toContain('Art. 30 RGPD');

    const dpoReason = getPermissionDeniedReason('recruiter', 'rgpd.manage');
    expect(dpoReason).toContain('DPO');
  });
});
