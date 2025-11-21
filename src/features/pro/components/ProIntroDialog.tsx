'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUser } from '@/store/user';

import { userStatsQuery } from '@/features/home/queries/user-stats';

import { ProIntro } from './ProIntro';

export const ProIntroDialog = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isUserLoading || isStatsLoading || !user || !stats) {
      return;
    }

    const dialogShown = localStorage.getItem('proIntroDialogShown');
    if (dialogShown) {
      return;
    }

    const hasEarnedEnough = stats.totalWinnings ?? 0 >= 1000;
    const isNotPro = !user.isPro;

    if (hasEarnedEnough && isNotPro) {
      localStorage.setItem('proIntroDialogShown', 'true');
      setIsOpen(true);
    }
  }, [user, stats, isUserLoading, isStatsLoading]);

  if (isUserLoading || isStatsLoading || !user || !stats) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      localStorage.setItem('proIntroDialogShown', 'true');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="h-100 w-80 border-none bg-transparent p-0">
        <ProIntro className="h-full w-full rounded-2xl" />
      </DialogContent>
    </Dialog>
  );
};
