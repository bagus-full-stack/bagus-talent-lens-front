import { NextRequest, NextResponse } from 'next/server';
import { verifyReauthCredentials } from '@/lib/auth/recent-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, credential } = body;

    if (!method || !credential) {
      return NextResponse.json(
        { error: 'Méthode et justificatif d’authentification requis' },
        { status: 400 },
      );
    }

    const result = await verifyReauthCredentials({ method, credential });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Identifiant invalide' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      timestamp: Date.now(),
      message: 'Ré-authentification validée avec succès.',
    });

    // Également mis dans les cookies de réponse pour le navigateur
    response.cookies.set('tl_reauth_at', Date.now().toString(), {
      httpOnly: false, // Accessible au client pour mise à jour de l'état UI
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne de ré-authentification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
