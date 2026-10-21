'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Lock,
  Trash2,
  Shield,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  HelpCircle,
} from 'lucide-react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import {
  FIELD_TYPE_LABELS,
  PII_CATEGORY_LABELS,
  detectPiiRisk,
  type PatternField,
  type PatternFormData,
} from '@/lib/schemas/pattern';

interface SortableFieldItemProps {
  id: string;
  index: number;
  field: PatternField;
  register: UseFormRegister<PatternFormData>;
  setValue: UseFormSetValue<PatternFormData>;
  watch: UseFormWatch<PatternFormData>;
  onRemove: (index: number) => void;
  duplicateKeys: Set<string>;
}

export function SortableFieldItem({
  id,
  index,
  field,
  register,
  setValue,
  watch,
  onRemove,
  duplicateKeys,
}: SortableFieldItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Utilisation de useSortable pour le drag and drop dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Surveillance en temps réel des valeurs du champ
  const currentKey = watch(`fields.${index}.key`);
  const currentLabel = watch(`fields.${index}.label`);
  const currentType = watch(`fields.${index}.type`);
  const currentIsPii = watch(`fields.${index}.isPii`);
  const currentRequired = watch(`fields.${index}.required`);
  const currentPiiCategory = watch(`fields.${index}.piiCategory`);
  const currentDescription = watch(`fields.${index}.aiPromptDescription`);
  const currentOptions = watch(`fields.${index}.options`) || [];

  const isLocked = field.isLocked;
  const isDuplicateKey = duplicateKeys.has(currentKey?.trim().toLowerCase());

  // Détection automatique de risque PII non balisé pour champ texte libre ou liste
  const currentFieldForRisk: PatternField = {
    key: currentKey || '',
    label: currentLabel || '',
    type: currentType || 'text',
    required: !!currentRequired,
    isPii: !!currentIsPii,
    piiCategory: currentPiiCategory,
    aiPromptDescription: currentDescription,
    isLocked: !!isLocked,
  };
  const hasPiiRiskAlert = detectPiiRisk(currentFieldForRisk);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border transition-all duration-150 bg-white dark:bg-slate-900 ${
        isDragging
          ? 'z-50 shadow-xl border-indigo-500 ring-2 ring-indigo-500/20 opacity-90'
          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Barre d'en-tête du champ réordonnable */}
      <div className="flex items-center justify-between p-3.5 sm:px-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-t-xl select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Poignée de drag and drop */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="Glisser-déposer pour réordonner"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Cadenas et badge socle normalisé si champ verrouillé */}
          {isLocked ? (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800 text-[11px] font-medium"
              title="Champ du socle normalisé indispensable à l'anonymisation et à l'ingestion de CVs"
            >
              <Lock className="h-3 w-3" />
              <span>Socle normalisé</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-400 font-medium">#{index + 1}</span>
          )}

          {/* Titre et type du champ */}
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
            {currentLabel || 'Nouveau champ'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 hidden sm:inline">
            {currentKey || 'slug_champ'}
          </span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full font-medium">
            {FIELD_TYPE_LABELS[currentType] || 'Texte'}
          </span>

          {currentIsPii && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <Shield className="h-3 w-3" />
              <span>PII</span>
            </span>
          )}

          {currentRequired && (
            <span className="text-xs font-bold text-rose-500" title="Champ obligatoire">
              *
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Bouton replier/déplier */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            title={isExpanded ? 'Réduire' : 'Développer'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Bouton supprimer */}
          {isLocked ? (
            <button
              type="button"
              disabled
              className="p-1.5 rounded-md text-slate-300 dark:text-slate-600 cursor-not-allowed"
              title="Les champs du socle normalisé ne peuvent pas être supprimés"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Supprimer ce champ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alerte RGPD : Champ texte libre non balisé PII */}
      {hasPiiRiskAlert && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Alerte conformité RGPD :</strong> Ce champ texte
              libre (<em>« {currentLabel} »</em>) est susceptible de recueillir des données personnelles non masquées en mode aveugle.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue(`fields.${index}.isPii`, true, { shouldDirty: true });
              if (!currentPiiCategory) {
                setValue(`fields.${index}.piiCategory`, 'other', { shouldDirty: true });
              }
            }}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] shrink-0 transition-colors"
          >
            Activer PII
          </button>
        </div>
      )}

      {/* Contenu détaillé du champ (visible si isExpanded) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Libellé métier */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Libellé affiché *
              </label>
              <input
                type="text"
                {...register(`fields.${index}.label`, { required: true })}
                placeholder="ex: Coordonnées téléphoniques"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Slug / Nom technique */}
            <div className="sm:col-span-6">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nom technique (slug) *
                </label>
                {isDuplicateKey && (
                  <span className="text-[11px] font-medium text-rose-500">Doublon de clé !</span>
                )}
              </div>
              <input
                type="text"
                {...register(`fields.${index}.key`, {
                  required: true,
                  pattern: {
                    value: /^[a-z0-9_]+$/,
                    message: 'Format slug valide requis (minuscules, chiffres, tirets bas)',
                  },
                })}
                disabled={isLocked}
                placeholder="ex: telephone_mobile"
                className={`w-full px-3 py-2 font-mono text-sm rounded-lg border transition-all ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : isDuplicateKey
                      ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Type de données */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Type de données *
              </label>
              <select
                {...register(`fields.${index}.type`)}
                disabled={isLocked}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                  isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              >
                <option value="text">Texte libre</option>
                <option value="number">Nombre (entier ou décimal)</option>
                <option value="date">Date</option>
                <option value="list">Liste (tags / mots-clés)</option>
                <option value="boolean">Booléen (Oui / Non)</option>
                <option value="enum">Énumération (choix fixe)</option>
              </select>
            </div>

            {/* Options si énumération */}
            {currentType === 'enum' && (
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Options autorisées (séparées par une virgule)
                </label>
                <input
                  type="text"
                  value={currentOptions.join(', ')}
                  onChange={(e) => {
                    const opts = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setValue(`fields.${index}.options`, opts, { shouldDirty: true });
                  }}
                  placeholder="ex: Full Remote, Hybride, Présentiel"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Interrupteur PII et Catégorie PII */}
            <div className={currentType === 'enum' ? 'sm:col-span-12' : 'sm:col-span-8'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Interrupteur PII */}
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="checkbox"
                    id={`pii-${index}`}
                    {...register(`fields.${index}.isPii`)}
                    disabled={isLocked && field.isPii}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                  <label
                    htmlFor={`pii-${index}`}
                    className="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Donnée personnelle (PII)</span>
                  </label>
                </div>

                {/* Catégorie PII si actif */}
                {currentIsPii ? (
                  <div>
                    <select
                      {...register(`fields.${index}.piiCategory`)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="identity">Identité</option>
                      <option value="contact">Contact & Coordonnées</option>
                      <option value="location">Localisation & Mobilité</option>
                      <option value="photo">Photographie</option>
                      <option value="age_birth">Âge / Naissance</option>
                      <option value="nationality">Nationalité</option>
                      <option value="civil_status">État civil</option>
                      <option value="salary">Rémunération</option>
                      <option value="other">Autre PII</option>
                    </select>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Donnée anonyme (visible même en mode aveugle)
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox Obligatoire */}
            <div className="sm:col-span-12 flex items-center gap-2">
              <input
                type="checkbox"
                id={`required-${index}`}
                {...register(`fields.${index}.required`)}
                disabled={isLocked}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
              />
              <label
                htmlFor={`required-${index}`}
                className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
              >
                Champ obligatoire lors de l'extraction
              </label>
            </div>

            {/* Description pour le Prompt IA */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Consignes d'extraction pour le modèle d'IA (Prompt Description)</span>
              </label>
              <textarea
                {...register(`fields.${index}.aiPromptDescription`)}
                rows={2}
                placeholder="Indiquez au modèle comment détecter, normaliser et extraire ce champ depuis le document (ex: Identifier les certifications officielles AWS, GCP ou Kubernetes)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
