import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type SearchSkills, type SearchStatus } from '../constants/schema';
import type { SearchResult } from '../types';

interface SearchListingsParams {
  query: string;
  status?: SearchStatus[];
  skills?: SearchSkills[];
  bountiesLimit?: number;
  grantsLimit?: number;
  userRegion?: string[];
}

interface SearchListingsResponse {
  results: SearchResult[];
  count: string;
  bountiesCount: number;
  grantsCount: number;
}

const fetchSearchListings = async ({
  query,
  status = [],
  skills = [],
  bountiesLimit = 10,
  grantsLimit = 5,
  bountiesOffset = 0,
  grantsOffset = 0,
  userRegion,
}: SearchListingsParams & {
  bountiesOffset?: number;
  grantsOffset?: number;
}): Promise<SearchListingsResponse> => {
  const queryParams = new URLSearchParams({
    bountiesLimit: bountiesLimit.toString(),
    grantsLimit: grantsLimit.toString(),
  });

  // Add status filters (multiple values comma-separated)
  if (status.length > 0) {
    queryParams.set('status', status.join(','));
  }

  // Add skills filters (multiple values comma-separated)
  if (skills.length > 0) {
    queryParams.set('skills', skills.join(','));
  }

  // Add offset parameters
  if (bountiesOffset > 0) {
    queryParams.set('bountiesOffset', bountiesOffset.toString());
  }

  if (grantsOffset > 0) {
    queryParams.set('grantsOffset', grantsOffset.toString());
  }

  // Add user region if provided
  if (userRegion && userRegion.length > 0) {
    queryParams.set('userRegion', userRegion.join(','));
  }

  const { data } = await api.get(
    `/api/search/${encodeURIComponent(query)}?${queryParams.toString()}`,
  );

  return data;
};

export function useSearchListings({
  query,
  status,
  skills,
  bountiesLimit = 10,
  grantsLimit = 5,
  userRegion,
}: SearchListingsParams) {
  return useInfiniteQuery({
    queryKey: [
      'search-listings',
      query,
      status,
      skills,
      bountiesLimit,
      grantsLimit,
      userRegion,
    ],
    queryFn: ({ pageParam = { bountiesOffset: 0, grantsOffset: 0 } }) =>
      fetchSearchListings({
        query,
        status,
        skills,
        bountiesLimit,
        grantsLimit,
        userRegion,
        bountiesOffset: pageParam.bountiesOffset,
        grantsOffset: pageParam.grantsOffset,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // Calculate how many total results we've loaded so far
      const totalLoadedResults = allPages.reduce(
        (sum, page) => sum + page.results.length,
        0,
      );

      // Parse the total available count from the API
      const totalAvailableResults = parseInt(lastPage.count, 10);

      // If we've loaded all available results, no more pages
      if (totalLoadedResults >= totalAvailableResults) {
        return undefined;
      }

      // Calculate the next offsets based on what we've loaded so far
      const currentBountiesOffset = allPages.reduce(
        (sum, page) => sum + page.bountiesCount,
        0,
      );
      const currentGrantsOffset = allPages.reduce(
        (sum, page) => sum + page.grantsCount,
        0,
      );

      return {
        bountiesOffset: currentBountiesOffset,
        grantsOffset: currentGrantsOffset,
      };
    },
    enabled: Boolean(query?.trim()), // Only run query if search term is provided
    initialPageParam: { bountiesOffset: 0, grantsOffset: 0 },
    placeholderData: (previousData) => previousData, // Keep previous data visible during filter changes
  });
}
