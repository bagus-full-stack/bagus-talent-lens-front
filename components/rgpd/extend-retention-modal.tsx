'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  FileText,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CvRetentionItem } from '@/lib/schemas/rgpd-governance';
import { extendRetentionAction } from '@/app/actions/rgpd';
import { useAuth } from '@/lib/auth/auth-context';

export interface ExtendRetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CvRetentionItem | null;
  onSuccess: (updated: CvRetentionItem) => void;
}

export function ExtendRetentionModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: ExtendRetentionModalProps) {
  const { user, role } = useAuth();
  const [months, setMonths] = useState<number>(12);
  const [consentDate, setConsentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [consentText, setConsentText] = useState<string>('');
  const [consentSource, setConsentSource] = useState<string>(
    'Formulaire web - Réengagement TalentLens'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation frontale stricte
    if (!consentDate.trim()) {
      setErrorMessage('La date de recueil du consentement est obligatoire.');
      return;
    }
    if (!consentText.trim() || consentText.trim().length < 10) {
      setErrorMessage(
        'Le texte exact de consentement présenté au candidat doit comporter au moins 10 caractères.'
      );
      return;
    }
    if (!consentSource.trim()) {
      setErrorMessage('La source vérifiable du consentement est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      const res = await extendRetentionAction(
        {
          candidateId: item.candidateId,
          months,
          consentDate,
          consentText,
          consentSource,
        },
        {
          id: user?.id || 'usr-dpo',
          name: user?.name || 'Séverine Petit',
          role: role || 'dpo',
        }
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Refus de prolongation.');
        return;
      }

      if (res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la prolongation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Prolonger la conservation légale
              </h3>
              <p className="text-xs text-slate-500">
                {item.candidatePseudonym} · Dossier {item.folderReference}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Rappel d'exigence CNIL */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="font-semibold">Exigence stricte CNIL (Art. 7 RGPD) :</strong>
            <p className="mt-0.5">
              Toute prolongation au-delà du cycle standard exige la conservation formelle d&apos;une preuve de consentement explicite, libre et éclairé. Le refus est automatique en cas d&apos;élément manquant.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Durée de prolongation souhaitée
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    months === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  +{m} mois {m === 24 && '(Max légal)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date de recueil du consentement <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={consentDate}
              onChange={(e) => setConsentDate(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Source vérifiable du consentement <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="Ex: Formulaire web opt-in, Email de réengagement signé..."
              value={consentSource}
              onChange={(e) => setConsentSource(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Texte exact de consentement présenté au candidat <span className="text-red-500">*</span>
            </label>
            <Textarea
              required
              rows={3}
              placeholder="Ex: « J'accepte que le cabinet TalentLens conserve mon CV pour une durée de 24 mois aux fins de me proposer de futures opportunités. »"
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              className="text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ce texte sera scellé cryptographiquement dans le registre d&apos;audit WORM.
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {loading ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enregistrer la prolongation</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
