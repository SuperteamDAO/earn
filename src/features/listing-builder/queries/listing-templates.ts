import { queryOptions } from '@tanstack/react-query';

import { type BountyTemplateWithSponsor } from '@/app/api/sponsor-dashboard/templates/route';
import { api } from '@/lib/api';
import { type BountyType } from '@/prisma/enums';

const fetchListingTemplates = async (type: string) => {
  const { data } = await api.get<BountyTemplateWithSponsor[]>(
    '/api/sponsor-dashboard/templates',
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
