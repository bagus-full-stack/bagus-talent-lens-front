'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  User,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import {
  type DsrType,
  DSR_TYPE_LABELS,
  type CreateDsrInput,
} from '@/lib/schemas/dsr';
import { mockCandidatesRaw, type MockCandidateRecord } from '@/lib/mock/data/candidates';
import { createDsrAction } from '@/app/actions/dsr';

export interface NewDsrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDsr: any) => void;
}

export function NewDsrModal({ isOpen, onClose, onSuccess }: NewDsrModalProps) {
  const { user, role } = useAuth();

  const [requestType, setRequestType] = useState<DsrType>('erasure');
  const [candidateQuery, setCandidateQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<MockCandidateRecord | null>(null);

  const [receivedVia, setReceivedVia] = useState<'direct_email' | 'web_form' | 'registered_mail'>('direct_email');
  const [idVerified, setIdVerified] = useState<boolean>(true);
  const [idVerificationNote, setIdVerificationNote] = useState<string>('');
  const [initialComment, setInitialComment] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recherche de candidats en temps réel par nom ou email
  const searchResults =
    candidateQuery.trim().length >= 2
      ? mockCandidatesRaw
          .filter(
            (c) =>
              c.fullName?.toLowerCase().includes(candidateQuery.toLowerCase()) ||
              c.email?.toLowerCase().includes(candidateQuery.toLowerCase()) ||
              c.pseudonym?.toLowerCase().includes(candidateQuery.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const handleSelectCandidate = (cand: MockCandidateRecord) => {
    setSelectedCandidate(cand);
    setCandidateQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCandidate) {
      setErrorMessage('Veuillez rechercher et sélectionner un candidat concerné.');
      return;
    }

    if (!idVerified || idVerificationNote.trim().length < 5) {
      setErrorMessage(
        'La méthode de vérification d’identité est obligatoire (ex: CNI, passeport, FranceConnect, au moins 5 caractères).'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateDsrInput = {
        requestType,
        candidateId: selectedCandidate.id,
        candidatePseudonym: `Candidat #${selectedCandidate.pseudonym}`,
        candidateRealName: selectedCandidate.fullName,
        candidateEmail: selectedCandidate.email || `${selectedCandidate.pseudonym.toLowerCase()}@candidat-talentlens.fr`,
        folderReference: selectedCandidate.folderId === 'fld-de-2026' ? '#DE-2026' : selectedCandidate.folderId === 'fld-cyb-88' ? '#CYB-88' : '#FULL-12',
        receivedVia,
        idVerified,
        idVerificationNote: idVerificationNote.trim(),
        assignedDpoId: user?.id || 'usr_severine_petit',
        assignedDpoName: user?.name || 'Séverine Petit (DPO)',
        initialComment: initialComment.trim() || undefined,
      };

      const result = await createDsrAction(input, {
        id: user?.id || 'usr_severine_petit',
        name: user?.name || 'Séverine Petit',
        role: role,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Échec de création de la demande');
      }

      onSuccess(result.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création de la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <FileCheck2 className="h-4 w-4" />
            <span>Assistant RGPD · Enregistrement de Demande DSR</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Nouvelle demande d'exercice des droits
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Conforme aux Articles 15 à 22 du RGPD. Enregistre une demande et enclenche le compte à rebours légal de 30 jours calendaires.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* 1. Type de demande */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Type de droit exercé (RGPD) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DSR_TYPE_LABELS) as DsrType[]).map((type) => {
                const info = DSR_TYPE_LABELS[type];
                const isSelected = requestType === type;
                return (
                  <div
                    key={type}
                    onClick={() => setRequestType(type)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {info.label}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {info.article}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Recherche et sélection du candidat */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Candidat concerné <span className="text-rose-500">*</span>
            </label>

            {selectedCandidate ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedCandidate.pseudonym.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {selectedCandidate.fullName || `Candidat #${selectedCandidate.pseudonym}`}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        #{selectedCandidate.pseudonym}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedCandidate.email} · {selectedCandidate.currentTitle}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCandidate(null)}
                  className="h-7 text-xs text-slate-500 hover:text-rose-600"
                >
                  Changer
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom (ex: Lucas Meyer), email ou pseudonyme (#A1B2)..."
                  value={candidateQuery}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Menu des résultats instantanés */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => handleSelectCandidate(cand)}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {cand.fullName} <span className="font-mono text-slate-400">({cand.pseudonym})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{cand.email} · {cand.currentTitle}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Sélectionner
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Canal de réception */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Canal de réception
              </label>
              <select
                value={receivedVia}
                onChange={(e) => setReceivedVia(e.target.value as any)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="direct_email">Courrier électronique direct (dpo@talentlens.fr)</option>
                <option value="web_form">Formulaire en ligne de demande RGPD</option>
                <option value="registered_mail">Courrier postal recommandé avec AR</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Délai réglementaire CNIL
              </label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>30 jours calendaires au maximum (Art. 12.3 RGPD)</span>
              </div>
            </div>
          </div>

          {/* 4. Identité vérifiée (Obligatoire) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Identité du demandeur formellement vérifiée</span>
              </label>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                Contrôle CNIL
              </Badge>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Méthode de vérification & justification d'identité <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={idVerificationNote}
                onChange={(e) => setIdVerificationNote(e.target.value)}
                placeholder="Ex: CNI contrôlée via portail sécurisé / FranceConnect / passeport avec filigrane"
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 5. Commentaire initial */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Commentaire de prise en charge (Optionnel)
            </label>
            <textarea
              rows={2}
              value={initialComment}
              onChange={(e) => setInitialComment(e.target.value)}
              placeholder="Précisions de contexte transmises par le candidat..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedCandidate || !idVerified || idVerificationNote.trim().length < 5}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la demande'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
