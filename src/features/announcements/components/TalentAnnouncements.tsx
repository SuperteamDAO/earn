import { useEffect, useState } from 'react';

import { Feature1 } from '../talent/Feature1';
import { Feature2 } from '../talent/Feature2';
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
  }, []);

  const announcements: Announcement[] = [
    {
      id: 'feature-1',
      title: 'Feature 1',
      Content: Feature1,
      shouldShow: true,
    },
    {
      id: 'feature-2',
      title: 'Feature 2',
      Content: Feature2,
      shouldShow: true, // Always show
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
