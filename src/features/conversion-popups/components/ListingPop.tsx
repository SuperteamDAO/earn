import { usePrivy } from '@privy-io/react-auth';
import { useAtom, useSetAtom } from 'jotai';
import posthog from 'posthog-js';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { LocalImage } from '@/components/ui/local-image';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { useTimeout } from '@/hooks/use-timeout';
import { roundToNearestTenth } from '@/utils/number';

import { type Listing } from '@/features/listings/types';
import { isDeadlineOver } from '@/features/listings/utils/deadline';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

import { popupOpenAtom, popupsShowedAtom, popupTimeoutAtom } from '../atoms';
import { GetStarted } from './GetStarted';

interface VariantInfo {
  title: string;
  description: string;
  sponsorName: string | undefined;
  sponsorLogo: string | undefined;
}
const getVariantInfoMap = (
  listing: Listing | null,
  submissionCount: number,
): Record<number, VariantInfo> => {
  const reward = roundToNearestTenth(
    listing?.usdValue || listing?.rewardAmount || listing?.maxRewardAsk || 0,
  );
  const rewardLabel = reward ? '$' + reward.toLocaleString('en-us') : '';
  const type = listing?.type;
  const verb = listing?.type === 'bounty' ? 'submissions' : 'applications';
  const sponsorName = listing?.sponsor?.name;
  return {
    0: {
      title: `Don’t miss out on this ${rewardLabel} ${type}`,
      description: `Apply to ${sponsorName}’s ${type} and win from ${!!rewardLabel ? `a ${rewardLabel} pool` : 'an amazing pool'}. Takes 2 minutes to get started!`,
      sponsorName: listing?.sponsor?.name,
      sponsorLogo: listing?.sponsor?.logo,
    },
    1: {
      title: `High chances of winning this ${type}`,
      description: `This ${type} ${submissionCount > 0 ? 'only' : ''} has ${submissionCount} ${verb}. Sign up to get access to this well-paying ${type}!`,
      sponsorName: listing?.sponsor?.name,
      sponsorLogo: listing?.sponsor?.logo,
    },
  };
};

export const ListingPop = ({ listing }: { listing: Listing | null }) => {
  const [popupsShowed, setPopupsShowed] = useAtom(popupsShowedAtom);
  const setPopupTimeout = useSetAtom(popupTimeoutAtom);

  const [open, setOpen] = useAtom(popupOpenAtom);
  const { authenticated, ready } = usePrivy();

  const timeoutHandle = useTimeout(() => {
    setOpen(true);
    setPopupsShowed((s) => s + 1);
    posthog.capture('conversion pop up_initiated', {
      'Popup Source': 'Listing Pop-up',
    });
  }, 5_000);

  const isMD = useBreakpoint('md');
  const { serverTime } = useServerTimeSync();

  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      ready &&
      !authenticated &&
      listing?.status === 'OPEN' &&
      !isDeadlineOver(listing.deadline, serverTime()) &&
      popupsShowed < 2 &&
      !open &&
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ) {
      initated.current = true;
      setTimeout(() => {
        timeoutHandle.start();
        setPopupTimeout(timeoutHandle);
      }, 0);
    }
  }, [ready, authenticated]);

  const variant = useMemo<VariantInfo>(() => {
    const submissionCount = bountySnackbar?.submissionCount || 0;
    const map = getVariantInfoMap(listing, submissionCount);
    return map[submissionCount < 20 ? 1 : 0] as VariantInfo;
  }, [bountySnackbar?.submissionCount, listing]);

  const setPopupOpen = (e: boolean) => {
    if (e === false) {
      posthog.capture('conversion pop up_closed', {
        'Popup Source': 'Listing Pop-up',
      });
    }
    setOpen(e);
  };

  if (!isMD)
    return <Mobile open={open} setOpen={setPopupOpen} variant={variant} />;
  return <Desktop open={open} setOpen={setPopupOpen} variant={variant} />;
};

const Desktop = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  variant: VariantInfo;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        classNames={{
          overlay: 'hidden',
        }}
        unsetDefaultPosition
        unsetDefaultTransition
        className="data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full right-4 bottom-4 max-w-[22.5rem] translate-x-0 translate-y-0 overflow-hidden duration-500"
      >
        <DialogHeader className="">
          <LocalImage
            src={variant?.sponsorLogo || ''}
            alt={`${variant?.sponsorName} logo`}
            className="h-12 w-12 rounded-md"
            loading="eager"
          />
          <DialogTitle className="pt-2 text-base font-semibold">
            {variant?.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {variant?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-0">
          <GetStarted showLoginOverlay />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Mobile = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  variant: VariantInfo;
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent
        classNames={{
          overlay: isLoginOpen ? 'z-200' : '',
        }}
        className="border-0! ring-0!"
      >
        <DrawerHeader className="text-left">
          <LocalImage
            src={variant?.sponsorLogo || ''}
            alt={`${variant?.sponsorName} logo`}
            className="w-12 rounded-md object-contain"
            loading="eager"
          />
          <DrawerTitle className="pt-2 text-base font-semibold">
            {variant?.title}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-slate-500">
            {variant?.description}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-0">
          <GetStarted setIsLoginOpen={setIsLoginOpen} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
