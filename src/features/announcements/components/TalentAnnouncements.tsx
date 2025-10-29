'use client';
import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { useUpdateUser, useUser } from '@/store/user';

import { CreditFeature } from '../talent/Credits';
import { WalletFeature } from '../talent/Wallet';
import type { Announcement } from '../types/announcement';
import { AnnouncementModal } from './AnnouncementModal';

//const LOCAL_STORAGE_KEY = 'talentAnnouncementsSeen';

export function TalentAnnouncements() {
  const user = useUser();
  const updateUser = useUpdateUser();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user.user) return;
    const seen = !!user.user?.featureModalShown;
    if (!seen) {
      setShowModal(true);
    }
  }, [user.user]);

  const isLoggedInAndTalentFilled = Boolean(
    user.user && !!user.user.isTalentFilled,
  );

  const announcements: Announcement[] = [
    {
      id: 'credit-system',
      title: 'Credit System',
      Content: CreditFeature,
      shouldShow: isLoggedInAndTalentFilled,
      imagesToPreload: [`${ASSET_URL}/announcements/credit-system`],
      cta: {
        label: 'Learn More',
        link: 'https://superteamdao.notion.site/submission-credits',
      },
    },
    {
      id: 'embedded-wallet',
      title: 'Embedded Wallet',
      Content: WalletFeature,
      shouldShow: isLoggedInAndTalentFilled,
      imagesToPreload: [`${ASSET_URL}/announcements/embedded-wallet`],
      cta: {
        label: 'Understood',
      },
    },
  ];

  const visibleAnnouncements = announcements.filter((a) => a.shouldShow);

  if (!showModal) return null;

  function handleModalClose() {
    updateUser.mutateAsync({ featureModalShown: true });
    setShowModal(false);
  }

  return (
    <AnnouncementModal
      announcements={visibleAnnouncements}
      onClose={handleModalClose}
    />
  );
}
