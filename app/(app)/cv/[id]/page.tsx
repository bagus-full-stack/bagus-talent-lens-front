import React from 'react';
import { notFound } from 'next/navigation';
import { getCvRepository } from '@/lib/api';
import { getServerCurrentUser } from '@/lib/auth/session';
import { CvViewContainer } from '@/components/cv/cv-view-container';

interface CvDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CvDetailPageProps) {
  const { id } = await params;
  const repo = getCvRepository();
  const cv = await repo.getCvDetail(id, true);

  if (!cv) {
    return {
      title: 'Candidat introuvable | TalentShield',
    };
  }

  return {
    title: `${cv.pseudonym} · ${cv.currentTitle} | TalentShield`,
    description: `Fiche d’évaluation et d'extraction sémantique conforme RGPD pour ${cv.pseudonym}`,
  };
}

export default async function CvDetailPage({ params }: CvDetailPageProps) {
  const { id } = await params;
  const user = await getServerCurrentUser();
  const repo = getCvRepository();

  // RÈGLE ABSOLUE : Mode aveugle actif par défaut côté serveur
  const cv = await repo.getCvDetail(id, true, user?.id);

  if (!cv) {
    notFound();
  }

  return <CvViewContainer initialCandidate={cv} />;
}
