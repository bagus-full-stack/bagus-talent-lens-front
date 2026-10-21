import { NextRequest, NextResponse } from 'next/server';
import { mockMemberships } from '@/lib/mock/data/organizations';

// Mémoire temporaire pour la limitation des tentatives (Rate Limiting)
const loginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    // Vérification du verrouillage temporel
    const attemptRecord = loginAttempts.get(normalizedEmail) || { count: 0 };
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `Compte temporairement verrouillé pour des raisons de sécurité. Veuillez patienter ${retryAfterSeconds} secondes.`,
          retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    // Recherche dans les membres
    const member = mockMemberships.find(
      (m) => m.email.toLowerCase() === normalizedEmail,
    );

    // En environnement de test / mock : accepter mot de passe standard ou "TalentLens2026!"
    const isValidPassword = password === 'TalentLens2026!' || password.length >= 6;

    if (!member || !isValidPassword) {
      attemptRecord.count += 1;
      const remaining = Math.max(0, 5 - attemptRecord.count);

      if (attemptRecord.count >= 5) {
        attemptRecord.lockedUntil = now + 45 * 1000; // 45 secondes de blocage
        attemptRecord.count = 0;
        loginAttempts.set(normalizedEmail, attemptRecord);

        return NextResponse.json(
          {
            error: 'Trop de tentatives infructueuses consécutives. Blocage temporaire de sécurité de 45 secondes.',
            retryAfterSeconds: 45,
          },
          { status: 429 },
        );
      }

      loginAttempts.set(normalizedEmail, attemptRecord);

      return NextResponse.json(
        {
          error: 'Identifiants professionnels incorrects ou compte inexistant.',
          attemptsRemaining: remaining,
        },
        { status: 401 },
      );
    }

    // Réinitialisation des tentatives en cas de succès
    loginAttempts.delete(normalizedEmail);

    const response = NextResponse.json({
      success: true,
      role: member.role,
      aal: member.aal || 'aal1',
      userId: member.userId,
      fullName: member.fullName,
    });

    response.cookies.set('tl_session', 'active_session', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
    });
    response.cookies.set('tl_role', member.role, { path: '/', maxAge: 86400 });
    response.cookies.set('tl_aal', member.aal || 'aal1', { path: '/', maxAge: 86400 });
    response.cookies.delete('tl_logged_out');

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur de connexion serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
