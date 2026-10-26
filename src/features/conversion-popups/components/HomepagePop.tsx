'use client';

import { DialogTitle } from '@radix-ui/react-dialog';
import { useAtom, useSetAtom } from 'jotai';
import { posthog } from 'posthog-js';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupList,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTimeout } from '@/hooks/use-timeout';
import { publicEnv } from '@/lib/public-env';
import { useViewer } from '@/lib/viewer';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { roundToNearestThousand } from '@/utils/number';

import { useJson } from '@/features/home/hooks/use-json';

import { popupOpenAtom, popupsShowedAtom, popupTimeoutAtom } from '../atoms';
import { GetStarted } from './GetStarted';

const avatars = [
  {
    name: 'Abhishkek',
    src: ASSET_URL + '/pfps/t1.webp',
  },
  {
    name: 'Pratik',
    src: ASSET_URL + '/pfps/md2.webp',
  },
  {
    name: 'Yash',
    src: ASSET_URL + '/pfps/fff1.webp',
  },
];

// The sign-up prompt, seven seconds in, once, for a signed-out visitor.
// Pages that loaded the numbers pass them; otherwise they're fetched once
// it's due.
export const HomepagePop = ({
  totalUsers,
  liveOpportunityWorth,
}: {
  totalUsers?: number;
  liveOpportunityWorth?: number;
} = {}) => {
  const [popupsShowed, setPopupsShowed] = useAtom(popupsShowedAtom);
  const setPopupTimeout = useSetAtom(popupTimeoutAtom);

  const [variant, setVariant] = useState<number>(1);
  const [open, setOpen] = useAtom(popupOpenAtom);
  const authenticated = !!useViewer();

  const timeoutHandle = useTimeout(() => {
    const next =
      Number(localStorage.getItem('homepage-desktop-pop-variant')) || 1;
    setVariant(next || 1);
    localStorage.setItem('homepage-desktop-pop-variant', String(next + 1));
    setOpen(true);
    setPopupsShowed((s) => s + 1);
    posthog.capture('conversion pop up_initiated', {
      'Popup Source': 'Homepage Pop-up',
    });
  }, 7_000);

  const activateQuery = useMemo(
    () => !authenticated && popupsShowed < 1,
    [authenticated, popupsShowed],
  );

  const { data: stat } = useJson<{ totalUsers: number }>(
    activateQuery && totalUsers === undefined
      ? '/api/homepage/user-count/'
      : null,
  );
  const { data: liveOpportunities } = useJson<{ totalUsdValue: number }>(
    activateQuery && liveOpportunityWorth === undefined
      ? '/api/listings/live-opportunities/'
      : null,
  );

  const isMD = useBreakpoint('md');

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      !authenticated &&
      popupsShowed < 1 &&
      !open &&
      publicEnv.vercelEnv === 'production'
    ) {
      initated.current = true;
      setTimeout(() => {
        timeoutHandle.start();
        setPopupTimeout(timeoutHandle);
      }, 0);
    }
    // Once, when they're known to be signed out (`initated`).
    // oxlint-disable-next-line react/exhaustive-effect-dependencies, react-hooks/exhaustive-deps
  }, [authenticated]);

  const setPopupOpen = (e: boolean) => {
    if (!e) {
      posthog.capture('conversion pop up_closed', {
        'Popup Source': 'Homepage Pop-up',
      });
    }
    setOpen(e);
  };

  if (!isMD) {
    return (
      <Mobile
        open={open}
        setOpen={setPopupOpen}
        totalUsers={totalUsers ?? stat?.totalUsers}
      />
    );
  }

  return (
    <Desktop
      open={open}
      setOpen={setPopupOpen}
      totalUsers={totalUsers ?? stat?.totalUsers}
      liveOpportunityWorth={
        liveOpportunityWorth ?? liveOpportunities?.totalUsdValue
      }
      variant={variant}
    />
  );
};

const Mobile = ({
  open,
  setOpen,
  totalUsers,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  totalUsers: number | undefined;
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent
        classNames={{
          overlay: '',
        }}
        className="focus:ring-0 focus:ring-transparent focus:ring-offset-0"
      >
        <DrawerHeader className="text-left">
          <AvatarGroup>
            <AvatarGroupList>
              {avatars.map((a) => (
                <Avatar key={a.name}>
                  <AvatarImage src={a.src} />
                  <AvatarFallback>{a.name}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroupList>
          </AvatarGroup>
          <DrawerTitle className="pt-2 text-base font-semibold">
            {!totalUsers ? (
              <Skeleton className="h-5 w-3/4" />
            ) : (
              <>
                {totalUsers?.toLocaleString('en-us')} people have joined. You
                should too!
              </>
            )}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-slate-500">
            Sign up to never miss out on amazing opportunities that pay in
            global standards.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-0">
          <GetStarted />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const Desktop = ({
  open,
  setOpen,
  totalUsers,
  liveOpportunityWorth,
  variant,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  totalUsers: number | undefined;
  liveOpportunityWorth: number | undefined;
  variant: number;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn('max-w-[22.5rem] overflow-hidden bg-white p-0')}
        hideCloseIcon
      >
        {variant % 2 === 0 ? (
          <DesktopVariantOne totalUsers={totalUsers} />
        ) : (
          <DesktopVariantTwo liveOpportunityWorth={liveOpportunityWorth} />
        )}
        <DialogFooter className="p-5 pt-0">
          <GetStarted />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Female1 = ASSET_URL + '/avatars/female_1';
const Male1 = ASSET_URL + '/avatars/male_1';
const Male2 = ASSET_URL + '/avatars/male_2';

const DesktopVariantOne = ({
  totalUsers,
}: {
  totalUsers: number | undefined;
}) => {
  return (
    <>
      <div className="flex h-44 items-center justify-center bg-slate-50 p-0">
        <img src={Female1} alt="female 2" width={68} height={68} />
        <img src={Male1} alt="male 1" width={59} height={59} />
        <img src={Male2} alt="male 2" width={63} height={63} />
      </div>
      <DialogHeader className="px-5">
        <DialogTitle className="text-base font-semibold">
          {!totalUsers ? (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/4" />
            </>
          ) : (
            <>
              {totalUsers?.toLocaleString('en-us')} people have joined. You
              should too!
            </>
          )}
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          Sign up to never miss out on amazing opportunities that pay in global
          standards.
        </DialogDescription>
      </DialogHeader>
    </>
  );
};

const DesktopVariantTwo = ({
  liveOpportunityWorth,
}: {
  liveOpportunityWorth: number | undefined;
}) => {
  return (
    <>
      <div className="flex h-44 flex-col items-center justify-center gap-2 bg-slate-50 p-0">
        <span className="flex gap-2 font-semibold text-slate-500">
          <PulseIcon w={5} h={5} isPulsing bg={'#9AE6B4'} text="#16A34A" />
          <p>Live Opportunities</p>
        </span>
        <p className="text-4xl font-semibold">
          {liveOpportunityWorth ? (
            <>
              $
              {roundToNearestThousand(
                liveOpportunityWorth || 0,
              )?.toLocaleString('en-us')}
            </>
          ) : (
            <Skeleton className="h-12 w-3/4" />
          )}
        </p>
      </div>
      <DialogHeader className="px-5">
        <DialogTitle className="text-base font-semibold">
          Get access to opportunities worth $
          {formatNumberWithSuffix(
            roundToNearestThousand(liveOpportunityWorth || 0),
          )}
          !
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          {`Apply to hundreds of bounties & gigs with a single profile.`}
        </DialogDescription>
      </DialogHeader>
    </>
  );
};
