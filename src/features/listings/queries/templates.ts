import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '../types';

const fetchListingTemplate = async (slug: string): Promise<Listing> => {
  const { data } = await axios.get(`/api/listings/templates/${slug}/`);
  return data;
};

export const listingTemplateQuery = (slug: string) =>
  queryOptions({
    queryKey: ['bounty', slug],
    queryFn: () => fetchListingTemplate(slug),
  });
