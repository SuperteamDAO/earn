import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { useUser } from '@/store/user';

import { dashboardQuery } from '@/features/sponsor-dashboard/queries/dashboard';

import { AutoGenerateFeature } from '../sponsor/AutoGenerate';
import { AutoReviewGrantsFeature } from '../sponsor/AutoReviewGrants';
import { AutoReviewProjectsFeature } from '../sponsor/AutoReviewProjects';
import { CreditFeature } from '../sponsor/Credits';
import type { Announcement } from '../types/announcement';
import { AnnouncementModal } from './AnnouncementModal';

const LOCAL_STORAGE_KEY = 'sponsorAnnouncementsSeen-autoreviewprojects';

export function SponsorAnnouncements({
  isAnyModalOpen,
}: {
  isAnyModalOpen?: boolean;
}) {
  const user = useUser();
  const [showModal, setShowModal] = useState(false);

  const { data: allListings, isFetched: listingsFetched } = useQuery({
    ...dashboardQuery(user.user?.currentSponsorId),
    enabled: false,
  });

  useEffect(() => {
    if (isAnyModalOpen) return;
    if (!listingsFetched) return;
    const seen = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!seen) {
      setShowModal(true);
    }
  }, [isAnyModalOpen, listingsFetched]);

  const isLoggedInAndIsSponsor = Boolean(
    user.user && !!user.user.currentSponsorId,
  );

  const hasGrants = useMemo(() => {
    return Boolean(allListings?.some((listing) => listing.type === 'grant'));
  }, [allListings]);

  const announcements: Announcement[] = [
    {
      id: 'auto-review-projects',
      title: 'Auto Review for Projects',
      Content: AutoReviewProjectsFeature,
      shouldShow: isLoggedInAndIsSponsor,
      imagesToPreload: [`${ASSET_URL}/announcements/auto-review-projects`],
      cta: {
        label: 'Understood',
      },
    },
    {
      id: 'auto-generate',
      title: 'Auto Generate',
      Content: AutoGenerateFeature,
      shouldShow: isLoggedInAndIsSponsor,
      imagesToPreload: [`${ASSET_URL}/announcements/auto-generate`],
      cta: {
        label: 'Understood',
      },
    },
    {
      id: 'auto-review-grants',
      title: 'Auto Review for Grants',
      Content: AutoReviewGrantsFeature,
      shouldShow: isLoggedInAndIsSponsor && hasGrants,
      imagesToPreload: [`${ASSET_URL}/announcements/auto-review-grants`],
      cta: {
        label: 'Understood',
      },
    },
    {
      id: 'credit-system',
      title: 'Credit System',
      Content: CreditFeature,
      shouldShow: isLoggedInAndIsSponsor,
      imagesToPreload: [`${ASSET_URL}/announcements/credit-system`],
      cta: {
        label: 'Learn More',
        link: 'https://superteamdao.notion.site/submission-credits',
      },
    },
  ];

  const visibleAnnouncements = announcements.filter((a) => a.shouldShow);

  if (!showModal) return null;

  function handleModalClose() {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowModal(false);
  }

  return (
    <AnnouncementModal
      announcements={visibleAnnouncements}
      onClose={handleModalClose}
    />
  );
}
