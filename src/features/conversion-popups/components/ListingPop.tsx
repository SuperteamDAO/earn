import { useAtom } from 'jotai';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
import { isDeadlineOver, type Listing } from '@/features/listings';
import { bountySnackbarAtom } from '@/features/navbar';
import { useBreakpoint } from '@/hooks/use-breakpoint';

import { showAnyPopupAtom } from '../atoms';
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
  const sponsorName = listing?.sponsor?.name;
  return {
    0: {
      title: `Don’t miss out on this ${rewardLabel} ${type}`,
      description: `Apply to ${sponsorName}’s ${type} and win from ${!!rewardLabel ? `a ${rewardLabel} pool` : 'an amazing pool'}. Takes 2 minutes to get started!`,
      sponsorName: listing?.sponsor?.name,
      sponsorLogo: listing?.sponsor?.logo,
    },
    1: {
      title: `High chances of winning this bounty`,
      description: `This bounty only has ${submissionCount} submissions. Sign up to get access to this well-paying bounty!`,
      sponsorName: listing?.sponsor?.name,
      sponsorLogo: listing?.sponsor?.logo,
    },
  };
};

export const ListingPop = ({ listing }: { listing: Listing | null }) => {
  const [showAnyPopup, setShowAnyPopup] = useAtom(showAnyPopupAtom);

  const [variant, setVariant] = useState<VariantInfo>();
  const [open, setOpen] = useState(false);
  const { status } = useSession();

  const isMD = useBreakpoint('md');
  const [bountySnackbar] = useAtom(bountySnackbarAtom);

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      status === 'unauthenticated' &&
      listing?.status === 'OPEN' &&
      !isDeadlineOver(listing.deadline) &&
      showAnyPopup &&
      !open
    ) {
      initated.current = true;
      setTimeout(() => {
        setTimeout(() => {
          setOpen(true);
          setShowAnyPopup(false);
        }, 5_000);
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

  if (!isMD) return <Mobile open={open} setOpen={setOpen} variant={variant} />;
  return <Desktop open={open} setOpen={setOpen} variant={variant} />;
};

const Desktop = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
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
        className="bottom-4 right-4 max-w-sm translate-x-0 translate-y-0 duration-500 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full"
      >
        <DialogHeader className="">
          <Image
            src={variant?.sponsorLogo || ''}
            alt={`${variant?.sponsorName} logo`}
            width={100}
            height={100}
            className="w-12 rounded-md object-contain"
          />
          <DialogTitle className="pt-2 text-base font-semibold">
            {variant?.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {variant?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-0">
          <GetStarted />
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
  setOpen: Dispatch<SetStateAction<boolean>>;
  variant: VariantInfo | undefined;
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
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
          <GetStarted />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
