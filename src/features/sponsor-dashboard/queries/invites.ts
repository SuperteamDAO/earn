import { api } from '@/lib/api';

export const invitesQuery = ({
  searchText,
  skip,
  length,
  currentSponsorId,
}: {
  searchText?: string;
  skip?: number;
  length?: number;
  currentSponsorId?: string;
}) => ({
  queryKey: ['invites', currentSponsorId, searchText, skip, length],
  queryFn: async () => {
    if (!currentSponsorId) return null;

    const { data } = await api.get('/api/member-invites/list', {
      params: {
        searchText,
        skip,
        take: length,
      },
    });
    return data;
  },
  enabled: !!currentSponsorId,
});
