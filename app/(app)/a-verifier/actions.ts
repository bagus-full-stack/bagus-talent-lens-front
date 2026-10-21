'use server';

import { mockVerificationRepository } from '@/lib/mock/repositories/mock-verification-repository';
import { getServerCurrentUser } from '@/lib/auth/session';
import type { VerificationFilter } from '@/lib/schemas/verification';
import { revalidatePath } from 'next/cache';

export async function getVerificationQueueAction(filter?: Partial<VerificationFilter>) {
  return await mockVerificationRepository.getItems(filter);
}

export async function updateDoubtfulFieldAction(params: {
  itemId: string;
  fieldKey: string;
  action: 'validate' | 'correct' | 'ignore';
  correctedValue?: any;
  simulateError?: boolean;
}) {
  if (params.simulateError) {
    throw new Error('Simulation d’erreur serveur (Code HTTP 500) : Échec de persistance, retour arrière optimiste activé');
  }

  const user = await getServerCurrentUser();
  const res = await mockVerificationRepository.updateDoubtfulField(
    params.itemId,
    params.fieldKey,
    params.action,
    params.correctedValue,
    { name: user?.name || 'Recruteur TalentLens' }
  );

  revalidatePath('/a-verifier');
  return res;
}

export async function resolveSuspiciousAction(params: {
  itemId: string;
  action: 'exclude' | 'confirm_clean';
  reason: string;
  simulateError?: boolean;
}) {
  if (params.simulateError) {
    throw new Error('Simulation d’erreur serveur (Code HTTP 500) : Échec de validation sécurité, retour arrière optimiste activé');
  }

  const user = await getServerCurrentUser();
  const res = await mockVerificationRepository.resolveSuspiciousContent(
    params.itemId,
    params.action,
    params.reason,
    { name: user?.name || 'Recruteur TalentLens' }
  );

  revalidatePath('/a-verifier');
  return res;
}
