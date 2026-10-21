'use client';

import React, { useState } from 'react';
import {
  X,
  Settings2,
  ArrowUp,
  ArrowDown,
  Lock,
  Save,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  PipelineStageConfig,
  StageCategory,
} from '@/lib/pipeline/pipeline-store';

interface StageConfigDialogProps {
  isOpen: boolean;
  stages: PipelineStageConfig[];
  onClose: () => void;
  onSaveStages: (updatedStages: PipelineStageConfig[]) => Promise<void>;
}

export function StageConfigDialog({
  isOpen,
  stages,
  onClose,
  onSaveStages,
}: StageConfigDialogProps) {
  const [localStages, setLocalStages] = useState<PipelineStageConfig[]>(stages);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (id: string, newName: string) => {
    setLocalStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleCategoryChange = (id: string, newCat: StageCategory) => {
    setLocalStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, category: newCat } : s))
    );
  };

  const handleUnmaskToggle = (id: string) => {
    setLocalStages((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isUnmaskTrigger: !s.isUnmaskTrigger } : s
      )
    );
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localStages.length) return;

    const copy = [...localStages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Réassignation des numéros d'ordre
    const reordered = copy.map((s, i) => ({ ...s, order: i + 1 }));
    setLocalStages(reordered);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveStages(localStages);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="stage-config-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Configuration des étapes du pipeline (Rôle Admin)
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Liste des étapes éditables */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          <p className="text-slate-500 text-[11px] mb-2">
            Réordonnez, renommez ou ajustez la catégorie des étapes. Les étapes de catégorie « Perdue » exigent un motif codé obligatoire. Les étapes avec point de contact déclenchent la ré-authentification pour levée du mode aveugle.
          </p>

          {localStages.map((stg, idx) => (
            <div
              key={stg.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              {/* Ordre + Nom */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveOrder(idx, 'up')}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                    aria-label={`Monter ${stg.name}`}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === localStages.length - 1}
                    onClick={() => moveOrder(idx, 'down')}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                    aria-label={`Descendre ${stg.name}`}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                <span className="font-mono text-slate-400 text-[11px] w-5 text-center">
                  #{stg.order}
                </span>

                <input
                  type="text"
                  value={stg.name}
                  onChange={(e) => handleNameChange(stg.id, e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 flex-1 max-w-[180px]"
                />
              </div>

              {/* Catégorie */}
              <div className="flex items-center gap-2">
                <select
                  value={stg.category}
                  onChange={(e) => handleCategoryChange(stg.id, e.target.value as StageCategory)}
                  aria-label={`Catégorie pour ${stg.name}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-medium"
                >
                  <option value="active">Active (En cours)</option>
                  <option value="won">Gagnée (Embauché)</option>
                  <option value="lost">Perdue (Refusé)</option>
                </select>

                {/* Point de levée d'anonymat */}
                <button
                  type="button"
                  onClick={() => handleUnmaskToggle(stg.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium cursor-pointer ${
                    stg.isUnmaskTrigger
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                      : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                  }`}
                  title="Exige la ré-authentification 2FA pour lever l'anonymat à cette étape"
                >
                  <Lock className="h-3 w-3" />
                  <span>{stg.isUnmaskTrigger ? 'Point de rupture 2FA' : 'Standard'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pied */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
