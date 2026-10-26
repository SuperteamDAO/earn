'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { postJson, RequestError } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

interface UseAutoSwitchSponsorOptions {
  error: unknown;
  refetch?: () => void;
  queryKey?: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// The sponsor a 403 names: a RequestError from postJson/getJson, or the
// axios-shaped error Earn's queries threw.
function refusedFor(error: unknown): string | null {
  let status: unknown;
  let body: unknown;
  if (error instanceof RequestError) {
    status = error.status;
    body = error.body;
  } else if (isRecord(error) && isRecord(error.response)) {
    status = error.response.status;
    body = error.response.data;
  }
  if (status !== 403 || !isRecord(body)) return null;
  return typeof body.sponsorId === 'string' ? body.sponsorId : null;
}

// A dashboard page refused for another of their sponsors (a 403 naming it)
// switches them to it and reloads, as Earn did.
export function useAutoSwitchSponsor({ error }: UseAutoSwitchSponsorOptions) {
  const user = useViewer();
  const [isSwitching, setIsSwitching] = useState(false);
  // Each sponsor is tried once, so a failing switch doesn't retry forever.
  const tried = useRef(new Set<string>());

  useEffect(() => {
    const sponsorId = refusedFor(error);
    if (!sponsorId || !user) return;
    const canAccessSponsor =
      user.role === 'GOD' ||
      user.UserSponsors.some(
        (membership) => membership.sponsorId === sponsorId,
      );
    if (!canAccessSponsor) return;
    if (isSwitching || user.currentSponsorId === sponsorId) return;
    if (tried.current.has(sponsorId)) return;
    tried.current.add(sponsorId);

    const run = async () => {
      setIsSwitching(true);
      toast.loading('Incorrect sponsor, switching to correct one', {
        id: 'sponsor-switch',
      });
      try {
        await postJson('/earn/dashboard/sponsor-switch/', { sponsorId });
        toast.success('Switched to the correct sponsor', {
          id: 'sponsor-switch',
        });
        window.location.reload();
      } catch (switchError) {
        toast.error('Failed to switch sponsor', { id: 'sponsor-switch' });
        console.error('Failed to auto-switch sponsor:', switchError);
        setIsSwitching(false);
      }
    };
    void run();
  }, [error, user, isSwitching]);

  return { isSwitching };
}
