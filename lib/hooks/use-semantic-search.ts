'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  parseSearchFiltersFromParams,
  buildSearchFiltersToParams,
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from '@/lib/search/search-params';
import type { SearchResponse } from '@/lib/search/search-engine';

export function useSemanticSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Initialisation depuis l'URL (ou valeurs par défaut)
  const [filters, setFiltersState] = useState<SearchFilters>(() => {
    return parseSearchFiltersFromParams(searchParams);
  });

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Référence pour l'annulation des requêtes obsolètes (AbortController)
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronisation de l'état avec l'URL en cas de retour/avance navigateur (popstate)
  useEffect(() => {
    const fromUrl = parseSearchFiltersFromParams(searchParams);
    setFiltersState((prev) => {
      const prevParams = buildSearchFiltersToParams(prev).toString();
      const nextParams = buildSearchFiltersToParams(fromUrl).toString();
      if (prevParams !== nextParams) {
        return fromUrl;
      }
      return prev;
    });
  }, [searchParams]);

  // Exécution de la recherche avec AbortController et gestion des erreurs
  const fetchSearchResults = useCallback(async (currentFilters: SearchFilters) => {
    // Annulation de la requête précédente si elle est encore en vol
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const params = buildSearchFiltersToParams(currentFilters);
      const res = await fetch(`/api/recherche?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erreur serveur HTTP ${res.status}`);
      }

      const data = await res.json();

      // Si le serveur renvoie le code PROTECTED_CRITERION
      if (data.code === 'PROTECTED_CRITERION') {
        setResponse({
          candidates: [],
          totalCount: 0,
          page: 1,
          totalPages: 0,
          pageSize: 6,
          protectedCriterion: {
            isProtected: true,
            code: 'PROTECTED_CRITERION',
            category: data.category,
            categoryLabel: data.categoryLabel,
            detectedSnippet: data.detectedSnippet,
            legalNotice: data.legalNotice,
            message: data.message,
            suggestion: data.suggestion,
          },
          activeFilterCount: 0,
        });
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      // Les requêtes annulées par AbortController sont ignorées sans générer d'erreur dans l'UI
      if (err.name === 'AbortError') {
        return;
      }
      setIsError(true);
      setErrorMessage(err.message || 'Échec de la recherche sémantique');
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Déclencheur avec debounce (300ms) pour la frappe naturelle + synchronisation URL
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Mise à jour de l'URL pour partage et retour arrière
    const urlParams = buildSearchFiltersToParams(filters);
    const queryString = urlParams.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(targetUrl, { scroll: false });

    // Exécution différée (debounce 250ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(filters);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, fetchSearchResults, pathname, router]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateFilters = useCallback((next: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...next,
      // Réinitialise la pagination à la page 1 si un critère change (sauf si c'est le curseur lui-même)
      cursor: next.cursor !== undefined ? next.cursor : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      ...DEFAULT_SEARCH_FILTERS,
      query: '',
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    response,
    isLoading,
    isError,
    errorMessage,
    refetch: () => fetchSearchResults(filters),
  };
}
