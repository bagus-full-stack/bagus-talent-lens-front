import { NextRequest, NextResponse } from 'next/server';
import { shortlistStore } from '@/lib/shortlists/shortlist-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exportData = shortlistStore.getExportData(id);
  if (!exportData) {
    return NextResponse.json({ error: 'Shortlist introuvable' }, { status: 404 });
  }

  const { shortlist, exportableCandidates, restrictedCount } = exportData;

  // Construction du contenu CSV anonymisé (Conformité RGPD stricte)
  const header = 'Rang,Identifiant_Anonyme,Poste,Score_Match,Competences,Commentaire_Recruteur\n';
  const rows = exportableCandidates.map((c) => {
    const skills = `"${c.topSkills.join('; ')}"`;
    const note = `"${(c.note || '').replace(/"/g, '""')}"`;
    const title = `"${c.currentTitle.replace(/"/g, '""')}"`;
    return `${c.rank},${c.pseudonym},${title},${c.matchScore}%,${skills},${note}`;
  });

  const csvContent =
    `# EXPORT SHORTLIST TALENTLENS - STRICTEMENT ANONYMISÉ\n` +
    `# Shortlist: ${shortlist.title} (${shortlist.folderReference})\n` +
    `# Date: ${new Date().toISOString()}\n` +
    `# Candidats exportés: ${exportableCandidates.length}\n` +
    `# Candidats sous limitation RGPD exclus: ${restrictedCount}\n` +
    `# Avertissement: Le partage externe est strictement encadré par les finalités du recrutement.\n` +
    header +
    rows.join('\n');

  const safeFilename = `shortlist_${shortlist.id}_anonymise.csv`;

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'X-Restricted-Count': String(restrictedCount),
    },
  });
}
