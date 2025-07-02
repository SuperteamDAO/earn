import { queryOptions } from '@tanstack/react-query';

import { type BountyType } from '@/interface/prisma/enums';
import { api } from '@/lib/api';
import { type BountyTemplateWithSponsor } from '@/pages/api/listings/templates';

const fetchListingTemplates = async (type: string) => {
  const { data } = await api.get<BountyTemplateWithSponsor[]>(
    '/api/listings/templates/',
    {
      params: { type },
    },
  );
  return data;
};

export const listingTemplatesQuery = (type: BountyType) =>
  queryOptions({
    queryKey: ['listingTemplates', type],
    queryFn: () => fetchListingTemplates(type),
  });
