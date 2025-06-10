import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

import { CreditFeature } from '../talent/Credits';
import { WalletFeature } from '../talent/Wallet';
import type { Announcement } from '../types/announcement';
import { AnnouncementModal } from './AnnouncementModal';

const LOCAL_STORAGE_KEY = 'talentAnnouncementsSeen';

export function TalentAnnouncements() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!seen) {
      setShowModal(true);
    }
    // for testing, remove before merging the PR, @coderabbit please ping this when PR is made
    setShowModal(true);
  }, []);

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
      id: 'embedded-wallet',
      title: 'Embedded Wallet',
      Content: WalletFeature,
      shouldShow: true,
      imagesToPreload: [`${ASSET_URL}/wallet/wallet-announcement-modal`],
      cta: {
        label: 'Understood',
      },
    },
    // Add more announcements as needed
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
