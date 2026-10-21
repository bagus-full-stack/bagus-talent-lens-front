'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderPlus,
  X,
  Shield,
  EyeOff,
  Users,
  Briefcase,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/shared/form-and-toast';
import { createFolderAction, CreateFolderSchema } from '@/app/(app)/dossiers/actions';
import { mockOrganization, mockMemberships } from '@/lib/mock/data/organizations';
import { mockPatterns } from '@/lib/mock/data/patterns';

interface NewFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewFolderDialog({ isOpen, onClose, onSuccess }: NewFolderDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Champs de formulaire avec défaut hérité de l'organisation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Pôle Data & Ingénierie');
  const [contractType, setContractType] = useState<'CDI' | 'CDD' | 'Freelance' | 'Stage'>('CDI');
  const [location, setLocation] = useState('Paris (Hybride 2j)');
  const [remotePolicy, setRemotePolicy] = useState<'hybrid' | 'full_remote' | 'on_site'>('hybrid');
  // Hérité de l'organisation : mockOrganization.defaultBlindMode (true)
  const [blindModeEnabled, setBlindModeEnabled] = useState<boolean>(
    mockOrganization.defaultBlindMode ?? true,
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([
    mockMemberships[0]?.userId || 'usr_idriss_ouedraogo',
  ]);
  const [patternId, setPatternId] = useState<string>('PAT-TECH-04');

  if (!isOpen) return null;

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      jobTitle: jobTitle.trim(),
      department: department.trim() || undefined,
      contractType,
      location: location.trim(),
      remotePolicy,
      blindModeEnabled,
      assignedMemberIds: selectedMembers,
      patternId,
    };

    const validation = CreateFolderSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createFolderAction(validation.data);
      if (!res.success) {
        toast.error('Erreur', res.error || 'Impossible de créer le dossier.');
        setIsSubmitting(false);
        return;
      }

      toast.success(
        'Dossier créé avec succès',
        `Le dossier « ${res.folder?.title} » (${res.folder?.reference}) est désormais actif.`,
      );
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
      if (res.folder?.id) {
        router.push(`/dossiers/${res.folder.id}`);
      }
    } catch {
      toast.error('Erreur système', 'Une anomalie imprévue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Créer un nouveau dossier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Structurez votre campagne de recrutement sous anonymisation anti-biais et conformité CNIL.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom du dossier */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nom du dossier <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="ex: Architecte Solutions Cloud Paris"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? 'border-rose-400' : ''}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3" /> {errors.title}
                </p>
              )}
            </div>

            {/* Offre liée / Titre du poste */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Offre liée / Intitulé du poste <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="ex: Senior Cloud & DevOps Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={errors.jobTitle ? 'border-rose-400' : ''}
              />
              {errors.jobTitle && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3" /> {errors.jobTitle}
                </p>
              )}
            </div>

            {/* Département */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Département / Équipe
              </label>
              <Input
                type="text"
                placeholder="ex: Infrastructure & Plateformes"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            {/* Type de contrat */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type de contrat
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CDI">CDI (Contrat à durée indéterminée)</option>
                <option value="CDD">CDD</option>
                <option value="Freelance">Freelance / Indépendant</option>
                <option value="Stage">Stage / Alternance</option>
              </select>
            </div>

            {/* Localisation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Localisation & Politique remote <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="ex: Paris (Hybride 2j)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Description du dossier */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Contexte de la campagne
              </label>
              <textarea
                rows={2}
                placeholder="Précisez les attentes, les critères discriminants ou le calendrier de recrutement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Interrupteur Mode Aveugle (Défaut hérité de l'organisation) */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 shrink-0 mt-0.5">
                  <EyeOff className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-950 dark:text-amber-200">
                      Mode aveugle strict (Anti-biais)
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">
                      Hérité de l'organisation
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                    Toutes les PII (nom, photo, âge, coordonnées, adresses) sont caviardées côté serveur. La levée nécessitera une ré-authentification et justification Art. 30.
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={blindModeEnabled}
                onClick={() => setBlindModeEnabled(!blindModeEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  blindModeEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    blindModeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Pattern d'extraction par défaut */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>Pattern d'extraction & normalisation par défaut</span>
            </label>
            <select
              value={patternId}
              onChange={(e) => setPatternId(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {mockPatterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — {p.piiFieldsCount} champs PII caviardés
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">
              Définit la règle de parsing IA et la politique de masquage appliquée à l'import de chaque CV.
            </p>
          </div>

          {/* Membres assignés */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span>Membres habilités sur ce dossier</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg dark:border-slate-800">
              {mockMemberships.map((m) => {
                const isSelected = selectedMembers.includes(m.userId);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => handleMemberToggle(m.userId)}
                    className={`flex items-center gap-2 p-2 rounded-md text-left text-xs transition-colors border ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-medium'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-sm flex items-center justify-center border text-[10px] ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <span className="block truncate font-semibold">{m.fullName}</span>
                      <span className="block text-[10px] text-slate-400 capitalize">{m.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pied de formulaire */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  <span>Créer le dossier</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
