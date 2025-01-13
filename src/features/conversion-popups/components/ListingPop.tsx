import { useAtom, useSetAtom } from 'jotai';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
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
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTimeout } from '@/hooks/use-timeout';

import { type Listing } from '@/features/listings/types';
import { isDeadlineOver } from '@/features/listings/utils/deadline';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

import { popupsShowedAtom, popupTimeoutAtom } from '../atoms';
import { GetStarted } from './GetStarted';

interface VariantInfo {
  title: string;
  description: string;
  sponsorName: string | undefined;
  sponsorLogo: string | undefined;
}
const VariantInfo = (
  listing: Listing | null,
  submissionCount: number,
): Record<number, VariantInfo> => {
  const reward = listing?.rewardAmount || listing?.maxRewardAsk;
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

  const timeoutHandle = useTimeout(() => {
    setOpen(true);
    setPopupsShowed((s) => s + 1);
    posthog.capture('conversion pop up_initiated', {
      'Popup Source': 'Listing Pop-up',
    });
  }, 5_000);

  const [variant, setVariant] = useState<VariantInfo>();
  const [open, setOpen] = useState(false);
  const { status } = useSession();

  const isMD = useBreakpoint('md');
  const posthog = usePostHog();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      status === 'unauthenticated' &&
      listing?.status === 'OPEN' &&
      !isDeadlineOver(listing.deadline) &&
      popupsShowed < 2 &&
      !open
    ) {
      initated.current = true;
      setTimeout(() => {
        timeoutHandle.start();
        setPopupTimeout(timeoutHandle);
      }, 0);
    }
  }, [status]);

  useMemo(() => {
    const variantInfo = VariantInfo(
      listing,
      bountySnackbar?.submissionCount || 0,
    );
    if ((bountySnackbar?.submissionCount || 0) < 20 ? 1 : 0) {
      // high changes of winning
      setVariant(variantInfo[1]);
    } else {
      setVariant(variantInfo[0]);
    }
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
  variant: VariantInfo | undefined;
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
        className="bottom-4 right-4 max-w-[22.5rem] translate-x-0 translate-y-0 overflow-hidden duration-500 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full"
      >
        <DialogHeader className="">
          <Image
            src={variant?.sponsorLogo || ''}
            alt={`${variant?.sponsorName} logo`}
            width={100}
            height={100}
            className="h-12 w-12 rounded-md"
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
  variant: VariantInfo | undefined;
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent
        classNames={{
          overlay: isLoginOpen ? 'z-[200]' : '',
        }}
        className="!border-0 !ring-0"
      >
        <DrawerHeader className="text-left">
          <Image
            src={variant?.sponsorLogo || ''}
            alt={`${variant?.sponsorName} logo`}
            width={100}
            height={100}
            className="w-12 rounded-md object-contain"
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
