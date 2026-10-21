'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPatternRepository, getAuditRepository } from '@/lib/api';
import { getServerCurrentUser } from '@/lib/auth/session';
import {
  PatternFieldSchema,
  DEFAULT_SOCLE_FIELDS,
  estimateReExtractionCost,
  type PatternField,
} from '@/lib/schemas/pattern';

const CreatePatternSchema = z.object({
  name: z.string().min(3, 'Le nom doit comporter au moins 3 caractères (ex: Profils Cybersécurité).'),
  category: z.enum(['Tech', 'Commercial', 'Management', 'Support', 'Finance']),
  description: z.string().min(5, 'La description doit comporter au moins 5 caractères.'),
});

export async function createPatternAction(rawData: {
  name: string;
  category: 'Tech' | 'Commercial' | 'Management' | 'Support' | 'Finance';
  description: string;
}) {
  try {
    const user = await getServerCurrentUser();
    const validated = CreatePatternSchema.parse(rawData);
    const patternRepo = getPatternRepository();

    const created = await patternRepo.create({
      name: validated.name,
      category: validated.category,
      description: validated.description,
      fields: [...DEFAULT_SOCLE_FIELDS],
    });

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'PATTERN_VERSION_PUBLISH',
      actor: {
        id: user?.id || 'usr-system',
        name: user?.id || 'Administrateur',
        role: (user?.role || 'ADMIN').toUpperCase(),
        ip: '127.0.0.1',
        authStrength: user?.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        type: 'pattern',
        id: created.id,
      },
      justification: `Création du pattern d'extraction ${created.name} (${created.category}).`,
      payload: {
        action: 'pattern_create',
        patternId: created.id,
        name: created.name,
        fieldsCount: created.totalFields,
      },
    });

    revalidatePath('/patterns');
    return { success: true, pattern: created };
  } catch (error: any) {
    const msg = error instanceof z.ZodError ? error.issues?.[0]?.message : error.message || 'Erreur lors de la création du pattern.';
    return {
      success: false,
      error: msg,
    };
  }
}

export async function duplicatePatternAction(patternId: string, newName?: string) {
  try {
    const user = await getServerCurrentUser();
    const patternRepo = getPatternRepository();
    const duplicated = await patternRepo.duplicate(patternId, newName);

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'PATTERN_VERSION_PUBLISH',
      actor: {
        id: user?.id || 'usr-system',
        name: user?.id || 'Administrateur',
        role: (user?.role || 'ADMIN').toUpperCase(),
        ip: '127.0.0.1',
        authStrength: user?.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        type: 'pattern',
        id: duplicated.id,
      },
      justification: `Duplication du pattern source ${patternId} vers ${duplicated.id}.`,
      payload: {
        sourceId: patternId,
        newId: duplicated.id,
        newName: duplicated.name,
      },
    });

    revalidatePath('/patterns');
    return { success: true, pattern: duplicated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la duplication du pattern.',
    };
  }
}

export async function archivePatternAction(patternId: string) {
  try {
    const user = await getServerCurrentUser();
    const patternRepo = getPatternRepository();
    const archived = await patternRepo.archive(patternId);
    if (!archived) throw new Error('Pattern introuvable.');

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'PATTERN_VERSION_PUBLISH',
      actor: {
        id: user?.id || 'usr-system',
        name: user?.id || 'Administrateur',
        role: (user?.role || 'ADMIN').toUpperCase(),
        ip: '127.0.0.1',
        authStrength: user?.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        type: 'pattern',
        id: patternId,
      },
      justification: `Archivage réglementaire du pattern d'extraction ${patternId}.`,
      payload: {
        patternId,
        status: 'archived',
      },
    });

    revalidatePath('/patterns');
    return { success: true, pattern: archived };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erreur lors de l'archivage du pattern.",
    };
  }
}

export async function savePatternDraftAction(patternId: string, fields: PatternField[]) {
  try {
    const patternRepo = getPatternRepository();
    const pattern = await patternRepo.getById(patternId);
    if (!pattern) throw new Error('Pattern introuvable');

    // Validation Zod de chaque champ
    for (const f of fields) {
      PatternFieldSchema.parse(f);
    }

    // Vérification de l'unicité des clés
    const keys = fields.map((f) => f.key.trim().toLowerCase());
    if (new Set(keys).size !== keys.length) {
      throw new Error('Chaque champ doit posséder un nom technique unique.');
    }

    // Vérification que les champs du socle verrouillés n'ont pas été supprimés
    for (const socle of DEFAULT_SOCLE_FIELDS) {
      if (!fields.some((f) => f.key === socle.key)) {
        throw new Error(`Le champ verrouillé du socle normalisé « ${socle.label} » ne peut pas être supprimé.`);
      }
    }

    const draft = await patternRepo.saveDraft(patternId, fields);
    revalidatePath(`/patterns/${patternId}`);
    return { success: true, version: draft };
  } catch (error: any) {
    const msg = error instanceof z.ZodError ? error.issues?.[0]?.message : error.message || 'Erreur lors de la sauvegarde du brouillon.';
    return {
      success: false,
      error: msg,
    };
  }
}

export async function publishPatternVersionAction(
  patternId: string,
  fields: PatternField[],
  options?: { reExtractExisting?: boolean },
) {
  try {
    const user = await getServerCurrentUser();
    const patternRepo = getPatternRepository();

    // Validation de l'intégrité des champs
    for (const f of fields) {
      PatternFieldSchema.parse(f);
    }

    // Vérification de l'unicité des clés
    const keys = fields.map((f) => f.key.trim().toLowerCase());
    if (new Set(keys).size !== keys.length) {
      throw new Error('Chaque champ doit posséder un nom technique (slug) unique.');
    }

    // Vérification que les champs du socle normalisé sont tous présents
    for (const socle of DEFAULT_SOCLE_FIELDS) {
      if (!fields.some((f) => f.key === socle.key)) {
        throw new Error(`Le champ verrouillé du socle normalisé « ${socle.label} » est obligatoire.`);
      }
    }

    const result = await patternRepo.publishVersion(patternId, fields, options);

    // Enregistrement d'audit infalsifiable WORM
    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'PATTERN_VERSION_PUBLISH',
      actor: {
        id: user?.id || 'usr-system',
        name: user?.id || 'Administrateur',
        role: (user?.role || 'ADMIN').toUpperCase(),
        ip: '127.0.0.1',
        authStrength: user?.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        type: 'pattern',
        id: patternId,
      },
      justification: `Publication officielle de la version ${result.version.version} du pattern ${result.pattern.name}.`,
      payload: {
        patternId,
        newVersion: result.version.version,
        totalFields: fields.length,
        piiFields: fields.filter((f) => f.isPii).length,
        reExtractRequested: !!options?.reExtractExisting,
        tokensEstimate: result.reExtraction?.totalTokens || 0,
        estimatedCostEur: result.reExtraction?.estimatedEur || 0,
      },
    });

    revalidatePath('/patterns');
    revalidatePath(`/patterns/${patternId}`);

    return {
      success: true,
      version: result.version,
      pattern: result.pattern,
      reExtraction: result.reExtraction,
    };
  } catch (error: any) {
    const msg = error instanceof z.ZodError ? error.issues?.[0]?.message : error.message || 'Erreur lors de la publication.';
    return {
      success: false,
      error: msg,
    };
  }
}

export async function restorePatternVersionAction(patternId: string, targetVersion: string) {
  try {
    const user = await getServerCurrentUser();
    const patternRepo = getPatternRepository();
    const result = await patternRepo.restoreVersion(patternId, targetVersion);

    const auditRepo = getAuditRepository();
    await auditRepo.logEvent({
      action: 'PATTERN_VERSION_PUBLISH',
      actor: {
        id: user?.id || 'usr-system',
        name: user?.id || 'Administrateur',
        role: (user?.role || 'ADMIN').toUpperCase(),
        ip: '127.0.0.1',
        authStrength: user?.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
      },
      resource: {
        type: 'pattern',
        id: patternId,
      },
      justification: `Restauration de la version historique ${targetVersion} pour le pattern ${patternId}.`,
      payload: {
        patternId,
        restoredFromVersion: targetVersion,
      },
    });

    revalidatePath(`/patterns/${patternId}`);
    return { success: true, version: result.version, pattern: result.pattern };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la restauration de la version.',
    };
  }
}

export async function testPatternExtractionAction(fields: PatternField[], sampleCvId?: string) {
  try {
    const patternRepo = getPatternRepository();
    const results = await patternRepo.testExtraction(fields, sampleCvId);
    return { success: true, results };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erreur lors de l'exécution de l'extraction de test.",
    };
  }
}

export async function getReExtractionCostEstimateAction(cvCount: number, fieldsCount: number) {
  return estimateReExtractionCost(cvCount, fieldsCount);
}
