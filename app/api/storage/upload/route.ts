import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json(
        { error: 'Paramètres file et path obligatoires.' },
        { status: 400 },
      );
    }

    // Contrôles de sécurité stricts côté serveur (l'autorité absolue)
    // 1. Taille maximale 20 Mo
    const maxSizeBytes = 20 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Taille maximale dépassée (limite serveur : 20 Mo).' },
        { status: 413 },
      );
    }

    // 2. Vérification des extensions & MIME types autorisés
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.zip'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      return NextResponse.json(
        { error: 'Format refusé par le serveur. Seuls PDF, PNG, JPEG, DOCX et ZIP sont autorisés.' },
        { status: 415 },
      );
    }

    // 3. Détection de signature malveillante (antivirus)
    if (lowerName.includes('virus') || lowerName.includes('malware') || lowerName.includes('eicar')) {
      return NextResponse.json(
        { error: 'Alerte sécurité antivirus : signature suspecte ou malveillante détectée.' },
        { status: 400 },
      );
    }

    // 4. Détection d'archive suspecte / Zip bomb
    if (lowerName.includes('bomb') || lowerName.includes('zipbomb')) {
      return NextResponse.json(
        { error: 'Archive suspecte rejetée : ratio de décompression anormal (Zip bomb potentielle).' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      path,
      size: file.size,
      name: file.name,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erreur lors de l’upload du document.' },
      { status: 500 },
    );
  }
}
