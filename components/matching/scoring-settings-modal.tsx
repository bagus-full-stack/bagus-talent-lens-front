'use client';

import React, { useState } from 'react';
import {
  X,
  Sliders,
  History,
  ShieldCheck,
  Lock,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import type { ScoringWeights, MatchRunHistoryItem } from '@/lib/matching/types';
import { useToast } from '@/components/shared/form-and-toast';

interface ScoringSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: ScoringWeights;
  onChangeWeights: (updated: ScoringWeights) => void;
  history: MatchRunHistoryItem[];
}

export function ScoringSettingsModal({
  isOpen,
  onClose,
  weights,
  onChangeWeights,
  history,
}: ScoringSettingsModalProps) {
  const { role } = useAuth();
  const { addToast } = useToast();
  const isAdmin = role === 'admin';

  const [indispensableWeight, setIndispensableWeight] = useState(weights.indispensableWeight);
  const [souhaiteWeight, setSouhaiteWeight] = useState(weights.souhaiteWeight);
  const [similarityWeight, setSimilarityWeight] = useState(weights.similarityWeight);

  if (!isOpen) return null;

  const total = indispensableWeight + souhaiteWeight + similarityWeight;

  const handleSave = () => {
    if (total !== 100) {
      addToast({
        type: 'error',
        title: 'Somme des pondérations invalide',
        message: `La somme des poids doit être strictement égale à 100% (actuellement ${total}%).`,
      });
      return;
    }

    const nextWeights: ScoringWeights = {
      indispensableWeight,
      souhaiteWeight,
      similarityWeight,
      version: 'v2.5 - ' + new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Administrateur TalentLens',
    };

    onChangeWeights(nextWeights);
    addToast({
      type: 'success',
      title: 'Pondérations algorithmiques mises à jour',
      message: `Version ${nextWeights.version} enregistrée et diffusée sur tous les calculs de matching.`,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scoring-settings-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="scoring-settings-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Réglages de scoring & Pondérations</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {weights.version}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paramétrage du modèle mathématique d'adéquation prédictive (AI Act).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge Rôle et Droit de modification */}
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            isAdmin
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              {isAdmin
                ? 'Profil Administrateur : Vous disposez des droits de modification des pondérations.'
                : 'Profil Recruteur : Les pondérations sont en lecture seule pour préserver la neutralité.'}
            </span>
          </div>

          <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0">
            {isAdmin ? 'Mode Éditeur (Admin)' : 'Lecture seule (Recruteur)'}
          </Badge>
        </div>

        {/* Sliders de pondération */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Répartition des piliers décisionnels :
            </span>
            <span
              className={`font-mono font-bold text-xs ${
                total === 100 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              Total : {total}% / 100%
            </span>
          </div>

          {/* 1. Indispensables */}
          <div className="space-y-1 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Poids des critères indispensables (Must-Have)
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {indispensableWeight}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              disabled={!isAdmin}
              value={indispensableWeight}
              onChange={(e) => setIndispensableWeight(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block">
              Garantit l'élimination progressive si les compétences clés de l'offre font défaut.
            </span>
          </div>

          {/* 2. Souhaités */}
          <div className="space-y-1 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Poids des critères souhaités (Nice-To-Have)
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {souhaiteWeight}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              disabled={!isAdmin}
              value={souhaiteWeight}
              onChange={(e) => setSouhaiteWeight(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block">
              Valorise les atouts complémentaires sans pénaliser lourdement les profils solides.
            </span>
          </div>

          {/* 3. Similarité vectorielle */}
          <div className="space-y-1 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Poids de la similarité sémantique globale (NLP)
              </span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {similarityWeight}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              disabled={!isAdmin}
              value={similarityWeight}
              onChange={(e) => setSimilarityWeight(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block">
              Mesure la proximité lexicale et vectorielle entre le texte du CV et le texte de l'offre.
            </span>
          </div>
        </div>

        {/* Historique des matchings récents */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <History className="w-4 h-4 text-slate-500" />
            <span>Historique des sessions de matching (Audit Realtime)</span>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{h.folderReference}</span>
                    <span className="text-slate-500 truncate max-w-xs">{h.jobTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.timestamp).toLocaleString('fr-FR')} · {h.weightsVersion}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Top {h.topScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {h.candidatesCount} candidats
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fermer
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={total !== 100}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer la nouvelle version</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
