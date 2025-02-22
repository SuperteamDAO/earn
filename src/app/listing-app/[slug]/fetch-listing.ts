import { cache } from 'react';

import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { type Listing } from '@/features/listings/types';

export const getListing = cache(
  async (slug: string): Promise<Listing | null> => {
    try {
      const response = await api.get(`${getURL()}api/listings/details/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return null;
    }
  },
);
