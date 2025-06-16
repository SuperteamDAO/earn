import { queryOptions } from '@tanstack/react-query';

import { getProposalStatus } from '@/utils/near';

const fetchTreasuryProposalStatus = async (
  dao: string,
  proposalId: number,
): Promise<string> => {
  try {
    const result = await getProposalStatus(dao, proposalId);
    return result ?? 'Not Found';
  } catch (error) {
    console.error(error);
    return 'Not Found';
  }
};

export const treasuryProposalStatusQuery = (
  dao: string | undefined,
  proposalId: number,
) =>
  queryOptions({
    queryKey: ['treasuryProposalStatus', dao, proposalId],
    queryFn: () => fetchTreasuryProposalStatus(dao!, proposalId),
    enabled: !!dao && !!proposalId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
