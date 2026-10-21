'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { PatternField } from '@/lib/schemas/pattern';
import { generateJsonSchema } from '@/lib/schemas/pattern';
import { toast } from '@/components/shared/form-and-toast';

interface JsonSchemaTabProps {
  fields: PatternField[];
  patternId: string;
  patternName: string;
  version: string;
}

export function JsonSchemaTab({
  fields,
  patternId,
  patternName,
  version,
}: JsonSchemaTabProps) {
  const [copied, setCopied] = useState(false);

  // Génération dynamique du JSON Schema standard à partir de l'état actuel
  const schemaObj = generateJsonSchema(fields, {
    id: patternId,
    name: patternName,
    version,
  });
  const jsonString = JSON.stringify(schemaObj, null, 2);

  // Action : Copier le schéma dans le presse-papier
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('Schéma copié', 'Le JSON Schema a été copié dans votre presse-papier.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur', 'Impossible de copier le schéma.');
    }
  };

  // Action : Télécharger le fichier JSON
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${patternId.toLowerCase()}_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Téléchargement lancé', `Fichier schema_${patternId.toLowerCase()}_${version}.json généré.`);
  };

  // Coloration syntaxique JSON pour affichage propre et lisible
  const formatColoredJson = (json: string) => {
    const lines = json.split('\n');
    return lines.map((line, idx) => {
      // Coloration des clés ("key":)
      let highlighted = line
        .replace(/"([^"]+)":/g, '<span class="text-indigo-400 font-semibold">"$1"</span>:')
        // Coloration des chaînes de caractères ("value")
        .replace(/: "([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
        // Coloration des nombres
        .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
        // Coloration des booléens
        .replace(/: (true|false)/g, ': <span class="text-violet-400 font-medium">$1</span>')
        // Coloration de null
        .replace(/: (null)/g, ': <span class="text-rose-400 italic">$1</span>');

      return (
        <div key={idx} className="table-row">
          <span className="table-cell pr-4 text-right text-slate-600 select-none text-[11px] font-mono w-10">
            {idx + 1}
          </span>
          <span
            className="table-cell font-mono text-xs whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils du JSON Schema */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-500" />
            <span>Spécification JSON Schema (Draft-07)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Lecture seule
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ce schéma contractuel est transmis au LLM souverain pour garantir le typage strict et l'isolation PII.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier le schéma</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Télécharger (.json)</span>
          </button>
        </div>
      </div>

      {/* Bloc de code avec coloration syntaxique */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-slate-300">
              schema_{patternId.toLowerCase()}_{version}.json
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {fields.length} propriétés • {fields.filter((f) => f.required).length} requises
          </span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="table w-full">{formatColoredJson(jsonString)}</div>
        </div>
      </div>
    </div>
  );
}
