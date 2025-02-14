import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
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
import { ASSET_URL } from '@/constants/ASSET_URL';
import { type Superteam } from '@/constants/Superteam';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTimeout } from '@/hooks/use-timeout';
import { cn } from '@/utils/cn';

import { userCountQuery } from '@/features/home/queries/user-count';

import { popupsShowedAtom, popupTimeoutAtom } from '../atoms';
import { GetStarted } from './GetStarted';

export const RegionPop = ({ st }: { st: Superteam }) => {
  const [popupsShowed, setPopupsShowed] = useAtom(popupsShowedAtom);
  const setPopupTimeout = useSetAtom(popupTimeoutAtom);

  const timeoutHandle = useTimeout(() => {
    setOpen(true);
    setPopupsShowed((s) => s + 1);
    posthog.capture('conversion pop up_initiated', {
      'Popup Source': 'Region Pop-up',
    });
  }, 5_000);

  const [open, setOpen] = useState(false);
  const { authenticated, ready } = usePrivy();

  const activateQuery = useMemo(
    () => !authenticated && popupsShowed < 2,
    [authenticated, popupsShowed],
  );

  const { data: stat } = useQuery({
    ...userCountQuery,
    enabled: activateQuery,
  });

  const isMD = useBreakpoint('md');
  const posthog = usePostHog();

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      ready &&
      !authenticated &&
      popupsShowed < 2 &&
      !open
    ) {
      initated.current = true;
      setTimeout(() => {
        timeoutHandle.start();
        setPopupTimeout(timeoutHandle);
      }, 0);
    }
  }, [ready, authenticated]);

  const setPopupOpen = (e: boolean) => {
    if (e === false) {
      posthog.capture('conversion pop up_closed', {
        'Popup Source': 'Region Pop-up',
      });
    }
    setOpen(e);
  };

  if (!isMD) {
    return (
      <Mobile
        open={open}
        setOpen={setPopupOpen}
        st={st}
        totalUsers={stat?.totalUsers}
      />
    );
  }

  return (
    <Desktop
      open={open}
      setOpen={setPopupOpen}
      st={st}
      totalUsers={stat?.totalUsers}
    />
  );
};

const Mobile = ({
  open,
  setOpen,
  st,
  totalUsers,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  st: Superteam;
  totalUsers: number | undefined;
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
          <UserFlag isCode location={st.code} size="44px" />
          <DrawerTitle className="pt-2 text-base font-semibold">
            Exclusive opportunities for {st.nationality}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-slate-500">
            Sign up and receive exclusive opportunities available only to{' '}
            {st.nationality}.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-col gap-4 pt-0 sm:flex-col">
          <GetStarted setIsLoginOpen={setIsLoginOpen} />
          <People st={st} totalUsers={totalUsers} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const Desktop = ({
  open,
  setOpen,
  st,
  totalUsers,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  st: Superteam;
  totalUsers: number | undefined;
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          'max-w-[23rem] overflow-hidden bg-white p-5',
          isLoginOpen && 'invisible',
        )}
        hideCloseIcon
      >
        <DialogHeader className="">
          <UserFlag location={st.code} isCode size="44px" />
          <DialogTitle className="pt-2 text-base font-semibold">
            Exclusive opportunities for {st.nationality}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Sign up and receive exclusive opportunities available only to{' '}
            {st.nationality}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-4 sm:flex-col">
          <GetStarted setIsLoginOpen={setIsLoginOpen} />
          <People st={st} totalUsers={totalUsers} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const dummyUsers = [
  { name: 'Kash', pfp: ASSET_URL + '/pfps/t1.webp' },
  { name: 'Neil', pfp: ASSET_URL + '/pfps/md2.webp' },
  { name: 'Pratik', pfp: ASSET_URL + '/pfps/fff1.webp' },
];

const People = ({
  st,
  totalUsers,
}: {
  st: Superteam;
  totalUsers: number | undefined;
}) => {
  const people = useMemo(
    () => [...(st.people || []), ...dummyUsers].slice(0, 3),
    [st.people],
  );
  return (
    <div className="flex items-center gap-5">
      <AvatarGroup className="-space-x-2">
        <AvatarGroupList>
          {people.map((p) => (
            <Avatar key={p.name} className="h-7 w-7">
              <AvatarImage src={p.pfp} />
              <AvatarFallback>
                {p.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroupList>
      </AvatarGroup>
      <p className="text-sm text-slate-500">
        Join {people[0]?.name.split(' ')[0]}, {people[1]?.name.split(' ')[0]} &{' '}
        {totalUsers?.toLocaleString('en-us')} others
      </p>
    </div>
  );
};
