'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { postJson } from '@/lib/fetch-json';

import { ListingBuilderSkeleton } from './ListingBuilderSkeleton';

// A listing of another sponsor's: switches to that sponsor when they're
// on its team (or in God mode) and reloads, else back to the dashboard.
export function OtherSponsorListing({
  sponsorId,
}: {
  sponsorId: string | null;
}) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!sponsorId) {
      toast.error('This listing does not belong to you');
      router.push('/earn/dashboard/listings/');
      return;
    }
    toast.loading('Incorrect sponsor, switching to correct one', {
      id: 'sponsor-switch',
    });
    postJson('/earn/dashboard/sponsor-switch/', { sponsorId })
      .then(() => {
        toast.success('Switched to the correct sponsor', {
          id: 'sponsor-switch',
        });
        window.location.reload();
      })
      .catch((error: unknown) => {
        toast.error('Failed to switch sponsor', { id: 'sponsor-switch' });
        console.error('Failed to auto-switch sponsor:', error);
      });
  }, [router, sponsorId]);

  return <ListingBuilderSkeleton />;
}
