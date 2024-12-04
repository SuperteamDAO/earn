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

import { showAnyPopupAtom } from '../atoms';
import { GetStarted } from './GetStarted';

interface GrantInfo {
  title: string;
  description: string;
  icon: string;
}
const grantInfo: GrantInfo = {
  title: 'Ready to build out your next idea?',
  description:
    'Apply to grants worth thousands of dollars with a single profile.',
  icon: '/assets/icons/bank.png',
};

export const GrantsPop = () => {
  const [showAnyPopup, setShowAnyPopup] = useAtom(showAnyPopupAtom);

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
          setOpen(true);
          setShowAnyPopup(false);
        }, 5_000);
      }, 0);
    }
  }, [status]);

  if (!isMD) {
    return <Mobile open={open} setOpen={setOpen} variant={grantInfo} />;
  }

  return <Desktop open={open} setOpen={setOpen} variant={grantInfo} />;
};

const Mobile = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  variant: GrantInfo;
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <Image
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
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

const Desktop = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  variant: GrantInfo;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white" hideCloseIcon>
        <DialogHeader className="">
          <Image
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
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
        <DialogFooter className="">
          <GetStarted />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
