'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  FileCode,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { createPatternAction } from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';

interface NewPatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPatternDialog({ isOpen, onClose }: NewPatternDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Tech' | 'Commercial' | 'Management' | 'Support' | 'Finance'>('Tech');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('Le nom du pattern doit comporter au moins 3 caractères.');
      return;
    }

    if (description.trim().length < 5) {
      setError('La description doit comporter au moins 5 caractères.');
      return;
    }

    startTransition(async () => {
      const res = await createPatternAction({
        name: name.trim(),
        category,
        description: description.trim(),
      });

      if (!res.success || !res.pattern) {
        setError(res.error || 'Erreur lors de la création');
        toast.error('Erreur', res.error || 'Impossible de créer le pattern');
      } else {
        toast.success('Pattern créé', `Le pattern « ${res.pattern.name} » a été initialisé avec le socle normalisé.`);
        onClose();
        router.push(`/patterns/${res.pattern.id}`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Créer un nouveau pattern d'extraction
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Structure de données sur-mesure pour l'analyse et l'anonymisation de CVs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Intitulé du pattern *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Ingénierie Cybersécurité & Réseaux"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Domaine / Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              >
                <option value="Tech">Tech & Ingénierie</option>
                <option value="Commercial">Commercial & Vente B2B</option>
                <option value="Management">Management & Direction</option>
                <option value="Support">Support & Relation Client</option>
                <option value="Finance">Finance & Comptabilité</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Version initiale
              </label>
              <div className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm font-mono flex items-center justify-between">
                <span>v1.0-brouillon</span>
                <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-sans font-medium">
                  Brouillon
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description de l'usage *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrivez les spécificités de ce métier, les critères d'extraction cibles et les compétences clés recherchées."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
              required
            />
          </div>

          {/* Encadré d'assurance socle normalisé */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-medium text-xs">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Garantie de conformité RGPD & Socle normalisé</span>
            </div>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
              Ce pattern sera automatiquement initialisé avec les <strong>6 champs du socle normalisé</strong> (identité, coordonnées, localisation, expériences, formations, compétences) verrouillés pour sécuriser l'anonymisation stricte en mode aveugle.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/30"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Initialisation...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Créer et configurer les champs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
