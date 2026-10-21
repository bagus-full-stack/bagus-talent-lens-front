'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Sliders,
  History,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlindModeBadge } from '@/components/shared/blind-mode-badge';
import { ReasonDialog } from '@/components/shared/reason-dialog';
import { useToast } from '@/components/shared/form-and-toast';
import {
  PRESET_JOB_OFFERS,
  DEFAULT_SCORING_WEIGHTS,
  INITIAL_MATCH_RUN_HISTORY,
  calculateMatchingResults,
} from '@/lib/matching/mock-data';
import type {
  StructuredOfferCriteria,
  CandidateMatchResult,
  ScoringWeights,
  MatchRunHistoryItem,
} from '@/lib/matching/types';
import { JobOfferStep } from '@/components/matching/job-offer-step';
import { MatchingResultsView } from '@/components/matching/matching-results-view';
import { MatchingDetailDrawer } from '@/components/matching/matching-detail-drawer';
import { CandidateComparisonModal } from '@/components/matching/candidate-comparison-modal';
import { ScoringSettingsModal } from '@/components/matching/scoring-settings-modal';

export default function MatchingPage() {
  const { addToast } = useToast();

  // Étape active : ÉTAPE 1 (Offre & Critères) ou ÉTAPE 2 (Résultats & Explicabilité)
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2'>('step1');

  // Critères de l'offre
  const [criteria, setCriteria] = useState<StructuredOfferCriteria>(() => {
    return PRESET_JOB_OFFERS['fld-de-2026'];
  });

  // Pondérations de scoring
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS);

  // Historique des sessions de matching
  const [history, setHistory] = useState<MatchRunHistoryItem[]>(INITIAL_MATCH_RUN_HISTORY);

  // Résultats de matching calculés
  const [results, setResults] = useState<CandidateMatchResult[]>(() => {
    return calculateMatchingResults(PRESET_JOB_OFFERS['fld-de-2026'], DEFAULT_SCORING_WEIGHTS);
  });

  // Progression asynchrone Realtime de `match_run`
  const [isRealtimeRunning, setIsRealtimeRunning] = useState(false);
  const [realtimeProgress, setRealtimeProgress] = useState(0);

  // Tiroir de détail
  const [selectedDrawerResult, setSelectedDrawerResult] = useState<CandidateMatchResult | null>(null);

  // Modale de réglages
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modale de comparaison côte à côte (2 à 4 candidats)
  const [comparisonCandidates, setComparisonCandidates] = useState<CandidateMatchResult[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Dialogue de rejet avec motif obligatoire (<ReasonDialog>)
  const [candidateToDiscard, setCandidateToDiscard] = useState<CandidateMatchResult | null>(null);

  // Lancement du matching asynchrone (Realtime)
  const handleLaunchMatching = () => {
    setCurrentStep('step2');
    setIsRealtimeRunning(true);
    setRealtimeProgress(10);

    setTimeout(() => setRealtimeProgress(35), 300);
    setTimeout(() => setRealtimeProgress(68), 650);
    setTimeout(() => setRealtimeProgress(92), 1000);
    setTimeout(() => {
      setRealtimeProgress(100);
      setIsRealtimeRunning(false);

      const calculated = calculateMatchingResults(criteria, scoringWeights);
      setResults(calculated);

      // Ajout à l'historique
      const newHistoryItem: MatchRunHistoryItem = {
        id: `run-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        jobTitle: criteria.jobTitle,
        folderReference: criteria.folderReference,
        candidatesCount: calculated.length,
        topScore: calculated[0]?.overallScore || 0,
        weightsVersion: scoringWeights.version,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);

      addToast({
        type: 'success',
        title: 'Matching Realtime finalisé',
        message: `${calculated.length} candidats analysés et classés pour ${criteria.folderReference}.`,
      });
    }, 1300);
  };

  // Actions recruteur
  const handleShortlistCandidate = (candidateId: string) => {
    setResults((prev) =>
      prev.map((r) => (r.candidate.id === candidateId ? { ...r, status: 'shortlisted' } : r))
    );
    addToast({
      type: 'success',
      title: 'Candidat ajouté à la shortlist',
      message: 'Le profil a été placé dans la shortlist active du dossier.',
    });
  };

  const handlePipelineCandidate = (candidateId: string) => {
    setResults((prev) =>
      prev.map((r) => (r.candidate.id === candidateId ? { ...r, status: 'pipelined' } : r))
    );
    addToast({
      type: 'success',
      title: 'Candidat positionné dans le pipeline',
      message: 'La candidature a été déplacée à l’étape « Entretien technique ».',
    });
  };

  const handleConfirmDiscard = (reason: string) => {
    if (!candidateToDiscard) return;
    const discardedId = candidateToDiscard.candidate.id;

    setResults((prev) =>
      prev.map((r) =>
        r.candidate.id === discardedId
          ? { ...r, status: 'discarded', discardReason: reason }
          : r
      )
    );

    addToast({
      type: 'warning',
      title: 'Candidat écarté de l’offre',
      message: `Motif enregistré au registre d’audit : « ${reason} ».`,
    });

    setCandidateToDiscard(null);
    if (selectedDrawerResult?.candidate.id === discardedId) {
      setSelectedDrawerResult(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
              Recrutement
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              Matching prédictif
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span>Matching prédictif & Explicabilité</span>
            <Badge
              variant="secondary"
              className="font-mono text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              {scoringWeights.version}
            </Badge>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyse d'adéquation compétences / exigences de poste, sans variable socio-démographique ou discriminatoire.
          </p>
        </div>

        {/* Stepper : ÉTAPE 1 (Offre) / ÉTAPE 2 (Résultats) */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setCurrentStep('step1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentStep === 'step1'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            1. Offre & Critères
          </button>

          <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>

          <button
            type="button"
            onClick={() => setCurrentStep('step2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentStep === 'step2'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            2. Résultats & Explicabilité ({results.length})
          </button>
        </div>
      </div>

      {/* VUE ÉTAPE 1 : Offre & Critères structurés (dnd-kit) */}
      {currentStep === 'step1' && (
        <JobOfferStep
          criteria={criteria}
          onChangeCriteria={setCriteria}
          onLaunchMatching={handleLaunchMatching}
          isMatchingRunning={isRealtimeRunning}
        />
      )}

      {/* VUE ÉTAPE 2 : Résultats, Classement dédupliqué & Explicabilité */}
      {currentStep === 'step2' && (
        <MatchingResultsView
          criteria={criteria}
          results={results}
          onOpenDrawer={(res) => setSelectedDrawerResult(res)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenComparison={(selected) => {
            setComparisonCandidates(selected);
            setIsComparisonOpen(true);
          }}
          onBackToCriteria={() => setCurrentStep('step1')}
          onShortlistCandidate={handleShortlistCandidate}
          onPipelineCandidate={handlePipelineCandidate}
          onDiscardCandidate={(cand) => setCandidateToDiscard(cand)}
          isRealtimeRunning={isRealtimeRunning}
          realtimeProgress={realtimeProgress}
        />
      )}

      {/* Tiroir de détail (« Pourquoi ce score », skill gap, extraits sourcés) */}
      <MatchingDetailDrawer
        result={selectedDrawerResult}
        isOpen={Boolean(selectedDrawerResult)}
        onClose={() => setSelectedDrawerResult(null)}
        onShortlist={handleShortlistCandidate}
        onPipeline={handlePipelineCandidate}
        onDiscard={(cand) => setCandidateToDiscard(cand)}
      />

      {/* Modale de Comparaison de 2 à 4 candidats côte à côte */}
      <CandidateComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        candidates={comparisonCandidates}
        criteria={criteria}
        onSelectCandidateToPipeline={(id) => {
          handlePipelineCandidate(id);
          setIsComparisonOpen(false);
        }}
      />

      {/* Modale des Réglages de scoring & Pondérations */}
      <ScoringSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        weights={scoringWeights}
        onChangeWeights={(next) => {
          setScoringWeights(next);
          // Recalcul automatique avec les nouvelles pondérations
          setResults(calculateMatchingResults(criteria, next));
        }}
        history={history}
      />

      {/* Modale « Écarter avec un motif » (ReasonDialog rejection) */}
      <ReasonDialog
        isOpen={Boolean(candidateToDiscard)}
        onClose={() => setCandidateToDiscard(null)}
        onSubmit={handleConfirmDiscard}
        actionType="rejection"
        targetItemName={candidateToDiscard?.candidate.pseudonym || 'ce candidat'}
        title="Écarter la candidature avec un motif objectif"
        description="Selon l'Article L. 1132-1 du Code du travail, tout écartement de candidature doit être motivé par un critère professionnel objectif consigné au registre."
        submitButtonText="Confirmer et consigner le motif"
      />
    </div>
  );
}
