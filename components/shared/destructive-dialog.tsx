'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DestructiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function DestructiveDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation de suppression',
  description = 'Cette action est irréversible et supprimera définitivement cet élément.',
  confirmButtonText = 'Supprimer définitivement',
  cancelButtonText = 'Annuler',
  itemName,
  isLoading = false,
}: DestructiveDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="destructive-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête */}
        <div className="p-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/70 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{title}</span>
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

        {/* Corps */}
        <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <p className="leading-relaxed">{description}</p>
          {itemName && (
            <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate border border-slate-200 dark:border-slate-700">
              « {itemName} »
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            data-testid="btn-destructive-cancel"
            className="text-xs h-8"
          >
            {cancelButtonText}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="btn-destructive-confirm"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 gap-1.5 font-medium shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>{isLoading ? 'Suppression...' : confirmButtonText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
