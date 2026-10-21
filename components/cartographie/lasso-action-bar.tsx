'use client';

import React, { useState } from 'react';
import { BookmarkPlus, Check, X, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartographyPoint } from '@/lib/schemas/cartographie';

interface LassoActionBarProps {
  selectedPoints: CartographyPoint[];
  onClearSelection: () => void;
  onCreateShortlist: (points: CartographyPoint[]) => void;
}

export function LassoActionBar({
  selectedPoints,
  onClearSelection,
  onCreateShortlist,
}: LassoActionBarProps) {
  const [created, setCreated] = useState(false);

  if (selectedPoints.length === 0) return null;

  const handleCreate = () => {
    onCreateShortlist(selectedPoints);
    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      onClearSelection();
    }, 2500);
  };

  return (
    <div
      data-testid="lasso-action-bar"
      className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200"
    >
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
          {selectedPoints.length}
        </div>
        <span className="text-xs font-semibold" data-testid="lasso-selected-count">
          {selectedPoints.length} candidat{selectedPoints.length > 1 ? 's' : ''} sélectionné{selectedPoints.length > 1 ? 's' : ''} au lasso
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {created ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <Check className="h-4 w-4" />
          <span>Shortlist créée avec succès !</span>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={handleCreate}
          data-testid="btn-create-shortlist-lasso"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-medium shadow-xs"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          <span>Créer une shortlist</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
        title="Désélectionner"
        aria-label="Annuler la sélection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
