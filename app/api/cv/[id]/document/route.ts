import { NextRequest, NextResponse } from 'next/server';
import { verifySignedToken } from '../signed-url/route';
import { getCvRepository } from '@/lib/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const mode = searchParams.get('mode') || 'redacted';

  if (!token) {
    return NextResponse.json(
      { error: 'Token de signature absent' },
      { status: 400 },
    );
  }

  // 1. Validation de l'URL signée (TTL 60 secondes)
  const isValid = verifySignedToken(id, mode, token);
  if (!isValid) {
    return NextResponse.json(
      {
        error: 'URL signée expirée ou invalide (durée de validité 60 secondes dépassée).',
        code: 'SIGNED_URL_EXPIRED',
      },
      { status: 403 },
    );
  }

  // 2. Récupération des données du document
  const repo = getCvRepository();
  const cv = await repo.getCvDetail(id, mode === 'redacted');
  if (!cv) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  // 3. Rendu du document PDF / SVG vectoriel scellé
  const isRedacted = mode === 'redacted';
  const candidateTitle = isRedacted ? cv.pseudonym : `${cv.nominative?.firstName} ${cv.nominative?.lastName}`;
  const contactText = isRedacted ? '***@***.*** · +33 * ** ** **' : `${cv.nominative?.email} · ${cv.nominative?.phone}`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="100%" height="100%">
  <rect width="595" height="842" fill="#ffffff"/>
  
  <!-- En-tête -->
  <rect x="0" y="0" width="595" height="120" fill="#f8fafc"/>
  <line x1="0" y1="120" x2="595" y2="120" stroke="#e2e8f0" stroke-width="1"/>
  
  <text x="40" y="45" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${candidateTitle}</text>
  <text x="40" y="70" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#4f46e5">${cv.currentTitle}</text>
  <text x="40" y="92" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">${contactText} · ${cv.location}</text>

  <!-- Photo / Caviardage -->
  <rect x="475" y="20" width="80" height="80" rx="8" fill="${isRedacted ? '#fef3c7' : '#e0e7ff'}" stroke="${isRedacted ? '#f59e0b' : '#6366f1'}" stroke-width="1"/>
  <text x="515" y="65" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="${isRedacted ? '#92400e' : '#3730a3'}">${isRedacted ? 'CAVIARDÉ' : 'PHOTO'}</text>

  <!-- Profil & Compétences -->
  <text x="40" y="155" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#475569" letter-spacing="1">PROFIL &amp; EXPERTISE</text>
  <line x1="40" y1="162" x2="555" y2="162" stroke="#e2e8f0" stroke-width="1"/>
  <text x="40" y="185" font-family="system-ui, sans-serif" font-size="11" fill="#334155">${cv.aiJustification}</text>

  <!-- Expériences -->
  <text x="40" y="235" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#475569" letter-spacing="1">PARCOURS PROFESSIONNEL</text>
  <line x1="40" y1="242" x2="555" y2="242" stroke="#e2e8f0" stroke-width="1"/>
  
  ${cv.experiences
    .map(
      (exp, i) => `
    <text x="40" y="${270 + i * 85}" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">${exp.role}</text>
    <text x="420" y="${270 + i * 85}" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">${exp.period}</text>
    <text x="40" y="${290 + i * 85}" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#4f46e5">${exp.companySector}</text>
    <text x="40" y="${310 + i * 85}" font-family="system-ui, sans-serif" font-size="10" fill="#334155">${exp.summary}</text>
  `,
    )
    .join('')}

  <!-- Footer conformité -->
  <rect x="0" y="810" width="595" height="32" fill="#f1f5f9"/>
  <text x="40" y="830" font-family="monospace" font-size="9" fill="#64748b">TalentLens RFC 3161 Empreinte : ${cv.hashId.substring(0, 32)}... · Mode : ${isRedacted ? 'Caviardé (Anti-Biais)' : 'Nominatif Dérogatoire'}</text>
</svg>`;

  return new NextResponse(svgContent, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
      'X-Document-Mode': mode,
      'X-Document-Blind': isRedacted ? 'true' : 'false',
    },
  });
}
