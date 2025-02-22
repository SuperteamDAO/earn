'use client';

import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import type { Listing } from '@/features/listings/types';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

export function ListingAnalytics({ listing }: { listing: Listing }) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);
  const posthog = usePostHog();

  const { data: submissionNumber = 0 } = useQuery(
    submissionCountQuery(listing.id ?? ''),
  );

  useEffect(() => {
    if (listing.type === 'bounty') {
      posthog.capture('open_bounty');
    } else if (listing.type === 'project') {
      posthog.capture('open_project');
    }
  }, [listing.type, posthog]);

  useEffect(() => {
    setBountySnackbar({
      isCaution: listing.sponsor?.isCaution,
      submissionCount: submissionNumber,
      deadline: listing.deadline,
      rewardAmount: listing.rewardAmount,
      type: listing.type,
      isPublished: listing.isPublished,
      status: listing.status,
      sponsorId: listing.sponsorId,
      slug: listing.slug,
    });
  }, [listing, submissionNumber, setBountySnackbar]);

  return null;
}
