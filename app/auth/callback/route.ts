import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findValidInvitation } from '@/lib/mock/data/invitations';
import { mockMemberships } from '@/lib/mock/data/organizations';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect') || '/';

  // Paramètres pour tests et environnement de simulation
  const mockEmail = searchParams.get('mock_email');
  const mockEmailVerified = searchParams.get('mock_verified') !== 'false';
  const provider = searchParams.get('provider') || 'google';

  // 1. Traitement en mode simulation / mock (ou pour les tests automatisés)
  if (mockEmail || process.env.DATA_SOURCE !== 'supabase') {
    const targetEmail = mockEmail || 'candidat.invite@tech-recrutement.fr';

    // Règle 1 : Vérification de la validation de l'adresse email
    if (!mockEmailVerified) {
      const errorUrl = new URL('/connexion', origin);
      errorUrl.searchParams.set('error', 'EMAIL_NOT_VERIFIED');
      errorUrl.searchParams.set(
        'message',
        `L’adresse email (${targetEmail}) n’est pas vérifiée par votre fournisseur d’identité (${provider.toUpperCase()}). Veuillez confirmer votre compte d’abord.`,
      );
      return NextResponse.redirect(errorUrl);
    }

    // Règle 2 : Vérification qu'une invitation correspond (ou que l'utilisateur est déjà membre actif)
    const existingMember = mockMemberships.find(
      (m) => m.email.toLowerCase() === targetEmail.toLowerCase(),
    );
    const validInvitation = findValidInvitation(targetEmail);

    if (!existingMember && !validInvitation) {
      const errorUrl = new URL('/connexion', origin);
      errorUrl.searchParams.set('error', 'NO_INVITATION');
      errorUrl.searchParams.set(
        'message',
        `Accès refusé : aucune invitation active trouvée pour « ${targetEmail} » au sein du Cabinet Horizon RH. Veuillez solliciter une invitation auprès de votre administrateur.`,
      );
      return NextResponse.redirect(errorUrl);
    }

    // Invitation valide : on établit la session avec le rôle associé
    const role = validInvitation?.role || existingMember?.role || 'recruiter';
    const aal = role === 'admin' || role === 'owner' ? 'aal2' : 'aal1';

    const response = NextResponse.redirect(new URL(next, origin));
    response.cookies.set('tl_session', 'mock_authenticated_session', {
      path: '/',
      httpOnly: true,
      maxAge: 86400,
    });
    response.cookies.set('tl_role', role, { path: '/', maxAge: 86400 });
    response.cookies.set('tl_aal', aal, { path: '/', maxAge: 86400 });
    response.cookies.delete('tl_logged_out');

    return response;
  }

  // 2. Traitement en mode Supabase avec échange de code PKCE
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      const errorUrl = new URL('/connexion', origin);
      errorUrl.searchParams.set('error', 'AUTH_EXCHANGE_FAILED');
      errorUrl.searchParams.set(
        'message',
        error?.message || 'Échec de l’échange de jeton d’authentification sécurisé.',
      );
      return NextResponse.redirect(errorUrl);
    }

    const userEmail = data.user.email;
    const isEmailVerified = Boolean(data.user.email_confirmed_at);

    // Règle 1 : Vérifier que l'email est vérifié
    if (!isEmailVerified) {
      await supabase.auth.signOut();
      const errorUrl = new URL('/connexion', origin);
      errorUrl.searchParams.set('error', 'EMAIL_NOT_VERIFIED');
      errorUrl.searchParams.set(
        'message',
        'Votre adresse email doit obligatoirement être vérifiée pour accéder à la plateforme sécurisée TalentLens.',
      );
      return NextResponse.redirect(errorUrl);
    }

    // Règle 2 : Vérifier qu'une invitation correspond
    if (userEmail) {
      const invitation = findValidInvitation(userEmail);
      if (!invitation) {
        await supabase.auth.signOut();
        const errorUrl = new URL('/connexion', origin);
        errorUrl.searchParams.set('error', 'NO_INVITATION');
        errorUrl.searchParams.set(
          'message',
          `Aucune invitation active n’a été trouvée pour « ${userEmail} ». L’accès est strictement sur invitation préalable.`,
        );
        return NextResponse.redirect(errorUrl);
      }
    }

    const response = NextResponse.redirect(new URL(next, origin));
    response.cookies.delete('tl_logged_out');
    return response;
  }

  return NextResponse.redirect(new URL('/connexion', origin));
}
