'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard, ArrowDown, ArrowUp, CornerDownLeft, EscapeForward, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['J', '↓'],
      description: 'Sélectionner le candidat / élément suivant dans la file',
    },
    {
      keys: ['K', '↑'],
      description: 'Sélectionner le candidat / élément précédent dans la file',
    },
    {
      keys: ['Entrée'],
      description: 'Valider le champ douteux actif ou confirmer l’édition en ligne',
    },
    {
      keys: ['Échap'],
      description: 'Annuler l’édition en ligne en cours ou fermer les fenêtres d’aide',
    },
    {
      keys: ['?'],
      description: 'Ouvrir / Fermer ce guide des raccourcis clavier',
    },
    {
      keys: ['N'],
      description: 'Aller directement au prochain élément non traité (« Suivant »)',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Raccourcis clavier de vérification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Naviguez et validez sans lâcher votre clavier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
            aria-label="Fermer la boîte de dialogue des raccourcis"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {sc.description}
              </span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="inline-flex items-center justify-center min-w-6 px-2 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded shadow-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            J'ai compris (Échap pour fermer)
          </button>
        </div>
      </div>
    </div>
  );
}
