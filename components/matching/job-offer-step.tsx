'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  FileCheck2,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { mockFolders } from '@/lib/mock/data/folders';
import {
  PRESET_JOB_OFFERS,
  SAMPLE_JOB_OFFER_TEXT,
} from '@/lib/matching/mock-data';
import type { StructuredOfferCriteria } from '@/lib/matching/types';
import { StructuredCriteriaDnd } from './structured-criteria-dnd';

interface JobOfferStepProps {
  criteria: StructuredOfferCriteria;
  onChangeCriteria: (criteria: StructuredOfferCriteria) => void;
  onLaunchMatching: () => void;
  isMatchingRunning: boolean;
}

export function JobOfferStep({
  criteria,
  onChangeCriteria,
  onLaunchMatching,
  isMatchingRunning,
}: JobOfferStepProps) {
  const [inputMode, setInputMode] = useState<'text' | 'upload' | 'preset'>('preset');
  const [rawText, setRawText] = useState(SAMPLE_JOB_OFFER_TEXT);
  const [selectedFolderId, setSelectedFolderId] = useState(criteria.folderId);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [isOfferTooVague, setIsOfferTooVague] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(true);

  // Changement de dossier -> mise à jour de l'offre
  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    if (PRESET_JOB_OFFERS[folderId]) {
      onChangeCriteria(PRESET_JOB_OFFERS[folderId]);
      setIsOfferTooVague(false);
    }
  };

  // Analyse du texte ou du PDF avec progression en temps réel
  const handleStartAnalysis = (textToAnalyze: string) => {
    const trimmed = textToAnalyze.trim();

    // Détection d'offre trop vague (état "offre trop vague")
    if (trimmed.length < 25) {
      setIsOfferTooVague(true);
      return;
    }

    setIsOfferTooVague(false);
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisStatusText('Extraction du texte et normalisation de l’offre...');

    setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisStatusText('Identification des compétences indispensables & prérequis...');
    }, 400);

    setTimeout(() => {
      setAnalysisProgress(80);
      setAnalysisStatusText('Catégorisation des atouts souhaités et du niveau de séniorité...');
    }, 850);

    setTimeout(() => {
      setAnalysisProgress(100);
      setAnalysisStatusText('Analyse terminée avec succès !');
      setIsAnalyzing(false);
      setHasAnalyzed(true);

      // Si c'est le texte par défaut ou un texte custom, génère des critères
      if (PRESET_JOB_OFFERS[selectedFolderId]) {
        onChangeCriteria(PRESET_JOB_OFFERS[selectedFolderId]);
      }
    }, 1250);
  };

  const handleSimulatePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawText(`FICHIER IMPORTÉ : ${file.name}\n\n${SAMPLE_JOB_OFFER_TEXT}`);
      handleStartAnalysis(SAMPLE_JOB_OFFER_TEXT);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de source de l'offre */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              1. Choix du dossier de recrutement
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFolderId}
              onChange={(e) => handleSelectFolder(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {mockFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.reference} — {f.title} ({f.totalCandidates} candidats)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Onglets de saisie de l'offre : Presets, Texte collé, Import PDF */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setInputMode('preset');
                setIsOfferTooVague(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                inputMode === 'preset'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Modèle du dossier ({criteria.folderReference})
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMode('text');
                setIsOfferTooVague(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                inputMode === 'text'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Coller le texte de l'offre
            </button>

            <button
              type="button"
              onClick={() => {
                setInputMode('upload');
                setIsOfferTooVague(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                inputMode === 'upload'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Importer un PDF d'offre
            </button>
          </div>

          {/* Mode 1 : Modèle preset */}
          {inputMode === 'preset' && (
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 dark:border-indigo-950 dark:bg-indigo-950/20 text-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                  {criteria.jobTitle}
                </span>
                <p className="text-slate-500 text-[11px]">
                  Fiche de poste standard pour {criteria.folderReference} ({criteria.seniority} · {criteria.location})
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartAnalysis(SAMPLE_JOB_OFFER_TEXT)}
                className="h-8 text-xs gap-1.5 shrink-0 bg-white dark:bg-slate-900"
              >
                <RefreshCw className="w-3 h-3 text-indigo-600" />
                <span>Réanalyser</span>
              </Button>
            </div>
          )}

          {/* Mode 2 : Texte collé */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <Textarea
                rows={5}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (e.target.value.trim().length >= 25) setIsOfferTooVague(false);
                }}
                placeholder="Collez ici l'intégralité de la fiche de poste ou les exigences formulées par le client..."
                className="text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />

              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRawText('Offre ingénieur');
                    handleStartAnalysis('Offre ingénieur');
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Tester l'état « Offre trop vague »
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleStartAnalysis(rawText)}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Analyser les critères structurés</span>
                </Button>
              </div>
            </div>
          )}

          {/* Mode 3 : Import PDF */}
          {inputMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-3 hover:border-indigo-400 transition-colors">
              <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Déposez la fiche de poste PDF ici ou cliquez pour parcourir
                </p>
                <p className="text-[11px] text-slate-400">
                  Formats supportés : PDF, DOCX (Max. 10 Mo)
                </p>
              </div>

              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleSimulatePdfUpload}
                  className="hidden"
                />
                <Button size="sm" variant="outline" className="text-xs gap-1.5 pointer-events-none">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sélectionner un fichier PDF</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* ÉTAT : Analyse en cours avec progression */}
        {isAnalyzing && (
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{analysisStatusText}</span>
              </span>
              <span className="font-mono font-bold text-indigo-600">{analysisProgress}%</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ÉTAT : Offre trop vague (invite à préciser) */}
        {isOfferTooVague && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-200"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold block">
                Offre trop vague pour un matching prédictif impartial :
              </strong>
              <p className="text-[11px] leading-relaxed">
                Le descriptif fourni est trop sommaire (moins de 25 caractères). Pour garantir une analyse d'adéquation fiable et explicable (AI Act), veuillez préciser au minimum 2 compétences indispensables, le périmètre technologique et le niveau d'expérience requis.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRawText(SAMPLE_JOB_OFFER_TEXT);
                  handleStartAnalysis(SAMPLE_JOB_OFFER_TEXT);
                }}
                className="h-7 text-[11px] mt-1 bg-white dark:bg-slate-900 border-amber-300 text-amber-900"
              >
                <span>Utiliser un descriptif complet d'exemple</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Critères structurés éditables avec glisser-déposer (dnd-kit) */}
      {hasAnalyzed && !isAnalyzing && !isOfferTooVague && (
        <StructuredCriteriaDnd
          criteria={criteria}
          onChangeCriteria={onChangeCriteria}
          onLaunchMatching={onLaunchMatching}
          isLaunching={isMatchingRunning}
        />
      )}
    </div>
  );
}
