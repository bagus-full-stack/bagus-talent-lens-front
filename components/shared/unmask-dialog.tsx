'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, KeyRound, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UnmaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidatePseudonym: string;
  folderReference: string;
  onConfirmUnmask: (reason: string, mfaCode: string) => void;
}

export function UnmaskDialog({
  isOpen,
  onClose,
  candidatePseudonym,
  folderReference,
  onConfirmUnmask,
}: UnmaskDialogProps) {
  const [mfaCode, setMfaCode] = useState(['4', '8', '2', '', '', '']);
  const [reason, setReason] = useState('Entretien RH technique client planifié pour finalisation du recrutement.');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newDigits = [...mfaCode];
    newDigits[index] = val;
    setMfaCode(newDigits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Le motif professionnel Art. 30 doit comporter au moins 10 caractères.');
      return;
    }
    const code = mfaCode.join('');
    if (code.length < 6) {
      setError('Veuillez saisir les 6 chiffres du code TOTP / MFA.');
      return;
    }
    setError(null);
    onConfirmUnmask(reason, code);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 uppercase">
                Élévation de privilèges
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirmez votre identité
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info Action */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <KeyRound className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Action sous contrôle RGPD :</span>
            </div>
            <p className="mt-1">
              Lever le mode aveugle pour <strong className="font-bold">{candidatePseudonym}</strong> · Dossier <strong className="font-bold">{folderReference}</strong>
            </p>
          </div>

          {/* Saisie MFA */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Code de sécurité 2FA à 6 chiffres (Google Authenticator / YubiKey)
            </label>
            <div className="flex gap-2 justify-between">
              {mfaCode.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  className="h-11 w-11 text-center font-mono text-lg font-bold rounded-md border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Synchronisation OTP : 18s restantes
            </p>
          </div>

          {/* Motif Art. 30 RGPD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motif professionnel justifiant l'action (Art. 30 RGPD) *
              </label>
              <span className="text-[10px] text-slate-400">
                ({reason.length}/10 caractères requis)
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Ex : Entretien technique client chez Société Générale prévu le 14/10."
            />
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Ce motif sera scellé et enregistré dans le journal d'audit immuable WORM.</span>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              Confirmer et enregistrer dans l'audit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
