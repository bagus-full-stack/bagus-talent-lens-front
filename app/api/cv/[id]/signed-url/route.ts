import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerCurrentUser } from '@/lib/auth/session';
import { getCvRepository } from '@/lib/api';

const SIGNING_SECRET = process.env.SIGNED_URL_SECRET || 'talentshield-signed-token-secret-2026';

export function generateSignedToken(candidateId: string, mode: 'redacted' | 'original', expiresAtMs: number): string {
  const payload = `${candidateId}:${mode}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  return `${expiresAtMs}.${hmac}`;
}

export function verifySignedToken(candidateId: string, mode: string, token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const expiresAtMs = parseInt(parts[0], 10);
    if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) return false;
    const payload = `${candidateId}:${mode}:${expiresAtMs}`;
    const expectedHmac = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // 1. Vérification session
  const user = await getServerCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Authentification requise pour générer une URL signée' },
      { status: 401 },
    );
  }

  // 2. Récupération du candidat
  const repo = getCvRepository();
  const cv = await repo.getCvDetail(id);
  if (!cv) {
    return NextResponse.json({ error: 'Candidat introuvable' }, { status: 404 });
  }

  // 3. Détermination du mode (redacted par défaut pour mode aveugle strict)
  const isUnmasked = !cv.isBlindMode && (user.can_reveal_identity || ['admin', 'owner', 'dpo'].includes(user.role));
  const mode: 'redacted' | 'original' = isUnmasked ? 'original' : 'redacted';

  // 4. Génération de token signé avec TTL 60 secondes
  const now = Date.now();
  const expiresAtMs = now + 60 * 1000;
  const token = generateSignedToken(id, mode, expiresAtMs);

  const documentTitle =
    mode === 'redacted'
      ? `CV_${cv.pseudonym.replace(/[^a-zA-Z0-9]/g, '_')}_caviarde.pdf`
      : `CV_${id}_original.pdf`;

  const signedUrl = `/api/cv/${id}/document?token=${token}&mode=${mode}`;

  return NextResponse.json({
    signedUrl,
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresIn: 60,
    mode,
    isBlind: mode === 'redacted',
    documentTitle,
  });
}
