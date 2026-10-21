import React from 'react';
import { getPatternRepository } from '@/lib/api';
import { PatternsListView } from '@/components/patterns/patterns-list-view';

export const metadata = {
  title: 'Patterns d’extraction sémantique | TalentShield',
  description: 'Gestion des schémas d’extraction IA et contrôle des champs PII.',
};

export default async function PatternsPage() {
  const patternRepo = getPatternRepository();
  const patterns = await patternRepo.getAll();

  return <PatternsListView initialPatterns={patterns} />;
}
