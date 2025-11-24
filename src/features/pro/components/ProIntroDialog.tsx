'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUser } from '@/store/user';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { useProUpgradeFlow } from '@/features/pro/state/pro-upgrade-flow';

import { ProIntro } from './ProIntro';

export const ProIntroDialog = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);
  const [, forceDialogRerender] = useState(0);
  const { flow } = useProUpgradeFlow();
  const isDialogFlowActive = flow.source === 'dialog' && flow.status !== 'idle';

  if (isUserLoading || isStatsLoading || !user || !stats) {
    return null;
  }

  const dialogSeen =
    typeof window === 'undefined'
      ? true
      : localStorage.getItem('proIntroDialogShown') === 'true';
  const hasEarnedEnough = (stats.totalWinnings ?? 0) >= 1000;
  const shouldAutoShow = !dialogSeen && hasEarnedEnough && !user.isPro;
  const dialogOpen = shouldAutoShow || isDialogFlowActive;

  const handleOpenChange = (open: boolean) => {
    if (isDialogFlowActive) {
      return;
    }

    if (!open) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('proIntroDialogShown', 'true');
      }
      forceDialogRerender((value) => value + 1);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="h-100 w-80 border-none bg-transparent p-0">
        <ProIntro origin="dialog" className="h-full w-full rounded-2xl" />
      </DialogContent>
    </Dialog>
  );
};
