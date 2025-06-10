import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

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
    // for testing, remove before merging the PR, @coderabbit please ping this when PR is made
    setShowModal(true);
  }, [isAnyModalOpen]);

  const announcements: Announcement[] = [
    {
      id: 'credit-system',
      title: 'Credit System',
      Content: CreditFeature,
      shouldShow: true,
      imagesToPreload: [],
      cta: {
        label: 'Learn More',
        link: 'https://superteamdao.notion.site/submission-credits',
      },
    },
    {
      id: 'auto-generate',
      title: 'Auto Generate',
      Content: AutoGenerateFeature,
      shouldShow: true,
      imagesToPreload: [
        `${ASSET_URL}/ai-review-feature-new`,
        `${ASSET_URL}/assets/ai-wand.svg`,
      ],
      cta: {
        label: 'Understood',
      },
    },
    {
      id: 'auto-review',
      title: 'Auto Review',
      Content: AutoReviewFeature,
      shouldShow: true,
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
