'use client';

import React from 'react';
import { X, UploadCloud } from 'lucide-react';
import { ImportFlow } from './import-flow';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  folderTitle?: string;
}

export function ImportModal({
  isOpen,
  onClose,
  folderId,
  folderTitle,
}: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto animate-in fade-in-50 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-auto max-h-[92vh] overflow-y-auto">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold shrink-0">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="import-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Importer des CVs & Candidatures
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {folderTitle ? (
                  <>Campagne associée : <strong className="text-slate-700 dark:text-slate-300">{folderTitle}</strong></>
                ) : (
                  'Ingestion de masse, vectorisation et anonymisation anti-biais sous contrôle souverain.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Fermer la modale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parcours d'import complet */}
        <ImportFlow
          initialFolderId={folderId}
          onCloseModal={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
}
