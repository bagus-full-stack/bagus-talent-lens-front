'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DataBreachRecord, BreachSeverity } from '@/lib/schemas/rgpd-governance';
import { declareDataBreachAction } from '@/app/actions/rgpd';
import { useAuth } from '@/lib/auth/auth-context';

export interface DeclareBreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBreach: DataBreachRecord) => void;
}

export function DeclareBreachModal({
  isOpen,
  onClose,
  onSuccess,
}: DeclareBreachModalProps) {
  const { user, role } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [nature, setNature] = useState<string>('unauthorized_access');
  const [detectedAt, setDetectedAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [severity, setSeverity] = useState<BreachSeverity>('medium');
  const [affectedPersonsCount, setAffectedPersonsCount] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Identité et coordonnées (nom, prénom, email)',
  ]);
  const [description, setDescription] = useState<string>('');
  const [consequences, setConsequences] = useState<string>('');
  const [remediationTaken, setRemediationTaken] = useState<string>('');
  const [authorityNotification, setAuthorityNotification] = useState<'required' | 'not_required' | 'pending'>('pending');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calcul du délai restant de 72h CNIL via useMemo (pas de setState in effect)
  const hoursRemaining72h = useMemo(() => {
    if (!detectedAt) return 72;
    const detectTime = new Date(detectedAt).getTime();
    const deadline = detectTime + 72 * 60 * 60 * 1000;
    const now = Date.now();
    return Math.round((deadline - now) / (1000 * 60 * 60));
  }, [detectedAt]);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 5) {
      setErrorMessage("Le titre de l'incident doit comporter au moins 5 caractères.");
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMessage('Sélectionnez au moins une catégorie de données impactées.');
      return;
    }
    if (description.trim().length < 15) {
      setErrorMessage('La description doit être suffisamment détaillée (min. 15 caractères).');
      return;
    }
    if (consequences.trim().length < 10) {
      setErrorMessage('Veuillez évaluer les conséquences potentielles (min. 10 caractères).');
      return;
    }
    if (remediationTaken.trim().length < 10) {
      setErrorMessage('Indiquez les mesures correctives immédiates (min. 10 caractères).');
      return;
    }

    setLoading(true);
    try {
      const res = await declareDataBreachAction(
        {
          title: title.trim(),
          nature: nature as any,
          detectedAt: new Date(detectedAt).toISOString(),
          severity,
          affectedPersonsCount: Number(affectedPersonsCount) || 0,
          affectedDataCategories: selectedCategories,
          description: description.trim(),
          consequences: consequences.trim(),
          remediationTaken: remediationTaken.trim(),
          authorityNotification,
        },
        {
          id: user?.id || 'usr-dpo',
          name: user?.name || 'Séverine Petit',
          role: role || 'dpo',
        }
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Erreur lors de la déclaration.');
        return;
      }

      if (res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const categoriesOptions = [
    'Identité et coordonnées (nom, prénom, email)',
    'Documents CV et lettres de motivation',
    'Évaluations techniques et scores IA',
    'Données de connexion et métadonnées système',
    'Données sensibles (catégories particulières Art. 9)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-lg text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Formulaire guidé : Déclaration de Violation de Données
              </h3>
              <p className="text-xs text-slate-500">
                Obligation légale Art. 33 & 34 RGPD · Notification CNIL sous 72 heures
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

        {/* Compte à rebours 72h */}
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs text-red-950 dark:text-red-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600 animate-pulse" />
            <span>
              <strong>Délai réglementaire CNIL :</strong> Notification obligatoire au plus tard 72h après détection.
            </span>
          </div>
          <Badge variant={hoursRemaining72h <= 24 ? 'destructive' : 'warning'} className="font-mono text-xs">
            {hoursRemaining72h > 0 ? `${hoursRemaining72h}h restantes` : 'Délai 72h dépassé'}
          </Badge>
        </div>

        {/* Formulaire défilable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Intitulé synthétique de l&apos;incident <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Ex: Accès non autorisé à l'API d'ingestion des CV..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nature de l&apos;incident
              </label>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="unauthorized_access">Accès non autorisé / Intrusion</option>
                <option value="accidental_disclosure">Divulgation accidentelle</option>
                <option value="data_loss">Perte de disponibilité ou de données</option>
                <option value="alteration">Altération non autorisée</option>
                <option value="ransomware">Attaque par rançongiciel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date et heure de détection <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                required
                value={detectedAt}
                onChange={(e) => setDetectedAt(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Niveau de gravité estimé
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as BreachSeverity[]).map((sev) => {
                  const labels: Record<BreachSeverity, string> = {
                    low: 'Faible',
                    medium: 'Moyenne',
                    high: 'Élevée',
                    critical: 'Critique',
                  };
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-1.5 px-2 text-[11px] font-medium rounded-md border transition-all ${
                        severity === sev
                          ? sev === 'critical'
                            ? 'bg-red-600 text-white border-red-600'
                            : sev === 'high'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {labels[sev]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre estimé de personnes affectées
              </label>
              <Input
                type="number"
                min="0"
                value={affectedPersonsCount}
                onChange={(e) => setAffectedPersonsCount(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Catégories de données personnelles concernées <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {categoriesOptions.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description circonstanciée des faits <span className="text-red-500">*</span>
            </label>
            <Textarea
              required
              rows={2}
              placeholder="Exposez le déroulé de l'incident, les vecteurs d'attaque identifiés et les systèmes impactés..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Conséquences probables pour les personnes concernées <span className="text-red-500">*</span>
            </label>
            <Textarea
              required
              rows={2}
              placeholder="Évaluation du risque de préjudice moral, usurpation d'identité, perte de contrôle..."
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mesures d&apos;atténuation et de remédiation immédiates <span className="text-red-500">*</span>
            </label>
            <Textarea
              required
              rows={2}
              placeholder="Mesures techniques adoptées (isolation réseau, rotation des clés, correctifs de sécurité)..."
              value={remediationTaken}
              onChange={(e) => setRemediationTaken(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Statut de notification à la CNIL (Art. 33)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'required', label: 'Obligatoire (Risque avéré)' },
                { val: 'pending', label: 'En cours d’évaluation DPO' },
                { val: 'not_required', label: 'Non requise (Risque exclu)' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setAuthorityNotification(opt.val as any)}
                  className={`py-2 px-2 text-[11px] font-medium rounded-lg border text-center transition-all ${
                    authorityNotification === opt.val
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Consigner au Registre des Violations</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
