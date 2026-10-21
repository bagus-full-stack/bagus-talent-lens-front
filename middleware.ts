import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = [
  '/connexion',
  '/auth/callback',
  '/mfa-verify',
  '/mfa-setup',
  '/api/auth',
  '/invitation',
  '/api/invitation',
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Ignorer les fichiers statiques, images et chunks Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Déterminer si la route est publique
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 3. Rafraîchissement de session Supabase (si configuré)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.DATA_SOURCE === 'supabase';

  let isAuthenticated = false;
  let userRole = request.cookies.get('tl_role')?.value || 'admin';
  let aal = request.cookies.get('tl_aal')?.value || 'aal2';

  if (isSupabaseConfigured) {
    try {
      response = await updateSession(request);
      const sessionCookie = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');
      isAuthenticated = Boolean(sessionCookie);
    } catch {
      isAuthenticated = false;
    }
  } else {
    // Mode Démonstration / Mock : l'utilisateur a une session par défaut
    // sauf s'il s'est explicitement déconnecté (cookie tl_logged_out === 'true')
    const isLoggedOut = request.cookies.get('tl_logged_out')?.value === 'true';
    isAuthenticated = !isLoggedOut;
  }

  // 4. Protection des routes privées : redirection vers /connexion avec paramètre ?redirect=
  if (!isAuthenticated && !isPublicRoute) {
    const redirectUrl = new URL('/connexion', request.url);
    const fullPath = pathname + search;
    redirectUrl.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Exigence de niveau MFA AAL2 pour les rôles Owner et Admin
  // Si l'utilisateur est Owner ou Admin et son niveau est AAL1,
  // il doit obligatoirement valider son second facteur avant d'accéder aux sections administratives
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const isAdminRoute =
    pathname.startsWith('/parametres') ||
    pathname.startsWith('/utilisateurs') ||
    pathname.startsWith('/audit');

  if (
    isAuthenticated &&
    isOwnerOrAdmin &&
    aal === 'aal1' &&
    (isAdminRoute || pathname === '/mfa-verify')
  ) {
    if (pathname !== '/mfa-verify') {
      const mfaUrl = new URL('/mfa-verify', request.url);
      mfaUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // 6. Application des en-têtes de sécurité stricts (CSP, X-Frame-Options, etc.)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
