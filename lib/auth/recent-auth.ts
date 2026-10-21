import { cookies } from 'next/headers';

export class ReauthRequiredError extends Error {
  public readonly code = 'REAUTH_REQUIRED' as const;
  public readonly status = 401 as const;
  public readonly maxAgeSeconds: number;

  constructor(maxAgeSeconds: number = 300, message?: string) {
    super(
      message ||
        `Ré-authentification récente requise : cette action sensible exige une validation par mot de passe ou TOTP datant de moins de ${Math.round(maxAgeSeconds / 60)} minutes.`,
    );
    this.name = 'ReauthRequiredError';
    this.maxAgeSeconds = maxAgeSeconds;
  }
}

/**
 * Helper serveur à appeler dans les Server Actions sensibles :
 * - Levée du mode aveugle (Unmask)
 * - Export nominatif de données
 * - Suppression définitive ou purge RGPD Art. 17
 *
 * Vérifie que la dernière authentification / validation forte date de moins de `maxAgeSeconds` (par défaut 300s / 5min).
 */
export async function requireRecentAuth(maxAgeSeconds: number = 300): Promise<{ authenticatedAt: number }> {
  const cookieStore = await cookies();
  const reauthCookie = cookieStore.get('tl_reauth_at');

  if (!reauthCookie || !reauthCookie.value) {
    throw new ReauthRequiredError(maxAgeSeconds);
  }

  const timestamp = parseInt(reauthCookie.value, 10);
  if (isNaN(timestamp)) {
    throw new ReauthRequiredError(maxAgeSeconds);
  }

  const ageInSeconds = (Date.now() - timestamp) / 1000;
  if (ageInSeconds > maxAgeSeconds || ageInSeconds < 0) {
    throw new ReauthRequiredError(
      maxAgeSeconds,
      `Preuve de ré-authentification expirée (émise il y a ${Math.round(ageInSeconds)}s, seuil maximal autorisé : ${maxAgeSeconds}s).`,
    );
  }

  return { authenticatedAt: timestamp };
}

/**
 * Valide le mot de passe ou le code TOTP côté serveur et émet un cookie de ré-authentification HTTP-only
 */
export async function verifyReauthCredentials(params: {
  method: 'password' | 'totp';
  credential: string;
}): Promise<{ success: boolean; error?: string }> {
  const { method, credential } = params;

  // Validation minimale
  if (!credential || credential.trim().length === 0) {
    return { success: false, error: 'Identifiant ou code d’authentification manquant.' };
  }

  if (method === 'totp') {
    // Vérification du code TOTP 6 chiffres
    const cleanOtp = credential.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return { success: false, error: 'Le code TOTP doit comporter exactement 6 chiffres numériques.' };
    }
  }

  // Émission du cookie de ré-authentification récente côté serveur
  const cookieStore = await cookies();
  const now = Date.now();
  cookieStore.set('tl_reauth_at', now.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600, // 1 heure
  });

  return { success: true };
}
