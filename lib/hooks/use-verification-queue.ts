'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  VerificationItem,
  VerificationFilter,
  VerificationStats,
  DoubtfulField,
} from '@/lib/schemas/verification';
import { useToast } from '@/components/shared/form-and-toast';

export interface UseVerificationQueueReturn {
  items: VerificationItem[];
  stats: VerificationStats;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  updateFieldMutation: ReturnType<typeof useUpdateFieldMutation>;
  resolveSuspiciousMutation: ReturnType<typeof useResolveSuspiciousMutation>;
}

export function useVerificationQueue(filter: Partial<VerificationFilter> = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['verification-queue', filter];

  const query = useQuery<{ items: VerificationItem[]; stats: VerificationStats }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.motif && filter.motif !== 'all') params.set('motif', filter.motif);
      if (filter.folderId && filter.folderId !== 'all') params.set('folderId', filter.folderId);
      if (filter.status && filter.status !== 'all') params.set('status', filter.status);
      if (filter.dateRange && filter.dateRange !== 'all') params.set('dateRange', filter.dateRange);
      if (filter.search) params.set('search', filter.search);

      const res = await fetch(`/api/a-verifier?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement de la file de vérification');
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  return {
    items: query.data?.items || [],
    stats: query.data?.stats || { total: 0, treated: 0, pending: 0, excluded: 0, suspiciousCount: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    queryKey,
  };
}

export function useUpdateFieldMutation(filter: Partial<VerificationFilter> = {}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const queryKey = ['verification-queue', filter];

  return useMutation({
    mutationFn: async ({
      itemId,
      fieldKey,
      action,
      correctedValue,
      simulateError,
    }: {
      itemId: string;
      fieldKey: string;
      action: 'validate' | 'correct' | 'ignore';
      correctedValue?: any;
      simulateError?: boolean;
    }) => {
      const res = await fetch('/api/a-verifier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          fieldKey,
          action,
          correctedValue,
          simulateError,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur serveur lors de la validation du champ');
      }

      return res.json();
    },

    // 1. MISE À JOUR OPTIMISTE (onMutate)
    onMutate: async (variables) => {
      // Annule les requêtes en cours pour ne pas écraser la mise à jour optimiste
      await queryClient.cancelQueries({ queryKey });

      // Sauvegarde du snapshot pour rollback éventuel
      const previousData = queryClient.getQueryData<{
        items: VerificationItem[];
        stats: VerificationStats;
      }>(queryKey);

      if (previousData) {
        // Copie profonde pour éviter les mutations directes
        const newItems = previousData.items.map((item) => {
          if (item.id !== variables.itemId) return item;

          const updatedFields: DoubtfulField[] = item.doubtfulFields.map((field) => {
            if (field.key !== variables.fieldKey) return field;

            if (variables.action === 'validate') {
              return {
                ...field,
                status: 'validated' as const,
                confidence: 100,
                updatedAt: new Date().toISOString(),
              };
            }
            if (variables.action === 'correct') {
              return {
                ...field,
                status: 'corrected' as const,
                correctedValue: variables.correctedValue,
                confidence: 100,
                updatedAt: new Date().toISOString(),
              };
            }
            if (variables.action === 'ignore') {
              return {
                ...field,
                status: 'ignored' as const,
                updatedAt: new Date().toISOString(),
              };
            }
            return field;
          });

          const allTreated = updatedFields.every((f) => f.status !== 'pending');
          const isSuspiciousPending = item.suspiciousDetails?.mitigationStatus === 'pending';
          const newStatus = allTreated && !isSuspiciousPending ? ('treated' as const) : item.status;

          return {
            ...item,
            doubtfulFields: updatedFields,
            status: newStatus,
          };
        });

        // Recalcul immédiat des statistiques optimistes
        const newTreated = newItems.filter((i) => i.status === 'treated').length;
        const newPending = newItems.filter((i) => i.status === 'pending' || i.status === 'in_progress').length;

        queryClient.setQueryData(queryKey, {
          items: newItems,
          stats: {
            ...previousData.stats,
            treated: newTreated,
            pending: newPending,
          },
        });
      }

      return { previousData };
    },

    // 2. RETOUR ARRIÈRE EN CAS D'ERREUR (onError)
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      addToast({
        type: 'error',
        title: 'Échec de synchronisation (Rollback)',
        message: err.message || 'Le serveur a rejeté la modification. Restauration de l’état antérieur.',
      });
    },

    // 3. RE-SYNCHRONISATION APRÈS RÉSOLUTION (onSettled)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useResolveSuspiciousMutation(filter: Partial<VerificationFilter> = {}) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const queryKey = ['verification-queue', filter];

  return useMutation({
    mutationFn: async ({
      itemId,
      action,
      reason,
      simulateError,
    }: {
      itemId: string;
      action: 'exclude' | 'confirm_clean';
      reason: string;
      simulateError?: boolean;
    }) => {
      const res = await fetch('/api/a-verifier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          action,
          reason,
          simulateError,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la résolution de sécurité');
      }

      return res.json();
    },

    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<{
        items: VerificationItem[];
        stats: VerificationStats;
      }>(queryKey);

      if (previousData) {
        const newItems = previousData.items.map((item) => {
          if (item.id !== variables.itemId || !item.suspiciousDetails) return item;

          const updatedSuspicious = {
            ...item.suspiciousDetails,
            mitigationStatus: variables.action === 'exclude' ? ('excluded' as const) : ('confirmed_clean' as const),
            confirmationReason: variables.reason,
            reviewedBy: 'Recruteur / Auditeur',
            reviewedAt: new Date().toISOString(),
          };

          return {
            ...item,
            status: variables.action === 'exclude' ? ('excluded' as const) : ('treated' as const),
            suspiciousDetails: updatedSuspicious,
          };
        });

        const newTreated = newItems.filter((i) => i.status === 'treated').length;
        const newPending = newItems.filter((i) => i.status === 'pending' || i.status === 'in_progress').length;
        const newExcluded = newItems.filter((i) => i.status === 'excluded').length;

        queryClient.setQueryData(queryKey, {
          items: newItems,
          stats: {
            ...previousData.stats,
            treated: newTreated,
            pending: newPending,
            excluded: newExcluded,
          },
        });
      }

      return { previousData };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      addToast({
        type: 'error',
        title: 'Échec de l’opération de sécurité (Rollback)',
        message: err.message || 'Restauration de l’état antérieur suite à une erreur serveur.',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
