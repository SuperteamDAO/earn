'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { postJson } from '@/lib/fetch-json';

import { SubmissionsPageSkeleton } from './SubmissionsPageSkeleton';

// Another sponsor's listing they may manage: switched to that sponsor, then
// the page loads again (Earn's useAutoSwitchSponsor).
export function SwitchSponsor({ sponsorId }: { sponsorId: string }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
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
  }, [sponsorId]);
  return <SubmissionsPageSkeleton />;
}

// Not theirs (or not there): back to their listings.
export function NotYourListing() {
  const router = useRouter();
  useEffect(() => {
    toast.error('This listing does not belong to you');
    router.push('/earn/dashboard/listings/');
  }, [router]);
  return <SubmissionsPageSkeleton />;
}
