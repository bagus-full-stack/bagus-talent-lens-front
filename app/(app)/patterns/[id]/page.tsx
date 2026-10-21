import React from 'react';
import { notFound } from 'next/navigation';
import { getPatternRepository } from '@/lib/api';
import { PatternEditor } from '@/components/patterns/editor/pattern-editor';
import { DEFAULT_SOCLE_FIELDS, generateJsonSchema } from '@/lib/schemas/pattern';

interface PatternDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PatternDetailPageProps) {
  const { id } = await params;
  const patternRepo = getPatternRepository();
  const pattern = await patternRepo.getById(id);

  if (!pattern) {
    return {
      title: 'Pattern introuvable | TalentShield',
    };
  }

  return {
    title: `Éditeur : ${pattern.name} (${pattern.activeVersion}) | TalentShield`,
    description: pattern.description,
  };
}

export default async function PatternDetailPage({ params }: PatternDetailPageProps) {
  const { id } = await params;
  const patternRepo = getPatternRepository();
  const pattern = await patternRepo.getById(id);

  if (!pattern) {
    notFound();
  }

  // Récupérer la version active et toutes les versions
  const allVersions = await patternRepo.getVersions(pattern.id);
  let activeVersion = await patternRepo.getVersion(pattern.id, pattern.activeVersion);

  if (!activeVersion) {
    activeVersion = {
      id: `ver-${pattern.id}-init`,
      patternId: pattern.id,
      version: pattern.activeVersion,
      status: pattern.status === 'draft' ? 'draft' : 'active',
      fields: [...DEFAULT_SOCLE_FIELDS],
      schemaJson: JSON.stringify(
        generateJsonSchema(DEFAULT_SOCLE_FIELDS, { id: pattern.id, version: pattern.activeVersion }),
        null,
        2,
      ),
      createdAt: new Date().toISOString(),
    };
  }

  return (
    <PatternEditor
      initialPattern={pattern}
      initialVersion={activeVersion}
      allVersions={allVersions.length > 0 ? allVersions : [activeVersion]}
    />
  );
}
