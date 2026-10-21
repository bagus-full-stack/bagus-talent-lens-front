import { NextRequest, NextResponse } from 'next/server';
import { getExportRepository } from '@/lib/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = getExportRepository();

    const { file, exportItem } = await repo.generateFileContent(id);
    await repo.recordDownload(id);

    return new Response(file.buffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'X-WORM-SHA256': file.sha256Hash,
        'X-Export-Id': exportItem.id,
      },
    });
  } catch (err: any) {
    const isExpired = err.message?.includes('expiré');
    return NextResponse.json(
      { error: err.message || 'Échec du téléchargement du fichier' },
      { status: isExpired ? 410 : 404 }
    );
  }
}
