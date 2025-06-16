import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface SyncTreasuryStatusVariables {
  id: string;
}

export function useSyncTreasuryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: SyncTreasuryStatusVariables) => {
      const response = await api.post(
        '/api/sponsor-dashboard/submission/sync-treasury-status',
        {
          id,
        },
      );

      if (!response.data) {
        throw new Error('Failed to sync treasury status');
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions'],
      });
      queryClient.invalidateQueries({
        queryKey: ['submission', variables.id],
      });
    },
    onError: (error) => {
      console.error('Failed to sync treasury status:', error);
    },
  });
}
