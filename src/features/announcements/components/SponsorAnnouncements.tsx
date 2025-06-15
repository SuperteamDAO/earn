import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { useUser } from '@/store/user';

import { dashboardQuery } from '@/features/sponsor-dashboard/queries/dashboard';

import { AutoGenerateFeature } from '../sponsor/AutoGenerate';
import { AutoReviewFeature } from '../sponsor/AutoReview';
import { CreditFeature } from '../sponsor/Credits';
import type { Announcement } from '../types/announcement';
import { AnnouncementModal } from './AnnouncementModal';

const LOCAL_STORAGE_KEY = 'sponsorAnnouncementsSeen';

export function SponsorAnnouncements({
  isAnyModalOpen,
}: {
  isAnyModalOpen?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAnyModalOpen) return;
    const seen = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!seen) {
      setShowModal(true);
    }
  }, [isAnyModalOpen]);

  const user = useUser();
  const isLoggedInAndIsSponsor = Boolean(
    user.user && !!user.user.currentSponsorId,
  );

  const { data: allListings } = useQuery({
    ...dashboardQuery(user.user?.currentSponsorId),
    enabled: false,
  });

  const hasGrants = useMemo(() => {
    return Boolean(allListings?.some((listing) => listing.type === 'grant'));
  }, [allListings]);

  const announcements: Announcement[] = [
    {
      id: 'auto-generate',
      title: 'Auto Generate',
      Content: AutoGenerateFeature,
      shouldShow: isLoggedInAndIsSponsor,
      imagesToPreload: [
        `${ASSET_URL}/ai-review-feature-new`,
        `${ASSET_URL}/assets/ai-wand.svg`,
      ],
      cta: {
        label: 'Understood',
      },
    },
    {
      id: 'credit-system',
      title: 'Credit System',
      Content: CreditFeature,
      shouldShow: isLoggedInAndIsSponsor,
      imagesToPreload: [],
      cta: {
        label: 'Learn More',
        link: 'https://superteamdao.notion.site/submission-credits',
      },
    },
    {
      id: 'auto-review',
      title: 'Auto Review',
      Content: AutoReviewFeature,
      shouldShow: hasGrants,
      imagesToPreload: [
        `${ASSET_URL}/ai-review-feature-new`,
        `${ASSET_URL}/assets/ai-wand.svg`,
      ],
      cta: {
        label: 'Understood',
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
