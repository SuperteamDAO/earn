'use client';
/* oxlint-disable no-underscore-dangle -- the editor's image cleanup hooks are window globals */

import { postJson } from '@/lib/fetch-json';
import { convertUndefinedToNull } from '@/utils/undefinedToNull';

import type { ListingFormData, SubmitListingResponse } from '../types';

// The builder's autosave.
export const saveDraftRequest = (data: Partial<ListingFormData>) =>
  postJson<ListingFormData>('/api/sponsor-dashboard/listing/draft/', {
    ...convertUndefinedToNull(data),
  });

// Publishes a draft, or updates a published listing.
export async function submitListingRequest(
  data: ListingFormData,
  isEditing: boolean,
) {
  if (!data.id) throw new Error('Missing ID');

  if (typeof window !== 'undefined' && window.__processImageCleanup) {
    try {
      await window.__processImageCleanup();
    } catch (error) {
      console.error('Failed to process image cleanup:', error);
    }
  } else {
    console.warn('Image cleanup not initialized');
  }

  const action = isEditing ? 'update' : 'publish';
  return postJson<SubmitListingResponse>(
    `/api/sponsor-dashboard/listing/${data.id}/${action}/`,
    { ...convertUndefinedToNull(data) },
  );
}
