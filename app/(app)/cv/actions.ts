'use server';

import { revalidatePath } from 'next/cache';
import { getCvRepository, getAuditRepository } from '@/lib/api';
import { getServerCurrentUser } from '@/lib/auth/session';
import { can } from '@/lib/permissions';

export async function getCvDetailAction(id: string, isBlindMode = true) {
  const repo = getCvRepository();
  const user = await getServerCurrentUser();
  return repo.getCvDetail(id, isBlindMode, user?.id);
}

export async function updateCvFieldAction(params: {
  candidateId: string;
  key: string;
  value: any;
  version: number;
}) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, message: 'Non authentifié' };
  }

  const repo = getCvRepository();
  const result = await repo.updateCvField(
    params.candidateId,
    params.key,
    params.value,
    params.version,
    { id: user.id, name: user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens' },
  );

  if (result.success) {
    revalidatePath(`/cv/${params.candidateId}`);
  }

  return result;
}

export async function validateCvFieldAction(params: {
  candidateId: string;
  key: string;
}) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.validateCvField(
    params.candidateId,
    params.key,
    { name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens') : 'Recruteur' },
  );

  if (success) {
    revalidatePath(`/cv/${params.candidateId}`);
  }

  return { success };
}

export async function validateCvExtractionAction(params: { candidateId: string }) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.validateCvExtraction(
    params.candidateId,
    { name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens') : 'Recruteur' },
  );

  if (success) {
    revalidatePath(`/cv/${params.candidateId}`);
  }

  return { success };
}

export async function updateCvPipelineStageAction(params: {
  candidateId: string;
  stage: string;
}) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.updateCvPipelineStage(
    params.candidateId,
    params.stage,
    { name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens') : 'Recruteur' },
  );

  if (success) {
    revalidatePath(`/cv/${params.candidateId}`);
  }

  return { success };
}

export async function toggleCvShortlistAction(params: { candidateId: string }) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.toggleCvShortlist(
    params.candidateId,
    { name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens') : 'Recruteur' },
  );

  if (success) {
    revalidatePath(`/cv/${params.candidateId}`);
    revalidatePath('/shortlists');
  }

  return { success };
}

export async function toggleCvRestrictionAction(params: { candidateId: string }) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.toggleCvRestriction(
    params.candidateId,
    { name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Délégué DPO') : 'DPO' },
  );

  if (success) {
    revalidatePath(`/cv/${params.candidateId}`);
  }

  return { success };
}

export async function addCvNoteAction(params: {
  candidateId: string;
  content: string;
}) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, message: 'Non authentifié' };
  }

  const repo = getCvRepository();
  const note = await repo.addCvNote(params.candidateId, params.content, {
    id: user.id,
    name: user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur TalentLens',
    role: user.role,
  });

  if (note) {
    revalidatePath(`/cv/${params.candidateId}`);
    return { success: true, note };
  }

  return { success: false };
}

export async function unmaskCvAction(params: {
  candidateId: string;
  reason: string;
  credential?: string;
  method?: 'totp' | 'password';
}) {
  const user = await getServerCurrentUser();
  if (!user) {
    return { success: false, message: 'Non authentifié' };
  }

  // Vérification des droits d'élévation
  const isAllowed = can(user, 'identity.reveal');
  if (!isAllowed) {
    return {
      success: false,
      message: 'Autorisation insuffisante : votre rôle ne dispose pas du droit de lever l’anonymat (identity.reveal).',
    };
  }

  // Vérification de la justification légale Art. 30
  if (!params.reason || params.reason.trim().length < 10) {
    return {
      success: false,
      message: 'Le motif professionnel Art. 30 doit comporter au moins 10 caractères.',
    };
  }

  const repo = getCvRepository();
  const auditRepo = getAuditRepository();
  const actorName = user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur Habilité';

  const updatedDetail = await repo.unmaskCv(
    params.candidateId,
    user.id,
    actorName,
    params.reason,
  );

  if (!updatedDetail) {
    return { success: false, message: 'Candidat introuvable' };
  }

  // Enregistrement dans le registre d'audit WORM immuable
  await auditRepo.logEvent({
    action: 'UNMASK',
    actorId: user.id,
    actorName,
    role: user.role,
    targetType: 'candidate',
    targetId: params.candidateId,
    reason: params.reason,
    metadata: {
      candidatePseudonym: updatedDetail.pseudonym,
      folderId: updatedDetail.folderId,
      expiresIn: '24h',
      legalBasis: 'Art. 30 RGPD - Entretien de recrutement ou validation client',
    },
  });

  revalidatePath(`/cv/${params.candidateId}`);

  return {
    success: true,
    detail: updatedDetail,
  };
}

export async function deleteCvAction(params: { candidateId: string }) {
  const user = await getServerCurrentUser();
  const repo = getCvRepository();
  const success = await repo.deleteCv(params.candidateId, {
    name: user ? (user.role === 'admin' ? 'Idriss Ouédraogo' : 'Recruteur') : 'Recruteur',
  });

  if (success) {
    revalidatePath('/dossiers');
  }

  return { success };
}
