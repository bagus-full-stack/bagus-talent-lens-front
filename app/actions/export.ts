'use server';

import { can, type PermissionUser } from '@/lib/permissions';
import { getExportRepository, getAuditRepository } from '@/lib/api';
import {
  CreateExportInputSchema,
  type CreateExportInput,
  type Export,
  NOMINATIVE_REASON_LABELS,
} from '@/lib/schemas/export';
import { mockOrganization } from '@/lib/mock/data/organizations';

export interface CreateExportActionResult {
  success: boolean;
  export?: Export;
  downloadUrl?: string;
  error?: string;
  code?: 'FORBIDDEN' | 'CEILING_EXCEEDED' | 'REAUTH_REQUIRED' | 'JUSTIFICATION_REQUIRED' | 'VALIDATION_ERROR';
}

/**
 * Server Action pour la génération d'un export sécurisé TalentLens.
 * Exécute tous les contrôles de sécurité, RBAC, plafond et scellement WORM.
 */
export async function createExportAction(
  input: CreateExportInput,
  actor: { id: string; name: string; role: any; can_export?: boolean } = {
    id: 'usr_idriss_ouedraogo',
    name: 'Idriss Ouédraogo',
    role: 'recruiter',
    can_export: true,
  }
): Promise<CreateExportActionResult> {
  try {
    // 1. Validation de schéma Zod
    const parsed = CreateExportInputSchema.safeParse(input);
    if (!parsed.success) {
      const issueMsg =
        parsed.error.issues?.[0]?.message ||
        parsed.error.errors?.[0]?.message ||
        'Données d’export invalides';
      return {
        success: false,
        error: issueMsg,
        code: 'VALIDATION_ERROR',
      };
    }

    const data = parsed.data;
    const permUser: PermissionUser = {
      id: actor.id,
      role: actor.role,
      can_export: actor.can_export,
    };

    // 2. Contrôle du Plafond (200 max)
    if (data.candidateCount > 200) {
      return {
        success: false,
        error: `Plafond réglementaire dépassé : maximum 200 candidats autorisés par export (actuellement ${data.candidateCount}).`,
        code: 'CEILING_EXCEEDED',
      };
    }

    // 3. Contrôle des Permissions (RBAC)
    if (data.confidentiality === 'anonymized_strict') {
      if (!can(permUser, 'export.anonymized')) {
        return {
          success: false,
          error: "Permission manquante : votre rôle ne dispose pas de l'autorisation d'export anonymisé (export.anonymized).",
          code: 'FORBIDDEN',
        };
      }
      // Sécurité : coordonnées systématiquement désactivées en mode anonyme
      data.options.includeContact = false;
    } else if (data.confidentiality === 'nominative_justified') {
      // Pour l'export nominatif, permission export.named requise
      if (!can(permUser, 'export.named')) {
        return {
          success: false,
          error: "Habilitation manquante : l'export nominatif requiert la permission spéciale 'export.named'.",
          code: 'FORBIDDEN',
        };
      }

      // Motif et confirmation de la base légale obligatoires
      if (!data.nominativeJustification?.reasonCode) {
        return {
          success: false,
          error: "Motif obligatoire : un motif réglementaire codé doit être spécifié pour tout export nominatif.",
          code: 'JUSTIFICATION_REQUIRED',
        };
      }

      if (!data.nominativeJustification.legalBasisConfirmed) {
        return {
          success: false,
          error: "Base légale obligatoire : vous devez confirmer la conformité au titre de l'Art. 6 RGPD.",
          code: 'JUSTIFICATION_REQUIRED',
        };
      }

      if (!data.nominativeJustification.reauthVerified) {
        return {
          success: false,
          error: "Ré-authentification requise : veuillez valider votre identité (MFA/Mot de passe) avant la génération nominative.",
          code: 'REAUTH_REQUIRED',
        };
      }
    }

    // 4. Création dans le repository serveur
    const exportRepo = getExportRepository();
    const auditRepo = getAuditRepository();

    const folderRef = data.folderReference || '#DOS-2026';
    const folderTitle = data.folderTitle || 'Dossier de recrutement';
    const folderId = data.folderId || 'fld-de-2026';

    const reasonLabel = data.nominativeJustification?.reasonCode
      ? NOMINATIVE_REASON_LABELS[data.nominativeJustification.reasonCode]
      : 'Export standard anonymisé';

    const justificationText =
      data.confidentiality === 'nominative_justified'
        ? `[${data.nominativeJustification?.reasonCode}] ${reasonLabel} - ${data.nominativeJustification?.justificationText}`
        : 'Diffusion shortlist externe sous pseudonymisation stricte';

    const created = await (exportRepo as any).create({
      organizationId: mockOrganization.id,
      userId: actor.id,
      userName: actor.name,
      userRole: String(actor.role).toUpperCase(),
      folderId,
      folderReference: folderRef,
      folderTitle,
      shortlistId: data.shortlistId,
      title: data.title,
      format: data.format,
      confidentiality: data.confidentiality,
      candidateCount: data.candidateCount,
      fileSizeBytes: data.format === 'csv_table' ? 450000 : 2800000,
      justification: justificationText,
      reasonCode: data.nominativeJustification?.reasonCode,
      options: data.options,
    });

    // 5. Enregistrement immuable dans le journal d'audit WORM
    const auditAction =
      data.confidentiality === 'nominative_justified' ? 'EXPORT_NOMINATIVE' : 'EXPORT_ANONYMIZED';

    const auditEvent = await auditRepo.logEvent({
      action: auditAction as any,
      actor: {
        id: actor.id,
        name: actor.name,
        role: String(actor.role).toUpperCase(),
        ip: '192.168.1.100',
        authStrength: data.nominativeJustification?.reauthVerified ? 'MFA_FIDO2' : 'PASSWORD_HASHED',
      },
      resource: {
        id: created.id,
        type: 'export' as any,
        folderReference: folderRef,
      },
      justification: justificationText,
      payload: {
        format: data.format,
        candidateCount: data.candidateCount,
        confidentiality: data.confidentiality,
        reasonCode: data.nominativeJustification?.reasonCode,
        sha256Seal: created.sha256Hash,
        expiresAt: created.expiresAt,
      },
    });

    created.auditEventId = auditEvent.id;

    return {
      success: true,
      export: created,
      downloadUrl: created.downloadUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur inattendue lors de la génération de l’export',
    };
  }
}
