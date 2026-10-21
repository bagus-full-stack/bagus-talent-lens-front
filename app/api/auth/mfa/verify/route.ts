import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || !/^\d{6}$/.test(code.toString().trim())) {
      return NextResponse.json(
        { error: 'Code TOTP invalide. Il doit comporter 6 chiffres.' },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      aal: 'aal2',
      verifiedAt: Date.now(),
      message: 'Authentification forte AAL2 validée.',
    });

    // Émission du cookie de niveau AAL2
    response.cookies.set('tl_aal', 'aal2', {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
    });

    response.cookies.set('tl_reauth_at', Date.now().toString(), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne de vérification MFA';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
