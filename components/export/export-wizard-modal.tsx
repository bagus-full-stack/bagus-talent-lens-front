'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Layers,
  Check,
  KeyRound,
  FileCheck,
  X,
} from 'lucide-react';
import { createExportAction } from '@/app/actions/export';
import { useAuth } from '@/lib/auth/auth-context';
import type { ExportFormat, ExportConfidentiality } from '@/lib/schemas/export';
import { cn } from '@/lib/utils';

interface ExportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle?: string;
  folderId?: string;
  folderReference?: string;
  shortlistId?: string;
  candidateIds?: string[];
  defaultCandidateCount?: number;
  onSuccess?: () => void;
}

export function ExportWizardModal({
  isOpen,
  onClose,
  contextTitle,
  folderId = 'fld-de-2026',
  folderReference = '#DE-2026',
  shortlistId,
  candidateIds = [],
  defaultCandidateCount = 12,
  onSuccess,
}: ExportWizardModalProps) {
  const { user, role } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState<string>(contextTitle || 'Shortlist Candidats Qualifiés');
  const [format, setFormat] = useState<ExportFormat>('pdf_shortlist');
  const [confidentiality, setConfidentiality] = useState<ExportConfidentiality>('anonymized_strict');
  const [candidateCount, setCandidateCount] = useState<number>(defaultCandidateCount);

  // Justification nominative
  const [reasonCode, setReasonCode] = useState<string>('RECRUITMENT_INTERVIEW_SCHEDULED');
  const [justificationText, setJustificationText] = useState<string>('');
  const [legalBasisConfirmed, setLegalBasisConfirmed] = useState<boolean>(false);
  const [reauthVerified, setReauthVerified] = useState<boolean>(false);
  const [reauthPassword, setReauthPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdDownloadUrl, setCreatedDownloadUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateExport = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        title,
        folderId,
        folderReference,
        shortlistId,
        candidateCount,
        format,
        confidentiality,
        options: {
          includeScores: true,
          includeSkills: true,
          includeContact: confidentiality === 'nominative_justified',
          includeNotes: false,
        },
      };

      if (confidentiality === 'nominative_justified') {
        payload.nominativeJustification = {
          reasonCode,
          justificationText,
          legalBasisConfirmed,
          reauthVerified,
        };
      }

      const res = await createExportAction(payload, {
        id: user?.id || 'usr_current',
        name: user?.fullName || 'Utilisateur Recruteur',
        role,
        can_export: true,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors de la génération de l’export');
        setLoading(false);
        return;
      }

      setCreatedDownloadUrl(`/api/exports/${res.export?.id}/download`);
      setStep(3); // Écran de succès
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Assistant d'Export Certifié WORM
              </h2>
              <p className="text-xs text-slate-500">
                {folderReference} · Plafond réglementaire max 200 profils
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Étape 1 : Paramètres généraux */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Titre du document exporté :
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9 bg-slate-50 dark:bg-slate-950"
                placeholder="Ex: Shortlist Finale Société Générale..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200">Format :</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="pdf_shortlist">PDF Synthèse Shortlist</option>
                  <option value="csv_table">Tableau CSV Sécurisé</option>
                  <option value="json_audit">JSON Structuré Machine</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Nombre de candidats (max 200) :
                </label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={candidateCount}
                  onChange={(e) => setCandidateCount(Math.min(200, Math.max(1, Number(e.target.value))))}
                  className="text-xs h-9 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Sélecteur de confidentialité */}
            <div className="space-y-2 pt-2">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Niveau de confidentialité RGPD :
              </label>

              <div
                onClick={() => setConfidentiality('anonymized_strict')}
                className={cn(
                  'p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3',
                  confidentiality === 'anonymized_strict'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                )}
              >
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Anonymisé Strict (Recommandé)
                    <Badge variant="success" className="text-[9px] py-0">Zéro-PII</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pseudonymes cryptographiques, coordonnées caviardées. Idéal pour diffusion client sans biais.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setConfidentiality('nominative_justified')}
                className={cn(
                  'p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3',
                  confidentiality === 'nominative_justified'
                    ? 'border-amber-600 bg-amber-50/40 dark:border-amber-500 dark:bg-amber-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                )}
              >
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Nominatif Justifié
                    <Badge variant="warning" className="text-[9px] py-0">2FA Requise</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Identités complètes dé-caviardées. Exige un motif Art. 30 RGPD et une ré-authentification forte.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (confidentiality === 'nominative_justified') {
                    setStep(2);
                  } else {
                    handleCreateExport();
                  }
                }}
                disabled={loading}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {confidentiality === 'nominative_justified' ? 'Continuer vers le motif légal' : 'Générer l’export'}
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2 : Justification nominative & 2FA */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Exigence de justification légale (Art. 30 RGPD)
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                L'export nominatif lève le caviardage de {candidateCount} profil(s). Cette opération est scellée dans le registre d'audit WORM avec votre identité.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Motif réglementaire :
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="RECRUITMENT_INTERVIEW_SCHEDULED">Entretien planifié avec le client</option>
                <option value="CLIENT_OFFER_CONTRACT">Émission d'une proposition d'embauche</option>
                <option value="LEGAL_COMPLIANCE_AUDIT">Contrôle de conformité ou audit légal</option>
                <option value="CANDIDATE_CONSENT_DIRECT">Consentement direct et exprès du candidat</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Précisions sur la justification :
              </label>
              <Textarea
                rows={3}
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-950"
                placeholder="Ex: Entretien technique final planifié le 20/10 pour le poste #DE-2026..."
              />
            </div>

            {/* Cases à cocher obligatoires */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalBasisConfirmed}
                  onChange={(e) => setLegalBasisConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Je certifie sur l'honneur détenir la base légale appropriée (Art. 6 RGPD) et que cet export sera détruit à l'issue de l'échéance des 7 jours.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reauthVerified}
                  onChange={(e) => setReauthVerified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Validation de l'authentification forte (AAL2 FIDO2 / TOTP validée).
                </span>
              </label>
            </div>

            <div className="flex justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Retour
              </Button>
              <Button
                size="sm"
                onClick={handleCreateExport}
                disabled={loading || !legalBasisConfirmed || !reauthVerified || justificationText.length < 5}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Signer &amp; Exporter
              </Button>
            </div>
          </div>
        )}

        {/* Étape 3 : Succès & Téléchargement direct */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Document certifié généré avec succès
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                L'archive est scellée par filigrane numérique et protégée pendant 7 jours.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              {createdDownloadUrl && (
                <a href={createdDownloadUrl} download className="inline-block">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs">
                    <Download className="w-4 h-4" />
                    Télécharger immédiatement
                  </Button>
                </a>
              )}
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
