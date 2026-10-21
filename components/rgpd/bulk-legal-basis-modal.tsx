'use client';

import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { bulkUpdateLegalBasisAction } from '@/app/actions/rgpd';
import { useAuth } from '@/lib/auth/auth-context';

export interface BulkLegalBasisModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
  onSuccess: (count: number) => void;
}

export function BulkLegalBasisModal({
  isOpen,
  onClose,
  candidateIds,
  onSuccess,
}: BulkLegalBasisModalProps) {
  const { user, role } = useAuth();
  const [legalBasis, setLegalBasis] = useState<
    'consentement' | 'interet_legitime' | 'contrat' | 'obligation_legale'
  >('consentement');
  const [source, setSource] = useState<string>('Campagne de régularisation TalentLens');
  const [consentDate, setConsentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [consentText, setConsentText] = useState<string>(
    'Régularisation documentée de la base légale avec archivage de la preuve.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || candidateIds.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!source.trim()) {
      setErrorMessage('La source de justification est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      const res = await bulkUpdateLegalBasisAction(
        {
          candidateIds,
          legalBasis,
          source: source.trim(),
          consentDate,
          consentText,
        },
        {
          id: user?.id || 'usr-dpo',
          name: user?.name || 'Séverine Petit',
          role: role || 'dpo',
        }
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors de la mise à jour.');
        return;
      }

      onSuccess(res.data?.count || candidateIds.length);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Régularisation en masse de base légale
              </h3>
              <p className="text-xs text-slate-500">
                {candidateIds.length} profils candidats sélectionnés
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Base légale applicable (Art. 6 RGPD) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {[
                { val: 'consentement', label: 'Consentement explicite (Art. 6.1.a)', desc: 'Accord préalable et positif du candidat' },
                { val: 'interet_legitime', label: 'Intérêt légitime documenté (Art. 6.1.f)', desc: 'Sourcing direct avec notification Art. 14' },
                { val: 'contrat', label: 'Exécution précontractuelle (Art. 6.1.b)', desc: 'Processus d’embauche actif ou prestation' },
                { val: 'obligation_legale', label: 'Obligation légale (Art. 6.1.c)', desc: 'Exigence réglementaire ou légale' },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                    legalBasis === opt.val
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="legalBasis"
                    checked={legalBasis === opt.val}
                    onChange={() => setLegalBasis(opt.val as any)}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-slate-500">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Source de la justification <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Ex: Campagne d'opt-in email, InMail LinkedIn..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date d&apos;effet / recueil
            </label>
            <Input
              type="date"
              value={consentDate}
              onChange={(e) => setConsentDate(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Note explicative / Référence de la preuve
            </label>
            <Textarea
              rows={2}
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Actions */}
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
                <span>Mise à jour...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Régulariser ({candidateIds.length})</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
