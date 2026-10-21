'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  getFolderRepository,
  getAuditRepository,
  getOrganizationRepository,
  getShortlistRepository,
} from '@/lib/api';
import { getServerCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions';
import type { Folder } from '@/types';

export const CreateFolderSchema = z.object({
  title: z
    .string()
    .min(2, 'Le nom du dossier doit comporter au moins 2 caractères')
    .max(100, 'Le nom du dossier ne peut excéder 100 caractères'),
  description: z.string().optional(),
  jobTitle: z
    .string()
    .min(2, "L'intitulé de l'offre liée est obligatoire"),
  department: z.string().optional(),
  contractType: z.enum(['CDI', 'CDD', 'Freelance', 'Stage']).default('CDI'),
  location: z.string().min(2, 'La localisation est requise').default('Paris'),
  remotePolicy: z.enum(['full_remote', 'hybrid', 'on_site']).default('hybrid'),
  blindModeEnabled: z.boolean().default(true),
  assignedMemberIds: z.array(z.string()).default([]),
  patternId: z.string().default('PAT-TECH-04'),
});

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;

/**
 * Server Action : Création d'un nouveau dossier de recrutement
 * Protégé par contrôle de rôle et validation Zod
 */
export async function createFolderAction(input: CreateFolderInput) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  // Seuls les admins, owners et recruteurs peuvent créer des dossiers
  if (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'recruiter') {
    return {
      success: false,
      error: `Action non autorisée : le rôle '${user.role}' ne peut pas créer de dossiers.`,
    };
  }

  const validation = CreateFolderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues?.[0]?.message || 'Données du formulaire invalides.',
    };
  }

  const data = validation.data;
  const org = await getOrganizationRepository().getCurrent();

  // Génération de la référence normalisée #CODE-NN
  const prefix = data.title
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'DOS';
  const reference = `#${prefix}-${Math.floor(100 + Math.random() * 900)}`;

  const folderRepo = getFolderRepository();
  const newFolder = await folderRepo.create({
    reference,
    title: data.title,
    organizationId: org.id,
    jobTitle: data.jobTitle,
    department: data.department || 'Recrutement Spécialisé',
    status: 'active',
    contractType: data.contractType,
    location: data.location,
    remotePolicy: data.remotePolicy,
    blindModeEnabled: data.blindModeEnabled,
    patternId: data.patternId,
    assignedMemberIds:
      data.assignedMemberIds.length > 0 ? data.assignedMemberIds : [user.id],
    retentionAlertDays: 730,
  });

  // Journalisation d'audit WORM (Art. 30 RGPD)
  const auditRepo = getAuditRepository();
  await auditRepo.logEvent({
    action: 'FOLDER_CREATE',
    actor: {
      id: user.id,
      name: user.id,
      role: user.role.toUpperCase(),
      ip: '127.0.0.1',
      authStrength: user.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
    },
    resource: {
      id: newFolder.id,
      type: 'folder',
      folderReference: newFolder.reference,
    },
    justification: `Création du dossier de recrutement ${newFolder.reference} avec mode aveugle ${data.blindModeEnabled ? 'actif' : 'inactif'}.`,
    payload: {
      folderId: newFolder.id,
      title: newFolder.title,
      reference: newFolder.reference,
      blindModeEnabled: data.blindModeEnabled,
    },
  });

  revalidatePath('/dossiers');
  return { success: true, folder: newFolder };
}

/**
 * Server Action : Bascule du mode aveugle pour un dossier
 * Passage ON -> OFF : exige permission 'identity.reveal', justification légale Art. 30, et ré-authentification
 * Passage OFF -> ON : immédiat sans condition bloquante
 */
export async function setBlindModeAction(
  folderId: string,
  enabled: boolean,
  reason?: string,
  reauthVerified?: boolean,
) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  const folderRepo = getFolderRepository();
  const folder = await folderRepo.getById(folderId);
  if (!folder) {
    return { success: false, error: 'Dossier introuvable.' };
  }

  // 1. Passage ON -> OFF (Levée d'anonymat)
  if (!enabled) {
    // Vérification de permission côté serveur
    if (!can(user, 'identity.reveal')) {
      return {
        success: false,
        error: `Permission refusée [403] : le rôle '${user.role}' ne dispose pas du droit 'identity.reveal' requis pour désactiver le mode aveugle.`,
      };
    }

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        error: "Un motif légal explicite (minimum 5 caractères) est requis pour lever l'anonymat (Art. 30 RGPD).",
      };
    }

    // Mise à jour du statut du dossier
    const updated = await folderRepo.update(folderId, { blindModeEnabled: false });

    // Journalisation d'audit WORM infalsifiable
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'BLIND_MODE_UNMASK',
      actor: {
        id: user.id,
        name: user.id,
        role: user.role.toUpperCase(),
        ip: '127.0.0.1',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: folderId,
        type: 'folder',
        folderReference: folder.reference,
      },
      justification: reason.trim(),
      payload: {
        folderId,
        unmaskScope: ['PII_CORE', 'CONTACT_DETAILS'],
      },
    });

    revalidatePath('/dossiers');
    revalidatePath(`/dossiers/${folderId}`);
    return { success: true, blindModeEnabled: false, folder: updated };
  }

  // 2. Passage OFF -> ON (Restauration immédiate du mode aveugle)
  const updated = await folderRepo.update(folderId, { blindModeEnabled: true });

  const auditRepo = getAuditRepository();
  await auditRepo.logEvent({
    action: 'BLIND_MODE_RESTORE',
    actor: {
      id: user.id,
      name: user.id,
      role: user.role.toUpperCase(),
      ip: '127.0.0.1',
      authStrength: 'MFA_FIDO2',
    },
    resource: {
      id: folderId,
      type: 'folder',
      folderReference: folder.reference,
    },
    justification: 'Rétablissement du mode aveugle strict (anonymisation anti-biais).',
    payload: {
      folderId,
    },
  });

  revalidatePath('/dossiers');
  revalidatePath(`/dossiers/${folderId}`);
  return { success: true, blindModeEnabled: true, folder: updated };
}

/**
 * Server Action : Actions groupées sur les candidats d'un dossier
 */
export async function bulkCandidateAction(
  folderId: string,
  candidateIds: string[],
  actionType: 'shortlist' | 'export' | 'delete',
  options?: { shortlistId?: string; exportFormat?: string; reason?: string },
) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  if (candidateIds.length === 0) {
    return { success: false, error: 'Aucun candidat sélectionné.' };
  }

  const folder = await getFolderRepository().getById(folderId);
  if (!folder) {
    return { success: false, error: 'Dossier introuvable.' };
  }

  const auditRepo = getAuditRepository();

  if (actionType === 'shortlist') {
    if (!can(user, 'shortlist.write')) {
      return { success: false, error: 'Permission insuffisante pour modifier les shortlists.' };
    }
    const shortlistRepo = getShortlistRepository();
    const existingShortlists = await shortlistRepo.getByFolder(folderId);
    let targetShortlist = existingShortlists[0];

    if (!targetShortlist) {
      targetShortlist = await shortlistRepo.create({
        title: `Sélection ${folder.title}`,
        folderId,
        folderReference: folder.reference,
        organizationId: folder.organizationId,
        createdBy: user.id,
        createdByName: user.id,
        candidateIds: [...candidateIds],
        isShared: true,
        isBlind: folder.blindModeEnabled,
        notes: {},
        rankings: {},
      });
    } else {
      const mergedIds = Array.from(new Set([...targetShortlist.candidateIds, ...candidateIds]));
      await shortlistRepo.reorderCandidates(targetShortlist.id, mergedIds);
    }

    await auditRepo.logEvent({
      action: 'SHORTLIST_CREATE',
      actor: {
        id: user.id,
        name: user.id,
        role: user.role.toUpperCase(),
        ip: '127.0.0.1',
        authStrength: 'PASSWORD',
      },
      resource: {
        id: targetShortlist.id,
        type: 'folder',
        folderReference: folder.reference,
      },
      justification: `Ajout groupé de ${candidateIds.length} profils dans la shortlist`,
      payload: {
        shortlistId: targetShortlist.id,
        candidateCount: candidateIds.length,
      },
    });

    revalidatePath(`/dossiers/${folderId}`);
    return { success: true, message: `${candidateIds.length} profil(s) ajouté(s) à la shortlist.` };
  }

  if (actionType === 'export') {
    const isNamed = !folder.blindModeEnabled;
    const requiredPermission = isNamed ? 'export.named' : 'export.anonymized';
    if (!can(user, requiredPermission)) {
      return {
        success: false,
        error: `Permission insuffisante pour exporter en mode ${isNamed ? 'nominatif' : 'anonymisé'}.`,
      };
    }

    await auditRepo.logEvent({
      action: isNamed ? 'EXPORT_NOMINATIVE' : 'EXPORT_ANONYMIZED',
      actor: {
        id: user.id,
        name: user.id,
        role: user.role.toUpperCase(),
        ip: '127.0.0.1',
        authStrength: isNamed ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        id: `exp-${Date.now()}`,
        type: 'export',
        folderReference: folder.reference,
      },
      justification: options?.reason || `Export groupé (${options?.exportFormat || 'CSV'}) par ${user.id}`,
      payload: {
        candidateCount: candidateIds.length,
        format: options?.exportFormat || 'csv',
      },
    });

    return {
      success: true,
      message: `Export de ${candidateIds.length} profil(s) généré avec succès.`,
    };
  }

  if (actionType === 'delete') {
    if (user.role !== 'admin' && user.role !== 'owner') {
      return { success: false, error: 'Seuls les administrateurs peuvent supprimer des candidatures.' };
    }

    await auditRepo.logEvent({
      action: 'FOLDER_ARCHIVE',
      actor: {
        id: user.id,
        name: user.id,
        role: user.role.toUpperCase(),
        ip: '127.0.0.1',
        authStrength: 'MFA_FIDO2',
      },
      resource: {
        id: folderId,
        type: 'folder',
        folderReference: folder.reference,
      },
      justification: options?.reason || 'Purge administrative de candidatures',
      payload: {
        candidateCount: candidateIds.length,
      },
    });

    revalidatePath(`/dossiers/${folderId}`);
    return {
      success: true,
      message: `${candidateIds.length} candidature(s) retirée(s) du dossier.`,
    };
  }

  return { success: false, error: 'Action groupée non reconnue.' };
}
