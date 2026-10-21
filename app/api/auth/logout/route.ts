import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Déconnexion effectuée.' });

  response.cookies.delete('tl_session');
  response.cookies.delete('tl_role');
  response.cookies.delete('tl_aal');
  response.cookies.delete('tl_reauth_at');

  // Marqueur de déconnexion explicite pour le middleware
  response.cookies.set('tl_logged_out', 'true', {
    path: '/',
    httpOnly: true,
    maxAge: 86400,
  });

  return response;
}
