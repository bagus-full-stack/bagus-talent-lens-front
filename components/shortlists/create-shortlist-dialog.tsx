'use client';

import React, { useState } from 'react';
import { X, Bookmark, Plus, Users, Lock, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockFolders } from '@/lib/mock/data/folders';
import type { ShortlistVisibility } from '@/lib/schemas/shortlist';

interface CreateShortlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    folderId: string;
    visibility: ShortlistVisibility;
  }) => Promise<void>;
}

export function CreateShortlistDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateShortlistDialogProps) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(mockFolders[0]?.id || 'fld-de-2026');
  const [visibility, setVisibility] = useState<ShortlistVisibility>('team');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner un titre pour la shortlist.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onCreate({
        title: title.trim(),
        folderId,
        visibility,
      });
      setTitle('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid="create-shortlist-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Nouvelle shortlist de présélection
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-[11px]">
              {error}
            </div>
          )}

          {/* Titre */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Nom de la shortlist *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Top Data Architects Paris Q4"
              data-testid="input-shortlist-title"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Dossier / Offre liée */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Offre / Dossier de recrutement associé *
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              data-testid="select-shortlist-folder"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              {mockFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.reference} — {f.title}
                </option>
              ))}
            </select>
          </div>

          {/* Visibilité */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Visibilité
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('team')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 cursor-pointer transition-all ${
                  visibility === 'team'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Équipe</div>
                  <div className="text-[10px] text-slate-500">Partagée avec les recruteurs du dossier</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Lock className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">Privée</div>
                  <div className="text-[10px] text-slate-500">Visible uniquement par vous</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pied */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-8"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !title.trim()}
              data-testid="btn-submit-create-shortlist"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-medium shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{isLoading ? 'Création...' : 'Créer la shortlist'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
