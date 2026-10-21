'use client';

import React from 'react';
import {
  Sparkles,
  Search,
  X,
  Bookmark,
  Share2,
  Check,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEARCH_PROMPT_EXAMPLES } from '@/lib/search/search-engine';

interface SearchQueryBarProps {
  query: string;
  onChangeQuery: (newQuery: string) => void;
  onSubmitSearch: () => void;
  onSelectExample: (exampleQuery: string) => void;
  isLoading: boolean;
}

export function SearchQueryBar({
  query,
  onChangeQuery,
  onSubmitSearch,
  onSelectExample,
  isLoading,
}: SearchQueryBarProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmitSearch();
    }
  };

  return (
    <div className="space-y-3">
      {/* Barre principale de recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-indigo-600 dark:text-indigo-400 pointer-events-none" />
          <Input
            type="text"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Recherche en langage naturel : poste, stack technique, contraintes de préavis, missions..."
            className="pl-10 pr-9 h-10.5 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 focus-visible:ring-indigo-500 shadow-xs"
            aria-label="Requête de recherche en langage naturel"
          />
          {query && (
            <button
              type="button"
              onClick={() => onChangeQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onSubmitSearch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-10.5 px-5 gap-2 text-xs sm:text-sm font-semibold shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Rechercher</span>
          </Button>

          {/* Bouton Partager le lien synchronisé avec l'URL */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-10.5 text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 gap-1.5"
            title="Copier le lien direct avec les filtres actuels"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Lien copié</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Partager</span>
              </>
            )}
          </Button>

          {/* Bouton désactivé « Enregistrer cette recherche : Bientôt disponible » */}
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-10.5 text-xs text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 gap-1.5 opacity-60 cursor-not-allowed hidden md:flex"
            title="Cette fonctionnalité sera activée dans la prochaine version de TalentLens"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
              Bientôt disponible
            </Badge>
          </Button>
        </div>
      </div>

      {/* Exemples cliquables */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
          Exemples rapides :
        </span>
        {SEARCH_PROMPT_EXAMPLES.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectExample(ex.query)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>{ex.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
