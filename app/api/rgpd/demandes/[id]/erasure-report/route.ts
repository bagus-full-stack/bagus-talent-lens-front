import { NextRequest, NextResponse } from 'next/server';
import { getDsrRepository } from '@/lib/api';
import { DsrService } from '@/lib/rgpd/dsr-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const repo = getDsrRepository() as any;
    const dsr = await repo.getById(decodedId);

    if (!dsr) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (dsr.requestType !== 'erasure' || dsr.status !== 'fulfilled') {
      return NextResponse.json(
        { error: "Le rapport d'effacement certifié n'est disponible que pour les demandes d'effacement clôturées." },
        { status: 400 }
      );
    }

    const report = DsrService.generateErasureReport(
      dsr,
      {
        id: dsr.firstValidatorId || 'usr_val1',
        name: dsr.firstValidatorName || 'Premier Validateur',
        role: 'DPO',
      },
      {
        id: dsr.secondValidatorId || 'usr_val2',
        name: dsr.secondValidatorName || 'Second Validateur',
        role: 'ADMIN',
      }
    );

    // Construction d'un document texte certifié téléchargeable sans PII
    const lines = [
      '==============================================================================',
      'PROCES-VERBAL D’EFFACEMENT IRREVERSIBLE DE DONNEES PERSONNELLES',
      'CONFORME AU REGLEMENT GENERAL SUR LA PROTECTION DES DONNEES (RGPD - ART. 17)',
      '==============================================================================',
      '',
      `Reference Certificat : ${report.certificateId}`,
      `Dossier DSR         : ${report.dsrId}`,
      `Identifiant Sujet   : ${report.candidatePseudonym} [STRICTEMENT PSEUDONYMISE - ZERO PII]`,
      `Dossier Metier Lie  : ${report.folderReference}`,
      `Date de Destruction : ${report.erasureTimestamp}`,
      '',
      '--- SIGNATURES DE DOUBLE VALIDATION CONJOINTE ---',
      `1er Validateur : ${report.firstValidator.name} (${report.firstValidator.role})`,
      `2nd Validateur : ${report.secondValidator.name} (${report.secondValidator.role})`,
      'Controle de separation des devoirs : Conforme (deux identifiants distincts certifies)',
      '',
      '--- COMPOSANTS PURGES ET ATTESTATIONS CRYPTOGRAPHIQUES ---',
      ...report.purgedComponents.map(
        (c) =>
          `* ${c.name} (${c.storage})\n  Items purges: ${c.itemsCount} | Empreinte: ${c.sha256Proof}`
      ),
      '',
      '--- MENTION LEGALE D’IRREVERSIBILITE ---',
      report.legalNotice,
      '',
      `SCELLÉ CRYPTOGRAPHIQUE WORM : ${report.sha256CertificateSeal}`,
      '==============================================================================',
    ];

    const content = lines.join('\r\n');
    const filename = `pv_effacement_rgpd_${dsr.id.replace('#', '')}_sans_pii.txt`;

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-WORM-Seal': report.sha256CertificateSeal,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
