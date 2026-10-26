'use client';

import { useEffect } from 'react';

import { AUTO_GENERATE_STORAGE_KEY } from '../constants';
import type {
  BuilderHackathon,
  BuilderListing,
  BuilderTemplate,
} from '../types/builder';
import { BuilderDataProvider } from './BuilderData';
import { ListingBuilderProvider } from './ListingBuilderProvider';

interface ListingBuilderLayout {
  route: 'new' | 'edit' | 'duplicate';
  // The saved listing (edit, duplicate); null for a new one.
  listing: BuilderListing | null;
  hackathons: BuilderHackathon[];
  createAllowed: boolean;
  templates: BuilderTemplate[];
}

export function ListingBuilder({
  route,
  listing,
  hackathons,
  createAllowed,
  templates,
}: ListingBuilderLayout) {
  useEffect(() => {
    localStorage.removeItem(AUTO_GENERATE_STORAGE_KEY);
  }, []);

  return (
    <BuilderDataProvider value={{ hackathons, createAllowed, templates }}>
      <ListingBuilderProvider
        listing={
          listing && route === 'duplicate'
            ? {
                ...listing,
                title: listing.title + ' (copy)',
                slug: '',
                isPublished: false,
                publishedAt: null,
                id: undefined,
                deadline: null,
                status: 'OPEN',
              }
            : (listing ?? undefined)
        }
        isEditing={!!listing?.publishedAt}
        hackathons={hackathons}
      />
    </BuilderDataProvider>
  );
}
