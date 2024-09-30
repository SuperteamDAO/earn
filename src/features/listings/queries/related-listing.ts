import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '../types';

interface RelatedListingsParams {
  listingId: string;
  take?: number;
  excludeIds?: string[];
}

const fetchRelatedListings = async (
  params: RelatedListingsParams,
): Promise<Listing[]> => {
  const { data } = await axios.get(
    `/api/listings/${params.listingId}/related`,
    { params },
  );
  return data;
};

export const relatedlistingsQuery = (params: RelatedListingsParams) =>
  queryOptions({
    queryKey: ['related-listing', params],
    queryFn: () => fetchRelatedListings(params),
  });
