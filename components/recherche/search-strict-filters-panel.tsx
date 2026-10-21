'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  FolderOpen,
  Briefcase,
  MapPin,
  Clock,
  Languages,
  GraduationCap,
  Sparkles,
  RotateCcw,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockFolders } from '@/lib/mock/data/folders';
import { KNOWN_SKILLS_LIST } from '@/lib/search/search-engine';
import type { SearchFilters } from '@/lib/search/search-params';
import { countActiveFilters } from '@/lib/search/search-params';

interface SearchStrictFiltersPanelProps {
  filters: SearchFilters;
  onChangeFilters: (next: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
}

export function SearchStrictFiltersPanel({
  filters,
  onChangeFilters,
  onResetFilters,
}: SearchStrictFiltersPanelProps) {
  const activeCount = countActiveFilters(filters);
  const [skillInput, setSkillInput] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  const availableSkillsSuggestions = KNOWN_SKILLS_LIST.filter(
    (s) =>
      !filters.skills.includes(s) &&
      s.toLowerCase().includes(skillInput.toLowerCase().trim())
  ).slice(0, 8);

  const handleAddSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      onChangeFilters({ skills: [...filters.skills, skill], cursor: 1 });
    }
    setSkillInput('');
    setIsSkillDropdownOpen(false);
  };

  const handleRemoveSkill = (skill: string) => {
    onChangeFilters({
      skills: filters.skills.filter((s) => s !== skill),
      cursor: 1,
    });
  };

  const handleToggleContract = (contract: string) => {
    const next = filters.contractTypes.includes(contract)
      ? filters.contractTypes.filter((c) => c !== contract)
      : [...filters.contractTypes, contract];
    onChangeFilters({ contractTypes: next, cursor: 1 });
  };

  const handleToggleLanguage = (lang: string) => {
    const next = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang];
    onChangeFilters({ languages: next, cursor: 1 });
  };

  return (
    <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* En-tête des filtres stricts */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Filtres stricts
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="font-mono text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200"
            >
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1"
            title="Réinitialiser tous les critères stricts"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </Button>
        </div>
      </div>

      {/* 1. Dossier de recrutement */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Dossier de recrutement</span>
        </label>
        <select
          value={filters.folderId}
          onChange={(e) => onChangeFilters({ folderId: e.target.value, cursor: 1 })}
          className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Tous les dossiers (Vivier global)</option>
          {mockFolders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.reference} — {f.title}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Années d'expérience (Curseur interactif) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Expérience minimale</span>
          </label>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {filters.minExperience === 0 ? 'Tous niveaux' : `≥ ${filters.minExperience} ans`}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="15"
          step="1"
          value={filters.minExperience}
          onChange={(e) => onChangeFilters({ minExperience: Number(e.target.value), cursor: 1 })}
          className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          aria-label="Curseur des années d'expérience minimale"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Junior (0)</span>
          <span>Confirmé (3+)</span>
          <span>Senior (8+)</span>
          <span>Lead (12+)</span>
        </div>
      </div>

      {/* 3. Types de contrat */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Type de contrat
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'cdi', label: 'CDI' },
            { id: 'cdd', label: 'CDD' },
            { id: 'freelance', label: 'Freelance' },
            { id: 'alternance', label: 'Alternance' },
          ].map((c) => {
            const isChecked = filters.contractTypes.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleContract(c.id)}
                  className="accent-indigo-600 rounded"
                />
                <span>{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Localisation + Rayon géographique */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Localisation & Rayon</span>
        </label>

        <div className="flex gap-2">
          <Input
            type="text"
            value={filters.location}
            onChange={(e) => onChangeFilters({ location: e.target.value, cursor: 1 })}
            placeholder="Ville, Région ou 'Remote'..."
            className="h-8.5 text-xs bg-slate-50 dark:bg-slate-800"
          />

          <select
            value={filters.radius}
            onChange={(e) => onChangeFilters({ radius: Number(e.target.value), cursor: 1 })}
            className="w-24 h-8.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value={10}>+ 10 km</option>
            <option value={25}>+ 25 km</option>
            <option value={50}>+ 50 km</option>
            <option value={100}>+ 100 km</option>
          </select>
        </div>
      </div>

      {/* 5. Disponibilité */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Disponibilité / Préavis</span>
        </label>
        <select
          value={filters.availability}
          onChange={(e) => onChangeFilters({ availability: e.target.value, cursor: 1 })}
          className="w-full h-8.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
        >
          <option value="all">Toutes disponibilités</option>
          <option value="immediate">Immédiate (sans préavis)</option>
          <option value="1_month">Sous 1 mois max</option>
          <option value="3_months">Sous 3 mois (préavis standard)</option>
          <option value="negotiable">Négociable</option>
        </select>
      </div>

      {/* 6. Niveau d'études */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Niveau d'études</span>
        </label>
        <select
          value={filters.educationLevel}
          onChange={(e) => onChangeFilters({ educationLevel: e.target.value, cursor: 1 })}
          className="w-full h-8.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
        >
          <option value="all">Tous niveaux de diplôme</option>
          <option value="bac5">Bac+5 / Master / Grande École</option>
          <option value="bac3">Bac+3 / Licence / Bachelor</option>
          <option value="doctorat">Doctorat / PhD</option>
          <option value="autodidacte">Autodidacte / Équivalence</option>
        </select>
      </div>

      {/* 7. Langues */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-indigo-600" />
          <span>Langues</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'fr', label: 'Français' },
            { id: 'en', label: 'Anglais' },
            { id: 'es', label: 'Espagnol' },
            { id: 'de', label: 'Allemand' },
          ].map((lang) => {
            const isSelected = filters.languages.includes(lang.id);
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleToggleLanguage(lang.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Compétences clés (Multi-sélection avec autocomplétion) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Compétences validées</span>
        </label>

        {/* Badges des compétences sélectionnées */}
        {filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {filters.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-indigo-900 dark:hover:text-white"
                  aria-label={`Retirer la compétence ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input d'autocomplétion */}
        <div className="relative">
          <Input
            type="text"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setIsSkillDropdownOpen(true);
            }}
            onFocus={() => setIsSkillDropdownOpen(true)}
            placeholder="Ajouter une compétence (ex: Snowflake, Python)..."
            className="h-8.5 text-xs bg-slate-50 dark:bg-slate-800"
          />

          {isSkillDropdownOpen && availableSkillsSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-9.5 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {availableSkillsSuggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 font-medium flex items-center justify-between"
                >
                  <span>{skill}</span>
                  <Plus className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
