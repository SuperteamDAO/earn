import { useMutation } from '@tanstack/react-query';
import { type ApiError } from 'next/dist/server/api-utils';
import { toast } from 'sonner';

interface CreateTreasuryProposalResponse {
  message: string;
  url: string;
  proposalId: number;
}

interface CreateTreasuryProposalVariables {
  id: string;
}

export function useCreateTreasuryProposal() {
  return useMutation<
    CreateTreasuryProposalResponse,
    ApiError,
    CreateTreasuryProposalVariables
  >({
    mutationFn: async ({ id }) => {
      const response = await fetch(
        '/api/sponsor-dashboard/submission/create-treasury-proposal',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create treasury proposal');
      }

      return response.json();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create treasury proposal');
    },
  });
}
