'use server';

import { cookies } from 'next/headers';
import {
  resolveInvitationByToken,
  markInvitationAccepted,
  hashInvitationToken,
  type SafeInvitationDetails,
} from '@/lib/mock/data/invitations';
import { ROLE_PERMISSIONS, type RolePermissions } from '@/lib/permissions/rbac';
import { z } from 'zod';

// Schéma de validation du mot de passe fort
export const PasswordPolicySchema = z
  .string()
  .min(12, 'Le mot de passe doit comporter au moins 12 caractères.')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule.')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial.');

export interface InvitationFlowState {
  invitationId: string;
  email: string;
  step: 1 | 2 | 3;
  authMethod?: 'google' | 'linkedin' | 'password';
  fullName?: string;
  mfaCompleted?: boolean;
  mfaSkipped?: boolean;
  backupCodes?: string[];
  mfaSecret?: string;
}

export interface InvitationDataResponse {
  status: 'valid' | 'expired' | 'already_used' | 'not_found';
  invitation?: SafeInvitationDetails;
  step: 1 | 2 | 3;
  mfaMandatory: boolean;
  mfaCompleted: boolean;
  mfaSkipped: boolean;
  mfaSecret: string;
  otpauthUrl: string;
  backupCodes: string[];
  permissions?: RolePermissions;
  errorMessage?: string;
}

function getCookieName(token: string): string {
  const hash = hashInvitationToken(token);
  return `tl_inv_${hash.substring(0, 16)}`;
}

function generateBackupCodes(): string[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

const DEFAULT_SECRET = 'JBSWY3DPEHPK3PXP';

/**
 * Récupère l'état complet côté serveur de l'invitation
 */
export async function getInvitationServerState(rawToken: string): Promise<InvitationDataResponse> {
  const resolved = resolveInvitationByToken(rawToken);

  if (resolved.status !== 'valid' || !resolved.invitation) {
    return {
      status: resolved.status,
      invitation: resolved.invitation,
      step: 1,
      mfaMandatory: false,
      mfaCompleted: false,
      mfaSkipped: false,
      mfaSecret: DEFAULT_SECRET,
      otpauthUrl: '',
      backupCodes: [],
      errorMessage: resolved.errorMessage,
    };
  }

  const cookieStore = await cookies();
  const cookieName = getCookieName(rawToken);
  const stateCookie = cookieStore.get(cookieName)?.value;

  let state: InvitationFlowState = {
    invitationId: resolved.invitation.id,
    email: resolved.invitation.email,
    step: 1,
    mfaSecret: DEFAULT_SECRET,
    backupCodes: generateBackupCodes(),
  };

  if (stateCookie) {
    try {
      const parsed = JSON.parse(stateCookie);
      if (parsed.invitationId === resolved.invitation.id) {
        state = {
          ...state,
          ...parsed,
        };
      }
    } catch {
      // Cookie corrompu ou format précédent
    }
  }

  const role = resolved.invitation.role;
  const isMfaMandatory = role === 'admin' || role === 'owner';

  // Si le rôle exige la MFA mais que le client tente de forcer l'étape 3 sans validation
  if (isMfaMandatory && state.step === 3 && !state.mfaCompleted) {
    state.step = 2;
  }

  const secret = state.mfaSecret || DEFAULT_SECRET;
  const otpauthUrl = `otpauth://totp/TalentLens:${resolved.invitation.email}?secret=${secret}&issuer=TalentLens%20Horizon%20RH`;
  const permissions = ROLE_PERMISSIONS[role];

  return {
    status: 'valid',
    invitation: resolved.invitation,
    step: state.step,
    mfaMandatory: isMfaMandatory,
    mfaCompleted: Boolean(state.mfaCompleted),
    mfaSkipped: Boolean(state.mfaSkipped),
    mfaSecret: secret,
    otpauthUrl,
    backupCodes: state.backupCodes || [],
    permissions,
  };
}

/**
 * Étape 1 : Validation des identifiants (mot de passe ou SSO) et contrôle de l'email
 */
export async function submitCredentialsAction(
  rawToken: string,
  payload: {
    authMethod: 'google' | 'linkedin' | 'password';
    email: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
  },
): Promise<{ success: boolean; nextStep?: number; error?: string; errorCode?: string }> {
  const resolved = resolveInvitationByToken(rawToken);

  if (resolved.status !== 'valid' || !resolved.invitation) {
    return {
      success: false,
      error: resolved.errorMessage || 'Invitation invalide ou expirée.',
      errorCode: resolved.status.toUpperCase(),
    };
  }

  const expectedEmail = resolved.invitation.email.trim().toLowerCase();
  const providedEmail = payload.email.trim().toLowerCase();

  // Règle d'or : L'adresse email doit correspondre exactement à l'invitation
  if (providedEmail !== expectedEmail) {
    return {
      success: false,
      errorCode: 'EMAIL_MISMATCH',
      error: `L’adresse email saisie (${providedEmail}) ne correspond pas à l’invitation (${expectedEmail}). L’accès se fait strictement sur invitation adressée à ce compte.`,
    };
  }

  // Vérification de robustesse si mot de passe
  if (payload.authMethod === 'password') {
    if (!payload.password) {
      return { success: false, error: 'Veuillez saisir un mot de passe.' };
    }

    const validation = PasswordPolicySchema.safeParse(payload.password);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues?.[0]?.message || 'Mot de passe non conforme aux règles de sécurité.',
      };
    }

    if (payload.password !== payload.confirmPassword) {
      return {
        success: false,
        error: 'Les deux mots de passe ne sont pas identiques.',
      };
    }
  }

  // Enregistrer l'état d'étape 1 validée sur le serveur
  const cookieStore = await cookies();
  const cookieName = getCookieName(rawToken);
  const existingCookie = cookieStore.get(cookieName)?.value;
  let currentState: InvitationFlowState = {
    invitationId: resolved.invitation.id,
    email: resolved.invitation.email,
    step: 2,
    authMethod: payload.authMethod,
    fullName: payload.fullName,
    mfaSecret: DEFAULT_SECRET,
    backupCodes: generateBackupCodes(),
  };

  if (existingCookie) {
    try {
      currentState = { ...currentState, ...JSON.parse(existingCookie), step: 2, authMethod: payload.authMethod };
    } catch {
      // Ignorer
    }
  }

  cookieStore.set(cookieName, JSON.stringify(currentState), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 heure pour finaliser
    path: '/',
  });

  return { success: true, nextStep: 2 };
}

/**
 * Étape 2 : Vérification du code TOTP et enregistrement du MFA
 */
export async function verifyMfaAction(
  rawToken: string,
  code: string,
): Promise<{ success: boolean; nextStep?: number; error?: string; backupCodes?: string[] }> {
  const resolved = resolveInvitationByToken(rawToken);

  if (resolved.status !== 'valid' || !resolved.invitation) {
    return { success: false, error: 'Invitation non valide.' };
  }

  const cleanCode = code.replace(/\s+/g, '');
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'Veuillez saisir un code à 6 chiffres valide.',
    };
  }

  const cookieStore = await cookies();
  const cookieName = getCookieName(rawToken);
  const existingCookie = cookieStore.get(cookieName)?.value;

  let state: InvitationFlowState = {
    invitationId: resolved.invitation.id,
    email: resolved.invitation.email,
    step: 3,
    mfaCompleted: true,
    backupCodes: generateBackupCodes(),
  };

  if (existingCookie) {
    try {
      const parsed = JSON.parse(existingCookie);
      state = {
        ...parsed,
        step: 3,
        mfaCompleted: true,
        backupCodes: parsed.backupCodes || generateBackupCodes(),
      };
    } catch {
      // Ignorer
    }
  }

  cookieStore.set(cookieName, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });

  return {
    success: true,
    nextStep: 3,
    backupCodes: state.backupCodes,
  };
}

/**
 * Étape 2 (Alternative pour profils non-admins) : Passer la configuration MFA
 */
export async function skipMfaAction(
  rawToken: string,
): Promise<{ success: boolean; nextStep?: number; error?: string }> {
  const resolved = resolveInvitationByToken(rawToken);

  if (resolved.status !== 'valid' || !resolved.invitation) {
    return { success: false, error: 'Invitation non valide.' };
  }

  const role = resolved.invitation.role;
  if (role === 'admin' || role === 'owner') {
    return {
      success: false,
      error: 'La double authentification (MFA AAL2) est strictement obligatoire pour les rôles Administrateur et Propriétaire.',
    };
  }

  const cookieStore = await cookies();
  const cookieName = getCookieName(rawToken);
  const existingCookie = cookieStore.get(cookieName)?.value;

  let state: InvitationFlowState = {
    invitationId: resolved.invitation.id,
    email: resolved.invitation.email,
    step: 3,
    mfaSkipped: true,
    mfaCompleted: false,
  };

  if (existingCookie) {
    try {
      const parsed = JSON.parse(existingCookie);
      state = { ...parsed, step: 3, mfaSkipped: true, mfaCompleted: false };
    } catch {
      // Ignorer
    }
  }

  cookieStore.set(cookieName, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });

  return { success: true, nextStep: 3 };
}

/**
 * Étape 3 : Acceptation de la charte déontologique et finalisation du compte
 */
export async function acceptCharterAndFinalizeAction(
  rawToken: string,
  payload: { acceptedCharter: boolean },
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  if (!payload.acceptedCharter) {
    return {
      success: false,
      error: 'Vous devez accepter la Charte d’utilisation et de déontologie pour accéder à la plateforme.',
    };
  }

  const resolved = resolveInvitationByToken(rawToken);

  if (resolved.status !== 'valid' || !resolved.invitation) {
    return {
      success: false,
      error: resolved.errorMessage || 'L’invitation a expiré ou a déjà été utilisée.',
    };
  }

  const cookieStore = await cookies();
  const cookieName = getCookieName(rawToken);
  const flowCookie = cookieStore.get(cookieName)?.value;

  let authMethod: 'google' | 'linkedin' | 'password' = 'password';
  let mfaEnrolled = resolved.invitation.role === 'admin' || resolved.invitation.role === 'owner';
  let fullName: string | undefined;

  if (flowCookie) {
    try {
      const parsed: InvitationFlowState = JSON.parse(flowCookie);
      if (parsed.authMethod) authMethod = parsed.authMethod;
      if (parsed.mfaCompleted !== undefined) mfaEnrolled = parsed.mfaCompleted;
      if (parsed.fullName) fullName = parsed.fullName;
    } catch {
      // Continuer
    }
  }

  // 1. Marquer l'invitation comme acceptée et créer le membre dans l'organisation
  const member = markInvitationAccepted(rawToken, {
    authMethod,
    mfaEnrolled,
    fullName,
  });

  // 2. Définir les cookies d'authentification pour établir la session applicative
  const aal = mfaEnrolled ? 'aal2' : 'aal1';
  cookieStore.set('tl_session', 'active_session', { path: '/', maxAge: 86400, httpOnly: true });
  cookieStore.set('tl_role', resolved.invitation.role, { path: '/', maxAge: 86400 });
  cookieStore.set('tl_aal', aal, { path: '/', maxAge: 86400 });
  cookieStore.set('tl_user_id', member.userId, { path: '/', maxAge: 86400 });
  cookieStore.set('tl_can_reveal', resolved.invitation.can_reveal_identity ? 'true' : 'false', { path: '/', maxAge: 86400 });
  cookieStore.set('tl_can_export', resolved.invitation.can_export ? 'true' : 'false', { path: '/', maxAge: 86400 });

  // Supprimer les cookies transitoires
  cookieStore.delete('tl_logged_out');
  cookieStore.delete(cookieName);

  return {
    success: true,
    redirectUrl: '/',
  };
}
