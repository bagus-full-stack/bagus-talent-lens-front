'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'primary' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
              variant === 'warning'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
            )}
          >
            {variant === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </div>

          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p id="confirm-dialog-desc" className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="text-xs">
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'text-xs gap-1.5 text-white',
              variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700',
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface DestructiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  itemNameToDelete?: string;
  confirmWord?: string; // Défaut: "SUPPRIMER"
  confirmButtonText?: string;
  auditReasonRequired?: boolean;
  isLoading?: boolean;
}

export function DestructiveDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemNameToDelete,
  confirmWord = 'SUPPRIMER',
  confirmButtonText = 'Supprimer définitivement',
  auditReasonRequired = true,
  isLoading = false,
}: DestructiveDialogProps) {
  const [typedWord, setTypedWord] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const isMatch = typedWord.trim().toUpperCase() === confirmWord.toUpperCase();
  const isReasonValid = !auditReasonRequired || auditReason.trim().length >= 10;
  const canSubmit = isMatch && isReasonValid && !isLoading;

  const handleClose = () => {
    setTypedWord('');
    setAuditReason('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    setTypedWord('');
    setAuditReason('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destructive-dialog-title"
      aria-describedby="destructive-dialog-desc"
    >
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-slate-900 animate-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 id="destructive-dialog-title" className="text-base font-bold text-red-700 dark:text-red-400">
                {title}
              </h2>
              <span className="rounded bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.2 text-[10px] font-bold uppercase dark:bg-red-950 dark:text-red-300">
                Action Irréversible
              </span>
            </div>
            <p id="destructive-dialog-desc" className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mention d'audit légal RGPD */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Traçabilité & Journal d'Audit WORM :</span>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Cette suppression sera scellée cryptographiquement dans le registre d'audit immuable avec votre identifiant, horodatage et adresse IP (Art. 30 RGPD).
            </p>
          </div>
        </div>

        {/* Champ de confirmation par mot-clé */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pour confirmer, veuillez saisir le mot <strong className="text-red-600 font-mono">« {confirmWord} »</strong> ci-dessous :
          </label>
          <Input
            value={typedWord}
            onChange={(e) => setTypedWord(e.target.value)}
            placeholder={confirmWord}
            className="font-mono text-xs uppercase"
            autoFocus
            aria-label="Confirmation par mot clé"
          />
        </div>

        {/* Motif d'audit obligatoire si demandé */}
        {auditReasonRequired && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motif de suppression légale ou RGPD (min. 10 caractères) :
            </label>
            <textarea
              rows={2}
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="Ex : Demande d'effacement Art. 17 RGPD du candidat reçue le 14/03..."
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            {auditReason.length > 0 && auditReason.trim().length < 10 && (
              <p className="text-[11px] text-amber-600 font-medium">
                {10 - auditReason.trim().length} caractère(s) supplémentaire(s) requis pour l'audit légal.
              </p>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading} className="text-xs">
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Trash2 className="h-3.5 w-3.5" />
            <span>{confirmButtonText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
