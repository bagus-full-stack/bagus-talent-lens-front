'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  Briefcase,
  MapPin,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { MatchingCriterion, StructuredOfferCriteria } from '@/lib/matching/types';

interface StructuredCriteriaDndProps {
  criteria: StructuredOfferCriteria;
  onChangeCriteria: (updated: StructuredOfferCriteria) => void;
  onLaunchMatching: () => void;
  isLaunching: boolean;
}

interface SortableCriterionCardProps {
  criterion: MatchingCriterion;
  onDelete: (id: string) => void;
  onSwitchCategory: (id: string) => void;
}

function SortableCriterionCard({
  criterion,
  onDelete,
  onSwitchCategory,
}: SortableCriterionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: criterion.id,
    data: { criterion },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isIndispensable = criterion.category === 'indispensable';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors shadow-2xs ${
        isIndispensable
          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
          : 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded touch-none"
          title="Glisser-déposer pour réordonner ou changer de catégorie"
          aria-label={`Glisser le critère ${criterion.label}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="font-semibold truncate select-none">{criterion.label}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onSwitchCategory(criterion.id)}
          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          title={isIndispensable ? 'Passer en critère souhaité' : 'Passer en critère indispensable'}
          aria-label={isIndispensable ? 'Basculer en souhaité' : 'Basculer en indispensable'}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(criterion.id)}
          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          title="Supprimer ce critère"
          aria-label={`Supprimer ${criterion.label}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function DroppableColumn({
  id,
  title,
  badgeText,
  badgeColor,
  criteria,
  onDelete,
  onSwitchCategory,
  onAddCriterion,
}: {
  id: 'indispensable' | 'souhaite';
  title: string;
  badgeText: string;
  badgeColor: string;
  criteria: MatchingCriterion[];
  onDelete: (id: string) => void;
  onSwitchCategory: (id: string) => void;
  onAddCriterion: (label: string, category: 'indispensable' | 'souhaite') => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onAddCriterion(newLabel.trim(), id);
      setNewLabel('');
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border p-4 space-y-3 flex flex-col transition-colors ${
        isOver
          ? 'ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 border-indigo-300'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <Badge variant="outline" className={`text-[10px] font-mono ${badgeColor}`}>
          {criteria.length} {badgeText}
        </Badge>
      </div>

      {/* Liste Sortable des critères */}
      <SortableContext items={criteria.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1 min-h-[140px]">
          {criteria.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center p-4 border border-dashed rounded-lg border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              <p>Glissez un critère ici ou ajoutez-en un ci-dessous.</p>
            </div>
          ) : (
            criteria.map((crit) => (
              <SortableCriterionCard
                key={crit.id}
                criterion={crit}
                onDelete={onDelete}
                onSwitchCategory={onSwitchCategory}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Formulaire d'ajout rapide de critère */}
      <form onSubmit={handleAdd} className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={`Ajouter un critère ${id === 'indispensable' ? 'indispensable' : 'souhaité'}...`}
          className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newLabel.trim()}
          className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </form>
    </div>
  );
}

export function StructuredCriteriaDnd({
  criteria,
  onChangeCriteria,
  onLaunchMatching,
  isLaunching,
}: StructuredCriteriaDndProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeItem, setActiveItem] = useState<MatchingCriterion | null>(null);

  const handleDeleteCriterion = (id: string) => {
    onChangeCriteria({
      ...criteria,
      indispensables: criteria.indispensables.filter((c) => c.id !== id),
      souhaites: criteria.souhaites.filter((c) => c.id !== id),
    });
  };

  const handleSwitchCategory = (id: string) => {
    const isIndispensable = criteria.indispensables.some((c) => c.id === id);

    if (isIndispensable) {
      const item = criteria.indispensables.find((c) => c.id === id)!;
      onChangeCriteria({
        ...criteria,
        indispensables: criteria.indispensables.filter((c) => c.id !== id),
        souhaites: [...criteria.souhaites, { ...item, category: 'souhaite' }],
      });
    } else {
      const item = criteria.souhaites.find((c) => c.id === id)!;
      onChangeCriteria({
        ...criteria,
        souhaites: criteria.souhaites.filter((c) => c.id !== id),
        indispensables: [...criteria.indispensables, { ...item, category: 'indispensable' }],
      });
    }
  };

  const handleAddCriterion = (label: string, category: 'indispensable' | 'souhaite') => {
    const newId = `crit-custom-${Date.now()}`;
    const newCriterion: MatchingCriterion = {
      id: newId,
      label,
      category,
      type: 'skill',
      weight: 1.0,
    };

    if (category === 'indispensable') {
      onChangeCriteria({
        ...criteria,
        indispensables: [...criteria.indispensables, newCriterion],
      });
    } else {
      onChangeCriteria({
        ...criteria,
        souhaites: [...criteria.souhaites, newCriterion],
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeInIndispensable = criteria.indispensables.find((c) => c.id === activeId);
    const activeInSouhaite = criteria.souhaites.find((c) => c.id === activeId);
    const draggedItem = activeInIndispensable || activeInSouhaite;

    if (!draggedItem) return;

    // Déposé directement sur la colonne "souhaite"
    if (overId === 'souhaite' && activeInIndispensable) {
      handleSwitchCategory(activeId);
      return;
    }

    // Déposé directement sur la colonne "indispensable"
    if (overId === 'indispensable' && activeInSouhaite) {
      handleSwitchCategory(activeId);
      return;
    }

    // Déposé sur un item de l'autre colonne
    const overInSouhaite = criteria.souhaites.find((c) => c.id === overId);
    const overInIndispensable = criteria.indispensables.find((c) => c.id === overId);

    if (activeInIndispensable && overInSouhaite) {
      handleSwitchCategory(activeId);
      return;
    }

    if (activeInSouhaite && overInIndispensable) {
      handleSwitchCategory(activeId);
      return;
    }
  };

  const totalCriteria = criteria.indispensables.length + criteria.souhaites.length;

  return (
    <div className="space-y-6">
      {/* Paramètres structurés du poste (Séniorité, Localisation, Contrat) */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Paramètres socle de l'offre analysée</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Séniorité exigée</label>
            <Input
              value={criteria.seniority}
              onChange={(e) => onChangeCriteria({ ...criteria, seniority: e.target.value })}
              className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Localisation & Télétravail</label>
            <Input
              value={criteria.location}
              onChange={(e) => onChangeCriteria({ ...criteria, location: e.target.value })}
              className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type de contrat</label>
            <Input
              value={criteria.contract}
              onChange={(e) => onChangeCriteria({ ...criteria, contract: e.target.value })}
              className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </Card>

      {/* Zone de Glisser-Déposer (Indispensables vs Souhaités) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          const id = event.active.id as string;
          const found =
            criteria.indispensables.find((c) => c.id === id) ||
            criteria.souhaites.find((c) => c.id === id);
          if (found) setActiveItem(found);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DroppableColumn
            id="indispensable"
            title="Critères Indispensables (Must-Have)"
            badgeText="exigés"
            badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
            criteria={criteria.indispensables}
            onDelete={handleDeleteCriterion}
            onSwitchCategory={handleSwitchCategory}
            onAddCriterion={handleAddCriterion}
          />

          <DroppableColumn
            id="souhaite"
            title="Critères Souhaités (Nice-To-Have)"
            badgeText="atouts"
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
            criteria={criteria.souhaites}
            onDelete={handleDeleteCriterion}
            onSwitchCategory={handleSwitchCategory}
            onAddCriterion={handleAddCriterion}
          />
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 border-indigo-400 shadow-xl text-xs font-semibold max-w-sm">
              {activeItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Barre de validation et lancement du matching */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-sm">
        <div className="text-xs space-y-0.5">
          <div className="font-bold flex items-center gap-1.5 text-indigo-300">
            <Sparkles className="w-4 h-4" />
            <span>Prêt pour le calcul prédictif déterministe</span>
          </div>
          <p className="text-slate-400">
            {criteria.indispensables.length} indispensables et {criteria.souhaites.length} souhaités définis pour {criteria.folderReference}.
          </p>
        </div>

        <Button
          onClick={onLaunchMatching}
          disabled={isLaunching || totalCriteria === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 h-10 gap-2 shadow-sm shrink-0 w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Lancer le matching ({totalCriteria} critères)</span>
        </Button>
      </div>
    </div>
  );
}
