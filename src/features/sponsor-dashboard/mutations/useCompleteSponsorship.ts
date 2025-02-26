import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';

export const useCompleteSponsorship = (listingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(`/api/sponsor-dashboard/sponsorship/complete`, {
        listingId,
      });
    },
    onMutate: async () => {
      queryClient.setQueryData(['sponsor-detail', listingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: 'CLOSED',
        };
      });
    },
    onError: () => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: ['sponsor-detail', listingId],
      });
      toast.error(
        'An error occurred while completing the sponsorship. Please try again.',
      );
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['sponsor-detail', listingId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions', listingId],
      });
      queryClient.invalidateQueries({ queryKey: ['sponsor-dashboard'] });

      toast.success('Sponsorship completed successfully');
    },
  });
};
