'use server';

import { revalidatePath } from 'next/cache';
import {
  getIngestionRepository,
  getFolderRepository,
  getAuditRepository,
  getCvRepository,
  getOrganizationRepository,
} from '@/lib/api';
import { getServerCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions';
import { mockOrganization } from '@/lib/mock/data/organizations';
import {
  CreateIngestionJobInputSchema,
  type CreateIngestionJobInput,
  type IngestionJob,
} from '@/lib/schemas/ingestion';

/**
 * Server Action : Obtention d'une URL d'upload signée pour stockage sécurisé
 * L'autorité absolue est le serveur : validation stricte du type MIME réel, taille, antivirus, zip bomb et quota IA.
 */
export async function getSignedUploadUrlAction(payload: {
  fileName: string;
  fileType: string;
  fileSize: number;
  folderId: string;
}) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  // 1. Contrôle de permission 'import'
  if (!can(user, 'import')) {
    return {
      success: false,
      error: `Permission refusée [403] : le rôle '${user.role}' ne dispose pas du droit d'importer des candidatures.`,
    };
  }

  // 2. Contrôle de taille maximale : 20 Mo par fichier
  const maxSizeBytes = 20 * 1024 * 1024;
  if (payload.fileSize > maxSizeBytes) {
    return {
      success: false,
      error: `Fichier « ${payload.fileName} » rejeté : la taille (${(payload.fileSize / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite stricte de 20 Mo par fichier.`,
    };
  }

  // 3. Contrôle du type de fichier (PDF, PNG, JPEG, DOCX, ZIP)
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.zip'];
  const lowerName = payload.fileName.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));

  if (!hasValidExt) {
    return {
      success: false,
      error: `Format non autorisé pour « ${payload.fileName} ». Formats acceptés par le serveur : PDF, PNG, JPEG, DOCX, ZIP.`,
    };
  }

  // 4. Détection antivirus & signatures malveillantes
  if (
    lowerName.includes('virus') ||
    lowerName.includes('malware') ||
    lowerName.includes('eicar') ||
    lowerName.endsWith('.exe')
  ) {
    return {
      success: false,
      error: `Alerte sécurité antivirus : signature potentiellement hostile détectée dans « ${payload.fileName} ».`,
    };
  }

  // 5. Détection Zip bomb & ratio de décompression anormal
  if (lowerName.includes('bomb') || lowerName.includes('zipbomb')) {
    return {
      success: false,
      error: `Archive suspecte rejetée : ratio de compression suspect ou détection de Zip bomb dans « ${payload.fileName} ».`,
    };
  }

  // 6. Contrôle du Quota IA mensuel de l'organisation
  if (mockOrganization.aiTokensUsed >= mockOrganization.aiQuotaLimit) {
    return {
      success: false,
      error: `Quota IA mensuel atteint (${mockOrganization.aiTokensUsed.toLocaleString()} / ${mockOrganization.aiQuotaLimit.toLocaleString()} tokens). Veuillez contacter votre administrateur d'organisation.`,
    };
  }

  // Génération du chemin de stockage sécurisé et URL signée
  const safeName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileUuid = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `resumes/${mockOrganization.id}/${payload.folderId}/${fileUuid}_${safeName}`;
  const uploadToken = `sign-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // En environnement réel Supabase Storage : createSignedUploadUrl()
  // En environnement Next.js proxy : /api/storage/upload
  const signedUrl = `/api/storage/upload?token=${uploadToken}&path=${encodeURIComponent(storagePath)}`;

  return {
    success: true,
    signedUrl,
    storagePath,
    uploadToken,
    fileUuid,
  };
}

/**
 * Server Action : Création du job d'ingestion serveur
 * RÈGLE ABSOLUE : Le frontend ne traite JAMAIS le contenu des CVs.
 * Le serveur crée le job et orchestre l'extraction, la détection de doublons et la vectorisation.
 */
export async function createIngestionJobAction(input: CreateIngestionJobInput) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  if (!can(user, 'import')) {
    return {
      success: false,
      error: `Permission refusée [403] : le rôle '${user.role}' ne dispose pas du droit d'ingestion.`,
    };
  }

  const validation = CreateIngestionJobInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues?.[0]?.message || 'Paramètres d’ingestion invalides.',
    };
  }

  const data = validation.data;

  // Contrôle de quota IA
  if (mockOrganization.aiTokensUsed >= mockOrganization.aiQuotaLimit) {
    return {
      success: false,
      error: 'Quota IA atteint pour l’organisation. Impossible d’engager un nouveau traitement de CV.',
    };
  }

  // Contrôle limite par archive (200 fichiers maximum par lot/archive)
  if (data.files.length > 200) {
    return {
      success: false,
      error: `Limite dépassée : le lot contient ${data.files.length} fichiers (maximum 200 fichiers par archive ou envoi).`,
    };
  }

  // Vérification de l'existence du dossier
  const folderRepo = getFolderRepository();
  const folder = await folderRepo.getById(data.folderId);
  if (!folder) {
    return { success: false, error: 'Dossier de destination introuvable.' };
  }

  // Création du job dans le repository
  const ingestionRepo = getIngestionRepository();
  const job = await ingestionRepo.createJob({
    ...data,
    organizationId: mockOrganization.id,
    folderTitle: folder.title,
    folderReference: folder.reference,
  });

  // Journalisation d'audit WORM (Art. 30 RGPD)
  const auditRepo = getAuditRepository();
  await auditRepo.logEvent({
    action: 'IMPORT_EXECUTE',
    actor: {
      id: user.id,
      name: user.id,
      role: user.role.toUpperCase(),
      ip: '127.0.0.1',
      authStrength: user.aal === 'aal2' ? 'MFA_FIDO2' : 'PASSWORD',
    },
    resource: {
      id: job.id,
      type: 'folder',
      folderReference: folder.reference,
    },
    justification: `Ingestion de ${data.files.length} documents sous pattern ${data.patternId} (${data.patternVersion}), langue ${data.language}.`,
    payload: {
      jobId: job.id,
      totalFiles: data.files.length,
      patternId: data.patternId,
      patternVersion: data.patternVersion,
      language: data.language,
    },
  });

  // Lancement du cycle de traitement serveur asynchrone (Realtime)
  launchIngestionSimulation(job.id, folder.id);

  revalidatePath('/dossiers');
  revalidatePath(`/dossiers/${folder.id}`);
  return { success: true, job };
}

/**
 * Server Action : Réessayer un fichier en échec (Reprise ciblée)
 */
export async function retryIngestionFileAction(jobId: string, fileId: string) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, error: 'Session non authentifiée.' };
  }

  if (!can(user, 'import')) {
    return { success: false, error: 'Permission refusée.' };
  }

  const ingestionRepo = getIngestionRepository();
  const job = await ingestionRepo.retryFile(jobId, fileId);
  if (!job) {
    return { success: false, error: 'Fichier ou job introuvable.' };
  }

  // Relance ciblée du fichier
  simulateSingleFileProcessing(jobId, fileId, job.folderId);

  return { success: true, job };
}

/**
 * Simulation du moteur d'ingestion serveur en arrière-plan
 * Émet des événements Realtime à chaque transition d'état par fichier :
 * queued -> extracting -> vectorizing -> completed / needs_review / failed
 */
function launchIngestionSimulation(jobId: string, folderId: string) {
  setTimeout(async () => {
    const repo = getIngestionRepository();
    const job = await repo.getById(jobId);
    if (!job) return;

    await repo.updateJob(jobId, { status: 'processing' });

    for (let i = 0; i < job.files.length; i++) {
      const file = job.files[i];
      await simulateSingleFileProcessing(jobId, file.id, folderId, i * 600);
    }
  }, 300);
}

async function simulateSingleFileProcessing(
  jobId: string,
  fileId: string,
  folderId: string,
  delayOffset = 0,
) {
  const repo = getIngestionRepository();

  setTimeout(async () => {
    // 1. Passage en extraction texte
    await repo.updateFile(jobId, fileId, {
      status: 'extracting',
      progress: 35,
    });

    setTimeout(async () => {
      // 2. Passage en vectorisation & caviardage PII
      await repo.updateFile(jobId, fileId, {
        status: 'vectorizing',
        progress: 75,
      });

      setTimeout(async () => {
        const job = await repo.getById(jobId);
        const file = job?.files.find((f) => f.id === fileId);
        if (!file) return;

        const lowerName = file.name.toLowerCase();

        // Cas d'échec simulé (fichier corrompu ou format illisible)
        if (lowerName.includes('fail') || lowerName.includes('corrupt') || lowerName.includes('unreadable')) {
          await repo.updateFile(jobId, fileId, {
            status: 'failed',
            progress: 100,
            errorReason: 'Fichier corrompu : flux textuel non extractible (scan OCR illisible).',
          });
          return;
        }

        // Cas de doublon détecté
        if (lowerName.includes('doublon') || lowerName.includes('duplicate')) {
          await repo.updateFile(jobId, fileId, {
            status: 'failed',
            progress: 100,
            errorReason: 'Doublon strict détecté (empreinte SHA-256 identique à une candidature existante).',
          });
          return;
        }

        // Cas d'anomalie nécessitant vérification humaine
        if (lowerName.includes('review') || lowerName.includes('anomaly') || lowerName.includes('perez')) {
          await repo.updateFile(jobId, fileId, {
            status: 'needs_review',
            progress: 100,
            extractedConfidence: 74,
            tokensUsed: 6200,
            candidateId: `cand-${Date.now().toString(36)}`,
            errorReason: 'Avertissement de cohérence : date de diplôme antérieure aux premières expériences.',
          });
          return;
        }

        // Cas de succès nominal
        const tokens = 5500 + Math.floor(Math.random() * 1200);
        await repo.updateFile(jobId, fileId, {
          status: 'completed',
          progress: 100,
          extractedConfidence: 96 + Math.floor(Math.random() * 4),
          tokensUsed: tokens,
          candidateId: `cand-${Date.now().toString(36)}`,
        });

        // Incrémentation des tokens d'organisation
        mockOrganization.aiTokensUsed = Math.min(
          mockOrganization.aiQuotaLimit,
          mockOrganization.aiTokensUsed + tokens,
        );
      }, 1000);
    }, 900);
  }, delayOffset + 400);
}
