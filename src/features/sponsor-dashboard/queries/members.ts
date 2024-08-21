import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface MembersQueryParams {
  searchText: string;
  skip: number;
  length: number;
  currentSponsorId: string | undefined;
}

const fetchMembersQueryFn = async ({
  searchText,
  skip,
  length,
}: MembersQueryParams) => {
  const response = await axios.get('/api/sponsor-dashboard/members/', {
    params: {
      searchText,
      skip,
      take: length,
    },
  });
  return response.data;
};

export const membersQuery = ({
  searchText,
  skip,
  length,
  currentSponsorId,
}: MembersQueryParams) =>
  queryOptions({
    queryKey: ['members', currentSponsorId, searchText, skip, length],
    queryFn: () =>
      fetchMembersQueryFn({ searchText, skip, length, currentSponsorId }),
    enabled: !!currentSponsorId,
  });
