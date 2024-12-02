import { DialogTitle } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

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
import { userCountQuery } from '@/features/home';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { PulseIcon } from '@/svg/pulse-icon';
import { formatNumberWithSuffix } from '@/utils';

import Female1 from '../../../../public/assets/conversion-popups/female_1.png';
import Male1 from '../../../../public/assets/conversion-popups/male_1.png';
import Male2 from '../../../../public/assets/conversion-popups/male_2.png';
import { showAnyPopupAtom } from '../atoms';
import { GetStarted } from './GetStarted';

const avatars = [
  {
    name: 'Abhishkek',
    src: '/assets/pfps/t1.webp',
  },
  {
    name: 'Pratik',
    src: '/assets/pfps/md2.webp',
  },
  {
    name: 'Yash',
    src: '/assets/pfps/fff1.webp',
  },
];

export const HomepagePop = () => {
  const liveOpportunityWorth = 350000;
  const { data: stat } = useQuery(userCountQuery);

  const [showAnyPopup, setShowAnyPopup] = useAtom(showAnyPopupAtom);

  const [variant, setVariant] = useState<number>(1);
  const [open, setOpen] = useState(false);
  const { status } = useSession();

  const isMD = useBreakpoint('md');

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      status === 'unauthenticated' &&
      showAnyPopup &&
      !open
    ) {
      initated.current = true;
      setTimeout(() => {
        setTimeout(() => {
          const variant =
            Number(localStorage.getItem('homepage-desktop-pop-variant')) || 1;
          setVariant(variant || 1);
          localStorage.setItem(
            'homepage-desktop-pop-variant',
            String(variant + 1),
          );
          setOpen(true);
          setShowAnyPopup(false);
        }, 10_000);
      }, 0);
    }
  }, [status]);

  if (!isMD) {
    return (
      <Mobile open={open} setOpen={setOpen} totalUsers={stat?.totalUsers} />
    );
  }

  return (
    <Desktop
      open={open}
      setOpen={setOpen}
      totalUsers={stat?.totalUsers}
      liveOpportunityWorth={liveOpportunityWorth}
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
  setOpen: Dispatch<SetStateAction<boolean>>;
  totalUsers: number | undefined;
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
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
              <>
                <Skeleton className="h-5 w-3/4" />
              </>
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
  setOpen: Dispatch<SetStateAction<boolean>>;
  totalUsers: number | undefined;
  liveOpportunityWorth: number;
  variant: number;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white p-0" hideCloseIcon>
        {variant % 2 === 0 ? (
          <DesktopVariantOne totalUsers={totalUsers} />
        ) : (
          <DesktopVariantTwo liveOpportunityWorth={liveOpportunityWorth} />
        )}
        <DialogFooter className="p-6 pt-0">
          <GetStarted />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DesktopVariantOne = ({
  totalUsers,
}: {
  totalUsers: number | undefined;
}) => {
  return (
    <>
      <div className="flex h-44 items-center justify-center bg-slate-50 p-0">
        <Image src={Female1} alt="female 2" />
        <Image src={Male1} alt="male 1" />
        <Image src={Male2} alt="male 2" />
      </div>
      <DialogHeader className="px-6">
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
  liveOpportunityWorth: number;
}) => {
  return (
    <>
      <div className="flex h-44 flex-col items-center justify-center gap-2 bg-slate-50 p-0">
        <span className="flex gap-2 font-semibold text-slate-500">
          <PulseIcon w={5} h={5} isPulsing bg={'#9AE6B4'} text="#16A34A" />
          <p>Live Opportunities</p>
        </span>
        <p className="text-4xl font-semibold">
          ${liveOpportunityWorth.toLocaleString('en-us')}
        </p>
      </div>
      <DialogHeader className="px-6">
        <DialogTitle className="text-base font-semibold">
          Get access to oppurtunities worth $
          {formatNumberWithSuffix(liveOpportunityWorth)}!
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          {`Apply to hundreds of bounties & gigs with a single profile.`}
        </DialogDescription>
      </DialogHeader>
    </>
  );
};
