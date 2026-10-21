'use client';

import React, { useState } from 'react';
import { X, Plus, Users, Check, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockCandidatesRaw } from '@/lib/mock/data/candidates';
import type { PipelineCandidacy } from '@/lib/pipeline/pipeline-store';

interface AddCandidatesDialogProps {
  isOpen: boolean;
  folderId: string;
  existingCandidacies: PipelineCandidacy[];
  onClose: () => void;
  onAddCandidate: (candidateId: string) => Promise<void>;
}

export function AddCandidatesDialog({
  isOpen,
  folderId,
  existingCandidacies,
  onClose,
  onAddCandidate,
}: AddCandidatesDialogProps) {
  const [search, setSearch] = useState('');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const existingCandIds = new Set(existingCandidacies.map((c) => c.candidateId));

  const available = mockCandidatesRaw
    .filter((c) => !existingCandIds.has(c.id))
    .filter(
      (c) =>
        !search.trim() ||
        c.pseudonym.toLowerCase().includes(search.toLowerCase()) ||
        c.currentTitle.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );

  const handleAdd = async (candId: string) => {
    await onAddCandidate(candId);
    setAddedIds((prev) => [...prev, candId]);
  };

  return (
    <div
      data-testid="add-candidates-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Ajouter des profils au pipeline
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Recherche */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par pseudonyme, titre ou compétence..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Liste */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 text-xs">
          {available.length === 0 ? (
            <p className="text-center text-slate-400 py-6">
              Tous les profils du vivier sont déjà positionnés dans le pipeline.
            </p>
          ) : (
            available.map((cand) => {
              const isAdded = addedIds.includes(cand.id);
              return (
                <div
                  key={cand.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {cand.pseudonym}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {cand.aiMatchScore || 85}%
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {cand.currentTitle}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {cand.skills.slice(0, 3).join(', ')} • {cand.yearsExperience} ans
                    </p>
                  </div>

                  <Button
                    size="sm"
                    disabled={isAdded}
                    onClick={() => handleAdd(cand.id)}
                    className="h-7 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        <span>Ajouté</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        <span>Ajouter</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Pied */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
