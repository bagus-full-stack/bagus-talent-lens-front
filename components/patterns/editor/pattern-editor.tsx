'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  FileCode,
  Layers,
  ArrowLeft,
  Plus,
  Save,
  UploadCloud,
  History,
  Sparkles,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  Clock,
  RotateCcw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import type { Pattern, PatternVersion, PatternField } from '@/types';
import {
  PatternFormSchema,
  DEFAULT_SOCLE_FIELDS,
  type PatternFormData,
} from '@/lib/schemas/pattern';
import { savePatternDraftAction } from '@/app/(app)/patterns/actions';
import { toast } from '@/components/shared/form-and-toast';
import { SortableFieldItem } from './sortable-field-item';
import { LivePreviewTab } from './tabs/live-preview-tab';
import { JsonSchemaTab } from './tabs/json-schema-tab';
import { TestCvTab } from './tabs/test-cv-tab';
import { PublishVersionModal } from './publish-version-modal';
import { VersionsHistoryModal } from './versions-history-modal';

interface PatternEditorProps {
  initialPattern: Pattern;
  initialVersion: PatternVersion;
  allVersions: PatternVersion[];
}

export function PatternEditor({
  initialPattern,
  initialVersion,
  allVersions,
}: PatternEditorProps) {
  const router = useRouter();
  const [pattern, setPattern] = useState<Pattern>(initialPattern);
  const [currentVersion, setCurrentVersion] = useState<PatternVersion>(initialVersion);
  const [versionsList, setVersionsList] = useState<PatternVersion[]>(allVersions);

  // Onglet actif : 'fields' | 'preview' | 'json' | 'test'
  const [activeTab, setActiveTab] = useState<'fields' | 'preview' | 'json' | 'test'>('fields');

  // Modales
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [isSavingDraft, startSaveDraftTransition] = useTransition();

  // Configuration de react-hook-form avec validation Zod partagée
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isDirty, errors },
  } = useForm<PatternFormData>({
    defaultValues: {
      id: initialPattern.id,
      name: initialPattern.name,
      category: initialPattern.category,
      description: initialPattern.description,
      fields: initialVersion.fields && initialVersion.fields.length > 0
        ? initialVersion.fields
        : [...DEFAULT_SOCLE_FIELDS],
    },
  });

  // Tableau dynamique de champs via useFieldArray
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  // Surveillance en temps réel pour l'aperçu et le schéma JSON
  const rawWatchedFields = useWatch({ control, name: 'fields' });
  const watchedFields = React.useMemo(() => rawWatchedFields || [], [rawWatchedFields]);
  const rawWatchedName = useWatch({ control, name: 'name' });
  const watchedName = rawWatchedName || pattern.name;

  // Calcul des doublons de clés pour feedback visuel immédiat
  const duplicateKeys = React.useMemo(() => {
    const keys = watchedFields.map((f) => f.key?.trim().toLowerCase()).filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const k of keys) {
      if (seen.has(k)) dupes.add(k);
      else seen.add(k);
    }
    return dupes;
  }, [watchedFields]);

  // Configuration des capteurs dnd-kit pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Évite les déplacements accidentels au clic
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  // Détection de modifications non enregistrées et confirmation avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non enregistrées sur ce pattern.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Action : Ajouter un nouveau champ
  const handleAddField = () => {
    const customCount = watchedFields.filter((f) => !f.isLocked).length + 1;
    const newKey = `nouveau_critere_${customCount}`;
    append({
      key: newKey,
      label: `Nouveau critère ${customCount}`,
      type: 'text',
      required: false,
      isPii: false,
      isLocked: false,
      isSystem: false,
      aiPromptDescription: 'Consigne d’extraction personnalisée...',
    });
    toast.success('Champ ajouté', `Le champ « Nouveau critère ${customCount} » a été ajouté à la liste.`);
  };

  // Action : Supprimer un champ avec blocage des champs verrouillés
  const handleRemoveField = (index: number) => {
    const target = watchedFields[index];
    if (target?.isLocked) {
      toast.error('Opération interdite', 'Les champs du socle normalisé ne peuvent pas être supprimés.');
      return;
    }
    remove(index);
    toast.success('Champ supprimé', `Le champ « ${target?.label || 'Inconnu'} » a été retiré.`);
  };

  // Action : Sauvegarder le brouillon
  const handleSaveDraft = (data: PatternFormData) => {
    startSaveDraftTransition(async () => {
      const res = await savePatternDraftAction(pattern.id, data.fields);
      if (res.success && res.version) {
        toast.success(
          'Brouillon enregistré',
          `Le schéma du pattern « ${pattern.name} » a été sauvegardé en version brouillon.`,
        );
        setCurrentVersion(res.version);
        // Réinitialiser l'état dirty avec les nouvelles valeurs
        reset(data);
      } else {
        toast.error('Erreur de sauvegarde', res.error || 'Impossible de sauvegarder le brouillon.');
      }
    });
  };

  // Réinitialiser les modifications vers la version active
  const handleReset = () => {
    if (confirm('Voulez-vous annuler toutes les modifications non enregistrées ?')) {
      reset({
        id: pattern.id,
        name: pattern.name,
        category: pattern.category,
        description: pattern.description,
        fields: currentVersion.fields,
      });
      toast.info('Modifications réinitialisées', 'Les champs ont été restaurés à la dernière version enregistrée.');
    }
  };

  // Callback après restauration d'une version historique
  const handleRestoreVersion = (restoredFields: PatternField[], restoredVersion: PatternVersion) => {
    reset({
      id: pattern.id,
      name: pattern.name,
      category: pattern.category,
      description: pattern.description,
      fields: restoredFields,
    });
    setCurrentVersion(restoredVersion);
    setVersionsList((prev) => [restoredVersion, ...prev]);
  };

  // Callback après publication officielle
  const handlePublishSuccess = (newVersion: PatternVersion, updatedPattern: Pattern) => {
    setPattern(updatedPattern);
    setCurrentVersion(newVersion);
    setVersionsList((prev) => [newVersion, ...prev]);
    reset({
      id: updatedPattern.id,
      name: updatedPattern.name,
      category: updatedPattern.category,
      description: updatedPattern.description,
      fields: newVersion.fields,
    });
  };

  const piiCount = watchedFields.filter((f) => f.isPii).length;

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête avec fil d'Ariane et actions principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/patterns"
              className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour aux patterns</span>
            </Link>
            <span>/</span>
            <span className="font-mono">{pattern.id}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>{watchedName}</span>
            </h1>

            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              {pattern.category}
            </span>

            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {pattern.activeVersion}
            </span>

            {pattern.status === 'draft' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Clock className="h-3 w-3" />
                Brouillon
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Version active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">{pattern.description}</p>
        </div>

        {/* Boutons d'actions header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <History className="h-3.5 w-3.5" />
            <span>Historique ({versionsList.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit(handleSaveDraft)}
            disabled={isSavingDraft || !isDirty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 shadow-xs"
          >
            {isSavingDraft ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Enregistrer brouillon</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Publier la version</span>
          </button>
        </div>
      </div>

      {/* Onglets de navigation dans l'éditeur */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'fields'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Champs & Structure ({watchedFields.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Aperçu du formulaire (rendu live)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>JSON Schema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Tester sur un CV</span>
          </button>
        </nav>

        {/* Indicateurs statistiques discrets */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <Shield className="h-3.5 w-3.5" />
            {piiCount} champs PII protégés
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
            <Lock className="h-3.5 w-3.5" />
            {watchedFields.filter((f) => f.isLocked).length} champs socle verrouillés
          </span>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          {/* Barre d'outils de la liste des champs */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {fields.length} champs configurés
              </strong>{' '}
              — Glissez-déposez la poignée <span className="font-mono">⠿</span> pour réordonner
              l'ordre d'analyse IA.
            </div>

            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ajouter un champ personnalisé</span>
            </button>
          </div>

          {/* Erreurs de formulaire globales si présentes */}
          {errors.fields?.root && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errors.fields.root.message}</span>
            </div>
          )}

          {/* Liste réordonnable avec dnd-kit */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {fields.map((fieldItem, index) => (
                  <SortableFieldItem
                    key={fieldItem.id}
                    id={fieldItem.id}
                    index={index}
                    field={fieldItem}
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    onRemove={handleRemoveField}
                    duplicateKeys={duplicateKeys}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Bouton d'ajout en bas de liste */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un critère supplémentaire au schéma</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <LivePreviewTab fields={watchedFields as PatternField[]} patternName={watchedName} />
      )}

      {activeTab === 'json' && (
        <JsonSchemaTab
          fields={watchedFields as PatternField[]}
          patternId={pattern.id}
          patternName={watchedName}
          version={pattern.activeVersion}
        />
      )}

      {activeTab === 'test' && <TestCvTab fields={watchedFields as PatternField[]} />}

      {/* Barre flottante d'alerte en cas de modifications non enregistrées */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>Vous avez des modifications non enregistrées.</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSubmit(handleSaveDraft)}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-sm transition-colors"
              >
                {isSavingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de publication officielle avec estimation tokens */}
      <PublishVersionModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        pattern={pattern}
        fields={watchedFields as PatternField[]}
        onSuccess={handlePublishSuccess}
      />

      {/* Modale d'historique des versions avec diff et restauration */}
      <VersionsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        patternId={pattern.id}
        versions={versionsList}
        currentFields={watchedFields as PatternField[]}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}
