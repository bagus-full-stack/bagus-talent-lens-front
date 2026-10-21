import { NextRequest } from 'next/server';
import { getIngestionRepository } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const repo = getIngestionRepository();
  const currentJob = await repo.getById(jobId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Envoyer l'état initial immédiatement
      if (currentJob) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(currentJob)}\n\n`));
      }

      // 2. Écouter les mises à jour Realtime
      const unsubscribe = repo.subscribe(jobId, (updatedJob) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(updatedJob)}\n\n`));
        } catch {
          // Fermé par le client
          unsubscribe();
        }
      });

      // Garde-fou de fermeture
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
