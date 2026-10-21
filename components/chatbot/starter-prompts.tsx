'use client';

import React from 'react';
import { Sparkles, Shield, Cpu, Users, Award, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StarterPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Users,
    title: 'Comparatif d’expertises',
    prompt:
      'Quelles sont les compétences distinctives des candidats du dossier #CYB-88 pour la gestion d’incidents SOC et la conformité NIS2 ?',
    tag: '#CYB-88',
  },
  {
    icon: Cpu,
    title: 'Spécialistes Data Lakehouse',
    prompt:
      'Quel profil dispose de la plus solide expérience sur Snowflake, Kafka et pipelines streaming distribués ?',
    tag: '#DE-2026',
  },
  {
    icon: Award,
    title: 'Audit des certifications',
    prompt:
      'Lister les profils attestant des certifications CISSP, OSCP ou équivalentes avec preuves associées dans le CV.',
    tag: 'Certifications',
  },
  {
    icon: Shield,
    title: 'Questions d’entretien ciblées',
    prompt:
      'Générer 5 questions techniques objectives pour évaluer l’architecture Zero Trust et la conformité RGPD.',
    tag: 'Entretien',
  },
];

export function StarterPrompts({ onSelectPrompt }: StarterPromptsProps) {
  return (
    <div className="py-6 px-4 max-w-2xl mx-auto w-full space-y-4" data-testid="starter-prompts">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Suggestions d'analyses objectives</span>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Comment puis-je vous assister aujourd'hui ?
        </h3>
        <p className="text-xs text-slate-500">
          Posez une question sur vos dossiers ou choisissez une requête prédéfinie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPrompt(item.prompt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPrompt(item.prompt);
                }
              }}
              className="p-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    <Icon className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                    {item.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  « {item.prompt} »
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
