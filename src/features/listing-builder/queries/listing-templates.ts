import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchListingTemplates = async (type: string) => {
  const { data } = await axios.get('/api/listings/templates/', {
    params: { type },
  });
  return data;
};

export const listingTemplatesQuery = (type: string) =>
  queryOptions({
    queryKey: ['listingTemplates', type],
    queryFn: () => fetchListingTemplates(type),
  });
